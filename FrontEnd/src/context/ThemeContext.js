import React, { createContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { darkThemeColors, lightThemeColors } from '../styles/styles'; 

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('dark'); 

  const [theme, setTheme] = useState(
    themeMode === 'light' ? lightThemeColors : darkThemeColors 
  );

  const toggleTheme = () => {
    const newThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newThemeMode);
    setTheme(newThemeMode === 'light' ? lightThemeColors : darkThemeColors);
  };
  
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
    });
  }, []); 


  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};