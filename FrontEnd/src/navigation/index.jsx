// src/navigation/index.jsx
import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Pressable, Platform, View, ActivityIndicator, Text } from 'react-native'; // Adicionado View, ActivityIndicator, Text
import { ThemeContext } from '../context/ThemeContext'; 
import { AuthContext, useAuth } from '../context/AuthContext'; // 1. Importe AuthContext e useAuth

// Telas
import HomeScreen from '../screens/HomeScreen';
import ProgramacaoScreen from '../screens/ProgramacaoScreen';
import ConfiguracoesScreen from '../screens/ConfiguracoesScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { getGlobalStyles } from '../styles/styles'; // Para estilos de loading

const RootStack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator(); // Renomeado para evitar conflito
const Tab = createBottomTabNavigator();

// Componente para as Abas Principais (após login)
function MainTabNavigator() {
  const { theme } = useContext(ThemeContext); 

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          let iconName;
          const iconSize = focused ? 30 : 28;
          const iconColor = focused ? theme.iconeAtivo : theme.iconeInativo; 

          if (route.name === 'Pontos') {
            iconName = focused ? 'map-marker-radius' : 'map-marker-radius-outline';
            return <MaterialCommunityIcons name={iconName} size={iconSize} color={iconColor} />;
          } else if (route.name === 'Programação') { 
            iconName = focused ? 'book-open' : 'book'; 
            return <Feather name={iconName} size={iconSize} color={iconColor} />;
          } else if (route.name === 'Configurações') { 
            iconName = focused ? 'cog' : 'cog-outline';
            return <MaterialCommunityIcons name={iconName} size={iconSize} color={iconColor} />;
          }
          return null; 
        },
        tabBarActiveTintColor: theme.iconeAtivo,
        tabBarInactiveTintColor: theme.iconeInativo,
        tabBarStyle: {
          backgroundColor: theme.fundoFooter, 
          borderTopWidth: 1,
          borderTopColor: theme.borda, 
          height: Platform.OS === 'ios' ? 80 : 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarButton: (props) => (
          <Pressable
            {...props}
            android_ripple={{ color: 'transparent' }} 
          />
        ),
      })}
    >
      <Tab.Screen name="Pontos" component={HomeScreen} />
      <Tab.Screen name="Programação" component={ProgramacaoScreen} /> 
      <Tab.Screen name="Configurações" component={ConfiguracoesScreen} />
    </Tab.Navigator>
  );
}

// Componente para o Fluxo de Autenticação
function AuthStackNavigator() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
    </AuthStackNav.Navigator>
  );
}

// Navegador Principal que decide entre Auth e App
export default function Routes() {
  const { theme, themeMode } = useContext(ThemeContext);
  const { userToken, isLoading: isAuthLoading } = useAuth(); // 2. Use o AuthContext
  const styles = getGlobalStyles(theme); // Para o estilo do loading

  // Define o tema da navegação baseado no tema do app
  const currentNavigationThemeBasedOnApp = themeMode === 'dark' ? NavigationDarkTheme : DefaultTheme;

  const navigationTheme = {
    ...currentNavigationThemeBasedOnApp,
    colors: {
      ...currentNavigationThemeBasedOnApp.colors,
      primary: theme.textoPrimario, 
      background: theme.backgroundPrincipal,
      card: theme.superficiePrimaria, 
      text: theme.textoPrimario,
      border: theme.borda,
      notification: theme.textoBotaoAcaoVermelho,
    },
    // Chave 'fonts' removida para usar fontes padrão do sistema
  };

  // 3. Mostra um indicador de carregamento enquanto o AuthContext verifica o token
  if (isAuthLoading) {
    return (
      // Envolve em um NavigationContainer temporário ou View para aplicar tema ao loading
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color={theme.textoPrimario} />
        <Text style={{color: theme.textoPrimario, marginTop: 10}}>Verificando sessão...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}> 
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {/* 4. Renderiza condicionalmente com base no userToken */}
        {userToken ? (
          <RootStack.Screen name="MainApp" component={MainTabNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}