import { ScrollView, Text } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import type { ModalProps } from "../types/models";
import ModalFrame from "./ModalFrame";
export default function SobreModal(props: ModalProps) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  return (
    <ModalFrame {...props} title="Sobre o OndeFica">
      <ScrollView contentContainerStyle={{ gap: 16 }}>
        <Text style={styles.text}>
          Explore o patrimônio de Brasília e organize sua programação de visitas
          e hospedagens.
        </Text>
        <Text style={styles.subtitle}>Desenvolvimento</Text>
        <Text style={styles.text}>Gustavo Jesus de Souza</Text>
        <Text style={styles.muted}>Versão 1.0.0</Text>
      </ScrollView>
    </ModalFrame>
  );
}
