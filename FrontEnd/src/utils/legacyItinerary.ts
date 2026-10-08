import type { components } from "../types/api.generated";
import type { ItineraryCreate } from "../types/models";
import { parseISODate } from "./dates";

export type LegacyEntry = components["schemas"]["ItineraryImportEntry"];
function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("Item local inválido.");
  return value as Record<string, unknown>;
}
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function date(value: unknown): string {
  const candidate = text(value) ?? "";
  const iso = /^\d{2}\/\d{2}\/\d{4}$/.test(candidate)
    ? candidate.split("/").reverse().join("-")
    : candidate;
  if (!parseISODate(iso))
    throw new Error(
      "A programação antiga contém uma data inválida. O original foi preservado.",
    );
  return iso;
}
function coordinate(value: unknown, limit: number): number | null {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : NaN;
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}
export function parseLegacyItinerary(raw: string | null): LegacyEntry[] {
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length > 100)
    throw new Error(
      "A importação aceita uma programação local com até 100 itens.",
    );
  return parsed.map((value: unknown) => {
    const old = record(value);
    const details = record(old.placeDetails);
    const title = text(details.title) ?? text(details.name);
    const id = text(old.id);
    const placeId = text(details.id);
    if (
      !title ||
      title.length > 200 ||
      !id ||
      id.length > 255 ||
      !["place", "hotel"].includes(String(old.type))
    )
      throw new Error(
        "A programação antiga contém um item inválido. O original foi preservado.",
      );
    const lat = coordinate(details.latitude ?? details.lat, 90);
    const lng = coordinate(details.longitude ?? details.lng, 180);
    const base = {
      place_title: title,
      place_id_google:
        placeId && /^[a-zA-Z0-9_-]{1,255}$/.test(placeId) ? placeId : null,
      latitude: lat !== null && lng !== null ? lat : null,
      longitude: lat !== null && lng !== null ? lng : null,
      formatted_address: text(details.formatted_address)?.slice(0, 500) ?? null,
      // Old photo URLs may contain the Google key. Never migrate them to the server.
      image_url: null,
    };
    let item: ItineraryCreate;
    if (old.type === "hotel")
      item = {
        ...base,
        item_type: "hotel",
        check_in_date: date(old.checkInDate),
        check_out_date: date(old.checkOutDate),
      };
    else {
      const people = Number(old.numberOfPeople);
      if (!Number.isInteger(people) || people < 1 || people > 1000)
        throw new Error(
          "Quantidade de pessoas inválida na programação antiga.",
        );
      item = {
        ...base,
        item_type: "place",
        visit_date: date(old.visitDate),
        number_of_people: people,
      };
    }
    return { local_id: id, item };
  });
}
