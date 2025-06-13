import React, { createContext, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

export const PreferencesContext = createContext();

export const PreferencesProvider = ({ children }) => {
  const [distanceUnit, setDistanceUnit] = useState('km'); 

  const changeDistanceUnit = (unit) => {
    if (unit === 'km' || unit === 'miles') {
      setDistanceUnit(unit);
      console.log("Unidade de distância alterada para:", unit);
    }
  };

  const value = {
    distanceUnit,
    changeDistanceUnit,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences deve ser usado dentro de um PreferencesProvider');
  }
  return context;
};