import { useCallback, useMemo, useState } from "react";
import {
  SectionList,
  ScrollView,
  Text,
  View,
  type SectionListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTrips } from "../context/TripsContext";
import { useReadOnly } from "../hooks/useReadOnly";
import { useTabContentInset } from "../hooks/useTabContentInset";
import { conflictingVisits } from "../utils/schedule";
import TripSelector from "../components/TripSelector";
import GuestPrompt from "../components/GuestPrompt";
import OfflineBanner from "../components/OfflineBanner";
import { useTheme } from "../context/ThemeContext";
import { usePreferences } from "../context/PreferencesContext";
import { usePlaces } from "../hooks/usePlaces";
import { useItinerary } from "../hooks/useItinerary";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useExportItinerary } from "../hooks/useExportItinerary";
import { errorMessage } from "../services/api";
import { useStyles } from "../styles/styles";
import type { ItemType, ItineraryItem, Place } from "../types/models";
import {
  groupItineraryByDate,
  itemAsPlace,
  sortItinerary,
  summarize,
  type ItinerarySection,
} from "../utils/itinerary";
import { useDialog } from "../context/DialogContext";
import AddDateModal from "../components/AddDateModal";
import AddHotelModal from "../components/AddHotelModal";
import AddFromListModal from "../components/AddFromListModal";
import Button from "../components/Button";
import Feedback from "../components/Feedback";
import Header from "../components/Header";
import ItineraryCard from "../components/ItineraryCard";
import Icon from "../components/Icon";

