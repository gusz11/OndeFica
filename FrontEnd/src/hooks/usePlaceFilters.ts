import { useDeferredValue, useMemo, useState } from "react";
import type { Place } from "../types/models";
import { PLACE_CATEGORIES } from "../utils/placePresentation";

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function usePlaceFilters(places: Place[], favorites: Set<string>) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const deferred = useDeferredValue(search);
  const filters = useMemo(() => {
    const types = new Set(
      places
        .flatMap((place) => place.types ?? [])
        .filter((type) => PLACE_CATEGORIES[type]),
    );
    return [
      { value: "all", label: "Todos" },
      { value: "favorites", label: "Salvos" },
      ...Array.from(types)
        .sort()
        .map((value) => ({
          value,
          label: PLACE_CATEGORIES[value] ?? "Atrações",
        })),
    ];
  }, [places]);
  const displayed = useMemo(
    () =>
      places.filter(
        (place) =>
          (filter === "all" ||
            (filter === "favorites"
              ? favorites.has(place.id)
              : place.types?.includes(filter))) &&
          normalize(place.title).includes(normalize(deferred)),
      ),
    [places, favorites, filter, deferred],
  );
  return { search, setSearch, filter, setFilter, filters, displayed };
}
