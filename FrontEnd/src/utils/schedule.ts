import type { ItineraryItem } from "../types/models";
export function validateSchedule(time: string, duration: string) {
  if (!time && !duration) return { start_time: null, duration_minutes: null };
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) || !/^\d+$/.test(duration))
    throw new Error("Informe horário HH:mm e duração em minutos.");
  const minutes = Number(duration);
  const start = Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  if (minutes < 1 || minutes > 1440 || start + minutes > 1440)
    throw new Error("A visita precisa terminar até meia-noite.");
  return { start_time: time, duration_minutes: minutes };
}
export function scheduleLabel(item: ItineraryItem) {
  if (!item.start_time || !item.duration_minutes) return "Horário livre";
  const end =
    Number(item.start_time.slice(0, 2)) * 60 +
    Number(item.start_time.slice(3)) +
    item.duration_minutes;
  return `${item.start_time}–${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")} · ${item.duration_minutes} min`;
}
export function conflictingVisits(items: ItineraryItem[]): Set<number> {
  const result = new Set<number>();
  const scheduled = items.filter(
    (i) => i.item_type === "place" && i.start_time && i.duration_minutes,
  );
  for (const [index, a] of scheduled.entries())
    for (const b of scheduled.slice(index + 1)) {
      if (a.trip_id !== b.trip_id || a.visit_date !== b.visit_date) continue;
      const start = (i: ItineraryItem) =>
        Number(i.start_time?.slice(0, 2)) * 60 + Number(i.start_time?.slice(3));
      if (
        start(a) < start(b) + (b.duration_minutes ?? 0) &&
        start(b) < start(a) + (a.duration_minutes ?? 0)
      ) {
        result.add(a.id);
        result.add(b.id);
      }
    }
  return result;
}
