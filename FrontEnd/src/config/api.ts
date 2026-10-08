const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
export const API_BASE_URL = (configured || "http://localhost:8000").replace(
  /\/$/,
  "",
);
const parsed = new URL(API_BASE_URL);
if (
  !["http:", "https:"].includes(parsed.protocol) ||
  parsed.username ||
  parsed.password ||
  parsed.search ||
  parsed.hash
) {
  throw new Error("EXPO_PUBLIC_API_URL inválida");
}
if (!__DEV__ && parsed.protocol !== "https:") {
  throw new Error("A API exige HTTPS em produção");
}

// The API returns relative photo proxy paths. Never interpret arbitrary URL schemes.
export function imageUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("/api/photos?")) return API_BASE_URL + value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? value : undefined;
  } catch {
    return undefined;
  }
}
