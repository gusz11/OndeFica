import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useVisitForm } from "../hooks/useBookingForm";
import { useStyles } from "../styles/styles";
import type { ModalProps, Place } from "../types/models";
import { useTrips } from "../context/TripsContext";
import { validateSchedule } from "../utils/schedule";
import TripSelector from "./TripSelector";
import Button from "./Button";
import DateInput from "./DateInput";
import ModalFrame from "./ModalFrame";
import TextField from "./TextField";
import { toISODate } from "../utils/dates";

type Props = ModalProps & {
  place: Place;
  onAddToItinerary: (
    place: Place,
    date: string,
    people: number,
    startTime: string | null,
    duration: number | null,
  ) => Promise<void>;
  isEditing?: boolean;
  initialTime?: string | null;
  initialDuration?: number | null;
  initialDate?: string | null;
  initialPeople?: number | null;
};
export default function AddDateModal({
  place,
  onAddToItinerary,
  isEditing,
  initialTime,
  initialDuration,
  initialDate,
  initialPeople,
  ...modal
}: Props) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const trips = useTrips();
  const [time, setTime] = useState(initialTime ?? "");
  const [duration, setDuration] = useState(
    initialDuration ? String(initialDuration) : "",
  );
  const today = toISODate(new Date());
  const defaultDate =
    trips.activeTrip?.start_date &&
    trips.activeTrip.end_date &&
    (today < trips.activeTrip.start_date || today > trips.activeTrip.end_date)
      ? trips.activeTrip.start_date
      : today;
  const form = useVisitForm(initialDate ?? defaultDate, initialPeople);
  const save = async () => {
    if (
      await form.save(async (date, people) => {
        const schedule = validateSchedule(time, duration);
        await onAddToItinerary(
          place,
          date,
          people,
          schedule.start_time,
          schedule.duration_minutes,
        );
      })
    )
      modal.onClose();
  };
  return (
    <ModalFrame
      {...modal}
      title={isEditing ? "Editar visita" : "Adicionar visita"}
      busy={form.pending}
      footer={
        <Button
          title={isEditing ? "Salvar alterações" : "Salvar visita"}
          icon="check"
          onPress={() => {
            void save();
          }}
          loading={form.pending}
          disabled={trips.readOnly || !trips.activeTrip}
        />
      }
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 16 }}
      >
        <Text style={styles.subtitle}>{place.title}</Text>
        <Text style={styles.muted}>
          Escolha o dia da visita e quem vai com você.
        </Text>
        {!isEditing && <TripSelector />}
        <DateInput
          label="Data da visita"
          value={form.date}
          onChange={form.setDate}
          disabled={form.pending}
        />
        <TextField
          label="Quantidade de pessoas"
          helper="Inclua todas as pessoas que vão visitar o local."
          keyboardType="number-pad"
          value={form.people}
          onChangeText={form.setPeople}
          maxLength={4}
          editable={!form.pending}
        />
        <TextField
          label="Horário (HH:mm)"
          helper="Opcional. Preencha também a duração."
          placeholder="09:00"
          value={time}
          onChangeText={setTime}
          maxLength={5}
          editable={!form.pending}
        />
        <TextField
          label="Duração em minutos"
          placeholder="60"
          keyboardType="number-pad"
          value={duration}
          onChangeText={setDuration}
          maxLength={4}
          editable={!form.pending}
        />
        {!!form.error && (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {form.error}
          </Text>
        )}
      </ScrollView>
    </ModalFrame>
  );
}
