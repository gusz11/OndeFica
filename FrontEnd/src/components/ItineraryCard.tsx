import { memo } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import type { ItineraryItem } from "../types/models";
import { formatDate, daysBetween } from "../utils/dates";
import { scheduleLabel } from "../utils/schedule";
import Icon from "./Icon";
import IconButton from "./IconButton";
import PlaceImage from "./PlaceImage";

type Props = {
  onMove: (item: ItineraryItem, direction: -1 | 1) => void;
  first: boolean;
  last: boolean;
  conflict: boolean;
  item: ItineraryItem;
  image?: string | null;
  disabled: boolean;
  onEdit: (item: ItineraryItem) => void;
  onRemove: (item: ItineraryItem) => void;
};
export default memo(function ItineraryCard({
  onMove,
  first,
  last,
  conflict,
  item,
  image,
  disabled,
  onEdit,
  onRemove,
}: Props) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const hotel = item.item_type === "hotel";
  const nights = hotel
    ? Math.max(
        0,
        daysBetween(item.check_in_date ?? "", item.check_out_date ?? "") - 1,
      )
    : 0;
  return (
    <View style={styles.panel}>
      <View
        style={[styles.row, { flexWrap: "nowrap", alignItems: "flex-start" }]}
      >
        <PlaceImage uri={image ?? item.image_url} style={styles.smallImage} />
        <View style={[styles.flex, { gap: 4 }]}>
          <Text style={styles.caption}>{hotel ? "Hospedagem" : "Visita"}</Text>
          <Text style={styles.subtitle}>{item.place_title}</Text>
        </View>
      </View>
      <View style={[styles.row, { marginTop: 4 }]}>
        <Icon
          name={hotel ? "moon" : "users"}
          size={16}
          color={theme.textoSecundario}
        />
        <Text style={styles.muted}>
          {hotel
            ? `${nights} ${nights === 1 ? "noite" : "noites"}`
            : `${item.number_of_people} ${item.number_of_people === 1 ? "pessoa" : "pessoas"}`}
        </Text>
      </View>
      {!hotel && <Text style={styles.label}>{scheduleLabel(item)}</Text>}
      {conflict && (
        <Text style={styles.error}>
          Horário sobreposto a outra visita neste dia.
        </Text>
      )}
      {hotel && (
        <Text style={styles.caption}>
          {formatDate(item.check_in_date)} → {formatDate(item.check_out_date)}
        </Text>
      )}
      <View style={{ marginTop: 4, gap: 8 }}>
        <Text style={[styles.caption, styles.flex]}>
          {hotel
            ? "Reserva diretamente com o hotel"
            : "Visita incluída no seu roteiro"}
        </Text>
        <View style={styles.row}>
          <IconButton
            icon="arrow-up"
            label={"Mover para cima " + item.place_title}
            disabled={disabled || first}
            onPress={() => onMove(item, -1)}
          />
          <IconButton
            icon="arrow-down"
            label={"Mover para baixo " + item.place_title}
            disabled={disabled || last}
            onPress={() => onMove(item, 1)}
          />
          <IconButton
            icon="edit-2"
            label={"Editar " + item.place_title}
            onPress={() => onEdit(item)}
            disabled={disabled}
          />
          <IconButton
            icon="trash-2"
            label={"Remover " + item.place_title}
            onPress={() => onRemove(item)}
            disabled={disabled}
            destructive
          />
        </View>
      </View>
    </View>
  );
});
