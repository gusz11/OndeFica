import { useQuery } from "@tanstack/react-query";
import { hotelsQueryOptions, placesQueryOptions } from "../config/placeQueries";

export function usePlaces() {
  return useQuery(placesQueryOptions());
}
export function useHotels(placeId: string, enabled: boolean) {
  return useQuery(hotelsQueryOptions(placeId, enabled));
}
