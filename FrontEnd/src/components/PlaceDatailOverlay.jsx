import React, { useContext } from 'react';
import { View, Text, Modal, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions, Platform, Linking, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { ThemeContext } from '../context/ThemeContext'; 
import { usePreferences } from '../context/PreferencesContext'; 
import { getGlobalStyles } from '../styles/styles';

const screenWidth = Dimensions.get('window').width;

const getLocalStyles = (colors, place) => StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.modalBackdrop || 'rgba(0, 0, 0, 0.8)',
  },
  modalView: {
    backgroundColor: colors.backgroundPrincipal, 
    borderRadius: 5,
    alignItems: 'center',
    shadowColor: colors.shadow || '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '100%', 
    height: '100%', 
    overflow: 'hidden', 
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'ios' ? 40 : 15, 
    paddingBottom: 10,
    marginBottom: 10,
    backgroundColor: colors.superficiePrimaria, 
  },
  headerTitle: {
    color: colors.textoPrimario, 
    fontSize: 18,
    fontWeight: '500',
    flex: 1, 
    textAlign: 'center',
    marginHorizontal: 10,
  },
  scrollViewContent: {
    width: '100%',
    paddingHorizontal: 8,
    paddingBottom: 8, 
  },
  modalImage: {
    width: '100%',
    height: 215,
    borderRadius: 2,
    marginBottom: 15,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textoSecundario, 
    textAlign: 'justify',
    marginBottom: 8,
  },
  boxImage: {
    backgroundColor: colors.superficiePrimaria,
    marginBottom: 8,
    borderRadius: 5,
    padding: 10,
  },
  infoContainer: { 
    width: '100%',
    marginBottom: 8, 
  },
  infoRowVertical: { 
    flexDirection: 'row',         
    justifyContent: 'space-between', 
    alignItems: 'center',         
    backgroundColor: colors.superficieSecundaria,
    padding: 12,                
    borderRadius: 5,              
    marginBottom: 8,              
    width: '100%',                
  },
  infoLabel: {
    fontSize: 16, 
    fontWeight: '600',
    color: colors.textoPrimario,
  },
  infoValue: { 
    fontSize: 14, 
    color: colors.textoPrimario,
    fontWeight: '400',
    textAlign: 'right',
    flex: 1, 
  },
  sectionTitle: {
    fontSize: 20, 
    fontWeight: '400',
    color: colors.textoPrimario,
    marginBottom: 10, 
    alignSelf: 'flex-start',
  },
  phoneContainer: { 
    width: '100%',
    paddingVertical: 10, 
    paddingHorizontal: 5, 
    borderRadius: 5,
    flexDirection: 'row', 
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 16, 
    color: colors.textoPrimario,
    marginLeft: 10, 
    flexShrink: 1,
  },
  boxInfo: {
    backgroundColor: colors.superficiePrimaria,
    padding: 10,
    borderRadius: 5,
    marginBottom: 8, 
  },
  boxLocal: {
    borderRadius: 5,
    padding: 10,
    marginTop: 8,
    backgroundColor: colors.superficiePrimaria,
    marginBottom: 8, 
  },
  boxGrade: { 
    flexDirection: 'row',
    marginBottom: 10, 
    height: (place && place.latitude && place.longitude) ? 224 : 'auto',
  },
  mapViewContainer: { 
    width: '60%', 
    height: '100%', 
    borderRadius: 5,
    overflow: 'hidden', 
    backgroundColor: colors.superficieSecundaria, 
  },
  map: { 
    ...StyleSheet.absoluteFillObject, 
  },
  mapInfo: { 
    backgroundColor: colors.superficieSecundaria, 
    marginLeft: 10,
    flex: 1, 
    padding: 10, 
    borderRadius: 5,
    justifyContent: 'space-around', 
    height: '120%', 
  },
  mapInfoText: {
    fontSize: 13, 
    color: colors.textoSecundario, 
    fontWeight: '500',
    textAlign: 'left',
    marginBottom: 4, 
  },
  findRouteButtonIcon: {
    marginRight: 8,
  },
  boxHotel: {
    borderRadius: 5,
    padding: 10,
    marginTop: 8,
    backgroundColor: colors.superficiePrimaria,
  },
  hotelCard: {
    backgroundColor: colors.superficieSecundaria,
    padding: 8, 
    borderRadius: 5,
    marginBottom: 8,
    width: '100%',
    flexDirection: 'row', 
    alignItems: 'center', 
  },
  hotelImage: { 
    width: screenWidth < 380 ? 60 : 70,
    height: screenWidth < 380 ? 60 : 70,
    borderRadius: 5, 
    marginRight: 10, 
  },
  hotelDetailsContainer: { 
    flex: 1, 
    flexDirection: 'column', 
  },
  hotelTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
    width: '100%',
    marginBottom: 8, 
  },
  hotelBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
    width: '100%',
  },
  hotelName: { 
    color: colors.textoPrimario,
    fontSize: screenWidth < 380 ? 14 : 16,
    fontWeight: 'bold',
    flex: 1, 
    marginRight: 5, 
  },
  hotelInfo: { 
    color: colors.textoSecundario,
    fontSize: screenWidth < 380 ? 11 : 12,
    flexShrink: 1, // Permite que o texto quebre se for muito longo
    marginRight: 5, // Espaço antes do botão
  },
  hotelButton: { 
    backgroundColor: colors.superficiePrimaria, 
    paddingVertical: screenWidth < 380 ? 5 : 7,
    paddingHorizontal: screenWidth < 380 ? 10 : 12,
    borderRadius: 5,
  },
  hotelButtonText: { 
    color: colors.textoPrimario, 
    fontSize: screenWidth < 380 ? 11 : 12,
  },
});

