import { useReadOnly } from "./useReadOnly";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { api, isCurrentSession, unwrap } from "../services/api";
import {
  parseLegacyItinerary,
  type LegacyEntry,
} from "../utils/legacyItinerary";

export function useLegacyImport() {
  const { userData, userToken } = useAuth();
  const readOnly = useReadOnly();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["legacy-itinerary", userData?.id],
    staleTime: Infinity,
    retry: false,
    queryFn: async (): Promise<LegacyEntry[]> =>
      parseLegacyItinerary(
        await AsyncStorage.getItem("@OndeFica:itineraryItems"),
      ),
  });
  const importEntries = async () => {
    if (readOnly || !userData)
      throw new Error("Conecte-se para importar sua programação.");
    const entries = query.data ?? [];
    if (!entries.length) return null;
    const result = unwrap(
      await api.POST("/itinerary/import", { body: { entries } }),
    );
    if (isCurrentSession(userToken))
      await Promise.all([
        client.invalidateQueries({ queryKey: ["itinerary", userData?.id] }),
        client.invalidateQueries({ queryKey: ["trips", userData?.id] }),
      ]);
    return result;
  };
  return { ...query, importEntries };
}
