import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Icon, { type IconName } from "./Icon";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  secondary?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};
export default function Button({
  title,
  onPress,
  disabled,
  loading,
  secondary,
  variant,
  icon,
  style,
  accessibilityLabel,
}: Props) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [focused, setFocused] = useState(false);
  const kind = variant ?? (secondary ? "secondary" : "primary");
  const color =
    kind === "primary"
      ? theme.botaoPrimarioTexto
      : kind === "danger"
        ? theme.textoBotaoAcaoVermelho
        : theme.textoPrimario;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{
        disabled: !!disabled || !!loading,
        busy: !!loading,
      }}
      onPress={onPress}
      disabled={disabled || loading}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.button,
        kind !== "primary" && styles[kind],
        focused && styles.fieldFocused,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : icon ? (
        <Icon name={icon} color={color} size={18} />
      ) : null}
      <Text style={[styles.buttonText, { color, flexShrink: 1 }]}>{title}</Text>
    </Pressable>
  );
}
