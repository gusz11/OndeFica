import { Text, View } from "react-native";
import { usePreferences } from "../context/PreferencesContext";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import type { ModalProps } from "../types/models";
import Chip from "./Chip";
import ModalFrame from "./ModalFrame";
export default function PreferencesModal(props: ModalProps) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const { distanceUnit, changeDistanceUnit } = usePreferences();
  return (
    <ModalFrame {...props} title="Preferências">
      <Text style={styles.text}>Unidade de distância</Text>
      <View style={styles.row}>
        <Chip
          title="Quilômetros"
          selected={distanceUnit === "km"}
          onPress={() => changeDistanceUnit("km")}
        />
        <Chip
          title="Milhas"
          selected={distanceUnit === "miles"}
          onPress={() => changeDistanceUnit("miles")}
        />
      </View>
    </ModalFrame>
  );
}
