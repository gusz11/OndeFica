import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import type { ModalProps } from "../types/models";
import ModalHeader from "./ModalHeader";
import SwipeDismiss from "./SwipeDismiss";

type Props = PropsWithChildren<
  ModalProps & { title: string; busy?: boolean; footer?: ReactNode }
>;

function ModalContent({ onClose, title, children, busy, footer }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const { height } = useWindowDimensions();
  // Read the insets of the modal's native window, not of its parent screen.
  const insets = useSafeAreaInsets();
  const maxHeight = Math.max(180, height - insets.top - insets.bottom - 48);
  const close = () => {
    if (!busy) onClose();
  };
  return (
    <SafeAreaView
      style={styles.backdrop}
      edges={["top", "bottom", "left", "right"]}
    >
      <KeyboardAvoidingView
        style={{ width: "100%", maxHeight }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SwipeDismiss
          onClose={close}
          enabled={!busy}
          style={[styles.modal, { maxHeight }]}
        >
          <View accessibilityViewIsModal style={{ flexShrink: 1, gap: 20 }}>
            <ModalHeader title={title} onClose={close} disabled={busy} />
            <View style={styles.modalBody}>{children}</View>
            {footer && <View style={styles.modalFooter}>{footer}</View>}
          </View>
        </SwipeDismiss>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function ModalFrame(props: Props) {
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!props.busy) props.onClose();
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ModalContent {...props} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Modal>
  );
}
