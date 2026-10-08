import { useCallback } from "react";
import {
  FlatList,
  Text,
  Pressable,
  View,
  type ListRenderItem,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { usePlaces } from "../hooks/usePlaces";
import { errorMessage } from "../services/api";
import { useStyles } from "../styles/styles";
import type { ModalProps, Place } from "../types/models";
import Feedback from "./Feedback";
import ModalFrame from "./ModalFrame";
import Icon from "./Icon";
import PlaceImage from "./PlaceImage";

export default function AddFromListModal({
  onItemSelected,
  ...modal
}: ModalProps & { onItemSelected: (place: Place) => void }) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const query = usePlaces();
  const renderItem = useCallback<ListRenderItem<Place>>(
    ({ item }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={"Adicionar " + item.title}
        style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
        onPress={() => onItemSelected(item)}
      >
        <PlaceImage uri={item.imageUrl} style={styles.smallImage} />
        <Text style={[styles.label, styles.flex]}>{item.title}</Text>
        <Icon name="plus" color={theme.textoPrimario} />
      </Pressable>
    ),
    [onItemSelected, styles, theme.textoPrimario],
  );
  return (
    <ModalFrame {...modal} title="Adicionar ao roteiro">
      <FlatList
        style={{ maxHeight: 400, flexShrink: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        data={query.data ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Feedback
            loading={query.isPending}
            error={query.error ? errorMessage(query.error) : null}
            empty="Nenhum local disponível."
            retry={() => {
              void query.refetch();
            }}
          />
        }
      />
    </ModalFrame>
  );
}
