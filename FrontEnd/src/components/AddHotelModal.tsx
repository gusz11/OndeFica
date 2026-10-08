import { ScrollView, Text } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useHotelForm } from "../hooks/useBookingForm";
import { useStyles } from "../styles/styles";
import type { ModalProps, Place } from "../types/models";
import { useTrips } from "../context/TripsContext";
import TripSelector from "./TripSelector";
import Button from "./Button";
import DateInput from "./DateInput";
import ModalFrame from "./ModalFrame";
import { nextDay, parseISODate, toISODate } from "../utils/dates";

type Props = ModalProps & {
  hotel: Place;
  onAddHotelToItinerary: (
    hotel: Place,
    checkIn: string,
    checkOut: string,
  ) => Promise<void>;
  isEditing?: boolean;
  initialCheckInDate?: string | null;
  initialCheckOutDate?: string | null;
};
export default function AddHotelModal({
  hotel,
  onAddHotelToItinerary,
  isEditing,
  initialCheckInDate,
  initialCheckOutDate,
  ...modal
}: Props) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const trips = useTrips();
  const form = useHotelForm(initialCheckInDate, initialCheckOutDate);
  const save = async () => {
    if (
      await form.save((checkIn, checkOut) =>
        onAddHotelToItinerary(hotel, checkIn, checkOut),
      )
    )
      modal.onClose();
  };
  return (
    <ModalFrame
      {...modal}
      title={isEditing ? "Editar hospedagem" : "Adicionar hospedagem"}
      busy={form.pending}
      footer={
        <Button
          title={isEditing ? "Salvar alterações" : "Salvar hospedagem"}
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
        <Text style={styles.subtitle}>{hotel.title}</Text>
        {!isEditing && <TripSelector />}
        <DateInput
          label="Check-in"
          value={form.checkIn}
          onChange={form.setCheckIn}
          disabled={form.pending}
        />
        <DateInput
          label="Check-out"
          value={form.checkOut}
          onChange={form.setCheckOut}
          disabled={form.pending}
          minimumDate={toISODate(
            nextDay(parseISODate(form.checkIn) ?? new Date()),
          )}
        />
        {!!form.error && (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {form.error}
          </Text>
        )}
        <Text style={styles.caption}>
          A hospedagem será incluída no roteiro. A reserva deve ser feita
          diretamente com o hotel.
        </Text>
      </ScrollView>
    </ModalFrame>
  );
}
