import { useState } from "react";
import {
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
} from "react-native";
import { imageUrl } from "../config/api";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import Icon from "./Icon";

type Props = { uri?: string | null; style: StyleProp<ImageStyle> };
export default function PlaceImage({ uri, style }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [failed, setFailed] = useState<string | undefined>();
  const resolved = imageUrl(uri);
  if (resolved && failed !== resolved)
    return (
      <Image
        source={{ uri: resolved }}
        style={style}
        resizeMode="cover"
        onError={() => setFailed(resolved)}
        accessible={false}
        accessibilityIgnoresInvertColors
      />
    );
  const frame = StyleSheet.flatten(style);
  const compact = typeof frame?.width === "number" && frame.width <= 80;
  // A neutral decorative fallback keeps unavailable photos from looking like a broken screen.
  return (
    <View
      accessible={false}
      style={[
        styles.imageFallback,
        {
          width: frame?.width,
          height: frame?.height,
          aspectRatio: frame?.aspectRatio,
          minHeight: frame?.minHeight,
          borderRadius: frame?.borderRadius,
        },
      ]}
    >
      <View style={!compact && styles.imageFallbackMark}>
        <Icon
          name="map-pin"
          color={theme.textoMuted}
          size={compact ? 22 : 28}
        />
      </View>
    </View>
  );
}
