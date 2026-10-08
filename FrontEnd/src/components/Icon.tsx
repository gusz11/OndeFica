import type { ComponentProps } from "react";
import { View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export type IconName = ComponentProps<typeof Feather>["name"];
export default function Icon({
  name,
  color,
  size = 20,
  filled = false,
}: {
  name: IconName;
  color: string;
  size?: number;
  filled?: boolean;
}) {
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {name === "bookmark" ? (
        // Feather só oferece contorno. Este par mantém a mesma forma nos dois estados.
        <FontAwesome
          name={filled ? "bookmark" : "bookmark-o"}
          size={size}
          color={color}
        />
      ) : (
        <Feather name={name} size={size} color={color} />
      )}
    </View>
  );
}
