import type { ItineraryItem } from "../types/models";
import type { Summary } from "./itinerary";
import { scheduleLabel } from "./schedule";
import { formatDate } from "./dates";

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] ?? character,
  );
}
export function itineraryHtml(
  items: ItineraryItem[],
  summary: Summary,
  tripName = "Minha programação",
): string {
  // All user/provider strings are escaped before insertion into printable HTML.
  const rows = items
    .map(
      (item) =>
        "<article><h2>" +
        escapeHtml(item.place_title) +
        "</h2><p>" +
        (item.item_type === "hotel"
          ? "Hospedagem: " +
            formatDate(item.check_in_date) +
            " a " +
            formatDate(item.check_out_date)
          : "Visita: " +
            formatDate(item.visit_date) +
            " · Pessoas: " +
            String(item.number_of_people ?? 1)) +
        "</p><p>" +
        (item.item_type === "place" ? escapeHtml(scheduleLabel(item)) : "") +
        "</p><p>" +
        escapeHtml(item.formatted_address ?? "") +
        "</p></article>",
    )
    .join("");
  return (
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>OndeFica</title>' +
    "<style>body{font-family:sans-serif;padding:24px;color:#222}article{border-bottom:1px solid #ddd;padding:12px 0;break-inside:avoid}h1{font-size:26px}h2{font-size:18px}</style></head>" +
    "<body><h1>OndeFica — " +
    escapeHtml(tripName) +
    "</h1>" +
    rows +
    "<h2>Resumo</h2><p>Ingressos: " +
    escapeHtml(summary.cost) +
    "</p><p>Dias: " +
    summary.days +
    "</p><p>Distância: " +
    escapeHtml(summary.distance) +
    "</p><p>Valores e trajetos são estimativas; confirme com os locais.</p></body></html>"
  );
}
