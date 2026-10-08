import { Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import type { ModalProps } from "../types/models";
import Chip from "./Chip";
import ModalFrame from "./ModalFrame";
export default function AparenciaModal(props: ModalProps) {
  const { theme, choice, changeTheme } = useTheme();
  const styles = useStyles(theme);
  return (
    <ModalFrame {...props} title="Aparência">
      <Text style={styles.muted}>Escolha a aparência do aplicativo.</Text>
      <View style={styles.row}>
        {(
          [
            { value: "light", label: "Claro" },
            { value: "dark", label: "Escuro" },
            { value: "system", label: "Sistema" },
          ] as const
        ).map((item) => (
          <Chip
            key={item.value}
            title={item.label}
            selected={choice === item.value}
            onPress={() => changeTheme(item.value)}
          />
        ))}
      </View>
    </ModalFrame>
  );
}
