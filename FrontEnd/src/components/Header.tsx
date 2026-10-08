import { memo } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import Icon from "./Icon";
export default memo(function Header() {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  return (
    <View style={styles.header}>
      <View style={styles.brandMark}>
        <Icon name="map-pin" color={theme.textoPrimario} size={20} />
      </View>
      <Text style={styles.headerTitle}>OndeFica</Text>
      <Text style={[styles.caption, { marginLeft: "auto" }]}>Brasília</Text>
    </View>
  );
});
