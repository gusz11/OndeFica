import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ItineraryContext = createContext();

const API_URL_PLACES = 'http://192.168.0.3:8000/api/pontos';
const ITINERARY_STORAGE_KEY = '@OndeFica:itineraryItems';

export const ItineraryProvider = ({ children }) => {
  const [itineraryItems, setItineraryItems] = useState([]);
  const [allPlaces, setAllPlaces] = useState([]);
  const [isLoadingAllPlaces, setIsLoadingAllPlaces] = useState(true);
  const [errorAllPlaces, setErrorAllPlaces] = useState(null);

  const isInitialMount = useRef(true);

  const loadItineraryFromStorage = async () => {
    try {
      const storedItinerary = await AsyncStorage.getItem(ITINERARY_STORAGE_KEY);
      if (storedItinerary !== null) {
        const parsed = JSON.parse(storedItinerary);
        console.log(
          "Itinerário carregado do AsyncStorage:",
          parsed.map(item => ({
            id: item.id,
            type: item.type,
            title: item.placeDetails?.title || item.placeDetails?.name,
            latitude: item.placeDetails?.latitude,
            longitude: item.placeDetails?.longitude,
            checkInDate: item.checkInDate,
            checkOutDate: item.checkOutDate,
            visitDate: item.visitDate,
          }))
        );
        setItineraryItems(parsed);
      } else {
        console.log("Nenhum itinerário encontrado no AsyncStorage.");
      }
    } catch (e) {
      console.error("Erro ao carregar itinerário do AsyncStorage:", e);
    }
  };

  const saveItineraryToStorage = async (items) => {
    try {
      await AsyncStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(items));
      console.log("Itinerário salvo no AsyncStorage.");
    } catch (e) {
      console.error("Erro ao salvar itinerário no AsyncStorage:", e);
    }
  };

  const fetchAllPlacesAPI = async () => {
    setIsLoadingAllPlaces(true);
    setErrorAllPlaces(null);
    try {
      const response = await fetch(API_URL_PLACES);
      if (!response.ok) {
        let errorBody = "Resposta não OK";
        try { errorBody = await response.text(); } catch (e) { console.error("Erro ao ler corpo do erro HTTP", e); }
        throw new Error(`Erro HTTP: ${response.status}. Detalhes: ${errorBody}`);
      }
      const responseData = await response.json();
      let places;
      if (Array.isArray(responseData)) {
        places = responseData;
      } else if (responseData && Array.isArray(responseData.data)) {
        places = responseData.data;
      } else {
        throw new Error("Formato de dados inesperado da API (Context).");
      }
      // Normalize latitude and longitude fields
      places = places.map(place => ({
        ...place,
        latitude: place.latitude || place.lat,
        longitude: place.longitude || place.lng,
      }));
      console.log(
        "Dados da API:",
        places.map(place => ({
          title: place.title || place.name,
          latitude: place.latitude,
          longitude: place.longitude,
        }))
      );
      setAllPlaces(places);
    } catch (e) {
      setErrorAllPlaces(e);
      setAllPlaces([]);
    } finally {
      setIsLoadingAllPlaces(false);
    }
  };

  useEffect(() => {
    fetchAllPlacesAPI();
    loadItineraryFromStorage();
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveItineraryToStorage(itineraryItems);
  }, [itineraryItems]);

  const addPlaceToItinerary = (place, visitDate, numberOfPeople) => {
    const newItem = {
      id: `place-${place.id}-${Date.now()}-${Math.random()}`,
      placeDetails: { ...place, latitude: place.latitude || place.lat, longitude: place.longitude || place.lng },
      visitDate: visitDate,
      numberOfPeople: numberOfPeople,
      type: 'place',
    };
    setItineraryItems(prevItems => [...prevItems, newItem]);
    Alert.alert("Sucesso!", `${place.title} foi adicionado à sua programação.`);
  };

  const addHotelToItinerary = (hotel, checkInDate, checkOutDate) => {
    const newItem = {
      id: `hotel-${hotel.id || hotel.name}-${Date.now()}-${Math.random()}`,
      placeDetails: { ...hotel, latitude: hotel.latitude || hotel.lat, longitude: hotel.longitude || hotel.lng },
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      type: 'hotel',
    };
    setItineraryItems(prevItems => [...prevItems, newItem]);
    Alert.alert("Sucesso!", `${hotel.name || hotel.title} foi adicionado à sua programação.`);
  };

  const removeFromItinerary = (itemIdToRemove) => {
    let itemRemovedTitle = "Item";
    setItineraryItems(prevItems => {
      const foundItem = prevItems.find(item => item.id === itemIdToRemove);
      if (foundItem) {
        itemRemovedTitle = foundItem.placeDetails.title || foundItem.placeDetails.name;
      }
      return prevItems.filter(item => item.id !== itemIdToRemove);
    });
    Alert.alert("Item Removido", `${itemRemovedTitle} foi removido da programação.`);
  };

  const updateItineraryItem = (itemIdToUpdate, dataToUpdate) => {
    let itemTitleForAlert = "Item";
    setItineraryItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemIdToUpdate) {
          itemTitleForAlert = item.placeDetails.title || item.placeDetails.name || "Item";
          return { ...item, ...dataToUpdate };
        }
        return item;
      })
    );
    Alert.alert("Sucesso!", `${itemTitleForAlert} foi atualizado na sua programação.`);
  };

  const checkForHotelOverlap = (newCheckIn, newCheckOut, existingItemId = null) => {
    const newCiDate = new Date(newCheckIn);
    const newCoDate = new Date(newCheckOut);
    for (const item of itineraryItems) {
      if (item.type === 'hotel' && item.id !== existingItemId) {
        const existingCiDate = new Date(item.checkInDate);
        const existingCoDate = new Date(item.checkOutDate);
        if (newCiDate < existingCoDate && newCoDate > existingCiDate) {
          return true;
        }
      }
    }
    return false;
  };

  return (
    <ItineraryContext.Provider
      value={{
        itineraryItems,
        addPlaceToItinerary,
        addHotelToItinerary,
        removeFromItinerary,
        updateItineraryItem,
        checkForHotelOverlap,
        allPlaces,
        isLoadingAllPlaces,
        errorAllPlaces,
        fetchAllPlacesAPI,
      }}
    >
      {children}
    </ItineraryContext.Provider>
  );
};

export const useItinerary = () => {
  const context = useContext(ItineraryContext);
  if (!context) {
    throw new Error('useItinerary deve ser usado dentro de um ItineraryProvider');
  }
  return context;
};