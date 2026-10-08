import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "ondefica.access-token";
let webToken: string | null = null;

// Browser sessions are memory-only. Mobile tokens use OS-protected storage.
export const tokenStorage = {
  read: async (): Promise<string | null> =>
    Platform.OS === "web" ? webToken : SecureStore.getItemAsync(KEY),
  write: async (token: string): Promise<void> => {
    if (Platform.OS === "web") {
      webToken = token;
      return;
    }
    await SecureStore.setItemAsync(KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  clear: async (): Promise<void> => {
    webToken = null;
    if (Platform.OS !== "web") await SecureStore.deleteItemAsync(KEY);
  },
};
