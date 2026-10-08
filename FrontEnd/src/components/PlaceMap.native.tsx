import MapView, { Marker } from "react-native-maps";
import type { Place } from "../types/models";

export default function PlaceMap({ place }: { place: Place }) {
  // Zero is a valid coordinate. Truthiness checks used to hide legitimate maps.
  if (place.latitude == null || place.longitude == null) return null;
  const coordinate = { latitude: place.latitude, longitude: place.longitude };
  return (
    <MapView
      style={{ width: "100%", height: 220 }}
      initialRegion={{
        ...coordinate,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Marker
        coordinate={coordinate}
        title={place.title}
        description={place.formatted_address ?? undefined}
      />
    </MapView>
  );
}
