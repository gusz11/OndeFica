import { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useReadOnly } from "../hooks/useReadOnly";
import { useTabContentInset } from "../hooks/useTabContentInset";
import { requestLogin } from "../navigation/root";
import OfflineBanner from "../components/OfflineBanner";
import GuestPrompt from "../components/GuestPrompt";
import { useTheme } from "../context/ThemeContext";
import { usePlaces } from "../hooks/usePlaces";
import { useFavorites, useItinerary } from "../hooks/useItinerary";
import { usePlaceFilters } from "../hooks/usePlaceFilters";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useNotice } from "../hooks/useNotice";
import { errorMessage } from "../services/api";
import { useStyles } from "../styles/styles";
import type { ItemType, Place } from "../types/models";
import AddDateModal from "../components/AddDateModal";
import AddHotelModal from "../components/AddHotelModal";
import Chip from "../components/Chip";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import Notice from "../components/Notice";
import Feedback from "../components/Feedback";
import Header from "../components/Header";
import PlaceCard from "../components/PlaceCard";
import PlaceDetailOverlay from "../components/PlaceDetailOverlay";

const EMPTY_PLACES: Place[] = [];
export default function HomeScreen() {
  const { userData } = useAuth();
  const readOnly = useReadOnly();
  const tabContentInset = useTabContentInset();
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const query = usePlaces();
  const favorites = useFavorites();
  const itinerary = useItinerary();
  const filter = usePlaceFilters(query.data ?? EMPTY_PLACES, favorites.ids);
  const [detail, setDetail] = useState<Place | null>(null);
  const [booking, setBooking] = useState<{
    place: Place;
    type: ItemType;
  } | null>(null);
  const favoriteAction = useAsyncAction();
  const { run: runFavorite } = favoriteAction;
  const { toggle } = favorites;
  const { notice, showNotice, dismissNotice } = useNotice();
  const closeBooking = useCallback(() => setBooking(null), []);
  const openPlace = useCallback(
    (place: Place) => {
      if (!userData) {
        setDetail(null);
        requestLogin();
        return;
      }
      setDetail(null);
      setBooking({ place, type: "place" });
    },
    [userData],
  );
  const openHotel = useCallback(
    (place: Place) => {
      if (!userData) {
        setDetail(null);
        requestLogin();
        return;
      }
      setDetail(null);
      setBooking({ place, type: "hotel" });
    },
    [userData],
  );
  const toggleFavorite = useCallback(
    (place: Place) => {
      if (!userData) {
        requestLogin();
        return;
      }
      void runFavorite(async () => {
        await toggle(place);
        showNotice(
          favorites.ids.has(place.id)
            ? "Lugar removido dos favoritos."
            : "Lugar salvo nos favoritos.",
        );
      });
    },
    [toggle, runFavorite, favorites.ids, showNotice, userData],
  );
  const renderItem = useCallback<ListRenderItem<Place>>(
    ({ item }) => (
      <PlaceCard
        place={item}
        saved={favorites.ids.has(item.id)}
        favoriteDisabled={
          !!userData &&
          (readOnly ||
            favorites.isPending ||
            favorites.isSaving ||
            !!favorites.error)
        }
        onFavorite={toggleFavorite}
        onAdd={openPlace}
        onDetails={setDetail}
      />
    ),
    [
      userData,
      readOnly,
      favorites.ids,
      favorites.isPending,
      favorites.isSaving,
      favorites.error,
      toggleFavorite,
      openPlace,
    ],
  );
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Header />
      {notice && <Notice message={notice} onClose={dismissNotice} />}
      <FlatList
        data={filter.displayed}
        renderItem={renderItem}
        keyExtractor={(place) => place.id}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 32 + tabContentInset,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListHeaderComponent={
          <View style={{ gap: 20, paddingTop: 12, paddingBottom: 24 }}>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>SEU GUIA NA CIDADE</Text>
              <Text style={styles.title}>Descubra Brasília.</Text>
              <Text style={styles.muted}>
                Encontre lugares que valem a visita.
              </Text>
            </View>
            <OfflineBanner />
            <View style={styles.search}>
              <Icon name="search" color={theme.textoMuted} size={19} />
              <TextInput
                accessibilityLabel="Pesquisar locais"
                style={styles.input}
                placeholder="Buscar lugares"
                placeholderTextColor={theme.textoMuted}
                value={filter.search}
                onChangeText={filter.setSearch}
                autoCorrect={false}
              />
              {!!filter.search && (
                <IconButton
                  icon="x"
                  label="Limpar busca"
                  onPress={() => filter.setSearch("")}
                />
              )}
            </View>
            <FlatList
              horizontal
              data={filter.filters}
              keyExtractor={(item) => item.value}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={{ marginRight: 8 }}>
                  <Chip
                    title={item.label}
                    selected={item.value === filter.filter}
                    icon={item.value === "favorites" ? "bookmark" : undefined}
                    onPress={() => filter.setFilter(item.value)}
                  />
                </View>
              )}
            />
            {!!favorites.error && (
              <Feedback
                error="Não foi possível carregar seus favoritos."
                retry={() => {
                  void favorites.refetch();
                }}
              />
            )}
            {!!favoriteAction.error && (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {favoriteAction.error}
              </Text>
            )}
            {!!query.error && !!query.data?.length && (
              <Feedback
                error={errorMessage(query.error)}
                retry={() => {
                  void query.refetch();
                }}
              />
            )}
            {!query.isPending && !query.error && (
              <Text style={styles.caption}>
                {filter.displayed.length}{" "}
                {filter.displayed.length === 1
                  ? "lugar encontrado"
                  : "lugares encontrados"}
              </Text>
            )}
          </View>
        }
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
        refreshing={query.isRefetching}
        onRefresh={() => {
          void query.refetch();
        }}
        ListEmptyComponent={
          !userData && filter.filter === "favorites" ? (
            <GuestPrompt />
          ) : (
            <Feedback
              loading={
                query.isLoading ||
                (!!userData &&
                  filter.filter === "favorites" &&
                  favorites.isLoading)
              }
              error={
                !query.data && query.error ? errorMessage(query.error) : null
              }
              title={
                filter.filter === "favorites" && !filter.search
                  ? "Seus favoritos ficam aqui"
                  : "Nenhum lugar encontrado"
              }
              icon={filter.filter === "favorites" ? "bookmark" : "search"}
              empty={
                filter.filter === "favorites" && !filter.search
                  ? "Toque no marcador de um lugar para guardá-lo e encontrar depois."
                  : "Experimente outra busca ou escolha uma categoria diferente."
              }
              actionLabel="Explorar todos os lugares"
              onAction={() => {
                filter.setSearch("");
                filter.setFilter("all");
              }}
              retry={() => {
                void query.refetch();
              }}
            />
          )
        }
      />
      {detail && (
        <PlaceDetailOverlay
          place={detail}
          visible
          onClose={() => setDetail(null)}
          onAdd={openPlace}
          onAddHotel={openHotel}
        />
      )}
      {booking?.type === "place" && (
        <AddDateModal
          place={booking.place}
          visible
          onClose={closeBooking}
          onAddToItinerary={async (place, date, people, time, duration) => {
            await itinerary.addPlace(place, date, people, time, duration);
            showNotice("Visita adicionada à sua programação.");
          }}
        />
      )}
      {booking?.type === "hotel" && (
        <AddHotelModal
          hotel={booking.place}
          visible
          onClose={closeBooking}
          onAddHotelToItinerary={async (hotel, checkIn, checkOut) => {
            await itinerary.addHotel(hotel, checkIn, checkOut);
            showNotice("Hospedagem adicionada à sua programação.");
          }}
        />
      )}
    </SafeAreaView>
  );
}
