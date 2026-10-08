import type { ExpoConfig } from "expo/config";

// Only public metadata belongs in Expo config. Google Places/JWT secrets stay on the API.
const config: ExpoConfig = {
  name: "OndeFica",
  slug: "OndeFica",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "com.gusta.ondefica",
  icon: "./assets/placeholder.png",
  userInterfaceStyle: "automatic",
  plugins: [
    "expo-secure-store",
    "expo-sharing",
    "expo-status-bar",
    "@react-native-community/datetimepicker",
    "expo-font",
  ],
  ios: { supportsTablet: true, bundleIdentifier: "com.gusta.ondefica" },
  android: {
    package: "com.gusta.ondefica",
    adaptiveIcon: {
      foregroundImage: "./assets/placeholder.png",
      backgroundColor: "#FFFFFF",
    },
  },
  web: { favicon: "./assets/placeholder.png" },
};
export default config;
