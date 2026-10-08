import { useState } from "react";
import { Pressable } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import Icon, { type IconName } from "./Icon";

type Props = {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  surface?: boolean;
  destructive?: boolean;
};
export default function IconButton({
  icon,
  label,
  onPress,
  disabled,
  selected,
  surface,
  destructive,
}: Props) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.iconButton,
        (surface || selected || focused) && styles.iconSurface,
        selected && styles.iconSelected,
        focused && styles.fieldFocused,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Icon
        name={icon}
        filled={selected}
        color={
          destructive
            ? theme.textoBotaoAcaoVermelho
            : selected
              ? theme.botaoPrimarioTexto
              : theme.textoPrimario
        }
      />
    </Pressable>
  );
}
