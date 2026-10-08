import { createNavigationContainerRef } from "@react-navigation/native";
import type { AuthStackParamList } from "../types/navigation";
export const navigationRef = createNavigationContainerRef<AuthStackParamList>();
export function requestLogin() {
  if (navigationRef.isReady()) navigationRef.navigate("Login");
}
