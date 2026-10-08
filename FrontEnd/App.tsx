import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { queryClient } from "./src/config/queryClient";
import { AuthProvider } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { PreferencesProvider } from "./src/context/PreferencesContext";
import { DialogProvider } from "./src/context/DialogContext";
import { useQueryLifecycle } from "./src/hooks/useQueryLifecycle";
import { TripsProvider } from "./src/context/TripsContext";
import Routes from "./src/navigation";
import { useStyles } from "./src/styles/styles";

function Content() {
  const { theme, themeMode } = useTheme();
  const styles = useStyles(theme);
  useQueryLifecycle();
  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundPrincipal }}>
      <StatusBar style={themeMode === "light" ? "dark" : "light"} />
      <View style={styles.appFrame}>
        <Routes />
      </View>
    </View>
  );
}
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <PreferencesProvider>
                <DialogProvider>
                  <TripsProvider>
                    <Content />
                  </TripsProvider>
                </DialogProvider>
              </PreferencesProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
