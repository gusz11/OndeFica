import type { OfflineSnapshot, OfflineStorage } from "./offlineSchema";
let value: { token: string; snapshot: OfflineSnapshot } | null = null;
// Browser credentials and private itineraries remain memory-only.
export const offlineStorage: OfflineStorage = {
  async read(token) {
    return value?.token === token ? value.snapshot : null;
  },
  async write(token, snapshot) {
    value = { token, snapshot };
  },
  async clear() {
    value = null;
  },
};
