import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DistanceUnit } from "../types/models";

type Preferences = {
  distanceUnit: DistanceUnit;
  changeDistanceUnit: (unit: DistanceUnit) => void;
};
const PreferencesContext = createContext<Preferences | undefined>(undefined);
export function PreferencesProvider({ children }: PropsWithChildren) {
  const [distanceUnit, setUnit] = useState<DistanceUnit>("km");
  const changed = useRef(false);
  const writes = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem("ondefica.distance-unit")
      .then((value) => {
        if (active && !changed.current && (value === "km" || value === "miles"))
          setUnit(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  const changeDistanceUnit = useCallback((unit: DistanceUnit) => {
    changed.current = true;
    setUnit(unit);
    writes.current = writes.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem("ondefica.distance-unit", unit));
    void writes.current.catch(() => undefined);
  }, []);
  const value = useMemo(
    () => ({ distanceUnit, changeDistanceUnit }),
    [distanceUnit, changeDistanceUnit],
  );
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
export function usePreferences(): Preferences {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences exige PreferencesProvider");
  return value;
}
