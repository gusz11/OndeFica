import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import AuthForm from "../components/AuthForm";
import type { AuthStackParamList } from "../types/navigation";
export default function LoginScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, "Login">) {
  return (
    <AuthForm mode="login" onSwitch={() => navigation.navigate("Register")} />
  );
}
