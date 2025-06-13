import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../components/Header';
import SobreModal from '../components/SobreModal';
import AparenciaModal from '../components/AparenciaModal';
import UserInfoModal from '../components/UserInfoModal';
import PreferencesModal from '../components/PreferencesModal';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext, useAuth } from '../context/AuthContext';
import { getGlobalStyles } from '../styles/styles';

const configOptions = [
  { id: '1', label: 'Conta', icon: 'account-circle-outline', action: 'conta' },
  { id: '2', label: 'Aparência', icon: 'palette-outline', action: 'aparencia' },
  { id: '3', label: 'Preferências', icon: 'cog-outline', action: 'preferencias' },
  { id: '4', label: 'Sobre', icon: 'information-outline', action: 'sobre' },
];

export default function ConfiguracoesScreen() {
  const { theme } = useContext(ThemeContext);
  const styles = getGlobalStyles(theme);
  const { userData, userToken } = useAuth();

  const [sobreModalVisible, setSobreModalVisible] = useState(false);
  const [aparenciaModalVisible, setAparenciaModalVisible] = useState(false);
  const [userInfoModalVisible, setUserInfoModalVisible] = useState(false);
  const [preferencesModalVisible, setPreferencesModalVisible] = useState(false); // ✅ Adicionado

  const handleOptionPress = (action) => {
    if (!userToken) {
      Alert.alert("Acesso Restrito", "Você precisa estar logado para acessar esta opção.");
      return;
    }

    if (action === 'sobre') {
      setSobreModalVisible(true);
    } else if (action === 'aparencia') {
      setAparenciaModalVisible(true);
    } else if (action === 'preferencias') {
      setPreferencesModalVisible(true);
    } else if (action === 'conta') {
      if (userData) {
        setUserInfoModalVisible(true);
      } else {
        Alert.alert("Informações Indisponíveis", "Não foi possível carregar os dados da sua conta. Tente novamente mais tarde.");
      }
    } else {
      console.log(`Opção ${action} clicada`);
      Alert.alert("Em Breve", `A funcionalidade "${action}" será implementada em breve!`);
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.scrollViewPadding}>
        <Text style={styles.configScreenTitle}>Configurações</Text>

        {configOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.configOptionButton}
            onPress={() => handleOptionPress(option.action)}
          >
            <Text style={styles.configOptionText}>{option.label}</Text>
            <MaterialCommunityIcons name={option.icon} size={26} color={theme.textoSecundario} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SobreModal
        visible={sobreModalVisible}
        onClose={() => setSobreModalVisible(false)}
      />
      <AparenciaModal
        visible={aparenciaModalVisible}
        onClose={() => setAparenciaModalVisible(false)}
      />
      <PreferencesModal
        visible={preferencesModalVisible}
        onClose={() => setPreferencesModalVisible(false)}
      />
      {userData && (
        <UserInfoModal
          visible={userInfoModalVisible}
          onClose={() => setUserInfoModalVisible(false)}
          userData={userData}
        />
      )}
    </View>
  );
}
