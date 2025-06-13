// src/screens/RegisterScreen.jsx
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext, useAuth } from '../context/AuthContext';
import { getGlobalStyles } from '../styles/styles'; 
import { Feather } from '@expo/vector-icons'; // Para um possível ícone de voltar

export default function RegisterScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const localStyles = getRegisterScreenStyles(theme); // Usaremos estilos locais
  const styles = { ...getGlobalStyles(theme), ...localStyles }; 

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const { register } = useAuth(); // Pega a função register do AuthContext

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert("Campos Vazios", "Por favor, preencha todos os campos.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Senhas Diferentes", "As senhas não coincidem.");
      return;
    }
    if (password.length < 8) { // Validação que temos no backend schema
        Alert.alert("Senha Curta", "A senha deve ter pelo menos 8 caracteres.");
        return;
    }

    setIsRegistering(true);
    try {
      const registeredUser = await register(fullName, email, password);
      console.log("Registro bem-sucedido:", registeredUser);
      Alert.alert(
        "Registro Concluído!", 
        "Sua conta foi criada com sucesso. Por favor, faça o login.",
        [{ text: "OK", onPress: () => navigation.navigate('Login') }] // Volta para a tela de Login
      );
    } catch (error) {
      console.error("Erro no registro:", error.message);
      Alert.alert("Erro no Registro", error.message || "Não foi possível criar a conta.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <View style={styles.registerContainer}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        {/* Botão Voltar (Opcional, já que o Stack Navigator provê) */}
        {/* <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={28} color={theme.textoPrimario} />
        </TouchableOpacity> */}
        
        <Text style={styles.registerTitle}>Criar Conta</Text>
        
        <TextInput
          style={styles.registerInput}
          placeholder="Nome Completo"
          placeholderTextColor={theme.textoMuted}
          value={fullName}
          onChangeText={setFullName}
          editable={!isRegistering}
        />
        <TextInput
          style={styles.registerInput}
          placeholder="Email"
          placeholderTextColor={theme.textoMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isRegistering}
        />
        <TextInput
          style={styles.registerInput}
          placeholder="Senha (mínimo 8 caracteres)"
          placeholderTextColor={theme.textoMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isRegistering}
        />
        <TextInput
          style={styles.registerInput}
          placeholder="Confirmar Senha"
          placeholderTextColor={theme.textoMuted}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!isRegistering}
        />

        <TouchableOpacity 
          style={[styles.registerButton, isRegistering && styles.registerButtonDisabled]} 
          onPress={handleRegister}
          disabled={isRegistering}
        >
          {isRegistering ? (
            <ActivityIndicator size="small" color={theme.botaoPrimarioTexto} />
          ) : (
            <Text style={styles.registerButtonText}>Cadastrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchAuthButton}
          onPress={() => navigation.navigate('Login')}
          disabled={isRegistering}
        >
          <Text style={styles.switchAuthButtonText}>
            Já tem uma conta? <Text style={styles.switchAuthLink}>Faça Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Estilos locais para RegisterScreen
const getRegisterScreenStyles = (colors) => StyleSheet.create({
  registerContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: Platform.OS === 'ios' ? 60 : 30, 
    paddingBottom: 20,
    backgroundColor: colors.backgroundPrincipal,
  },
  registerTitle: {
    fontSize: 32, 
    fontWeight: 'bold',
    color: colors.textoPrimario,
    marginBottom: 30,
    textAlign: 'center',
  },
  registerInput: {
    width: '100%',
    backgroundColor: colors.superficiePrimaria,
    color: colors.textoPrimario,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 5,
    fontSize: 16,
    marginBottom: 15,
  },
  registerButton: {
    width: '100%',
    backgroundColor: colors.botaoPrimarioFundo, 
    paddingVertical: 18,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 50,
    justifyContent: 'center',
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: colors.botaoPrimarioTexto,
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchAuthButton: { 
    marginTop: 15,
    padding: 10,
    alignSelf: 'center',
  },
  switchAuthButtonText: {
    color: colors.textoSecundario,
    fontSize: 14,
  },
  switchAuthLink: {
    color: colors.textoBotaoAcaoAzul || colors.iconeAtivo,
    fontWeight: 'bold',
  },
});