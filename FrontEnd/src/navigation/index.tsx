import { useEffect, useMemo, useState } from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";
import {
  TabBlurContext,
  TabScene,
  type TabBlurTarget,
} from "../context/TabBlurContext";
import GlassTabBar from "../components/GlassTabBar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import type { AuthStackParamList, MainTabParamList } from "../types/navigation";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import ProgramacaoScreen from "../screens/ProgramacaoScreen";
import ConfiguracoesScreen from "../screens/ConfiguracoesScreen";
import Button from "../components/Button";
import Feedback from "../components/Feedback";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { navigationRef } from "./root";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tabs = createMaterialTopTabNavigator<MainTabParamList>();
const renderTabBar = (props: MaterialTopTabBarProps) => (
  <GlassTabBar {...props} />
);

function MainTabs() {
  const { width } = useWindowDimensions();
  const [target, setTarget] = useState<TabBlurTarget>();
  const blurContext = useMemo(() => ({ target, setTarget }), [target]);
  return (
    <TabBlurContext.Provider value={blurContext}>
      <Tabs.Navigator
        tabBarPosition="bottom"
        tabBar={renderTabBar}
        initialLayout={{ width }}
        backBehavior="history"
        keyboardDismissMode="on-drag"
        screenOptions={{
          swipeEnabled: true,
          animationEnabled: true,
          lazy: true,
        }}
        screenLayout={({ children }) => <TabScene>{children}</TabScene>}
      >
        <Tabs.Screen
          name="Pontos"
          component={HomeScreen}
          options={{ title: "Explorar" }}
        />
        <Tabs.Screen name="Programação" component={ProgramacaoScreen} />
        <Tabs.Screen name="Configurações" component={ConfiguracoesScreen} />
      </Tabs.Navigator>
    </TabBlurContext.Provider>
  );
}
export default function Routes() {
  const { userToken, isLoading, sessionError, retrySession, logout } =
    useAuth();
  const { theme, themeMode } = useTheme();
  const styles = useStyles(theme);
  const action = useAsyncAction();
  const navigationTheme = useMemo(() => {
    const base = themeMode === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.textoBotaoAcaoAzul,
        background: theme.backgroundPrincipal,
        card: theme.superficiePrimaria,
        text: theme.textoPrimario,
        border: theme.borda,
      },
    };
  }, [theme, themeMode]);
  useEffect(() => {
    if (userToken && navigationRef.isReady()) navigationRef.navigate("Main");
  }, [userToken]);
  if (isLoading || sessionError)
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Feedback
          loading={isLoading}
          error={sessionError ?? action.error}
          retry={retrySession}
        />
        {!isLoading && (
          <Button
            title="Voltar ao login"
            onPress={() => {
              void action.run(logout);
            }}
            secondary
            loading={action.pending}
          />
        )}
      </SafeAreaView>
    );
  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <AuthStack.Navigator
        initialRouteName="Main"
        screenOptions={{ headerShown: false }}
      >
        <AuthStack.Screen name="Main" component={MainTabs} />
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
      </AuthStack.Navigator>
    </NavigationContainer>
  );
}
