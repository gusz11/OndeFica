import { useState } from "react";
import { FlatList, ScrollView, Text, View } from "react-native";
import { useTrips } from "../context/TripsContext";
import { useTheme } from "../context/ThemeContext";
import { useDialog } from "../context/DialogContext";
import { useStyles } from "../styles/styles";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { parseISODate, toISODate } from "../utils/dates";
import type { Trip } from "../types/models";
import Button from "./Button";
import Chip from "./Chip";
import ModalFrame from "./ModalFrame";
import TextField from "./TextField";
import DateInput from "./DateInput";
import Feedback from "./Feedback";

export default function TripSelector({ manage = false }: { manage?: boolean }) {
  const trips = useTrips();
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [editor, setEditor] = useState<Trip | "new" | null>(null);
  const action = useAsyncAction();
  const { confirmAction } = useDialog();
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.label}>Viagem</Text>
      <FlatList
        horizontal
        data={trips.data ?? []}
        keyExtractor={(t) => String(t.id)}
        renderItem={({ item }) => (
          <View style={{ marginRight: 8 }}>
            <Chip
              title={item.name}
              selected={item.id === trips.activeTrip?.id}
              onPress={() => trips.select(item.id)}
            />
          </View>
        )}
      />
      {!!trips.activeTrip?.start_date && (
        <Text style={styles.caption}>
          {trips.activeTrip.start_date} → {trips.activeTrip.end_date}
        </Text>
      )}
      {!trips.data?.length && (
        <Text style={styles.muted}>
          {trips.readOnly
            ? "Nenhuma viagem disponível offline."
            : "Crie uma viagem para começar seu roteiro."}
        </Text>
      )}
      {!!trips.error && !trips.data && (
        <Feedback
          error="Não foi possível carregar suas viagens."
          retry={() => {
            void trips.refetch();
          }}
        />
      )}
      <View style={styles.row}>
        <Button
          title="Nova viagem"
          icon="plus"
          secondary
          disabled={trips.readOnly || trips.saving}
          onPress={() => setEditor("new")}
        />
        {manage && trips.activeTrip && (
          <>
            <Button
              title="Editar viagem"
              secondary
              disabled={trips.readOnly || trips.saving}
              onPress={() => setEditor(trips.activeTrip)}
            />
            <Button
              title="Excluir viagem"
              variant="ghost"
              disabled={trips.readOnly || trips.saving || action.pending}
              onPress={() => {
                void action.run(async () => {
                  const trip = trips.activeTrip;
                  if (
                    trip &&
                    (await confirmAction(
                      "Excluir viagem",
                      `Excluir "${trip.name}" e todos os seus itens?`,
                      "Excluir",
                    ))
                  )
                    await trips.remove(trip.id);
                });
              }}
            />
          </>
        )}
      </View>
      {!!action.error && <Text style={styles.error}>{action.error}</Text>}
      {editor && (
        <TripEditor
          trip={editor === "new" ? null : editor}
          close={() => setEditor(null)}
        />
      )}
    </View>
  );
}
function TripEditor({ trip, close }: { trip: Trip | null; close: () => void }) {
  const trips = useTrips();
  const action = useAsyncAction();
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [name, setName] = useState(trip?.name ?? "");
  const [period, setPeriod] = useState(!!trip?.start_date);
  const [start, setStart] = useState(trip?.start_date ?? toISODate(new Date()));
  const [end, setEnd] = useState(trip?.end_date ?? start);
  const save = () => {
    void action.run(async () => {
      if (!name.trim()) throw new Error("Dê um nome à viagem.");
      if (period && (!parseISODate(start) || !parseISODate(end) || end < start))
        throw new Error("Confira o período da viagem.");
      await trips.save(
        {
          name: name.trim(),
          start_date: period ? start : null,
          end_date: period ? end : null,
        },
        trip?.id,
      );
      close();
    });
  };
  return (
    <ModalFrame
      visible
      onClose={close}
      title={trip ? "Editar viagem" : "Nova viagem"}
      busy={action.pending}
      footer={
        <Button
          title="Salvar viagem"
          onPress={save}
          loading={action.pending}
          disabled={trips.readOnly}
        />
      }
    >
      <ScrollView
        contentContainerStyle={{ gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label="Nome da viagem"
          placeholder="Fim de semana em Brasília"
          value={name}
          onChangeText={setName}
          maxLength={200}
          editable={!action.pending}
        />
        <Chip
          title="Definir período"
          selected={period}
          onPress={() => setPeriod(!period)}
        />
        {period && (
          <>
            <DateInput
              label="Início da viagem"
              value={start}
              onChange={setStart}
            />
            <DateInput label="Fim da viagem" value={end} onChange={setEnd} />
            <Text style={styles.caption}>
              Visitas e hospedagens devem ficar dentro deste período.
            </Text>
          </>
        )}
        {!!action.error && <Text style={styles.error}>{action.error}</Text>}
      </ScrollView>
    </ModalFrame>
  );
}
