import { useCallback, useMemo } from "react";
import {
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useReadOnly } from "./useReadOnly";
import { useTrips } from "../context/TripsContext";
import { offlineCache } from "../services/offlineCache";
import { api, ensureSuccess, isCurrentSession, unwrap } from "../services/api";
import type {
  Favorite,
  ItineraryCreate,
  ItineraryItem,
  ItineraryUpdate,
  Place,
} from "../types/models";

function createPayload(
  place: Place,
  dates:
    | { visit_date: string; number_of_people: number }
    | { check_in_date: string; check_out_date: string },
): ItineraryCreate {
  return {
    place_id_google: place.id,
    place_title: place.title,
    item_type: "visit_date" in dates ? "place" : "hotel",
    latitude: place.latitude,
    longitude: place.longitude,
    formatted_address: place.formatted_address,
    // Signed photo URLs expire. Refresh via catalog/details instead of persisting those credentials.
    image_url: place.imageUrl?.startsWith("https://") ? place.imageUrl : null,
    ...dates,
  };
}

export function useItinerary() {
  const { userData, userToken } = useAuth();
  const readOnly = useReadOnly();
  const client = useQueryClient();
  const { activeTrip } = useTrips();
  const userId = userData?.id;
  const key = useMemo(() => ["itinerary", userId] as const, [userId]);
  const query = useQuery({
    networkMode: "always",
    retry: false,
    queryKey: key,
    enabled: userId !== undefined && !readOnly,
    queryFn: async ({ signal }): Promise<ItineraryItem[]> => {
      const items: ItineraryItem[] = [];
      for (let skip = 0; ; skip += 100) {
        const page = unwrap(
          await api.GET("/itinerary/", {
            signal,
            params: { query: { skip, limit: 100 } },
          }),
        );
        items.push(...page);
        if (page.length < 100) {
          await offlineCache.update(userToken, {
            items: items.map((item) => ({ ...item, image_url: null })),
            itemsLoaded: true,
          });
          return items;
        }
      }
    },
  });
  const guard = useCallback(() => {
    if (readOnly || !onlineManager.isOnline() || !userData)
      throw new Error("Conecte-se para alterar a programação.");
  }, [readOnly, userData]);
  const refresh = useCallback(async () => {
    if (isCurrentSession(userToken))
      await client.invalidateQueries({ queryKey: key });
  }, [client, key, userToken]);
  const { mutateAsync: create, isPending: creating } = useMutation({
    networkMode: "always",
    mutationFn: async (body: ItineraryCreate) => {
      guard();
      return unwrap(await api.POST("/itinerary/", { body }));
    },
    onSuccess: refresh,
  });
  const { mutateAsync: update, isPending: updating } = useMutation({
    networkMode: "always",
    mutationFn: async ({ id, data }: { id: number; data: ItineraryUpdate }) =>
      unwrap(
        await api.PATCH("/itinerary/{item_id}", {
          params: { path: { item_id: id } },
          body: data,
        }),
      ),
    onSuccess: refresh,
  });
  const { mutateAsync: remove, isPending: removing } = useMutation({
    networkMode: "always",
    mutationFn: async (id: number) =>
      ensureSuccess(
        await api.DELETE("/itinerary/{item_id}", {
          params: { path: { item_id: id } },
        }),
      ),
    onSuccess: refresh,
  });
  const addPlace = useCallback(
    async (
      place: Place,
      date: string,
      people: number,
      startTime: string | null = null,
      duration: number | null = null,
    ) => {
      guard();
      if (!activeTrip) throw new Error("Crie ou selecione uma viagem.");
      await create({
        ...createPayload(place, { visit_date: date, number_of_people: people }),
        trip_id: activeTrip.id,
        start_time: startTime,
        duration_minutes: duration,
      });
    },
    [create, activeTrip, guard],
  );
  const addHotel = useCallback(
    async (hotel: Place, checkIn: string, checkOut: string) => {
      guard();
      if (!activeTrip) throw new Error("Crie ou selecione uma viagem.");
      await create({
        ...createPayload(hotel, {
          check_in_date: checkIn,
          check_out_date: checkOut,
        }),
        trip_id: activeTrip.id,
      });
    },
    [create, activeTrip, guard],
  );
  const editItem = useCallback(
    async (input: { id: number; data: ItineraryUpdate }) => {
      guard();
      return update(input);
    },
    [guard, update],
  );
  const deleteItem = useCallback(
    async (id: number) => {
      guard();
      return remove(id);
    },
    [guard, remove],
  );
  const reorder = useCallback(
    async (day: string, itemIds: number[]) => {
      guard();
      if (!activeTrip) return;
      unwrap(
        await api.POST("/trips/{trip_id}/days/{day}/order", {
          params: { path: { trip_id: activeTrip.id, day } },
          body: { item_ids: itemIds },
        }),
      );
      await refresh();
    },
    [guard, activeTrip, refresh],
  );
  const visibleItems = useMemo(
    () => query.data?.filter((item) => item.trip_id === activeTrip?.id),
    [query.data, activeTrip?.id],
  );
  return {
    ...query,
    items: visibleItems,
    addPlace,
    addHotel,
    update: editItem,
    remove: deleteItem,
    reorder,
    isSaving: creating || updating || removing,
  };
}

export function useFavorites() {
  const { userData, userToken } = useAuth();
  const readOnly = useReadOnly();
  const client = useQueryClient();
  const key = useMemo(
    () => ["favorites", userData?.id] as const,
    [userData?.id],
  );
  const query = useQuery({
    networkMode: "always",
    retry: false,
    queryKey: key,
    enabled: !!userData && !readOnly,
    queryFn: async ({ signal }): Promise<Favorite[]> => {
      const items: Favorite[] = [];
      for (let skip = 0; ; skip += 100) {
        const page = unwrap(
          await api.GET("/favorites/", {
            signal,
            params: { query: { skip, limit: 100 } },
          }),
        );
        items.push(...page);
        if (page.length < 100) return items;
      }
    },
  });
  const ids = useMemo(
    () => new Set(query.data?.map((item) => item.place_id_google)),
    [query.data],
  );
  const { mutateAsync, isPending } = useMutation({
    networkMode: "always",
    mutationFn: async ({ place, saved }: { place: Place; saved: boolean }) => {
      if (readOnly || !onlineManager.isOnline() || !userData)
        throw new Error("Conecte-se para alterar os favoritos.");
      if (saved)
        ensureSuccess(
          await api.DELETE("/favorites/{place_id}", {
            params: { path: { place_id: place.id } },
          }),
        );
      else
        unwrap(
          await api.POST("/favorites/", {
            body: { place_id_google: place.id, place_title: place.title },
          }),
        );
    },
    onSuccess: async () => {
      if (isCurrentSession(userToken))
        await client.invalidateQueries({ queryKey: key });
    },
  });
  const toggle = useCallback(
    (place: Place) => mutateAsync({ place, saved: ids.has(place.id) }),
    [mutateAsync, ids],
  );
  return { ...query, ids, toggle, isSaving: isPending };
}
