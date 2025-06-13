import React, { useContext } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

const getModalLocalStyles = (colors) => StyleSheet.create({
  centeredView: { 
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.modalBackdrop || 'rgba(0,0,0,0.7)'
  },
  modalView: { 
    width: '90%', maxHeight: '80%', backgroundColor: colors.superficiePrimaria,
    borderRadius: 10, paddingVertical: 20, alignItems: 'center', shadowColor: colors.shadow || '#000',
    shadowOffset: {width:0,height:2}, shadowOpacity:0.25, shadowRadius:4, elevation:5,
  },
  closeButton: { position: 'absolute', top: 15, left: 10, padding: 5, zIndex:1 },
  modalTitle: { 
    fontSize: 20, fontWeight: 'bold', color: colors.textoPrimario, 
    marginBottom: 15, textAlign: 'center', paddingHorizontal: 30 
  },
  listItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borda,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemText: {
    fontSize: 16,
    color: colors.textoPrimario,
    flex: 1, 
  },
  listEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listEmptyText: {
    color: colors.textoSecundario, 
    marginTop: 10, 
    textAlign: 'center',
  }
});

export default function AddFromListModal({ visible, onClose, places, isLoading, onItemSelected }) {
  const { theme } = useContext(ThemeContext);
  const localStyles = getModalLocalStyles(theme); 

  const itemsToList = (places || []).map(place => ({ 
    ...place, 
    originalType: 'place' 
  }));

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={localStyles.listItem} 
      onPress={() => onItemSelected(item, item.originalType)} 
    >
      <Text style={localStyles.listItemText}>{item.title}</Text>
      <Feather name="plus-circle" size={24} color={theme.textoSecundario} />
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={localStyles.centeredView}>
        <View style={localStyles.modalView}>
          <TouchableOpacity style={localStyles.closeButton} onPress={onClose}>
            <Feather name="arrow-left" size={26} color={theme.textoSecundario} />
          </TouchableOpacity>
          
          <Text style={localStyles.modalTitle}>Adicionar ao Roteiro</Text>
          
          <FlatList
            data={itemsToList}
            keyExtractor={(item) => item.id.toString()}
            style={{width: '100%'}}
            renderItem={renderItem}
            ListEmptyComponent={() => (
              <View style={localStyles.listEmptyContainer}>
                {isLoading ? (
                  <ActivityIndicator size="large" color={theme.textoPrimario} />
                ) : (
                  <Text style={localStyles.listEmptyText}>
                    Nenhum local disponível para adicionar.
                  </Text>
                )}
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}