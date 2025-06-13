import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemeContext } from '../context/ThemeContext';
import { useItinerary } from '../context/ItineraryContext';

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
    left: 5,
    padding: 5,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textoPrimario,
    marginBottom: 10,
    textAlign: 'center',
  },
  hotelName: {
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
    marginBottom: 15,
  },
  datePickerButtonText: {
    color: colors.textoPrimario,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: colors.botaoPrimarioFundo || '#D9D9D9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: colors.botaoPrimarioTexto || 'black',
    fontSize: 16,
    fontWeight: '500',
  }
});

export default function AddHotelModal({
  visible,
  onClose,
  hotel,
  onAddHotelToItinerary,
  isEditing,
  initialCheckInDate,
  initialCheckOutDate,
  itineraryItemId
}) {
  const { theme } = useContext(ThemeContext);
  const localStyles = getModalLocalStyles(theme);
  const { checkForHotelOverlap } = useItinerary();

  const parseDateString = (dateStr) => {
    if (!dateStr) {
      console.warn("Data inicial ausente:", dateStr);
      return null;
    }
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      console.warn("Data inicial inválida:", dateStr);
      return null;
    }
    return parsed;
  };

  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
  const [showPicker, setShowPicker] = useState(null);

  useEffect(() => {
    if (visible) {
      console.log("AddHotelModal - hotel:", hotel);
      console.log("AddHotelModal - initialCheckInDate:", initialCheckInDate, "initialCheckOutDate:", initialCheckOutDate);
      const today = new Date();
      let initialCI = today;
      let initialCO = new Date(today);
      initialCO.setDate(today.getDate() + 1);

      if (isEditing) {
        const parsedCI = parseDateString(initialCheckInDate);
        const parsedCO = parseDateString(initialCheckOutDate);
        if (parsedCI && !isNaN(parsedCI.getTime())) {
          initialCI = parsedCI;
        } else {
          console.warn("Check-in date inválida, usando data padrão:", initialCheckInDate);
        }
        if (parsedCO && !isNaN(parsedCO.getTime()) && parsedCO > initialCI) {
          initialCO = parsedCO;
        } else {
          initialCO = new Date(initialCI);
          initialCO.setDate(initialCI.getDate() + 1);
          if (!parsedCO) {
            console.warn("Check-out date ausente, usando data padrão:", initialCheckOutDate);
          } else {
            console.warn("Check-out date inválida ou anterior ao check-in, ajustando:", initialCheckOutDate);
          }
        }
      }
      setCheckInDate(initialCI);
      setCheckOutDate(initialCO);
      setShowPicker(null);
    }
  }, [visible, isEditing, initialCheckInDate, initialCheckOutDate, hotel]);

  const onChangeDate = (event, selectedDate) => {
    const dateValueToSet = selectedDate || (showPicker === 'checkin' ? checkInDate : checkOutDate);
    const currentlyShowingPicker = showPicker;
    setShowPicker(null);

    if (event.type === "set") {
      if (currentlyShowingPicker === 'checkin') {
        setCheckInDate(dateValueToSet);
        if (dateValueToSet >= checkOutDate) {
          const nextDay = new Date(dateValueToSet);
          nextDay.setDate(dateValueToSet.getDate() + 1);
          setCheckOutDate(nextDay);
        }
      } else if (currentlyShowingPicker === 'checkout') {
        if (dateValueToSet <= checkInDate) {
          Alert.alert("Data Inválida", "A data de check-out deve ser posterior à data de check-in.");
        } else {
          setCheckOutDate(dateValueToSet);
        }
      }
    }
  };

  const handleSave = () => {
    if (!hotel) {
      console.error("Objeto hotel está indefinido no handleSave");
      Alert.alert("Erro", "Nenhum hotel selecionado.");
      return;
    }
    if (checkOutDate <= checkInDate) {
      Alert.alert("Datas Inválidas", "A data de check-out deve ser posterior à data de check-in.");
      return;
    }

    const formatToYYYYMMDD = (dateObj) => dateObj.toISOString().split('T')[0];
    const formattedCheckIn = formatToYYYYMMDD(checkInDate);
    const formattedCheckOut = formatToYYYYMMDD(checkOutDate);

    if (checkForHotelOverlap(formattedCheckIn, formattedCheckOut, isEditing ? itineraryItemId : null)) {
      Alert.alert(
        "Conflito de Datas",
        "As datas selecionadas para este hotel se sobrepõem a uma reserva existente na sua programação."
      );
      return;
    }

    onAddHotelToItinerary(hotel, formattedCheckIn, formattedCheckOut);
    onClose();
  };

  if (!hotel) {
    console.warn("Prop hotel está indefinida no AddHotelModal");
    return null;
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
            <Feather name="arrow-left" size={26} color={theme.textoSecundario} />
          </TouchableOpacity>

          <Text style={localStyles.modalTitle}>{isEditing ? "Editar Hotel" : "Adicionar Hotel à Programação"}</Text>
          <Text style={localStyles.hotelName}>{hotel.title || hotel.name || "Hotel Sem Nome"}</Text>

          <Text style={localStyles.label}>Data de Check-in:</Text>
          <TouchableOpacity onPress={() => setShowPicker('checkin')} style={localStyles.datePickerButton}>
            <Text style={localStyles.datePickerButtonText}>{checkInDate.toLocaleDateString('pt-BR')}</Text>
          </TouchableOpacity>

          <Text style={localStyles.label}>Data de Check-out:</Text>
          <TouchableOpacity onPress={() => setShowPicker('checkout')} style={localStyles.datePickerButton}>
            <Text style={localStyles.datePickerButtonText}>{checkOutDate.toLocaleDateString('pt-BR')}</Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              testID={`${showPicker}Picker`}
              value={showPicker === 'checkin' ? checkInDate : checkOutDate}
              mode="date"
              display="default"
              onChange={onChangeDate}
              minimumDate={showPicker === 'checkout' ? new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000) : new Date()}
            />
          )}

          <TouchableOpacity style={localStyles.addButton} onPress={handleSave}>
            <Text style={localStyles.addButtonText}>{isEditing ? "Salvar Alterações" : "Adicionar Hotel"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}