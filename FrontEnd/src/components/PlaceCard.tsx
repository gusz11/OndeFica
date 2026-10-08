import { memo } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import type { Place } from "../types/models";
import { placeCategory } from "../utils/placePresentation";
import PlaceImage from "./PlaceImage";
import Button from "./Button";
import Icon from "./Icon";
import IconButton from "./IconButton";

type Props = {
  place: Place;
  saved: boolean;
  favoriteDisabled: boolean;
  onFavorite: (place: Place) => void;
  onDetails: (place: Place) => void;
  onAdd: (place: Place) => void;
};
export default memo(function PlaceCard({
  place,
  saved,
  favoriteDisabled,
  onFavorite,
  onDetails,
  onAdd,
}: Props) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const free = place.entryFee?.toLowerCase().includes("gratuit");
  return (
    <View style={styles.card}>
      <View>
        <PlaceImage uri={place.imageUrl} style={styles.cardImage} />
        <View style={{ position: "absolute", top: 12, right: 12 }}>
          <IconButton
            icon="bookmark"
            label={
              (saved ? "Remover favorito " : "Salvar favorito ") + place.title
            }
            onPress={() => onFavorite(place)}
            disabled={favoriteDisabled}
            selected={saved}
            surface
          />
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.spread}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{placeCategory(place)}</Text>
          </View>
          {place.rating != null && (
            <View style={styles.row}>
              <Icon name="star" size={14} color={theme.textoSecundario} />
              <Text style={styles.caption}>
                {place.rating.toFixed(1).replace(".", ",")}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {place.title}
        </Text>
        <Text style={styles.muted} numberOfLines={2}>
          {place.description}
        </Text>
        <View style={styles.row}>
          <View style={[styles.badge, free && styles.freeBadge]}>
            <Text style={[styles.badgeText, free && styles.freeText]}>
              {free
                ? "Entrada gratuita"
                : place.entryFee && place.entryFee !== "Consultar"
                  ? place.entryFee
                  : "Consulte o valor da entrada"}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <Button
            title="Detalhes"
            accessibilityLabel="Ver detalhes"
            icon="arrow-up-right"
            secondary
            style={styles.flex}
            onPress={() => onDetails(place)}
          />
          <Button
            title="Adicionar"
            icon="plus"
            accessibilityLabel={"Adicionar " + place.title}
            style={styles.flex}
            onPress={() => onAdd(place)}
          />
        </View>
      </View>
    </View>
  );
});
