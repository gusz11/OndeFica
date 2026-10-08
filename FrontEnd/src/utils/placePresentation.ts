import type { Place } from "../types/models";
export const PLACE_CATEGORIES: Record<string, string> = {
  museum: "Museus",
  park: "Parques",
  church: "Igrejas",
  art_gallery: "Galerias",
  stadium: "Estádios",
  zoo: "Zoológicos",
  amusement_park: "Parques de diversão",
  tourist_attraction: "Atrações",
};
export function placeCategory(place: Place): string {
  if (place.category && place.category !== "N/A") return place.category;
  const type = place.types?.find(
    (value) => value !== "tourist_attraction" && PLACE_CATEGORIES[value],
  );
  return type ? (PLACE_CATEGORIES[type] ?? "Atração") : "Atração";
}
