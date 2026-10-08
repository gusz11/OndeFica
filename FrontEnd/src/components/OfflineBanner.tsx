import { Platform, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useReadOnly } from "../hooks/useReadOnly";
import { useTrips } from "../context/TripsContext";
import { offlineCache } from "../services/offlineCache";
import { ApiError } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import Button from "./Button";
export default function OfflineBanner() {
  const { retrySession, userData } = useAuth();
  const offline = useReadOnly();
  const trips = useTrips();
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const unavailable =
    trips.error instanceof ApiError &&
    (trips.error.status === 0 || trips.error.status >= 500);
  const cache = offlineCache.snapshot;
  if (!userData) return null;
  if (!offline && !unavailable && !offlineCache.error)
    return cache?.itemsLoaded && cache.tripsLoaded ? (
      <Text style={styles.caption}>
        {Platform.OS === "web"
          ? "Roteiros disponíveis sem conexão nesta sessão."
          : "Viagens disponíveis offline neste aparelho."}
      </Text>
    ) : null;
  return (
    <View style={[styles.panel, { gap: 8 }]}>
      <Text style={styles.label}>
        {offline || unavailable
          ? "Consulta offline"
          : "Consulta offline indisponível"}
      </Text>
      <Text style={styles.caption}>
        {offlineCache.error ??
          (cache?.itemsLoaded && cache.tripsLoaded
            ? `Cópia salva em ${new Date(cache.savedAt).toLocaleString("pt-BR")}. Conecte-se para editar.`
            : "Ainda não há uma cópia completa neste aparelho. Conecte-se e abra a programação para baixar seus roteiros.")}
      </Text>
      {(offline || unavailable) && (
        <Button title="Reconectar" secondary onPress={retrySession} />
      )}
    </View>
  );
}
