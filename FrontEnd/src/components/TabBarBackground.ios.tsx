import { memo } from "react";
import { StyleSheet } from "react-native";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { useTheme } from "../context/ThemeContext";
import { floatingTabBar } from "../styles/navigation";
import BlurTabBarBackground from "./BlurTabBarBackground";

export default memo(function TabBarBackground() {
  const { themeMode } = useTheme();
  // Check the native runtime too: an OS version alone cannot guarantee support.
  if (!isGlassEffectAPIAvailable() || !isLiquidGlassAvailable()) {
    return <BlurTabBarBackground />;
  }
  return (
    <GlassView
      pointerEvents="none"
      glassEffectStyle="clear"
      colorScheme={themeMode}
      // Keep the native material untinted, without an opaque background or
      // opacity animation. iOS applies its transparency accessibility settings.
      style={styles.glass}
    />
  );
});

const styles = StyleSheet.create({
  glass: {
    ...StyleSheet.absoluteFill,
    borderRadius: floatingTabBar.radius,
  },
});
