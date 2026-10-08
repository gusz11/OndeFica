import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLegacyImport } from "../hooks/useLegacyImport";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { errorMessage } from "../services/api";
import { useStyles } from "../styles/styles";
import type { ModalProps } from "../types/models";
import Button from "./Button";
import Feedback from "./Feedback";
import ModalFrame from "./ModalFrame";

export default function LegacyImportModal(props: ModalProps) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const { userData } = useAuth();
  const query = useLegacyImport();
  const action = useAsyncAction();
  const [message, setMessage] = useState<string | null>(null);
  const importData = () =>
    action.run(async () => {
      const result = await query.importEntries();
      if (result)
        setMessage(
          result.imported +
            " itens importados; " +
            result.already_imported +
            " já importados.",
        );
    });
  return (
    <ModalFrame
      {...props}
      title="Programação antiga"
      busy={action.pending}
      footer={
        <Button
          title="Importar para minha conta"
          onPress={() => {
            void importData();
          }}
          disabled={!query.data?.length || !!query.error}
          loading={action.pending}
        />
      }
    >
      <FlatList
        style={{ flexShrink: 1 }}
        contentContainerStyle={{ gap: 12 }}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <Text style={styles.muted}>
              A versão anterior salvava a programação neste aparelho sem
              identificar a conta. Revise os itens e importe apenas os que
              pertencem a você.
            </Text>
            <Text style={styles.text}>Destino: {userData?.email}</Text>
          </View>
        }
        ListFooterComponent={
          <View style={{ gap: 12 }}>
            {!!action.error && <Text style={styles.error}>{action.error}</Text>}
            {!!message && <Text style={styles.text}>{message}</Text>}
            <Text style={styles.muted}>
              O original será preservado. Repetir a importação não duplica os
              itens.
            </Text>
          </View>
        }
        data={query.data ?? []}
        keyExtractor={(entry) => entry.local_id}
        renderItem={({ item }) => (
          <View style={styles.panel}>
            <Text style={styles.text}>{item.item.place_title}</Text>
            <Text style={styles.muted}>
              {item.item.visit_date ?? item.item.check_in_date}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Feedback
            loading={query.isPending}
            error={query.error ? errorMessage(query.error) : null}
            empty="Nenhuma programação antiga neste aparelho."
          />
        }
      />
    </ModalFrame>
  );
}
