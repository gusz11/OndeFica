import { memo, useEffect, useState } from "react";
import {
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { floatingTabBar, tabBarMetrics } from "../styles/navigation";
import { useTheme } from "../context/ThemeContext";
import TabBarBackground from "./TabBarBackground";
import Icon, { type IconName } from "./Icon";

const icons: Readonly<Record<string, IconName>> = {
  Pontos: "compass",
  Programação: "calendar",
  Configurações: "sliders",
};

export default memo(function GlassTabBar({
  state,
  descriptors,
  navigation,
  position,
}: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme, themeMode } = useTheme();
  const { fontScale } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(Keyboard.isVisible());
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const { capsuleHeight } = tabBarMetrics(fontScale, insets.bottom);
  const itemWidth =
    Math.max(0, width - floatingTabBar.innerPadding * 2 - 2) /
    state.routes.length;
  // The pager's continuous position follows both taps and the user's finger.
  const translateX = position.interpolate({
    inputRange: state.routes.map((_, index) => index),
    outputRange: state.routes.map((_, index) => index * itemWidth),
    extrapolate: "clamp",
  });
  if (keyboardVisible) return null;
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.safeArea,
        {
          paddingBottom: insets.bottom,
          paddingLeft: Math.max(insets.left, floatingTabBar.horizontalInset),
          paddingRight: Math.max(insets.right, floatingTabBar.horizontalInset),
        },
      ]}
    >
      <View
        accessibilityRole="tablist"
        onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
        style={[styles.capsule, { height: capsuleHeight }]}
      >
        <TabBarBackground />
        {width > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.selection,
              {
                width: Math.max(0, itemWidth - 4),
                transform: [{ translateX }],
                backgroundColor:
                  themeMode === "dark"
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.06)",
              },
            ]}
          />
        )}
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key]?.options;
          const label = options?.title ?? route.name;
          const color = focused ? theme.textoPrimario : theme.textoSecundario;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              aria-selected={focused}
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented)
                  navigation.navigate(route.name, route.params);
              }}
              onLongPress={() =>
                navigation.emit({ type: "tabLongPress", target: route.key })
              }
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <Icon
                name={icons[route.name] ?? "circle"}
                size={22}
                color={color}
              />
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                maxFontSizeMultiplier={1.4}
                style={[styles.label, { color }]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  safeArea: { position: "absolute", bottom: 0, left: 0, right: 0 },
  capsule: {
    flexDirection: "row",
    padding: floatingTabBar.innerPadding,
    marginBottom: floatingTabBar.bottomGap,
    borderRadius: floatingTabBar.radius,
    overflow: "hidden",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  selection: {
    position: "absolute",
    top: 6,
    bottom: 6,
    left: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  item: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 4,
    gap: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  label: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  pressed: { backgroundColor: "rgba(255, 255, 255, 0.08)" },
});
