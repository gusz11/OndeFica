import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { api, ensureSuccess, isCurrentSession, unwrap } from "../services/api";
import { offlineCache } from "../services/offlineCache";
import { useReadOnly } from "../hooks/useReadOnly";
import type { Trip, TripCreate } from "../types/models";

function useTripsState() {
  const { userData, userToken } = useAuth();
  const readOnly = useReadOnly();
  const client = useQueryClient();
  const [selection, setSelection] = useState<{
    owner: number;
    trip: number;
  } | null>(null);
  const key = useMemo(() => ["trips", userData?.id] as const, [userData?.id]);
  const query = useQuery({
    networkMode: "always",
    retry: false,
    queryKey: key,
    enabled: !!userData && !readOnly,
    queryFn: async ({ signal }) => {
      const trips: Trip[] = [];
      for (let skip = 0; ; skip += 100) {
        const page = unwrap(
          await api.GET("/trips/", {
            signal,
            params: { query: { skip, limit: 100 } },
          }),
        );
        trips.push(...page);
        if (page.length < 100) {
          if (isCurrentSession(userToken))
            await offlineCache.update(userToken, { trips, tripsLoaded: true });
          return trips;
        }
      }
    },
  });
  const refresh = async () => {
    if (isCurrentSession(userToken))
      await Promise.all([
        client.invalidateQueries({ queryKey: key }),
        client.invalidateQueries({ queryKey: ["itinerary", userData?.id] }),
      ]);
  };
  const mutation = useMutation({
    networkMode: "always",
    mutationFn: async (
      input: { body: TripCreate; id?: number } | { remove: number },
    ) => {
      if (readOnly || !onlineManager.isOnline() || !userData)
        throw new Error("Conecte-se para alterar suas viagens.");
      if ("remove" in input) {
        ensureSuccess(
          await api.DELETE("/trips/{trip_id}", {
            params: { path: { trip_id: input.remove } },
          }),
        );
        return null;
      }
      return input.id
        ? unwrap(
            await api.PATCH("/trips/{trip_id}", {
              params: { path: { trip_id: input.id } },
              body: input.body,
            }),
          )
        : unwrap(await api.POST("/trips/", { body: input.body }));
    },
    onSuccess: refresh,
  });
  const activeTrip =
    query.data?.find(
      (t) => selection?.owner === userData?.id && t.id === selection?.trip,
    ) ??
    query.data?.[0] ??
    null;
  return {
    ...query,
    activeTrip,
    select: (id: number) => {
      if (userData) setSelection({ owner: userData.id, trip: id });
    },
    save: async (body: TripCreate, id?: number) => {
      const trip = await mutation.mutateAsync({ body, id });
      if (trip && userData) setSelection({ owner: userData.id, trip: trip.id });
    },
    remove: (id: number) => mutation.mutateAsync({ remove: id }),
    saving: mutation.isPending,
    readOnly,
  };
}
const Context = createContext<ReturnType<typeof useTripsState> | undefined>(
  undefined,
);
export function TripsProvider({ children }: PropsWithChildren) {
  const state = useTripsState();
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useTrips() {
  const state = useContext(Context);
  if (!state) throw new Error("TripsProvider ausente");
  return state;
}
