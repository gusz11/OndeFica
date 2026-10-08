import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { floatingTabBar, tabBarMetrics } from "../styles/navigation";

export function useTabContentInset(): number {
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    tabBarMetrics(fontScale, insets.bottom).totalHeight +
    floatingTabBar.contentGap
  );
}
