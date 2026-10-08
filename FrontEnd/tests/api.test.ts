import { afterEach, describe, expect, it, vi } from "vitest";
import {
  api,
  ApiError,
  ensureSuccess,
  setApiSession,
  unwrap,
} from "../src/services/api";

afterEach(() => {
  setApiSession(null);
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Typed API client", () => {
  it("attaches JWT only to authenticated calls and handles profile responses", async () => {
    const requests: Request[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (request: Request) => {
        requests.push(request);
        return new Response(
          JSON.stringify({
            id: 1,
            email: "ana@example.com",
            full_name: "Ana",
            is_active: true,
            created_at: "2026-10-07",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );
    setApiSession("private-token");
    const profile = unwrap(await api.GET("/users/me/"));
    expect(profile.id).toBe(1);
    expect(requests[0]?.headers.get("Authorization")).toBe(
      "Bearer private-token",
    );
    await api.POST("/auth/register", {
      body: { email: "ana@example.com", password: "12345678" },
    });
    expect(requests[1]?.headers.has("Authorization")).toBe(false);
  });
  it("expires the matching session only, including responses from a previous account", async () => {
    let finish: ((response: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          }),
      ),
    );
    const expireOld = vi.fn();
    const expireNew = vi.fn();
    setApiSession("old", expireOld);
    const request = api.GET("/users/me/");
    await vi.waitFor(() => expect(finish).toBeDefined());
    setApiSession("new", expireNew);
    finish?.(
      new Response(JSON.stringify({ detail: "Expired" }), { status: 401 }),
    );
    await request;
    expect(expireOld).not.toHaveBeenCalled();
    expect(expireNew).not.toHaveBeenCalled();
  });
  it("handles empty DELETE responses and surfaces safe validation errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
    );
    expect(() =>
      ensureSuccess({ response: new Response(null, { status: 204 }) }),
    ).not.toThrow();
    ensureSuccess(
      await api.DELETE("/itinerary/{item_id}", {
        params: { path: { item_id: 1 } },
      }),
    );
    expect(() =>
      unwrap({
        response: new Response(null, { status: 422 }),
        error: { detail: [{ msg: "invalid" }] },
      }),
    ).toThrow("Confira");
  });
  it("reports connectivity failures without leaking internal exceptions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("internal-network-secret");
      }),
    );
    await expect(api.GET("/users/me/")).rejects.toThrow(ApiError);
    await expect(api.GET("/users/me/")).rejects.not.toThrow(
      "internal-network-secret",
    );
  });
  it("aborts requests after the timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (request: Request) =>
          new Promise<Response>((_resolve, reject) => {
            request.signal.addEventListener("abort", () =>
              reject(new Error("aborted")),
            );
          }),
      ),
    );
    const request = api.GET("/users/me/");
    const result = expect(request).rejects.toThrow("demorou demais");
    await vi.advanceTimersByTimeAsync(20000);
    await result;
  });
});
