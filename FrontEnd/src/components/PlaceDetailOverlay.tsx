import { useCallback } from "react";
import { FlatList, Modal, Text, View, type ListRenderItem } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import SwipeDismiss from "./SwipeDismiss";
import ModalHeader from "./ModalHeader";
import { useTheme } from "../context/ThemeContext";
import { usePreferences } from "../context/PreferencesContext";
import { useHotels } from "../hooks/usePlaces";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { errorMessage } from "../services/api";
import { useStyles } from "../styles/styles";
import type { Hotel, ModalProps, Place } from "../types/models";
import { callPhone, mapsUrl, openSafeUrl } from "../utils/links";
import { placeCategory } from "../utils/placePresentation";
import Button from "./Button";
import Icon from "./Icon";
import IconButton from "./IconButton";
import Feedback from "./Feedback";
import PlaceImage from "./PlaceImage";
import PlaceMap from "./PlaceMap";

type Props = ModalProps & {
  place: Place;
  onAdd: (place: Place) => void;
  onAddHotel: (hotel: Place) => void;
};
export default function PlaceDetailOverlay({
  place,
  onAdd,
  onAddHotel,
  ...modal
}: Props) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const { distanceUnit } = usePreferences();
  const hotels = useHotels(
    place.id,
    modal.visible && place.latitude != null && place.longitude != null,
  );
  const { run, error } = useAsyncAction();
  const renderHotel = useCallback<ListRenderItem<Hotel>>(
    ({ item }) => (
      <View style={styles.panel}>
        <View style={[styles.row, { flexWrap: "nowrap" }]}>
          <PlaceImage uri={item.imageUrl} style={styles.smallImage} />
          <View style={[styles.flex, { gap: 4 }]}>
            <Text style={styles.label}>{item.title}</Text>
            <Text style={styles.caption}>
              {[
                item.rating != null
                  ? `Nota ${item.rating.toFixed(1).replace(".", ",")}`
                  : null,
                item.distance_km != null
                  ? (distanceUnit === "miles"
                      ? item.distance_km * 0.621371
                      : item.distance_km
                    )
                      .toFixed(1)
                      .replace(".", ",") +
                    (distanceUnit === "miles" ? " mi" : " km")
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") || "Consulte as informações do hotel"}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <Button
            title="Adicionar hotel"
            icon="plus"
            style={styles.flex}
            onPress={() => onAddHotel(item)}
          />
          <IconButton
            icon="map-pin"
            label={"Ver " + item.title + " no mapa"}
            surface
            onPress={() => {
              void run(() => openSafeUrl(mapsUrl(item.id, item.title)));
            }}
          />
        </View>
      </View>
    ),
    [styles, distanceUnit, onAddHotel, run],
  );
  return (
    <Modal
      visible={modal.visible}
      animationType="slide"
      onRequestClose={modal.onClose}
    >
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <SwipeDismiss
            onClose={modal.onClose}
            edgeOnly
            style={styles.container}
          >
            <SafeAreaView style={styles.container}>
              <View style={styles.appFrame}>
                <ModalHeader
                  title="Detalhes do lugar"
                  onClose={modal.onClose}
                  back
                />
                <FlatList
                  data={hotels.data ?? []}
                  keyExtractor={(hotel) => hotel.id}
                  renderItem={renderHotel}
                  contentContainerStyle={{
                    paddingHorizontal: 24,
                    paddingBottom: 24,
                  }}
                  ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                  ListHeaderComponent={
                    <View style={{ gap: 20, paddingBottom: 16 }}>
                      <PlaceImage
                        uri={place.imageUrl}
                        style={styles.detailImage}
                      />
                      {!!place.photoAttributions?.length && (
                        <Text style={styles.caption}>
                          Foto: {place.photoAttributions.join(" · ")}
                        </Text>
                      )}
                      <View style={styles.hero}>
                        <Text style={styles.caption}>
                          {placeCategory(place)}
                        </Text>
                        <Text style={styles.title}>{place.title}</Text>
                        <Text style={styles.text}>
                          {place.longDescription ?? place.description}
                        </Text>
                      </View>
                      <View style={[styles.panel, { gap: 16 }]}>
                        <View
                          style={[
                            styles.row,
                            { alignItems: "flex-start", flexWrap: "nowrap" },
                          ]}
                        >
                          <Icon name="tag" color={theme.textoMuted} />
                          <View style={styles.flex}>
                            <Text style={styles.caption}>Entrada</Text>
                            <Text style={styles.text}>
                              {place.entryFee || "Consulte o local"}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={[
                            styles.row,
                            { alignItems: "flex-start", flexWrap: "nowrap" },
                          ]}
                        >
                          <Icon name="clock" color={theme.textoMuted} />
                          <View style={styles.flex}>
                            <Text style={styles.caption}>Horários</Text>
                            <Text style={styles.text}>
                              {place.hours || "Consulte o local"}
                            </Text>
                          </View>
                        </View>
                        {place.capacity && place.capacity !== "N/A" && (
                          <View style={[styles.row, { flexWrap: "nowrap" }]}>
                            <Icon name="users" color={theme.textoMuted} />
                            <Text style={[styles.muted, styles.flex]}>
                              Capacidade: {place.capacity}
                            </Text>
                          </View>
                        )}
                        {(place.phone_number || place.website) && (
                          <View style={styles.row}>
                            {place.phone_number && (
                              <Button
                                title="Ligar"
                                icon="phone"
                                secondary
                                onPress={() => {
                                  void run(() =>
                                    callPhone(place.phone_number ?? ""),
                                  );
                                }}
                              />
                            )}
                            {place.website && (
                              <Button
                                title="Site do local"
                                icon="external-link"
                                secondary
                                onPress={() => {
                                  void run(() =>
                                    openSafeUrl(place.website ?? ""),
                                  );
                                }}
                              />
                            )}
                          </View>
                        )}
                      </View>
                      <View style={styles.stack}>
                        <Text style={styles.subtitle}>Como chegar</Text>
                        {!!place.formatted_address && (
                          <Text style={styles.muted}>
                            {place.formatted_address}
                          </Text>
                        )}
                        <PlaceMap place={place} />
                        <Button
                          title="Abrir no mapa"
                          icon="map-pin"
                          secondary
                          onPress={() => {
                            void run(() =>
                              openSafeUrl(mapsUrl(place.id, place.title)),
                            );
                          }}
                        />
                      </View>
                      {!!error && (
                        <Text
                          style={styles.error}
                          accessibilityLiveRegion="polite"
                        >
                          {errorMessage(error)}
                        </Text>
                      )}
                      <View style={{ gap: 4 }}>
                        <Text style={styles.subtitle}>Hotéis próximos</Text>
                        <Text style={styles.caption}>
                          Opções para ficar perto dos seus planos.
                        </Text>
                      </View>
                    </View>
                  }
                  ListEmptyComponent={
                    <Feedback
                      loading={hotels.isLoading}
                      error={hotels.error ? errorMessage(hotels.error) : null}
                      title="Hospedagem por perto"
                      icon="moon"
                      empty="Nenhum hotel próximo disponível neste momento."
                      retry={() => {
                        void hotels.refetch();
                      }}
                    />
                  }
                />
                <View
                  style={{
                    padding: 20,
                    borderTopWidth: 1,
                    borderColor: theme.borda,
                    backgroundColor: theme.fundoFooter,
                  }}
                >
                  <Button
                    title="Adicionar à programação"
                    icon="plus"
                    onPress={() => onAdd(place)}
                  />
                </View>
              </View>
            </SafeAreaView>
          </SwipeDismiss>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Modal>
  );
}
