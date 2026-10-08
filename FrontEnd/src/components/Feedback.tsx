import { ActivityIndicator, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import Button from "./Button";
import Icon, { type IconName } from "./Icon";

type Props = {
  loading?: boolean;
  error?: string | null;
  empty?: string;
  retry?: () => void;
  title?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
};
export default function Feedback({
  loading,
  error,
  empty,
  retry,
  title,
  icon,
  actionLabel,
  onAction,
}: Props) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  if (!loading && !error && !empty) return null;
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      {loading ? (
        <>
          <ActivityIndicator color={theme.textoPrimario} />
          <Text style={styles.muted}>Carregando...</Text>
        </>
      ) : (
        <>
          <View style={styles.emptyIcon}>
            <Icon
              name={error ? "alert-circle" : (icon ?? "compass")}
              color={
                error ? theme.textoBotaoAcaoVermelho : theme.textoSecundario
              }
              size={28}
            />
          </View>
          <Text style={[styles.subtitle, { textAlign: "center" }]}>
            {error ? "Algo não deu certo" : (title ?? "Nada por aqui ainda")}
          </Text>
          <Text
            style={[
              error ? styles.error : styles.muted,
              { textAlign: "center" },
            ]}
          >
            {error || empty}
          </Text>
        </>
      )}
      {!!error && !!retry && (
        <Button title="Tentar novamente" onPress={retry} secondary />
      )}
      {!loading && !error && onAction && actionLabel && (
        <Button title={actionLabel} onPress={onAction} secondary />
      )}
    </View>
  );
}
