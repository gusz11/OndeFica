import { expect, it } from "vitest";
import { parseLegacyItinerary } from "../src/utils/legacyItinerary";
const legacy = {
  id: "local1",
  type: "place",
  visitDate: "07/10/2026",
  numberOfPeople: "2",
  placeDetails: {
    id: "ChIJ-test",
    title: "Museu",
    latitude: 0,
    longitude: 0,
    imageUrl: "https://maps.googleapis.com/photo?key=secret",
  },
};
it("preserves zero coordinates, converts local dates, and removes photo keys", () => {
  const result = parseLegacyItinerary(JSON.stringify([legacy]));
  expect(result[0]?.item.latitude).toBe(0);
  expect(result[0]?.item.visit_date).toBe("2026-10-07");
  expect(result[0]?.item.image_url).toBeNull();
  expect(JSON.stringify(result)).not.toContain("secret");
});
it("rejects invalid legacy data without silent loss", () => {
  expect(() =>
    parseLegacyItinerary(
      JSON.stringify([{ ...legacy, visitDate: "30/02/2026" }]),
    ),
  ).toThrow("data inválida");
  expect(() => parseLegacyItinerary(JSON.stringify([null]))).toThrow(
    "inválido",
  );
  expect(parseLegacyItinerary(null)).toEqual([]);
});
