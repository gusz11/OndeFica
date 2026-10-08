import { beforeEach, expect, it, vi } from "vitest";
import { randomBytes, createHash, webcrypto } from "node:crypto";
import { offlineStorage } from "../src/services/offlineStorage";
import type { OfflineSnapshot } from "../src/services/offlineSchema";

const state = vi.hoisted(() => ({
  secure: new Map<string, string>(),
  files: new Map<string, Uint8Array>(),
  fail: false,
}));
vi.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
  async getItemAsync(key: string) {
    return state.secure.get(key) ?? null;
  },
  async setItemAsync(key: string, value: string) {
    if (state.fail) throw new Error("storage unavailable");
    state.secure.set(key, value);
  },
  async deleteItemAsync(key: string) {
    state.secure.delete(key);
  },
}));
vi.mock("expo-file-system", () => ({
  Paths: { document: "document" },
  File: class {
    name: string;
    constructor(_parent: string, name: string) {
      this.name = name;
    }
    get exists() {
      return state.files.has(this.name);
    }
    get size() {
      return state.files.get(this.name)?.length ?? 0;
    }
    create() {
      state.files.set(this.name, new Uint8Array());
    }
    write(bytes: Uint8Array) {
      state.files.set(this.name, bytes);
    }
    async bytes() {
      return state.files.get(this.name) ?? new Uint8Array();
    }
    delete() {
      state.files.delete(this.name);
    }
  },
}));
// Exercise the native storage adapter with actual authenticated encryption; OS APIs are test doubles.
vi.mock("expo-crypto", () => ({
  randomUUID: () => webcrypto.randomUUID(),
  CryptoDigestAlgorithm: { SHA256: "SHA256" },
  async digestStringAsync(_algorithm: string, text: string) {
    return createHash("sha256").update(text).digest("hex");
  },
  AESEncryptionKey: {
    async generate() {
      const hex = randomBytes(32).toString("hex");
      return {
        hex,
        async encoded() {
          return hex;
        },
      };
    },
    async import(hex: string) {
      return { hex };
    },
  },
  AESSealedData: {
    fromCombined(bytes: Uint8Array) {
      return bytes;
    },
  },
  async aesEncryptAsync(bytes: Uint8Array, key: { hex: string }) {
    const nonce = randomBytes(12);
    const cryptoKey = await webcrypto.subtle.importKey(
      "raw",
      Buffer.from(key.hex, "hex"),
      "AES-GCM",
      false,
      ["encrypt"],
    );
    const encrypted = await webcrypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      cryptoKey,
      Uint8Array.from(bytes),
    );
    return {
      async combined() {
        return Uint8Array.from(Buffer.concat([nonce, Buffer.from(encrypted)]));
      },
    };
  },
  async aesDecryptAsync(bytes: Uint8Array, key: { hex: string }) {
    const cryptoKey = await webcrypto.subtle.importKey(
      "raw",
      Buffer.from(key.hex, "hex"),
      "AES-GCM",
      false,
      ["decrypt"],
    );
    return new Uint8Array(
      await webcrypto.subtle.decrypt(
        { name: "AES-GCM", iv: Uint8Array.from(bytes.slice(0, 12)) },
        cryptoKey,
        Uint8Array.from(bytes.slice(12)),
      ),
    );
  },
}));
const snapshot: OfflineSnapshot = {
  version: 1,
  origin: "server",
  savedAt: "2026-10-07",
  user: {
    id: 1,
    email: "ana@example.com",
    is_active: true,
    created_at: "2026-10-07",
  },
  trips: [{ id: 1, user_id: 1, name: "Brasília", created_at: "2026-10-07" }],
  items: [],
  tripsLoaded: true,
  itemsLoaded: true,
};
beforeEach(() => {
  state.secure.clear();
  state.files.clear();
  state.fail = false;
});
it("persiste somente ciphertext, restaura Unicode e rejeita outra credencial", async () => {
  await offlineStorage.write("token", snapshot);
  const bytes = [...state.files.values()][0];
  expect(bytes).toBeDefined();
  expect(new TextDecoder().decode(bytes)).not.toContain("ana@example.com");
  expect((await offlineStorage.read("token"))?.trips[0]?.name).toBe("Brasília");
  expect(await offlineStorage.read("other-token")).toBeNull();
});
it("rejeita alteração do ciphertext e metadados com caminho arbitrário", async () => {
  await offlineStorage.write("token", snapshot);
  const bytes = [...state.files.values()][0];
  if (!bytes) throw new Error("missing file");
  bytes[20] = (bytes[20] ?? 0) ^ 1;
  expect(await offlineStorage.read("token")).toBeNull();
  state.secure.set(
    "ondefica.offline-key",
    JSON.stringify({
      version: 1,
      digest: "hash",
      key: "a".repeat(64),
      file: "../other.bin",
    }),
  );
  expect(await offlineStorage.read("token")).toBeNull();
});
it("falha ao confirmar novo arquivo preserva a cópia anterior e remove arquivo incompleto", async () => {
  await offlineStorage.write("token", snapshot);
  state.fail = true;
  await expect(
    offlineStorage.write("token", { ...snapshot, trips: [] }),
  ).rejects.toThrow();
  expect(state.files.size).toBe(1);
  expect((await offlineStorage.read("token"))?.trips).toHaveLength(1);
});
it("logout remove chave e arquivo e aceita metadados corrompidos", async () => {
  await offlineStorage.write("token", snapshot);
  await offlineStorage.clear();
  expect(state.files.size).toBe(0);
  expect(state.secure.size).toBe(0);
  state.secure.set("ondefica.offline-key", "invalid json");
  await offlineStorage.clear();
  expect(state.secure.size).toBe(0);
});
