import React, { useContext } from 'react'; 
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons'; 
import { ThemeContext } from '../context/ThemeContext'; 

const getLocalStyles = (colors) => StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.modalBackdrop || 'rgba(0, 0, 0, 0.7)', 
  },
  modalView: {
    width: '100%', 
    maxHeight: '100%',
    backgroundColor: colors.superficiePrimaria,
    paddingTop: 40, 
    paddingHorizontal: 20, 
    paddingBottom: 20, 
    alignItems: 'center',
  },
  scrollViewContent: {
    alignItems: 'center', 
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40, 
    left: 15, 
    padding: 5,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textoPrimario,
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 10, 
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textoPrimario,
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalParagraph: {
    fontSize: 15,
    color: colors.textoSecundario,
    textAlign: 'justify',
    marginBottom: 12,
    lineHeight: 22,
  },
  modalListItem: {
    fontSize: 14,
    color: colors.textoSecundario, 
    marginBottom: 5,
    alignSelf: 'flex-start', 
  },
  modalVersion: {
    fontSize: 12,
    color: colors.textoMuted, 
    marginTop: 20,
    textAlign: 'center',
  }
});

export default function SobreModal({ visible, onClose }) {
  const { theme } = useContext(ThemeContext); 
  const styles = getLocalStyles(theme);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose} 
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Feather name="arrow-left" size={26} color={theme.textoSecundario} />
          </TouchableOpacity>
          
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.modalTitle}>Sobre o "Onde Fica"</Text>
            <Text style={styles.modalParagraph}>
              O "Onde Fica" é uma aplicação móvel destinada a turistas que visitam o Distrito Federal. Nosso objetivo é fornecer informações centralizadas sobre pontos turísticos, monumentos históricos e opções de hospedagem na região.
            </Text>
            <Text style={styles.modalParagraph}>
              Buscamos solucionar a dificuldade que os turistas enfrentam ao planejar suas visitas, devido à dispersão de informações, oferecendo uma plataforma prática e intuitiva para montar roteiros de viagem.
            </Text>
            <Text style={styles.modalParagraph}>
              Este projeto foi desenvolvido como parte de um esforço para enriquecer a experiência turística na capital e valorizar o patrimônio local.
            </Text>

            <Text style={styles.modalSubtitle}>Equipe de Desenvolvimento:</Text>
            <Text style={styles.modalListItem}>• Gustavo Jesus de Souza</Text>
            <Text style={styles.modalListItem}>• Leonardo Louzada de Melo</Text>
            <Text style={styles.modalListItem}>• Leonardo Rodrigues Amorim Filho</Text>
            <Text style={styles.modalListItem}>• Mario Eduardo Pereira de Sousa</Text>
            <Text style={styles.modalListItem}>• Matheus Figueiredo Silva</Text>
            
            <Text style={styles.modalVersion}>Versão do App: 1.0.0 (Desenvolvimento)</Text>
            <Text style={styles.modalVersion}>Documentação do Projeto: Versão &lt;1.3&gt;</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}