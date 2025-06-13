import React, { useContext } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { getGlobalStyles } from '../styles/styles';

const getModalLocalStyles = (colors) => StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.modalBackdrop || 'rgba(0, 0, 0, 0.6)', 
  },
  modalView: {
    width: '80%',
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
    top: 15,
    left: 10,
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textoPrimario, 
    marginBottom: 25,
    textAlign: 'center',
  },
});

export default function AparenciaModal({ visible, onClose }) {
  const { theme, themeMode, toggleTheme } = useContext(ThemeContext);
  const styles = getGlobalStyles(theme); 
  const modalLocalStyles = getModalLocalStyles(theme); 

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={modalLocalStyles.centeredView}>
        <View style={modalLocalStyles.modalView}>
          <TouchableOpacity style={modalLocalStyles.closeButton} onPress={onClose}>
            <Feather name="arrow-left" size={26} color={theme.textoSecundario} />
          </TouchableOpacity>
          
          <Text style={modalLocalStyles.modalTitle}>Modo de Aparência</Text>
          <View style={styles.themeSelectorContainer}>
            <TouchableOpacity 
              style={[
                styles.themeButton, 
                { 
                  backgroundColor: themeMode === 'light' ? theme.superficieSecundaria : theme.superficiePrimaria,
                  borderColor: themeMode === 'light' ? theme.iconeAtivo : 'transparent',
                }
              ]}
              onPress={() => { if (themeMode !== 'light') toggleTheme(); }}
            >
              <Text style={[styles.themeButtonText, { color: themeMode === 'light' ? theme.iconeAtivo : theme.textoMuted }]}>Claro</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.themeButton, 
                { 
                  backgroundColor: themeMode === 'dark' ? theme.superficieSecundaria : theme.superficiePrimaria,
                  borderColor: themeMode === 'dark' ? theme.iconeAtivo : 'transparent',
                }
              ]}
              onPress={() => { if (themeMode !== 'dark') toggleTheme(); }}
            >
              <Text style={[styles.themeButtonText, { color: themeMode === 'dark' ? theme.iconeAtivo : theme.textoMuted }]}>Escuro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}