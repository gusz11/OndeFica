import React, { useContext } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext'; 

const getModalLocalStyles = (colors) => StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.modalBackdrop || 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    width: '85%',
    backgroundColor: colors.superficiePrimaria,
    borderRadius: 10,
    padding: 25,
    alignItems: 'center',
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    left: 10,
    padding: 5,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textoPrimario,
    marginBottom: 25,
    textAlign: 'center',
  },
  infoContainer: {
    width: '100%',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borda,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.textoSecundario,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: colors.textoPrimario,
    flexShrink: 1,
    textAlign: 'right',
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: colors.textoBotaoAcaoVermelho || '#cc3636', 
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white', 
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default function UserInfoModal({ visible, onClose, userData }) {
  const { theme } = useContext(ThemeContext);
  const localStyles = getModalLocalStyles(theme);
  const { logout, isLoading } = useAuth(); 

  const handleLogout = () => {
    Alert.alert(
      "Sair da Conta",
      "Tem certeza que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sair", 
          style: "destructive", 
          onPress: async () => {
            await logout(); 
            onClose();
          } 
        }
      ]
    );
  };

  if (!userData) {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={localStyles.centeredView}>
          <View style={localStyles.modalView}>
            <ActivityIndicator size="large" color={theme.textoPrimario} />
            <Text style={{color: theme.textoPrimario, marginTop: 10}}>Carregando dados da conta...</Text>
            <TouchableOpacity style={localStyles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color={theme.textoSecundario} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={localStyles.centeredView}>
        <View style={localStyles.modalView}>
          <TouchableOpacity style={localStyles.closeButton} onPress={onClose}>
            <Feather name="arrow-left" size={26} top={14} color={theme.textoSecundario} />
          </TouchableOpacity>
          
          <Text style={localStyles.modalTitle}>Minha Conta</Text>
          
          <View style={localStyles.infoContainer}>
            <View style={localStyles.infoRow}>
              <Text style={localStyles.infoLabel}>Nome:</Text>
              <Text style={localStyles.infoValue}>{userData.full_name || "Não informado"}</Text>
            </View>
            <View style={[localStyles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={localStyles.infoLabel}>Email:</Text>
              <Text style={localStyles.infoValue}>{userData.email}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={localStyles.logoutButton} 
            onPress={handleLogout}
            disabled={isLoading}
          >
            <Text style={localStyles.logoutButtonText}>Sair da Conta</Text>
          </TouchableOpacity>
          
        </View>
      </View>
    </Modal>
  );
}