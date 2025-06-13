import React, { useContext } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { usePreferences } from '../context/PreferencesContext';


const getModalLocalStyles = (colors) => StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.modalBackdrop || 'rgba(0, 0, 0, 0.6)', 
  },
  modalView: {
    width: '85%',
    backgroundColor: colors.superficiePrimaria,
    borderRadius: 5,
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
    top: 10,
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
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  preferenceLabel: {
    fontSize: 16,
    color: colors.textoSecundario,
    marginRight: 8,
  },
  selectorContainer: {
    flexDirection: 'row',
  },
  selectorButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5, 
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  selectorButtonText: {
    fontSize: 14,
    fontWeight: 'bold', 
  }
});

export default function PreferencesModal({ visible, onClose }) {
  const { theme } = useContext(ThemeContext);
  const { distanceUnit, changeDistanceUnit } = usePreferences();
  const localStyles = getModalLocalStyles(theme);

  const activeButtonStyle = {
    backgroundColor: theme.iconeAtivo, 
    borderColor: theme.iconeAtivo,
  };
  const inactiveButtonStyle = {
    backgroundColor: 'transparent', 
    borderColor: theme.borda,
  };

  const activeButtonTextStyle = {
    color: theme.botaoPrimarioTexto,
  };
  const inactiveButtonTextStyle = {
    color: theme.textoSecundario,
  };

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
            <Feather name="arrow-left" size={26} color={theme.textoSecundario} />
          </TouchableOpacity>
          
          <Text style={localStyles.modalTitle}>Preferências</Text>
          
          <View style={localStyles.preferenceRow}>
            <Text style={localStyles.preferenceLabel}>Unidade de Distância:</Text>
            <View style={localStyles.selectorContainer}>
              <TouchableOpacity
                style={[
                  localStyles.selectorButton,
                  distanceUnit === 'km' ? activeButtonStyle : inactiveButtonStyle,
                  { marginRight: 10 }
                ]}
                onPress={() => changeDistanceUnit('km')}
              >
                <Text style={[localStyles.selectorButtonText, distanceUnit === 'km' ? activeButtonTextStyle : inactiveButtonTextStyle]}>
                  km
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  localStyles.selectorButton,
                  distanceUnit === 'miles' ? activeButtonStyle : inactiveButtonStyle
                ]}
                onPress={() => changeDistanceUnit('miles')}
              >
                <Text style={[localStyles.selectorButtonText, distanceUnit === 'miles' ? activeButtonTextStyle : inactiveButtonTextStyle]}>
                  mi
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}