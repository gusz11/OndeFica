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
import { Platform, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  darkThemeColors,
  lightThemeColors,
  type ThemeColors,
} from "../styles/styles";

type ThemeMode = "light" | "dark";
type ThemeChoice = ThemeMode | "system";
type ThemeState = {
  theme: ThemeColors;
  themeMode: ThemeMode;
  choice: ThemeChoice;
  changeTheme: (value: ThemeChoice) => void;
};
const ThemeContext = createContext<ThemeState | undefined>(undefined);
export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [choice, setChoice] = useState<ThemeChoice>("dark");
  const changed = useRef(false);
  const writes = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem("ondefica.theme")
      .then((value) => {
        if (
          active &&
          !changed.current &&
          (value === "light" || value === "dark" || value === "system")
        )
          setChoice(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  const changeTheme = useCallback((value: ThemeChoice) => {
    changed.current = true;
    setChoice(value);
    writes.current = writes.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem("ondefica.theme", value));
    void writes.current.catch(() => undefined);
  }, []);
  const themeMode: ThemeMode =
    choice === "system" ? (system === "light" ? "light" : "dark") : choice;
  const theme = themeMode === "light" ? lightThemeColors : darkThemeColors;
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    // Controles e barras de rolagem do navegador acompanham o tema do app.
    const previous = document.documentElement.style.colorScheme;
    document.documentElement.style.colorScheme = themeMode;
    return () => {
      document.documentElement.style.colorScheme = previous;
    };
  }, [themeMode]);
  const value = useMemo(
    () => ({ theme, themeMode, choice, changeTheme }),
    [theme, themeMode, choice, changeTheme],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
export function useTheme(): ThemeState {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme exige ThemeProvider");
  return value;
}
