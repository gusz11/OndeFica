import type { DistanceUnit, ItineraryItem, Place } from "../types/models";
import { daysBetween, formatFullDate } from "./dates";
import { calculateHaversineDistance } from "./geometry";

export type Summary = { cost: string; days: number; distance: string };
export type ItinerarySection = {
  date: string;
  title: string;
  data: ItineraryItem[];
};
export function groupItineraryByDate(
  items: ItineraryItem[],
): ItinerarySection[] {
  const groups = new Map<string, ItinerarySection>();
  for (const item of sortItinerary(items)) {
    const date = item.visit_date ?? item.check_in_date ?? "";
    const section = groups.get(date) ?? {
      date,
      title: formatFullDate(date),
      data: [],
    };
    section.data.push(item);
    groups.set(date, section);
  }
  return Array.from(groups.values());
}
export function sortItinerary(items: ItineraryItem[]): ItineraryItem[] {
  return [...items].sort(
    (a, b) =>
      (a.visit_date ?? a.check_in_date ?? "").localeCompare(
        b.visit_date ?? b.check_in_date ?? "",
      ) ||
      (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
      a.id - b.id,
  );
}
export function summarize(
  items: ItineraryItem[],
  places: Place[],
  unit: DistanceUnit,
): Summary {
  const placesById = new Map(places.map((place) => [place.id, place]));
  let total = 0;
  let unknown = false;
  let distance = 0;
  const dates: string[] = [];
  const sorted = sortItinerary(items);
  for (const [index, item] of sorted.entries()) {
    if (item.item_type === "place") {
      const fee =
        placesById.get(item.place_id_google ?? "")?.entryFee?.toLowerCase() ??
        "consultar";
      const numeric = fee.match(/\d+(?:[.,]\d+)?/);
      if (fee.includes("gratuit")) total += 0;
      else if (numeric)
        total +=
          Number(numeric[0].replace(",", ".")) * (item.number_of_people ?? 1);
      else unknown = true;
    }
    if (item.visit_date) dates.push(item.visit_date);
    if (item.check_in_date) dates.push(item.check_in_date);
    if (item.check_out_date) dates.push(item.check_out_date);
    const previous = sorted[index - 1];
    if (previous)
      distance +=
        calculateHaversineDistance(
          previous.latitude,
          previous.longitude,
          item.latitude,
          item.longitude,
        ) ?? 0;
  }
  dates.sort();
  const first = dates[0];
  const last = dates.at(-1);
  return {
    cost:
      "R$ " +
      total.toFixed(2).replace(".", ",") +
      (unknown ? " + consultar" : ""),
    days: first && last ? daysBetween(first, last) : 0,
    distance:
      (unit === "miles" ? distance * 0.621371 : distance)
        .toFixed(1)
        .replace(".", ",") +
      (unit === "miles" ? " mi" : " km") +
      " (linha reta)",
  };
}
export function itemAsPlace(item: ItineraryItem, places: Place[]): Place {
  return (
    places.find((place) => place.id === item.place_id_google) ?? {
      id: item.place_id_google ?? String(item.id),
      title: item.place_title,
      hours: "Consultar",
      entryFee: "Consultar",
      category: "N/A",
      capacity: "N/A",
      description: item.formatted_address ?? "",
      imageUrl: item.image_url,
      latitude: item.latitude,
      longitude: item.longitude,
      formatted_address: item.formatted_address,
    }
  );
}
