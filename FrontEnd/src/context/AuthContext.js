import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const API_BASE_URL = 'http://192.168.0.3:8000';
const API_AUTH_URL = `${API_BASE_URL}/auth`;

const ANDROID_CLIENT_ID = "728023220873-6pbvaou3rn5vibbb9l2ve3j2h2jfaksj.apps.googleusercontent.com";
const EXPO_GO_CLIENT_ID = "728023220873-uncakb5hrmengtvm12r0319s4afopn4a.apps.googleusercontent.com";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAuthSessionLoading, setIsAuthSessionLoading] = useState(true);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    expoClientId: EXPO_GO_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
  });

  const fetchAndSetUserData = async (token) => {
    if (!token) { setUserData(null); return; }
    try {
      const userResponse = await fetch(`${API_BASE_URL}/users/me/`, {
        method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await userResponse.json();
      if (userResponse.ok) { setUserData(data); } else { await logout(); }
    } catch (e) { await logout(); }
  };
  
  useEffect(() => {
    const bootstrapAsync = async () => {
      let token = null;
      try {
        token = await AsyncStorage.getItem('@userToken');
        setUserToken(token);
        if (token) { await fetchAndSetUserData(token); }
      } catch (e) { console.error("Erro ao carregar token:", e); }
      finally { setIsAuthSessionLoading(false); }
    };
    bootstrapAsync();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params; 
      if (id_token) { handleGoogleTokenBackend(id_token); } 
      else { Alert.alert("Erro", "Token do Google não obtido."); setIsAuthSessionLoading(false); }
    } else if (response?.type !== 'loaded') {
      setIsAuthSessionLoading(false); 
    }
  }, [response]);

  const handleGoogleTokenBackend = async (idToken) => {
    setIsAuthSessionLoading(true); 
    try {
      const backendResponse = await fetch(`${API_AUTH_URL}/google`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_token: idToken }),
      });
      const data = await backendResponse.json();
      if (!backendResponse.ok) throw new Error(data.detail || 'Falha no login com Google via backend');
      if (data.access_token) {
        await AsyncStorage.setItem('@userToken', data.access_token);
        setUserToken(data.access_token);
        await fetchAndSetUserData(data.access_token);
      } else { throw new Error('Token da aplicação não recebido'); }
    } catch (e) {
      Alert.alert("Erro de Login", e.message || "Erro no servidor.");
      await logout();
    } finally {
      setIsAuthSessionLoading(false);
    }
  };
  
  const signInWithGoogle = async () => {
    if (isAuthSessionLoading) return;
    setIsAuthSessionLoading(true);
    await promptAsync({ showInRecents: true }); 
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_AUTH_URL}/token`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        // O corpo envia 'username' e 'password' como esperado pelo backend
        body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Falha no login.');
      
      if (data.access_token) {
        await AsyncStorage.setItem('@userToken', data.access_token);
        setUserToken(data.access_token);
        await fetchAndSetUserData(data.access_token);
        return true; 
      } else { throw new Error('Token não recebido.'); }
    } catch (e) {
      await logout();
      throw e; 
    }
  };

  const register = async (fullName, email, password) => {
    try {
      const response = await fetch(`${API_AUTH_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Falha no registro.');
      return data;
    } catch (e) { throw e; }
  };

  const logout = async () => {
    setIsAuthSessionLoading(true);
    await AsyncStorage.removeItem('@userToken');
    setUserToken(null);
    setUserData(null);
    console.log("Logout realizado.");
    setIsAuthSessionLoading(false);
  };

  return (
    <AuthContext.Provider value={{ 
        isLoading: isAuthSessionLoading, 
        userToken, 
        userData,
        login, 
        register, 
        logout,
        signInWithGoogle
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};