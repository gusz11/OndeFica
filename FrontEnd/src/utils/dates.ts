// Calendar-only dates must not travel through toISOString(), which shifts local days to UTC.
export function toISODate(value: Date): string {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}
export function parseISODate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined)
    return null;
  const date = new Date(year, month - 1, day, 12);
  return toISODate(date) === value ? date : null;
}
export function formatDate(value: string | null | undefined): string {
  return value && parseISODate(value)
    ? value.split("-").reverse().join("/")
    : "Não informado";
}
export function nextDay(value: Date): Date {
  const result = new Date(value);
  result.setDate(result.getDate() + 1);
  return result;
}
export function formatFullDate(value: string): string {
  const date = parseISODate(value);
  if (!date) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
export function daysBetween(first: string, last: string): number {
  const start = parseISODate(first);
  const end = parseISODate(last);
  if (!start || !end || end < start) return 0;
  return (
    Math.round(
      (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
        Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
        86400000,
    ) + 1
  );
}
