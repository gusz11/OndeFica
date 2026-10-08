import { useEffect, useMemo, type PropsWithChildren } from "react";
import {
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

type Props = PropsWithChildren<{
  onClose: () => void;
  enabled?: boolean;
  edgeOnly?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export default function SwipeDismiss({
  children,
  onClose,
  enabled = true,
  edgeOnly = true,
  style,
}: Props) {
  const { width } = useWindowDimensions();
  const translation = useSharedValue(0);
  const closing = useSharedValue(false);
  useEffect(() => {
    cancelAnimation(translation);
    translation.set(0);
    closing.set(false);
    return () => cancelAnimation(translation);
  }, [translation, closing, width, enabled]);
  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .enabled(enabled)
      .maxPointers(1)
      .activeOffsetX(16)
      .failOffsetY([-12, 12])
      .onUpdate((event) => {
        if (!closing.get()) translation.set(Math.max(0, event.translationX));
      })
      .onEnd((event) => {
        if (closing.get()) return;
        const dismiss =
          event.translationX >= Math.min(120, width * 0.28) ||
          (event.translationX > 24 && event.velocityX > 700);
        if (dismiss) {
          closing.set(true);
          translation.set(
            withTiming(width, { duration: 180 }, (finished) => {
              if (finished) scheduleOnRN(onClose);
            }),
          );
        } else {
          translation.set(withSpring(0, { damping: 24, stiffness: 240 }));
        }
      })
      .onFinalize(() => {
        if (!closing.get())
          translation.set(withSpring(0, { damping: 24, stiffness: 240 }));
      });
    // Start at the left edge; vertical lists, map pans and text fields keep their gestures.
    return edgeOnly ? pan.hitSlop({ left: 0, width: 28 }) : pan;
  }, [enabled, edgeOnly, width, translation, closing, onClose]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translation.get() }],
  }));
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View collapsable={false} style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
