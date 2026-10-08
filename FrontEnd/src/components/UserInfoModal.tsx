import { Text } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useStyles } from "../styles/styles";
import type { ModalProps } from "../types/models";
import { useDialog } from "../context/DialogContext";
import Button from "./Button";
import ModalFrame from "./ModalFrame";
export default function UserInfoModal(props: ModalProps) {
  const { confirmAction } = useDialog();
  const { userData, logout } = useAuth();
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const action = useAsyncAction();
  const confirm = () => {
    void action.run(async () => {
      if (
        await confirmAction(
          "Sair da conta",
          "Deseja sair da sua conta?",
          "Sair",
        )
      ) {
        await logout();
      }
    });
  };
  return (
    <ModalFrame {...props} title="Minha conta" busy={action.pending}>
      <Text style={styles.text}>
        Nome: {userData?.full_name ?? "Não informado"}
      </Text>
      <Text style={styles.text}>Email: {userData?.email}</Text>
      {!!action.error && <Text style={styles.error}>{action.error}</Text>}
      <Button
        title="Sair da conta"
        onPress={confirm}
        loading={action.pending}
        variant="danger"
        icon="log-out"
      />
    </ModalFrame>
  );
}