const EMPTY_ITEMS: ItineraryItem[] = [];
const EMPTY_PLACES: Place[] = [];
type Section = ItinerarySection;
type Booking = { place: Place; type: ItemType; existing?: ItineraryItem };
export default function ProgramacaoScreen() {
  const tabContentInset = useTabContentInset();
  const { userData } = useAuth();
  const { theme } = useTheme();
  const styles = useStyles(theme);
  return userData ? (
    <PrivateProgram tabContentInset={tabContentInset} />
  ) : (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Header />
      <ScrollView contentContainerStyle={{ paddingBottom: tabContentInset }}>
        <GuestPrompt />
      </ScrollView>
    </SafeAreaView>
  );
}
function PrivateProgram({ tabContentInset }: { tabContentInset: number }) {
  const trips = useTrips();
  const readOnly = useReadOnly();
  const { confirmAction } = useDialog();
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const { distanceUnit } = usePreferences();
  const query = useItinerary();
  const catalog = usePlaces();
  const items = query.items ?? EMPTY_ITEMS;
  const places = catalog.data ?? EMPTY_PLACES;
  const [listOpen, setListOpen] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const action = useAsyncAction();
  const pdf = useExportItinerary();
  const { run } = action;
  const { remove: removeItem, update, addPlace, addHotel, reorder } = query;
  const sorted = useMemo(() => sortItinerary(items), [items]);
  const summary = useMemo(
    () => summarize(items, places, distanceUnit),
    [items, places, distanceUnit],
  );
  const conflicts = useMemo(() => conflictingVisits(items), [items]);
  const sections = useMemo(() => groupItineraryByDate(items), [items]);
  const selectNew = useCallback((place: Place) => {
    setListOpen(false);
    setBooking({ place, type: "place" });
  }, []);
  const edit = useCallback(
    (item: ItineraryItem) =>
      setBooking({
        place: itemAsPlace(item, places),
        type: item.item_type,
        existing: item,
      }),
    [places],
  );
  const close = useCallback(() => setBooking(null), []);
  const remove = useCallback(
    (item: ItineraryItem) => {
      void run(async () => {
        if (
          await confirmAction(
            "Remover item",
            `Remover "${item.place_title}" da programação?`,
            "Remover",
          )
        ) {
          await removeItem(item.id);
        }
      });
    },
    [run, removeItem, confirmAction],
  );
  const move = useCallback(
    (item: ItineraryItem, direction: -1 | 1) => {
      void run(async () => {
        const day = item.visit_date ?? item.check_in_date ?? "";
        const ordered = sections
          .find((s) => s.date === day)
          ?.data.map((i) => i.id);
        if (!ordered) return;
        const index = ordered.indexOf(item.id);
        const target = index + direction;
        const other = ordered[target];
        if (index < 0 || other === undefined) return;
        ordered[target] = item.id;
        ordered[index] = other;
        await reorder(day, ordered);
      });
    },
    [run, sections, reorder],
  );
  const renderItem = useCallback<SectionListRenderItem<ItineraryItem, Section>>(
    ({ item, index, section }) => (
      <ItineraryCard
        item={item}
        first={index === 0}
        last={index === section.data.length - 1}
        conflict={conflicts.has(item.id)}
        onMove={move}
        image={
          places.find((place) => place.id === item.place_id_google)?.imageUrl
        }
        onEdit={edit}
        onRemove={remove}
        disabled={readOnly || query.isSaving || action.pending}
      />
    ),
    [
      places,
      edit,
      remove,
      query.isSaving,
      action.pending,
      readOnly,
      conflicts,
      move,
    ],
  );
  const savePlace = useCallback(
    async (
      place: Place,
      date: string,
      people: number,
      startTime: string | null,
      duration: number | null,
    ) => {
      if (booking?.existing)
        await update({
          id: booking.existing.id,
          data: {
            visit_date: date,
            number_of_people: people,
            start_time: startTime,
            duration_minutes: duration,
          },
        });
      else await addPlace(place, date, people, startTime, duration);
    },
    [booking, update, addPlace],
  );
  const saveHotel = useCallback(
    async (hotel: Place, checkIn: string, checkOut: string) => {
      if (booking?.existing)
        await update({
          id: booking.existing.id,
          data: { check_in_date: checkIn, check_out_date: checkOut },
        });
      else await addHotel(hotel, checkIn, checkOut);
    },
    [booking, update, addHotel],
  );
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Header />
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeading}>
            <Icon name="calendar" color={theme.textoSecundario} size={16} />
            <Text style={[styles.label, styles.flex]}>{section.title}</Text>
          </View>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 32 + tabContentInset,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        initialNumToRender={6}
        refreshing={query.isRefetching}
        onRefresh={() => {
          void query.refetch();
        }}
        ListHeaderComponent={
          <View style={{ gap: 20, paddingTop: 12 }}>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>TUDO NO SEU TEMPO</Text>
              <Text style={styles.title}>
                {trips.activeTrip?.name ?? "Minhas viagens"}
              </Text>
              <Text style={styles.muted}>
                Suas visitas e hospedagens, dia a dia.
              </Text>
            </View>
            <OfflineBanner />
            <TripSelector manage />
            <Button
              title="Atualizar roteiro"
              secondary
              icon="refresh-cw"
              disabled={readOnly}
              loading={query.isRefetching || trips.isRefetching}
              onPress={() => {
                void Promise.all([query.refetch(), trips.refetch()]);
              }}
            />
            <View style={styles.row}>
              <Button
                title="Adicionar visita"
                disabled={readOnly || !trips.activeTrip}
                icon="plus"
                onPress={() => setListOpen(true)}
                style={styles.flex}
              />
              <Button
                title="Exportar PDF"
                secondary
                icon="download"
                style={styles.flex}
                disabled={!items.length}
                loading={pdf.exporting}
                onPress={() => {
                  void action.run(() =>
                    pdf.exportPdf(sorted, summary, trips.activeTrip?.name),
                  );
                }}
              />
            </View>
            {!!items.length && (
              <View style={{ gap: 12 }}>
                <View style={styles.row}>
                  <View style={[styles.metric, { flexBasis: "45%" }]}>
                    <Text style={styles.caption}>Dias de viagem</Text>
                    <Text style={styles.metricValue}>{summary.days}</Text>
                  </View>
                  <View style={[styles.metric, { flexBasis: "45%" }]}>
                    <Text style={styles.caption}>Ingressos estimados</Text>
                    <Text style={styles.metricValue}>{summary.cost}</Text>
                  </View>
                </View>
                <Text style={styles.caption}>
                  Distância: {summary.distance}. Confirme preços e trajetos com
                  os locais.
                </Text>
              </View>
            )}
            {!!action.error && <Text style={styles.error}>{action.error}</Text>}
            {!readOnly && !!query.error && !!items.length && (
              <Feedback
                error={errorMessage(query.error)}
                retry={() => {
                  void query.refetch();
                }}
              />
            )}
          </View>
        }
        ListEmptyComponent={
          <Feedback
            loading={!readOnly && query.isPending && !!trips.activeTrip}
            error={query.error ? errorMessage(query.error) : null}
            title="Seu próximo roteiro começa aqui"
            icon="calendar"
            empty="Escolha um lugar, defina o dia da visita e organize sua viagem no seu ritmo."
            retry={() => {
              void query.refetch();
            }}
          />
        }
      />
      {listOpen && (
        <AddFromListModal
          visible
          onClose={() => setListOpen(false)}
          onItemSelected={selectNew}
        />
      )}
      {booking?.type === "place" && (
        <AddDateModal
          key={booking.existing?.id ?? booking.place.id}
          visible
          onClose={close}
          place={booking.place}
          onAddToItinerary={savePlace}
          isEditing={!!booking.existing}
          initialDate={booking.existing?.visit_date}
          initialPeople={booking.existing?.number_of_people}
          initialTime={booking.existing?.start_time}
          initialDuration={booking.existing?.duration_minutes}
        />
      )}
      {booking?.type === "hotel" && (
        <AddHotelModal
          key={booking.existing?.id ?? booking.place.id}
          visible
          onClose={close}
          hotel={booking.place}
          onAddHotelToItinerary={saveHotel}
          isEditing={!!booking.existing}
          initialCheckInDate={booking.existing?.check_in_date}
          initialCheckOutDate={booking.existing?.check_out_date}
        />
      )}
    </SafeAreaView>
  );
}
