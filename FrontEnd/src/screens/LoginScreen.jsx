// src/screens/LoginScreen.jsx
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext, useAuth } from '../context/AuthContext'; 
import { getGlobalStyles } from '../styles/styles'; 
import { MaterialCommunityIcons } from '@expo/vector-icons'; 

const getLoginScreenStyles = (colors) => StyleSheet.create({
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: colors.backgroundPrincipal,
  },
  loginTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.textoPrimario,
    marginBottom: 40,
  },
  loginInput: {
    width: '100%',
    backgroundColor: colors.superficiePrimaria,
    color: colors.textoPrimario,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 5,
    fontSize: 16,
    marginBottom: 15,
  },
  loginButton: {
    width: '100%',
    backgroundColor: colors.botaoPrimarioFundo,
    paddingVertical: 18,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 50, 
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: colors.botaoPrimarioTexto,
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchAuthButton: {
    marginTop: 15,
    padding: 10,
  },
  switchAuthButtonText: {
    color: colors.textoSecundario,
    fontSize: 14,
  },
  switchAuthLink: {
    color: colors.textoBotaoAcaoAzul || colors.iconeAtivo,
    fontWeight: 'bold',
  },
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginVertical: 25, // Ajustado
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borda,
  },
  orDividerText: {
    width: 50,
    textAlign: 'center',
    color: colors.textoMuted,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
    paddingVertical: 12, // Ajustado
    paddingHorizontal: 20,
    borderRadius: 5,
    width: '100%',
    justifyContent: 'center',
    minHeight: 50,
    ...Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.22,
            shadowRadius: 2.22,
        },
        android: {
            elevation: 3,
        },
    }),
  },
  googleButtonText: {
    color: '#404040', 
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10, 
  },
  googleIcon: { 
    width: 20,
    height: 20,
  }
});


export default function LoginScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const localStyles = getLoginScreenStyles(theme); 
  const styles = { ...getGlobalStyles(theme), ...localStyles }; 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false); 

  const { login, signInWithGoogle, isLoading: isAuthSessionLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Campos Vazios", "Por favor, preencha o email e a senha.");
      return;
    }
    setIsSubmittingLogin(true);
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert("Erro no Login", error.message || "Não foi possível conectar.");
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleGoogleSignIn = () => {
    signInWithGoogle();
  };

  return (
    <View style={styles.loginContainer}>
      <Text style={styles.loginTitle}>OndeFica</Text>
      
      <TextInput
        style={styles.loginInput}
        placeholder="Email"
        placeholderTextColor={theme.textoMuted}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isSubmittingLogin && !isAuthSessionLoading}
      />
      <TextInput
        style={styles.loginInput}
        placeholder="Senha"
        placeholderTextColor={theme.textoMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isSubmittingLogin && !isAuthSessionLoading}
      />

      <TouchableOpacity 
        style={[styles.loginButton, (isSubmittingLogin || isAuthSessionLoading) && styles.loginButtonDisabled]} 
        onPress={handleLogin}
        disabled={isSubmittingLogin || isAuthSessionLoading}
      >
        {isSubmittingLogin ? (
          <ActivityIndicator size="small" color={styles.loginButtonText.color} />
        ) : (
          <Text style={styles.loginButtonText}>Entrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.switchAuthButton}
        onPress={() => navigation.navigate('Register')}
        disabled={isSubmittingLogin || isAuthSessionLoading}
      >
        <Text style={styles.switchAuthButtonText}>
          Não tem uma conta? <Text style={styles.switchAuthLink}>Cadastre-se</Text>
        </Text>
      </TouchableOpacity>

      <View style={styles.orDividerContainer}>
        <View style={styles.orDividerLine} />
        <Text style={styles.orDividerText}>OU</Text>
        <View style={styles.orDividerLine} />
      </View>

      <TouchableOpacity 
        style={[styles.googleButton, isAuthSessionLoading && styles.loginButtonDisabled]} 
        onPress={handleGoogleSignIn}
        disabled={isAuthSessionLoading} 
      >
        <MaterialCommunityIcons name="google" size={20} color="#404040" /> 
        <Text style={styles.googleButtonText}>Entrar com Google</Text>
      </TouchableOpacity>
    </View>
  );
}