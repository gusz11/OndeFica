import { Pressable, Text } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import Icon, { type IconName } from "./Icon";

export default function Chip({
  title,
  selected,
  onPress,
  icon,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
}) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={16}
          color={selected ? theme.botaoPrimarioTexto : theme.textoSecundario}
        />
      )}
      <Text
        style={[
          styles.label,
          {
            color: selected ? theme.botaoPrimarioTexto : theme.textoSecundario,
          },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
