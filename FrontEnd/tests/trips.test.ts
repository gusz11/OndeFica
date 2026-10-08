import { describe, expect, it, vi } from "vitest";
import type { ItineraryItem, User } from "../src/types/models";
import type {
  OfflineSnapshot,
  OfflineStorage,
} from "../src/services/offlineSchema";
import { snapshotSchema } from "../src/services/offlineSchema";
import { conflictingVisits, validateSchedule } from "../src/utils/schedule";
import { groupItineraryByDate } from "../src/utils/itinerary";
import { createOfflineCache } from "../src/services/offlineCache";
vi.mock("../src/services/offlineStorage", () => ({ offlineStorage: {} }));

const user: User = {
  id: 1,
  email: "ana@example.com",
  is_active: true,
  created_at: "2026-10-07",
};
const visit = {
  id: 1,
  user_id: 1,
  trip_id: 1,
  item_type: "place",
  place_title: "Museu",
  created_at: "2026-10-07",
  visit_date: "2026-10-12",
  number_of_people: 1,
  sort_order: 0,
  start_time: "09:00",
  duration_minutes: 60,
} satisfies ItineraryItem;
function memoryStorage() {
  let stored: { token: string; snapshot: OfflineSnapshot } | null = null;
  return {
    async read(token: string) {
      return stored?.token === token ? stored.snapshot : null;
    },
    async write(token: string, snapshot: OfflineSnapshot) {
      stored = { token, snapshot };
    },
    async clear() {
      stored = null;
    },
  } satisfies OfflineStorage;
}
describe("Viagens e horários", () => {
  it("valida pares de campos, limites e visita terminando à meia-noite", () => {
    expect(validateSchedule("", "")).toEqual({
      start_time: null,
      duration_minutes: null,
    });
    expect(validateSchedule("23:00", "60").duration_minutes).toBe(60);
    for (const [time, duration] of [
      ["24:00", "60"],
      ["09:00", ""],
      ["", "60"],
      ["23:30", "60"],
      ["09:00", "-1"],
    ])
      expect(() => validateSchedule(time ?? "", duration ?? "")).toThrow();
  });
  it("detecta sobreposição só na mesma viagem e dia, aceitando horários adjacentes", () => {
    expect([
      ...conflictingVisits([
        visit,
        { ...visit, id: 2, start_time: "09:30" },
        { ...visit, id: 3, start_time: "10:30" },
        { ...visit, id: 4, trip_id: 2 },
        { ...visit, id: 5, visit_date: "2026-10-13" },
      ]),
    ]).toEqual([1, 2]);
  });
  it("mantém ordem manual dentro de cada dia e cronologia entre dias", () => {
    const sections = groupItineraryByDate(
      [
        visit,
        { ...visit, id: 2, sort_order: 0 },
        { ...visit, id: 3, sort_order: 1 },
        { ...visit, id: 4, visit_date: "2026-10-11", sort_order: 9 },
        { ...visit, id: 1, sort_order: 2 },
      ].filter((item, index) => index !== 0),
    );
    expect(sections.map((s) => s.data.map((i) => i.id))).toEqual([
      [4],
      [2, 3, 1],
    ]);
  });
});
describe("Consulta offline privada", () => {
  it("restaura após recriar o cache e isola credencial, conta e servidor", async () => {
    const storage = memoryStorage();
    const cache = createOfflineCache(storage, "server-a");
    cache.activate("token-a", user);
    await cache.update("token-a", { items: [visit], itemsLoaded: true });
    await cache.update("token-a", {
      trips: [{ id: 1, user_id: 1, name: "Viagem", created_at: "2026-10-07" }],
      tripsLoaded: true,
    });
    expect(
      (await createOfflineCache(storage, "server-a").restore("token-a"))
        ?.items[0]?.place_title,
    ).toBe("Museu");
    expect(await cache.restore("token-b")).toBeNull();
    expect(
      await createOfflineCache(storage, "server-b").restore("token-a"),
    ).toBeNull();
    cache.activate("token-b", { ...user, id: 2 });
    await cache.update("token-a", { items: [visit] });
    expect(cache.snapshot?.items).toEqual([]);
  });
  it("espera gravação em andamento antes de apagar e não ressuscita cache após logout", async () => {
    const storage = memoryStorage();
    let finish: (() => void) | undefined;
    const delayed: OfflineStorage = {
      ...storage,
      async write(token, snapshot) {
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
        await storage.write(token, snapshot);
      },
    };
    const cache = createOfflineCache(delayed, "server");
    cache.activate("token", user);
    const writing = cache.update("token", { items: [visit] });
    await vi.waitFor(() => expect(finish).toBeDefined());
    const clearing = cache.clear();
    finish?.();
    await Promise.all([writing, clearing]);
    expect(await cache.restore("token")).toBeNull();
    expect(cache.snapshot).toBeNull();
  });
  it("mantém as duas respostas concorrentes e informa falha de armazenamento", async () => {
    const storage = memoryStorage();
    const cache = createOfflineCache(storage, "server");
    cache.activate("token", user);
    await Promise.all([
      cache.update("token", { items: [visit], itemsLoaded: true }),
      cache.update("token", { trips: [], tripsLoaded: true }),
    ]);
    expect((await cache.restore("token"))?.items).toHaveLength(1);
    const bad = createOfflineCache(
      {
        ...storage,
        async write() {
          throw new Error("disk full");
        },
      },
      "server",
    );
    bad.activate("token", user);
    await bad.update("token", {});
    expect(bad.error).toContain("consulta offline");
  });
  it("rejeita payload corrompido e dados de outra conta", () => {
    const good = {
      version: 1,
      origin: "server",
      savedAt: "2026-10-07",
      user,
      trips: [],
      items: [visit],
      tripsLoaded: true,
      itemsLoaded: true,
    };
    expect(snapshotSchema.safeParse(good).success).toBe(true);
    expect(
      snapshotSchema.safeParse({ ...good, items: [{ ...visit, user_id: 2 }] })
        .success,
    ).toBe(false);
    expect(
      snapshotSchema.safeParse({
        ...good,
        items: [{ ...visit, start_time: "25:00" }],
      }).success,
    ).toBe(false);
    expect(
      snapshotSchema.safeParse({
        ...good,
        items: [{ ...visit, latitude: NaN }],
      }).success,
    ).toBe(false);
  });
});
