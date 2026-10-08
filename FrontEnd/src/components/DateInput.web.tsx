import { useState } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import type { DateInputProps } from "./DateInput";

export default function DateInput({
  label,
  value,
  onChange,
  disabled,
  minimumDate,
}: DateInputProps) {
  const { theme, themeMode } = useTheme();
  const styles = useStyles(theme);
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused]}>
        <input
          type="date"
          aria-label={label}
          value={value}
          disabled={disabled}
          min={minimumDate}
          onInput={(event) => onChange(event.currentTarget.value)}
          onChange={(event) => onChange(event.currentTarget.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box",
            minHeight: 52,
            padding: "12px 14px",
            fontSize: 16,
            fontFamily: "inherit",
            background: "transparent",
            color: theme.textoPrimario,
            colorScheme: themeMode,
            border: 0,
            outline: 0,
          }}
        />
      </View>
    </View>
  );
}
