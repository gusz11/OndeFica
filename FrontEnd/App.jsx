import React from 'react';
import Routes from './src/navigation';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { ThemeProvider, ThemeContext } from './src/context/ThemeContext';
import { ItineraryProvider } from './src/context/ItineraryContext'; 
import { AuthProvider } from './src/context/AuthContext';
import { PreferencesProvider } from './src/context/PreferencesContext'; 

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ItineraryProvider>
          <PreferencesProvider> 
            <ThemeContext.Consumer> 
              {({ theme, themeMode }) => (
                <View style={{ flex: 1, backgroundColor: theme.backgroundPrincipal }}>
                  <StatusBar 
                    style={themeMode === 'light' ? 'dark' : 'light'}
                    backgroundColor={theme.superficiePrimaria} 
                  />
                  <Routes /> 
                </View>
              )}
            </ThemeContext.Consumer>
          </PreferencesProvider>
        </ItineraryProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}