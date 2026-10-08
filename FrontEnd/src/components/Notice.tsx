import { Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import Icon from "./Icon";
import IconButton from "./IconButton";
export default function Notice({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  return (
    <View
      style={[
        styles.panel,
        styles.spread,
        {
          backgroundColor: theme.positivoFundo,
          marginHorizontal: 24,
          marginBottom: 12,
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <Icon name="check-circle" color={theme.positivo} />
      <Text style={[styles.muted, styles.flex, { color: theme.positivo }]}>
        {message}
      </Text>
      <IconButton icon="x" label="Fechar aviso" onPress={onClose} />
    </View>
  );
}
