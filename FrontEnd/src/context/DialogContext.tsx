import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Alert, Platform, Text, View } from "react-native";
import Button from "../components/Button";
import ModalFrame from "../components/ModalFrame";
import { useStyles } from "../styles/styles";
import { useTheme } from "./ThemeContext";

type Dialog = {
  title: string;
  message: string;
  confirmLabel: string;
  showCancel: boolean;
  finish: (accepted: boolean) => void;
};
type DialogActions = {
  confirmAction: (
    title: string,
    message: string,
    confirmLabel: string,
  ) => Promise<boolean>;
  notify: (title: string, message: string, onClose: () => void) => void;
};
const DialogContext = createContext<DialogActions | undefined>(undefined);

export function DialogProvider({ children }: PropsWithChildren) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const active = useRef<Dialog | null>(null);
  const show = useCallback((next: Dialog) => {
    active.current?.finish(false);
    active.current = next;
    setDialog(next);
  }, []);
  const finish = useCallback((accepted: boolean) => {
    const current = active.current;
    active.current = null;
    setDialog(null);
    current?.finish(accepted);
  }, []);
  useEffect(
    () => () => {
      active.current?.finish(false);
    },
    [],
  );
  const confirmAction = useCallback<DialogActions["confirmAction"]>(
    (title, message, confirmLabel) => {
      return new Promise<boolean>((resolve) => {
        if (Platform.OS === "web") {
          // Alert is unavailable on web; a themed modal also avoids blocking the browser.
          show({
            title,
            message,
            confirmLabel,
            showCancel: true,
            finish: resolve,
          });
        } else {
          Alert.alert(
            title,
            message,
            [
              {
                text: "Cancelar",
                style: "cancel",
                onPress: () => resolve(false),
              },
              {
                text: confirmLabel,
                style: "destructive",
                onPress: () => resolve(true),
              },
            ],
            { cancelable: true, onDismiss: () => resolve(false) },
          );
        }
      });
    },
    [show],
  );
  const notify = useCallback<DialogActions["notify"]>(
    (title, message, onClose) => {
      if (Platform.OS === "web") {
        show({
          title,
          message,
          confirmLabel: "Continuar",
          showCancel: false,
          finish: (accepted) => {
            if (accepted) onClose();
          },
        });
      } else {
        Alert.alert(title, message, [{ text: "Continuar", onPress: onClose }], {
          cancelable: false,
        });
      }
    },
    [show],
  );
  const value = useMemo(
    () => ({ confirmAction, notify }),
    [confirmAction, notify],
  );
  return (
    <DialogContext.Provider value={value}>
      {children}
      {dialog && (
        <ModalFrame visible title={dialog.title} onClose={() => finish(false)}>
          <Text style={styles.text}>{dialog.message}</Text>
          <View style={styles.row}>
            {dialog.showCancel && (
              <Button
                title="Cancelar"
                secondary
                onPress={() => finish(false)}
              />
            )}
            <Button
              title={dialog.confirmLabel}
              variant={dialog.showCancel ? "danger" : "primary"}
              onPress={() => finish(true)}
            />
          </View>
        </ModalFrame>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogActions {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog exige DialogProvider");
  return context;
}
