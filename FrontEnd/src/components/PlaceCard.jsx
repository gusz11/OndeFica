import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons'; 
import { ThemeContext } from '../context/ThemeContext';
import { getGlobalStyles } from '../styles/styles';

const screenHeight = Dimensions.get('window').height;

export default function PlaceCard({ place, onMoreInfoClick, isInitiallySaved, onToggleFavoriteStatus, onAddToItineraryClick }) {
  const { theme } = useContext(ThemeContext);
  const styles = getGlobalStyles(theme); 

  const [isSaved, setIsSaved] = useState(isInitiallySaved);

  useEffect(() => {
    setIsSaved(isInitiallySaved);
  }, [isInitiallySaved]);

  let dynamicNumberOfLines = 3; 
  if (screenHeight < 680) { 
    dynamicNumberOfLines = 2;
  } else if (screenHeight > 800) { 
    dynamicNumberOfLines = 4;
  }

  const handleToggleSave = () => {
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    if (onToggleFavoriteStatus) {
      onToggleFavoriteStatus(place.id, newSavedState);
    }
  };

  const saveIconColor = isSaved ? theme.iconeAtivo : theme.iconeInativo;

  return (
    <View style={styles.card}>
      <Image 
        source={place.imageUrl ? { uri: place.imageUrl } : require('../assets/placeholder.png')} 
        style={styles.cardImage} 
      />
      <View style={styles.cardContent}> 
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle}>{place.title}</Text>
          <TouchableOpacity onPress={() => onAddToItineraryClick(place)}> 
            <Feather name="plus" size={24} color={theme.textoPrimario} />
          </TouchableOpacity>
        </View>

        <Text 
          style={styles.cardDescription} 
          numberOfLines={dynamicNumberOfLines} 
          ellipsizeMode="tail"
        > 
          {place.description} 
        </Text>

        <View style={styles.cardBottomRow}>
          <TouchableOpacity onPress={handleToggleSave}> 
            <MaterialCommunityIcons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={25} 
              color={saveIconColor} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => onMoreInfoClick(place)} 
          > 
            <Text style={styles.buttonText}>Mais Informações</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}