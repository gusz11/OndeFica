import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import AuthForm from "../components/AuthForm";
import type { AuthStackParamList } from "../types/navigation";
export default function RegisterScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, "Register">) {
  return (
    <AuthForm mode="register" onSwitch={() => navigation.navigate("Login")} />
  );
}
