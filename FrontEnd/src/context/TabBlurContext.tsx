import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ComponentRef,
  type Dispatch,
  type PropsWithChildren,
  type RefObject,
  type SetStateAction,
} from "react";
import { Platform, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { BlurTargetView } from "expo-blur";

export type TabBlurTarget =
  | RefObject<ComponentRef<typeof View> | null>
  | undefined;
export const TabBlurContext = createContext<
  | {
      target: TabBlurTarget;
      setTarget: Dispatch<SetStateAction<TabBlurTarget>>;
    }
  | undefined
>(undefined);

export function TabScene({ children }: PropsWithChildren) {
  const context = useContext(TabBlurContext);
  const focused = useIsFocused();
  const ref = useRef<ComponentRef<typeof View> | null>(null);
  const setTarget = context?.setTarget;
  useEffect(() => {
    if (Platform.OS === "android" && focused) setTarget?.(ref);
  }, [focused, setTarget]);
  // Android needs an explicit target. The bar stays outside the target to avoid blurring itself.
  return Platform.OS === "android" ? (
    <BlurTargetView ref={ref} style={{ flex: 1 }}>
      {children}
    </BlurTargetView>
  ) : (
    children
  );
}

export function useTabBlurTarget(): TabBlurTarget {
  return useContext(TabBlurContext)?.target;
}
