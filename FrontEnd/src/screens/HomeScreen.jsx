import React, { useState, useEffect, useContext, useMemo } from 'react';
import { View, ScrollView, TextInput, ActivityIndicator, Text, TouchableOpacity, Platform } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Header from '../components/Header';
import PlaceCard from '../components/PlaceCard';
import PlaceDetailOverlay from '../components/PlaceDatailOverlay';
import AddDateModal from '../components/AddDateModal';
import AddHotelModal from '../components/AddHotelModal';
import { ThemeContext } from '../context/ThemeContext';
import { ItineraryContext, useItinerary } from '../context/ItineraryContext';
import { getGlobalStyles } from '../styles/styles';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';


const formatTypeLabel = (type) => {
  const traducoes = {
    tourist_attraction: 'Atração Turística', museum: 'Museu', park: 'Parque',
    church: 'Igreja', art_gallery: 'Galeria de Arte', stadium: 'Estádio',
    amusement_park: 'Parque de Diversões', zoo: 'Zoológico',
  };
  const formatted = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return traducoes[type.toLowerCase()] || formatted;
};

export default function HomeScreen() {
  const { theme, themeMode } = useContext(ThemeContext); 
  const styles = getGlobalStyles(theme);


  const { 
    allPlaces, 
    isLoadingAllPlaces, 
    errorAllPlaces, 
    fetchAllPlacesAPI, 
    addPlaceToItinerary, 
    addHotelToItinerary 
  } = useItinerary(); 

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPlaceForDetail, setSelectedPlaceForDetail] = useState(null);
  

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [favoritePlaceIds, setFavoritePlaceIds] = useState(new Set());

  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterDropdownItems, setFilterDropdownItems] = useState([]);

  const [addDateModalVisible, setAddDateModalVisible] = useState(false);
  const [placeToAddDate, setPlaceToAddDate] = useState(null);

  const [addHotelModalVisible, setAddHotelModalVisible] = useState(false);
  const [hotelToAdd, setHotelToAdd] = useState(null);
  
  const handleToggleFavoriteStatus = (placeId, isNowFavorite) => {
    setFavoritePlaceIds(prevIds => {
      const newIds = new Set(prevIds);
      if (isNowFavorite) newIds.add(placeId); else newIds.delete(placeId);
      return newIds;
    });
  };
  
  const allAvailableTypes = useMemo(() => {
    const typesSet = new Set();
    if (allPlaces) { 
        allPlaces.forEach(place => {
          if (place.types) {
            place.types.forEach(type => {
              if (!['point_of_interest', 'establishment', 'political', 'locality', 'administrative_area_level_1', 'geocode', 'health', 'finance', 'food', 'store'].includes(type)) {
                typesSet.add(type);
              }
            });
          }
        });
    }
    return Array.from(typesSet).sort().map(type => ({
      label: formatTypeLabel(type),
      value: type,
    }));
  }, [allPlaces]);

  useEffect(() => { 
    const baseItems = [ { label: 'Todos os Locais', value: null }, { label: 'Salvos', value: 'favorites' }];
    setFilterDropdownItems([...baseItems, ...allAvailableTypes]);
  }, [allAvailableTypes]);
  
  const displayedPlaces = useMemo(() => {
    if (!allPlaces) return []; 
    let placesToDisplay = [...allPlaces]; 
    if (activeFilter) {
      if (activeFilter === 'favorites') {
        placesToDisplay = allPlaces.filter(place => favoritePlaceIds.has(place.id));
      } else { 
        placesToDisplay = allPlaces.filter(place => 
          place.types && place.types.includes(activeFilter)
        );
      }
    }
    if (searchQuery.trim() !== '') {
      placesToDisplay = placesToDisplay.filter(place =>
        place.title && place.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return placesToDisplay;
   }, [allPlaces, activeFilter, searchQuery, favoritePlaceIds]);
  
  const handleOpenDetailModal = (place) => {setSelectedPlaceForDetail(place); setDetailModalVisible(true);};
  const handleCloseDetailModal = () => {setDetailModalVisible(false); setSelectedPlaceForDetail(null);};

  const handleOpenAddDateModal = (place) => {setPlaceToAddDate(place); setAddDateModalVisible(true);};
  const handleCloseAddDateModal = () => {setAddDateModalVisible(false); setPlaceToAddDate(null);};

  const handleOpenAddHotelModal = (hotel) => {setHotelToAdd(hotel); setAddHotelModalVisible(true);};
  const handleCloseAddHotelModal = () => {setAddHotelModalVisible(false); setHotelToAdd(null);};

  let currentFilterLabelForPlaceholder = "Filtrar";
  if (activeFilter) {
    const selectedItem = filterDropdownItems.find(item => item.value === activeFilter);
    if (selectedItem) currentFilterLabelForPlaceholder = selectedItem.label;
  }

  if (isLoadingAllPlaces && (!allPlaces || allPlaces.length === 0)) {
    return (
      <View style={[styles.container, styles.centeredMessageContainer]}>
        <ActivityIndicator size="large" color={theme.textoPrimario} />
        <Text style={styles.loadingText}>Carregando locais...</Text>
      </View>
    );
  }
  if (errorAllPlaces) {
    return (
      <View style={[styles.container, styles.centeredMessageContainer]}>
        <Text style={styles.errorText}>Ops! Algo deu errado ao buscar os dados.</Text>
        <Text style={styles.errorTextSmall}>{errorAllPlaces.message}</Text>
        <TouchableOpacity onPress={fetchAllPlacesAPI} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header /> 
      <ScrollView 
        style={styles.scroll} 
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.searchRow, Platform.OS === 'android' ? { zIndex: 1000 } : {}]}> 
            <View style={{flex: styles.inputContainerShort.flex, zIndex: filterDropdownOpen ? 3000 : 1000}}> 
              <DropDownPicker
                open={filterDropdownOpen}
                value={activeFilter}
                items={filterDropdownItems}
                setOpen={setFilterDropdownOpen}
                setValue={setActiveFilter} 
                placeholder={currentFilterLabelForPlaceholder} 
                ArrowDownIconComponent={({style}) => <MaterialCommunityIcons name="filter-variant" size={20} color={theme.textoSecundario} style={style} />}
                ArrowUpIconComponent={({style}) => <MaterialCommunityIcons name="filter-variant-remove" size={20} color={theme.textoSecundario} style={style} />}
                style={styles.dropdownPickerStyle}
                dropDownContainerStyle={styles.dropdownContainerStyle}
                textStyle={styles.dropdownTextStyle}
                placeholderStyle={[styles.dropdownPlaceholderStyle, {color: activeFilter ? theme.textoPrimario : theme.textoSecundario}]}
                listItemLabelStyle={styles.dropdownListItemLabelStyle}
                listMode={Platform.OS === 'ios' ? "SCROLLVIEW" : "MODAL"}
                theme={themeMode === 'dark' ? "DARK" : "LIGHT"} 
                zIndex={filterDropdownOpen ? 3000 : 1000} 
                zIndexInverse={1000}
                dropDownDirection="BOTTOM"
              />
            </View>
            
            <View style={styles.inputContainerLong}>
                <TextInput 
                  placeholder="Pesquise Aqui"
                  placeholderTextColor={theme.textoSecundario}
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <Feather name="search" size={20} color={theme.textoSecundario} />
            </View>
        </View>

        {isLoadingAllPlaces && allPlaces && allPlaces.length > 0 && <ActivityIndicator style={{marginTop: 20}} size="small" color={theme.textoPrimario} />}
        
        {!isLoadingAllPlaces && !errorAllPlaces && displayedPlaces.length === 0 && (
            <View style={styles.centeredMessageContainer}>
                <Text style={styles.infoText}>Nenhum ponto turístico encontrado com os filtros aplicados.</Text>
            </View>
        )}
        {!isLoadingAllPlaces && !errorAllPlaces && displayedPlaces.length > 0 && displayedPlaces.map((place) => (
          <PlaceCard 
              key={place.id} 
              place={place} 
              onMoreInfoClick={handleOpenDetailModal}
              isInitiallySaved={favoritePlaceIds.has(place.id)}
              onToggleFavoriteStatus={handleToggleFavoriteStatus}
              onAddToItineraryClick={handleOpenAddDateModal}
          />
        ))}
      </ScrollView>

      {selectedPlaceForDetail && (
        <PlaceDetailOverlay 
            place={selectedPlaceForDetail}
            visible={detailModalVisible}
            onClose={handleCloseDetailModal}
            onAddToItineraryClick={handleOpenAddDateModal} 
            onAddHotelToItineraryClick={handleOpenAddHotelModal}
        />
      )}

      {placeToAddDate && (
        <AddDateModal
          visible={addDateModalVisible}
          onClose={handleCloseAddDateModal}
          place={placeToAddDate}
          onAddToItinerary={addPlaceToItinerary}
        />
      )}

      {hotelToAdd && (
        <AddHotelModal
          visible={addHotelModalVisible}
          onClose={handleCloseAddHotelModal}
          hotel={hotelToAdd}
          onAddHotelToItinerary={addHotelToItinerary}
        />
      )}
    </View>
  );
}