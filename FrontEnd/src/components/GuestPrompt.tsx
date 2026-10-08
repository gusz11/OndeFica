import { Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import { requestLogin } from "../navigation/root";
import Button from "./Button";
export default function GuestPrompt() {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  return (
    <View style={[styles.panel, { margin: 24, gap: 16 }]}>
      <Text style={styles.subtitle}>Sua próxima viagem começa aqui</Text>
      <Text style={styles.muted}>
        Entre para guardar seus favoritos e organizar viagens. Você pode
        explorar os lugares sem uma conta.
      </Text>
      <Button title="Entrar ou criar conta" onPress={requestLogin} />
    </View>
  );
}
