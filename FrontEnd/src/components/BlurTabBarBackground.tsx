import { memo } from "react";
import { Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useTabBlurTarget } from "../context/TabBlurContext";
import { useTheme } from "../context/ThemeContext";

// Android captures the active scene, outside the bar, to avoid blurring itself.
export default memo(function BlurTabBarBackground() {
  const target = useTabBlurTarget();
  const { themeMode } = useTheme();
  return (
    <BlurView
      pointerEvents="none"
      intensity={80}
      tint={themeMode}
      blurTarget={Platform.OS === "android" ? target : undefined}
      blurMethod={
        Platform.OS === "android" && target
          ? "dimezisBlurViewSdk31Plus"
          : "none"
      }
      style={StyleSheet.absoluteFill}
    />
  );
});
