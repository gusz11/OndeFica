import { Linking } from "react-native";

export async function openSafeUrl(value: string): Promise<void> {
  const url = new URL(value);
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("Link indisponível.");
  await Linking.openURL(value);
}
export function mapsUrl(id: string, title: string): string {
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(title) +
    "&query_place_id=" +
    encodeURIComponent(id)
  );
}
export async function callPhone(value: string): Promise<void> {
  const digits = value.replace(/[^\d+]/g, "");
  if (!/^\+?\d{6,15}$/.test(digits)) throw new Error("Telefone indisponível.");
  await Linking.openURL("tel:" + digits);
}