export default function PlaceDetailOverlay({ place, visible, onClose, onAddToItineraryClick, onAddHotelToItineraryClick }) {
  const { theme } = useContext(ThemeContext);
  const { distanceUnit } = usePreferences(); 
  const localStyles = getLocalStyles(theme, place); 
  const styles = getGlobalStyles(theme); 

  if (!place) return null;

  const initialRegion = (place.latitude && place.longitude) ? {
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    latitudeDelta: 0.005, 
    longitudeDelta: 0.005,
  } : null;

  const handleOpenMaps = () => {
    if (!place || !place.latitude || !place.longitude) {
      Alert.alert("Localização Indisponível", "As coordenadas para este local não estão disponíveis.");
      return;
    }
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${place.latitude},${place.longitude}`;
    const label = place.title;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    Linking.openURL(url).catch(err => {
        console.error("Não foi possível abrir o app de mapas", err);
        Alert.alert("Erro", "Não foi possível abrir o aplicativo de mapas.");
    });
  };

  const handleCallPhoneNumber = (phoneNumber) => {
    if (phoneNumber) {
      let Sphone = phoneNumber.replace(/\D/g, '');
      Linking.openURL(Platform.OS === 'android' ? `tel:${Sphone}`: `telprompt:${Sphone}`)
        .catch(err => Alert.alert("Erro", "Não foi possível realizar a chamada."));
    } else {
      Alert.alert("Telefone Indisponível", "O número de telefone para este local não está disponível.");
    }
  };

  const handleOpenHotelWebsite = (websiteUrl) => {
    if (websiteUrl) {
      const fullUrl = websiteUrl.startsWith('http://') || websiteUrl.startsWith('https://') ? websiteUrl : `https://${websiteUrl}`;
      Linking.openURL(fullUrl).catch(err => {
        console.error("Não foi possível abrir o site do hotel", err, "URL:", fullUrl);
        Alert.alert("Erro", "Não foi possível abrir o site do hotel.");
      });
    } else {
      Alert.alert("Site Indisponível", "O site para este hotel não está disponível.");
    }
  };

  const formatHotelDistance = (distanceStr) => {
    if (!distanceStr || typeof distanceStr !== 'string') return "N/A";
    if (distanceUnit === 'miles') {
        const kmValue = parseFloat(distanceStr.replace('km', '').replace(',', '.'));
        if (!isNaN(kmValue)) {
            const milesValue = kmValue * 0.621371;
            return `${milesValue.toFixed(1).replace('.', ',')} mi`;
        }
    }
    return distanceStr;
  };


  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={localStyles.centeredView}>
        <View style={localStyles.modalView}> 
          <View style={localStyles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Feather name="arrow-left" size={28} color={theme.textoPrimario} />
            </TouchableOpacity>
            <Text style={localStyles.headerTitle}>{place.title}</Text> 
            <TouchableOpacity onPress={() => onAddToItineraryClick(place)}> 
              <Feather name="plus" size={28} color={theme.textoPrimario} />
            </TouchableOpacity>
          </View>
          <ScrollView style={localStyles.scrollViewContent}> 
            <View style={localStyles.boxImage}>
              <Image 
                source={place.imageUrl ? { uri: place.imageUrl } : require('../assets/placeholder.png')} 
                style={localStyles.modalImage} 
              />
              <Text style={localStyles.modalDescription}>{place.longDescription || place.description}</Text>
            </View>
            
            <View style={localStyles.boxInfo}>
  <View style={localStyles.infoContainer}>
    <View style={localStyles.infoRowVertical}>
      <Text style={localStyles.infoLabel}>Capacidade:</Text>
      <Text style={localStyles.infoValue}>{place.capacity || "N/D"}</Text>
    </View>
    <View style={localStyles.infoRowVertical}>
      <Text style={localStyles.infoLabel}>Entrada:</Text>
      <Text style={localStyles.infoValue}>{place.entryFee || "N/D"}</Text>
    </View>
    <View style={localStyles.infoRowVertical}>
      <Text style={localStyles.infoLabel}>Horários:</Text>
      <Text style={localStyles.infoValue}>{place.hours || "N/D"}</Text>
    </View>
    {place.phone_number && (
      <View style={localStyles.infoRowVertical}>
        <Text style={localStyles.infoLabel}>Telefone:</Text>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center' }}
          onPress={() => handleCallPhoneNumber(place.phone_number)}
        >
          <FontAwesome name="phone" size={20} color={theme.textoPrimario} />
          <Text style={localStyles.phoneText}>{place.phone_number}</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
</View>             
            <View style={localStyles.boxLocal}>
              <Text style={localStyles.sectionTitle}>Localização</Text> 
              <View style={localStyles.boxGrade}> 
                {initialRegion ? (
                  <View style={localStyles.mapViewContainer}>
                    <MapView style={localStyles.map} initialRegion={initialRegion} mapType={theme.mapType || (Platform.OS === 'ios' ? "mutedStandard" : "standard")}>
                      <Marker coordinate={initialRegion} title={place.title} description={place.formatted_address}/>
                    </MapView>
                  </View>
                ) : (
                  <View style={[localStyles.mapViewContainer, { justifyContent: 'center', alignItems: 'center'}]}>
                    {place.locationImageUrl ? <Image source={{uri: place.locationImageUrl}} style={{width: '100%', height: '100%', resizeMode: 'contain'}} /> : <Text style={{color: theme.textoSecundario}}>Mapa indisponível</Text>}
                  </View>
                )}
                <View style={localStyles.mapInfo}>
                  <Text style={localStyles.mapInfoText}>Você está visualizando a região de {place.title}.</Text>
                  <Text style={localStyles.mapInfoText}>Você pode clicar sobre os pontos do mapa para traçar rotas personalizadas.</Text>
                  <Text style={localStyles.mapInfoText}>Use o botão 'Encontrar melhor rota' para ver o caminho ideal a partir da sua localização atual.</Text>
                </View>
              </View> 
              <TouchableOpacity 
                style={[styles.button, { alignSelf: 'auto', width: '60%', marginTop: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
                onPress={handleOpenMaps}
              >
                  <Text style={styles.buttonText}>Encontrar melhor rota</Text>
                  <MaterialCommunityIcons name="play" size={20} color={styles.buttonText.color} top={1} marginLeft={2} style={localStyles.findRouteButtonIcon} />
              </TouchableOpacity>
            </View>

              <View style={localStyles.boxHotel}>
              <Text style={localStyles.sectionTitle}>Hotéis na Proximidade</Text>
              {place.hotels && place.hotels.map((hotel, index) => (
                <View key={hotel.id || index} style={localStyles.hotelCard}>
                    <Image source={hotel.imageUrl ? { uri: hotel.imageUrl } : require('../assets/placeholder.png')} style={localStyles.hotelImage} />
                    <View style={localStyles.hotelDetailsContainer}>
                      <View style={localStyles.hotelTopRow}>
                          <Text style={localStyles.hotelName}>{hotel.name || "Hotel Desconhecido"}</Text>
                          <TouchableOpacity onPress={() => onAddHotelToItineraryClick(hotel)}><Feather name="plus" size={24} color={theme.textoPrimario} /></TouchableOpacity>
                      </View>
                      <View style={localStyles.hotelBottomRow}>
                          <Text style={localStyles.hotelInfo}>Distância: {formatHotelDistance(hotel.distance)} - Nota: {hotel.rating || "N/A"}</Text>
                          <TouchableOpacity style={localStyles.hotelButton} onPress={() => handleOpenHotelWebsite(hotel.website)}><Text style={localStyles.hotelButtonText}>Acessar Site</Text></TouchableOpacity>
                      </View>
                    </View>
                </View>
              ))}
               {(!place.hotels || place.hotels.length === 0) && (
                <Text style={{color: theme.textoSecundario, textAlign: 'center', paddingVertical: 10}}>Nenhum hotel próximo encontrado.</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}