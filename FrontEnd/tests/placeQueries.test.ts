import { afterEach, describe, expect, it, vi } from "vitest";
import {
  onlineManager,
  QueryClient,
  QueryObserver,
} from "@tanstack/react-query";
import {
  hotelsQueryOptions,
  placesQueryOptions,
} from "../src/config/placeQueries";
import { ApiError, setApiSession } from "../src/services/api";

const clients: QueryClient[] = [];
function clientForTest() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 2, gcTime: Infinity } },
  });
  clients.push(client);
  return client;
}

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  onlineManager.setOnline(true);
  setApiSession(null);
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Public queries after a connection failure", () => {
  it("finishes with an error even when the request switches the manager offline", async () => {
    onlineManager.setOnline(true);
    const fetch = vi.fn(async () => {
      throw new Error("network-down");
    });
    vi.stubGlobal("fetch", fetch);
    const client = clientForTest();
    await expect(client.fetchQuery(placesQueryOptions())).rejects.toThrow(
      ApiError,
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(onlineManager.isOnline()).toBe(false);
    const state = client.getQueryState(["places"]);
    expect(state?.status).toBe("error");
    expect(state?.fetchStatus).toBe("idle");
  });

  it("allows manual retry while offline and reconnects when the API responds", async () => {
    onlineManager.setOnline(false);
    const fetch = vi.fn(
      async () =>
        new Response("[]", {
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetch);
    await expect(
      clientForTest().fetchQuery(placesQueryOptions()),
    ).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(onlineManager.isOnline()).toBe(true);
  });

  it("ends the loading state after the 20-second timeout", async () => {
    vi.useFakeTimers();
    onlineManager.setOnline(true);
    const fetch = vi.fn(
      (request: Request) =>
        new Promise<Response>((_resolve, reject) => {
          request.signal.addEventListener("abort", () =>
            reject(new Error("aborted")),
          );
        }),
    );
    vi.stubGlobal("fetch", fetch);
    const client = clientForTest();
    const observer = new QueryObserver(client, placesQueryOptions());
    const unsubscribe = observer.subscribe(() => undefined);
    try {
      await vi.advanceTimersByTimeAsync(0);
      expect(observer.getCurrentResult().isLoading).toBe(true);
      await vi.advanceTimersByTimeAsync(20000);
      const result = observer.getCurrentResult();
      expect(result.isLoading).toBe(false);
      expect(result.isError).toBe(true);
      expect(result.isPaused).toBe(false);
      expect(result.error?.message).toContain("demorou demais");
      expect(fetch).toHaveBeenCalledTimes(1);
    } finally {
      unsubscribe();
    }
  });

  it("does not leave the hotel lookup paused after a network failure", async () => {
    onlineManager.setOnline(false);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network-down");
      }),
    );
    const client = clientForTest();
    await expect(
      client.fetchQuery(hotelsQueryOptions("place-id", true)),
    ).rejects.toThrow(ApiError);
    expect(client.getQueryState(["hotels", "place-id"])?.fetchStatus).toBe(
      "idle",
    );
  });
});
