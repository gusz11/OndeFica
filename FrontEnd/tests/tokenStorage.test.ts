import { afterEach, describe, expect, it, vi } from "vitest";
import * as SecureStore from "expo-secure-store";
import { tokenStorage } from "../src/services/tokenStorage";
const state = vi.hoisted(() => ({
  platform: "android",
  saved: new Map<string, string>(),
}));
vi.mock("react-native", () => ({
  Platform: {
    get OS() {
      return state.platform;
    },
  },
}));
vi.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "device-only",
  getItemAsync: vi.fn(async (key: string) => state.saved.get(key) ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    state.saved.set(key, value);
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    state.saved.delete(key);
  }),
}));
afterEach(async () => {
  await tokenStorage.clear();
  state.saved.clear();
  state.platform = "android";
});
describe("Token storage", () => {
  it("uses device-only SecureStore on native platforms and deletes the token", async () => {
    await tokenStorage.write("jwt");
    expect(await tokenStorage.read()).toBe("jwt");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "ondefica.access-token",
      "jwt",
      { keychainAccessible: "device-only" },
    );
    await tokenStorage.clear();
    expect(await tokenStorage.read()).toBeNull();
  });
  it("keeps web credentials in memory without calling device storage", async () => {
    state.platform = "web";
    await tokenStorage.write("web-jwt");
    expect(await tokenStorage.read()).toBe("web-jwt");
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    await tokenStorage.clear();
    expect(await tokenStorage.read()).toBeNull();
  });
});
