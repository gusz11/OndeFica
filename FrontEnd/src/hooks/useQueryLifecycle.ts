import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import * as Network from "expo-network";
import { focusManager, onlineManager } from "@tanstack/react-query";

export function useQueryLifecycle(): void {
  useEffect(() => {
    if (Platform.OS === "web") return;
    let active = true;
    void Network.getNetworkStateAsync()
      .then((state) => {
        if (active)
          onlineManager.setOnline(
            state.isInternetReachable ?? state.isConnected ?? true,
          );
      })
      .catch(() => undefined);
    const connection = Network.addNetworkStateListener((state) =>
      onlineManager.setOnline(
        state.isInternetReachable ?? state.isConnected ?? true,
      ),
    );
    const focus = AppState.addEventListener("change", (state) =>
      focusManager.setFocused(state === "active"),
    );
    focusManager.setFocused(AppState.currentState === "active");
    return () => {
      active = false;
      focus.remove();
      connection.remove();
      focusManager.setFocused(undefined);
    };
  }, []);
}
