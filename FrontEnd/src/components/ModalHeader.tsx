import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import Icon from "./Icon";

export default function ModalHeader({
  title,
  onClose,
  back = false,
  disabled = false,
}: {
  title: string;
  onClose: () => void;
  back?: boolean;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  const button = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={back ? "Voltar" : "Fechar"}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onClose}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.superficieSecundaria },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Icon
        name={back ? "chevron-left" : "x"}
        color={theme.textoPrimario}
        size={22}
      />
      {back && (
        <Text
          maxFontSizeMultiplier={1.4}
          style={[styles.backLabel, { color: theme.textoPrimario }]}
        >
          Voltar
        </Text>
      )}
    </Pressable>
  );
  return (
    <View style={[styles.header, back && styles.fullScreen]}>
      {back && button}
      <Text
        accessibilityRole="header"
        numberOfLines={2}
        style={[styles.title, { color: theme.textoPrimario }]}
      >
        {title}
      </Text>
      {!back && button}
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    flexShrink: 0,
  },
  fullScreen: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  button: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 14,
  },
  backLabel: { fontSize: 14, fontWeight: "600" },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.45 },
});
