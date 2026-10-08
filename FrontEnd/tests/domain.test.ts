import { describe, expect, it } from "vitest";
import { daysBetween, parseISODate, toISODate } from "../src/utils/dates";
import { calculateHaversineDistance } from "../src/utils/geometry";
import { groupItineraryByDate, summarize } from "../src/utils/itinerary";
import { escapeHtml, itineraryHtml } from "../src/utils/pdf";
import type { ItineraryItem, Place } from "../src/types/models";

const item: ItineraryItem = {
  sort_order: 0,
  id: 1,
  user_id: 1,
  created_at: "2026-10-01T12:00:00Z",
  place_title: "Museu",
  place_id_google: "museum",
  item_type: "place",
  visit_date: "2026-10-07",
  number_of_people: 2,
  latitude: 0,
  longitude: 0,
};
const place: Place = {
  id: "museum",
  title: "Museu",
  description: "",
  entryFee: "Gratuito",
  hours: "Consultar",
  capacity: "Consultar",
  category: "Museu",
};

describe("Calendar-only dates", () => {
  it("rejects invalid days and preserves local dates near midnight", () => {
    expect(parseISODate("2026-02-30")).toBeNull();
    expect(parseISODate("07/10/2026")).toBeNull();
    expect(parseISODate("2024-02-29")).not.toBeNull();
    expect(toISODate(new Date(2026, 9, 7, 23, 59))).toBe("2026-10-07");
  });
  it("counts inclusive days without DST offsets", () => {
    expect(daysBetween("2026-10-07", "2026-10-07")).toBe(1);
    expect(daysBetween("2026-10-07", "2026-10-09")).toBe(3);
    expect(daysBetween("2026-10-09", "2026-10-07")).toBe(0);
  });
});
describe("Distance and price summaries", () => {
  it("groups visits and hotels by date without moving later stays before earlier visits", () => {
    const hotel: ItineraryItem = {
      ...item,
      id: 3,
      item_type: "hotel",
      visit_date: null,
      number_of_people: null,
      check_in_date: "2026-10-08",
      check_out_date: "2026-10-10",
    };
    const nextVisit = { ...item, id: 2, visit_date: "2026-10-08" };
    const sections = groupItineraryByDate([hotel, nextVisit, item]);
    expect(sections.map((section) => section.date)).toEqual([
      "2026-10-07",
      "2026-10-08",
    ]);
    expect(
      sections.map((section) => section.data.map((entry) => entry.id)),
    ).toEqual([[1], [2, 3]]);
  });
  it("accepts zero coordinates and rejects missing or invalid coordinates", () => {
    expect(calculateHaversineDistance(0, 0, 0, 1)).toBeCloseTo(111.195, 2);
    expect(calculateHaversineDistance(null, 0, 0, 1)).toBeNull();
    expect(calculateHaversineDistance(91, 0, 0, 1)).toBeNull();
    expect(calculateHaversineDistance(0, 0, 0, 180)).toBeCloseTo(20015.087, 2);
  });
  it("recognizes free admissions and multiplies paid fees by people", () => {
    expect(summarize([item], [place], "km").cost).toBe("R$ 0,00");
    expect(
      summarize([item], [{ ...place, entryFee: "R$ 10,50" }], "km").cost,
    ).toBe("R$ 21,00");
    expect(summarize([item], [], "km").cost).toContain("consultar");
  });
  it("handles chronology, miles, and one-day itineraries", () => {
    const summary = summarize(
      [item, { ...item, id: 2, longitude: 1, visit_date: "2026-10-08" }],
      [place],
      "miles",
    );
    expect(summary.distance).toBe("69,1 mi (linha reta)");
    expect(summary.days).toBe(2);
    expect(summarize([item], [place], "km").days).toBe(1);
  });
});
describe("Printable HTML", () => {
  it("escapes scripts, markup, quotes, and user-provided addresses", () => {
    const unsafe = '<script>alert("secret")</script>';
    const html = itineraryHtml(
      [
        {
          ...item,
          place_title: unsafe,
          formatted_address: "<img src=x onerror=alert(1)>",
        },
      ],
      summarize([item], [place], "km"),
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
    expect(escapeHtml("&<>'\"")).toBe("&amp;&lt;&gt;&#39;&quot;");
  });
});
