import { API_BASE_URL } from "../config/api";
import type { User } from "../types/models";
import { offlineStorage } from "./offlineStorage";
import {
  snapshotSchema,
  type OfflineSnapshot,
  type OfflineStorage,
} from "./offlineSchema";

export function createOfflineCache(storage: OfflineStorage, origin: string) {
  let token: string | null = null;
  let snapshot: OfflineSnapshot | null = null;
  let queue: Promise<void> = Promise.resolve();
  let failure: string | null = null;
  return {
    get snapshot() {
      return snapshot;
    },
    get error() {
      return failure;
    },
    async restore(credential: string) {
      const cached = await storage.read(credential);
      return cached?.origin === origin ? cached : null;
    },
    activate(
      credential: string,
      user: User,
      cached: OfflineSnapshot | null = null,
    ) {
      token = credential;
      snapshot =
        cached?.user.id === user.id
          ? { ...cached, user }
          : {
              version: 1,
              origin,
              savedAt: new Date().toISOString(),
              user,
              trips: [],
              items: [],
              tripsLoaded: false,
              itemsLoaded: false,
            };
      failure = null;
    },
    async update(
      credential: string | null,
      fields: Partial<
        Pick<OfflineSnapshot, "trips" | "items" | "tripsLoaded" | "itemsLoaded">
      >,
    ) {
      if (!credential || credential !== token || !snapshot) return;
      const parsed = snapshotSchema.safeParse({
        ...snapshot,
        ...fields,
        savedAt: new Date().toISOString(),
      });
      if (!parsed.success) {
        failure = "Dados inválidos para consulta offline. Atualize o roteiro.";
        return;
      }
      snapshot = parsed.data;
      const value = snapshot;
      queue = queue
        .catch(() => undefined)
        .then(async () => {
          if (credential !== token) return;
          try {
            await storage.write(credential, value);
            failure = null;
          } catch {
            failure =
              "Não foi possível preparar a consulta offline. Atualize o roteiro para tentar novamente.";
          }
        });
      await queue;
    },
    async clear() {
      token = null;
      snapshot = null;
      failure = null;
      await queue.catch(() => undefined);
      await storage.clear();
    },
  };
}
export const offlineCache = createOfflineCache(offlineStorage, API_BASE_URL);
