import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TextInput, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemeContext } from '../context/ThemeContext';

const getModalLocalStyles = (colors) => StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.modalBackdrop || 'rgba(0, 0, 0, 0.7)', 
  },
  modalView: {
    width: '90%',
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
    left: 15,
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textoPrimario,
    marginBottom: 10,
    textAlign: 'center',
  },
  placeName: {
    fontSize: 16,
    color: colors.textoSecundario,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    color: colors.textoSecundario,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  datePickerButton: {
    backgroundColor: colors.superficieSecundaria,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerButtonText: {
    color: colors.textoPrimario,
    fontSize: 16,
  },
  inputField: { 
    width: '100%',
    backgroundColor: colors.superficieSecundaria,
    color: colors.textoPrimario,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: { 
    backgroundColor: colors.botaoPrimarioFundo || '#D9D9D9', 
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: colors.botaoPrimarioTexto || 'black', 
    fontSize: 16,
    fontWeight: '500',
  }
});

export default function AddDateModal({ 
    visible, 
    onClose, 
    place, 
    onAddToItinerary, 
    isEditing, 
    initialDate, 
    initialPeople 
}) {
  const { theme } = useContext(ThemeContext);
  const localStyles = getModalLocalStyles(theme); 

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');
  const [numberOfPeople, setNumberOfPeople] = useState('1');

  useEffect(() => {
    if (visible) {
      if (isEditing && initialDate) {
        let parsedDate = new Date(); 
        if (initialDate.includes('-')) { 
            parsedDate = new Date(initialDate.replace(/-/g, '/'));
        } else if (initialDate.includes('/')) { 
            const parts = initialDate.split('/');
            if (parts.length === 3) {
                parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
        }
        setDate(isNaN(parsedDate.getTime()) ? new Date() : parsedDate);
      } else {
        setDate(new Date()); 
      }
      setNumberOfPeople(isEditing && initialPeople ? initialPeople.toString() : '1');
    }
  }, [visible, isEditing, initialDate, initialPeople]);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    if (Platform.OS === 'android') {
      setShowDatePicker(false); 
    }
    setDate(currentDate);
  };

  const handleSave = () => {
    if (!place) return;
    const numPeople = parseInt(numberOfPeople, 10);
    if (isNaN(numPeople) || numPeople <= 0) {
      Alert.alert("Entrada Inválida", "Por favor, insira um número válido de pessoas.");
      return;
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    onAddToItinerary(place, formattedDate, numPeople); 
    onClose();
  };

  const closeModalAndClear = () => {
    onClose();
  };

  if (!place) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={closeModalAndClear} 
    >
      <View style={localStyles.centeredView}>
        <View style={localStyles.modalView}>
          <TouchableOpacity style={localStyles.closeButton} onPress={closeModalAndClear}>
            <Feather name="arrow-left" size={26} color={theme.textoSecundario} />
          </TouchableOpacity>
          
          <Text style={localStyles.modalTitle}>{isEditing ? "Editar Item" : "Adicionar à Programação"}</Text>
          <Text style={localStyles.placeName}>{place.title}</Text>
          
          <Text style={localStyles.label}>Data da Visita:</Text>
          {Platform.OS === 'android' && (
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={localStyles.datePickerButton}>
              <Text style={localStyles.datePickerButtonText}>{date.toLocaleDateString('pt-BR')}</Text>
            </TouchableOpacity>
          )}
          {(showDatePicker || Platform.OS === 'ios') && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              is24Hour={true}
              display={Platform.OS === 'ios' ? "spinner" : "default"}
              onChange={onChangeDate}
              minimumDate={new Date()} // Exemplo: não permite datas passadas para novas adições
              style={{ width: '100%', marginBottom: Platform.OS === 'ios' ? 10 : (showDatePicker ? 20 : 0) }}
            />
          )}

          <Text style={localStyles.label}>Quantidade de Pessoas:</Text>
          <TextInput
            style={localStyles.inputField}
            placeholder="Ex: 2"
            placeholderTextColor={theme.textoMuted}
            value={numberOfPeople}
            onChangeText={setNumberOfPeople}
            keyboardType="numeric"
          />
          
          <TouchableOpacity style={localStyles.addButton} onPress={handleSave}>
            <Text style={localStyles.addButtonText}>{isEditing ? "Salvar Alterações" : "Adicionar ao Roteiro"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}