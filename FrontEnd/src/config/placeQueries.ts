import { queryOptions } from "@tanstack/react-query";
import { api, unwrap } from "../services/api";

// A failed API request marks the session offline. Public reads must still finish
// with an error and allow manual retries instead of waiting indefinitely online.
export function placesQueryOptions() {
  return queryOptions({
    queryKey: ["places"],
    networkMode: "always",
    retry: false,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET("/api/pontos", {
          signal,
          params: { query: { limit: 20 } },
        }),
      ),
  });
}

export function hotelsQueryOptions(placeId: string, enabled: boolean) {
  return queryOptions({
    queryKey: ["hotels", placeId],
    enabled,
    networkMode: "always",
    retry: false,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET("/api/pontos/{place_id}/hotels", {
          signal,
          params: { path: { place_id: placeId } },
        }),
      ),
  });
}
