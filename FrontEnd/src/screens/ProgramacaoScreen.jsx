import React, { useContext, useState, useMemo } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Header from '../components/Header';
import AddDateModal from '../components/AddDateModal';
import AddHotelModal from '../components/AddHotelModal';
import AddFromListModal from '../components/AddFromListModal';
import { ThemeContext } from '../context/ThemeContext';
import { ItineraryContext, useItinerary } from '../context/ItineraryContext';
import { usePreferences } from '../context/PreferencesContext';
import { getGlobalStyles } from '../styles/styles';
import { calculateHaversineDistance } from '../utils/geometry';

const calculateDaysBetween = (dateString1, dateString2) => {
  try {
    const normalizeDate = (ds) => {
      if (!ds) return null;
      const parsedDate = new Date(ds);
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    };
    const d1 = normalizeDate(dateString1);
    const d2 = normalizeDate(dateString2);
    if (!d1 || !d2 || d2 < d1) {
      console.warn("Datas inválidas ou check-out antes de check-in:", { dateString1, dateString2 });
      return 0;
    }
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  } catch (error) {
    console.error("Erro ao calcular dias entre datas:", { dateString1, dateString2, error });
    return 0;
  }
};

export default function ProgramacaoScreen() {
  const { theme } = useContext(ThemeContext);
  const styles = getGlobalStyles(theme);
  const {
    itineraryItems,
    removeFromItinerary,
    updateItineraryItem,
    allPlaces,
    isLoadingAllPlaces,
    addPlaceToItinerary,
    addHotelToItinerary
  } = useItinerary();
  const { distanceUnit } = usePreferences();

  const [addFromListModalVisible, setAddFromListModalVisible] = useState(false);
  const [addDateModalVisible, setAddDateModalVisible] = useState(false);
  const [addHotelModalVisible, setAddHotelModalVisible] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const hotelItineraryItems = itineraryItems.filter(item => item.type === 'hotel');
  const placeItineraryItems = itineraryItems.filter(item => item.type === 'place');

  const sortedPlaceItineraryItems = useMemo(() => {
    return [...placeItineraryItems].sort((a, b) => {
      const normalizeDate = (ds) => {
        if (!ds) return null;
        const parsedDate = new Date(ds);
        return isNaN(parsedDate.getTime()) ? null : parsedDate;
      };
      const dateA = normalizeDate(a.visitDate);
      const dateB = normalizeDate(b.visitDate);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA - dateB;
    });
  }, [placeItineraryItems]);

  const sortedHotelItineraryItems = useMemo(() => {
    return [...hotelItineraryItems].sort((a, b) => {
      const normalizeDate = (ds) => {
        if (!ds) return null;
        const parsedDate = new Date(ds);
        return isNaN(parsedDate.getTime()) ? null : parsedDate;
      };
      const dateA = normalizeDate(a.checkInDate);
      const dateB = normalizeDate(b.checkInDate);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA - dateB;
    });
  }, [hotelItineraryItems]);

  const resumo = useMemo(() => {
    let custoTotal = 0;
    let hasConsultarFee = false;
    placeItineraryItems.forEach(item => {
      const feeString = item.placeDetails?.entryFee || "0";
      let fee = 0;
      if (String(feeString).toLowerCase() === 'gratuita') fee = 0;
      else if (String(feeString).toLowerCase().includes('consultar')) hasConsultarFee = true;
      else {
        const match = String(feeString).match(/(\d+([.,]\d+)?)/);
        if (match) fee = parseFloat(match[0].replace(',', '.')) || 0;
        else hasConsultarFee = true;
      }
      custoTotal += fee * (parseInt(item.numberOfPeople, 10) || 1);
    });
    const custoIngressosStr = hasConsultarFee ? `R$ ${custoTotal.toFixed(2).replace('.', ',')} + Consultar` : `R$ ${custoTotal.toFixed(2).replace('.', ',')}`;

    let minDate = null, maxDate = null;
    const normalizeDate = (ds) => {
      if (!ds) return null;
      const parsedDate = new Date(ds);
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    };

    if (hotelItineraryItems.length > 0) {
      hotelItineraryItems.forEach(item => {
        if (item.checkInDate && item.checkOutDate) {
          const checkIn = normalizeDate(item.checkInDate);
          const checkOut = normalizeDate(item.checkOutDate);
          if (checkIn && !isNaN(checkIn.getTime()) && (!minDate || checkIn < minDate)) minDate = checkIn;
          if (checkOut && !isNaN(checkOut.getTime()) && (!maxDate || checkOut > maxDate)) maxDate = checkOut;
        } else {
          console.warn("Hotel com datas ausentes ou inválidas:", item);
        }
      });
    }
    if (placeItineraryItems.length > 0) {
      placeItineraryItems.forEach(item => {
        if (item.visitDate) {
          const visitDate = normalizeDate(item.visitDate);
          if (visitDate && !isNaN(visitDate.getTime())) {
            if (!minDate || visitDate < minDate) minDate = visitDate;
            if (!maxDate || visitDate > maxDate) maxDate = visitDate;
          } else {
            console.warn("Ponto turístico com data de visita inválida:", item);
          }
        }
      });
    }

    const diasDeTurismo = (minDate && maxDate) ? calculateDaysBetween(
      minDate.toISOString().split('T')[0],
      maxDate.toISOString().split('T')[0]
    ) : 0;

    let distanciaTotalKm = 0;
    const sortedForDistance = [...itineraryItems].sort((a, b) => {
      const dateA = normalizeDate(a.visitDate || a.checkInDate);
      const dateB = normalizeDate(b.visitDate || b.checkInDate);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA - dateB;
    });
    for (let i = 0; i < sortedForDistance.length - 1; i++) {
      const itemAtual = sortedForDistance[i].placeDetails;
      const itemProximo = sortedForDistance[i + 1].placeDetails;
      if (
        itemAtual?.latitude && itemAtual?.longitude &&
        itemProximo?.latitude && itemProximo?.longitude &&
        !isNaN(parseFloat(itemAtual.latitude)) && !isNaN(parseFloat(itemAtual.longitude)) &&
        !isNaN(parseFloat(itemProximo.latitude)) && !isNaN(parseFloat(itemProximo.longitude))
      ) {
        const dist = calculateHaversineDistance(
          parseFloat(itemAtual.latitude),
          parseFloat(itemAtual.longitude),
          parseFloat(itemProximo.latitude),
          parseFloat(itemProximo.longitude)
        );
        if (dist !== null && !isNaN(dist)) {
          distanciaTotalKm += dist;
        } else {
          console.warn("Distância inválida calculada entre:", {
            itemAtual: itemAtual.title || itemAtual.name,
            itemProximo: itemProximo.title || itemProximo.name,
          });
        }
      } else {
        console.warn("Coordenadas ausentes ou inválidas para:", {
          itemAtual: itemAtual?.title || itemAtual?.name,
          itemProximo: itemProximo?.title || itemProximo?.name,
          coordsAtual: { lat: itemAtual?.latitude, lng: itemAtual?.longitude },
          coordsProximo: { lat: itemProximo?.latitude, lng: itemProximo?.longitude },
        });
      }
    }
    let distanciaStr = `${distanciaTotalKm.toFixed(1).replace('.', ',')} km (aprox.)`;
    if (distanceUnit === 'miles') {
      const distanciaMilhas = distanciaTotalKm * 0.621371;
      distanciaStr = `${distanciaMilhas.toFixed(1).replace('.', ',')} mi (aprox.)`;
    }

    return {
      custoIngressos: custoIngressosStr,
      diasTurismo: `${diasDeTurismo} Dia(s)`,
      distanciaPercorrida: distanciaStr,
    };
  }, [itineraryItems, distanceUnit]);

  const handleOpenAddFromListModal = () => setAddFromListModalVisible(true);
  const handleItemSelectedFromList = (itemData, itemType) => {
    setAddFromListModalVisible(false);
    setIsEditing(false);
    setSelectedItemForModal({ itemData, type: itemType });
    if (itemType === 'place') setAddDateModalVisible(true);
    else if (itemType === 'hotel') setAddHotelModalVisible(true);
  };
  const handleCloseAddDateModal = () => {
    setAddDateModalVisible(false);
    setSelectedItemForModal(null);
    setIsEditing(false);
  };
  const handleCloseAddHotelModal = () => {
    setAddHotelModalVisible(false);
    setSelectedItemForModal(null);
    setIsEditing(false);
  };
  const handleEditItem = (item) => {
    setIsEditing(true);
    setSelectedItemForModal({ itemData: item.placeDetails, type: item.type, itineraryItemId: item.id, existingData: item });
    if (item.type === 'place') setAddDateModalVisible(true);
    else if (item.type === 'hotel') setAddHotelModalVisible(true);
  };
  const handleRemoveItem = (itemId, itemName) => {
    Alert.alert("Remover Item", `Tem certeza que deseja remover "${itemName}" da sua programação?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => removeFromItinerary(itemId) }
    ]);
  };
  const handleUpdateItinerary = (originalItemId, itemDetails, date1, date2_or_people) => {
    let updatedDataFields;
    if (selectedItemForModal?.type === 'place') updatedDataFields = { visitDate: date1, numberOfPeople: date2_or_people };
    else if (selectedItemForModal?.type === 'hotel') updatedDataFields = { checkInDate: date1, checkOutDate: date2_or_people };
    if (updatedDataFields && originalItemId) updateItineraryItem(originalItemId, updatedDataFields);
    if (selectedItemForModal?.type === 'place') handleCloseAddDateModal();
    else if (selectedItemForModal?.type === 'hotel') handleCloseAddHotelModal();
  };

  const generatePdfHtml = () => {
    const styles = `body{font-family:sans-serif;color:#333}.header{text-align:center;border-bottom:2px solid #eee;padding-bottom:10px;margin-bottom:20px}.header h1{color:#1a1a1a;margin:0}.section{margin-top:20px}.section-title{font-size:1.5em;color:#333;border-bottom:1px solid #ccc;padding-bottom:5px;margin-bottom:10px}.item{border:1px solid #ddd;border-radius:8px;padding:15px;margin-bottom:15px;page-break-inside:avoid}.item-title{font-size:1.2em;font-weight:bold;margin-top:0}.item-info{margin:5px 0}.summary-table{width:100%;border-collapse:collapse;margin-top:20px}.summary-table td{padding:8px;border:1px solid #ddd}.summary-table .label{font-weight:bold}`;
    const hotelsHtml = sortedHotelItineraryItems.map(item =>
      `<div class="item">
        <h3 class="item-title">${item.placeDetails.title}</h3>
        <p class="item-info"><strong>Check-in:</strong> ${item.checkInDate}</p>
        <p class="item-info"><strong>Check-out:</strong> ${item.checkOutDate}</p>
        <p class="item-info">${item.placeDetails.formatted_address || ''}</p>
      </div>`
    ).join('');
    const placesHtml = sortedPlaceItineraryItems.map(item =>
      `<div class="item">
        <h3 class="item-title">${item.placeDetails.title}</h3>
        <p class="item-info"><strong>Data da Visita:</strong> ${item.visitDate}</p>
        <p class="item-info"><strong>Pessoas:</strong> ${item.numberOfPeople}</p>
        <p class="item-info"><strong>Entrada:</strong> ${item.placeDetails.entryFee}</p>
      </div>`
    ).join('');
    return `
      <html>
        <head>
          <style>${styles}</style>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        </head>
        <body>
          <div class="header">
            <h1>OndeFica - Sua Programação</h1>
            <p>Roteiro de Viagem para Brasília</p>
          </div>
          ${hotelsHtml ? `<div class="section"><h2 class="section-title">Hospedagem</h2>${hotelsHtml}</div>` : ''}
          ${placesHtml ? `<div class="section"><h2 class="section-title">Pontos Turísticos</h2>${placesHtml}</div>` : ''}
          <div class="section">
            <h2 class="section-title">Resumo da Programação</h2>
            <table class="summary-table">
              <tr><td class="label">Custo Estimado (Ingressos):</td><td>${resumo.custoIngressos}</td></tr>
              <tr><td class="label">Total de Dias na Programação:</td><td>${resumo.diasTurismo}</td></tr>
              <tr><td class="label">Distância Estimada (Percurso):</td><td>${resumo.distanciaPercorrida}</td></tr>
            </table>
          </div>
        </body>
      </html>
    `;
  };

  const handleExportPdf = async () => {
    if (itineraryItems.length === 0) {
      Alert.alert("Programação Vazia", "Adicione itens à sua programação antes de exportar.");
      return;
    }
    try {
      const { uri } = await Print.printToFileAsync({ html: generatePdfHtml(), base64: false });
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Erro", "A funcionalidade de compartilhamento não está disponível neste dispositivo.");
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar Programação', UTI: '.pdf' });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível gerar o PDF para compartilhamento.");
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.scrollViewPadding}>
        <Text style={styles.programacaoScreenTitle}>Minha Programação</Text>
        <View style={styles.programacaoActionRow}>
          <TouchableOpacity style={styles.programacaoActionButton} onPress={handleExportPdf}>
            <Text style={styles.programacaoActionButtonText}>Exportar</Text>
            <Feather name="share-2" size={19} color={theme.textoMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.programacaoActionButton} onPress={handleOpenAddFromListModal}>
            <Text style={styles.programacaoActionButtonText}>Adicionar</Text>
            <Feather name="plus" size={23} color={theme.textoMuted} />
          </TouchableOpacity>
        </View>

        {sortedHotelItineraryItems.length > 0 && (
          <>
            <Text style={styles.programacaoSectionTitle}>Hospedagem</Text>
            {sortedHotelItineraryItems.map(item => (
              <View key={item.id} style={styles.programacaoCard}>
                <Image
                  source={item.placeDetails.imageUrl ? { uri: item.placeDetails.imageUrl } : require('../assets/placeholder.png')}
                  style={styles.programacaoImageLeft}
                />
                <View style={styles.programacaoContentArea}>
                  <View style={styles.programacaoTextInfo}>
                    <Text style={[styles.programacaoHotelNamePrincipal, { fontSize: 18, fontWeight: 'bold' }]}>
                      {item.placeDetails.title}
                    </Text>
                    <Text style={styles.programacaoPontoName}>{item.title}</Text>
                    <Text style={styles.programacaoHotelName}>Check-in: {item.checkInDate}</Text>
                    <Text style={styles.programacaoHotelName}>Check-out: {item.checkOutDate}</Text>
                  </View>
                  <View style={styles.programacaoActionsColumn}>
                    <TouchableOpacity style={styles.programacaoEditButton} onPress={() => handleEditItem(item)}>
                      <Text style={styles.programacaoEditButtonText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.programacaoRemoveButton} onPress={() => handleRemoveItem(item.id, item.placeDetails.title)}>
                      <Text style={styles.programacaoRemoveButtonText}>Remover</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {sortedPlaceItineraryItems.length > 0 && (
          <>
            <Text style={styles.programacaoSectionTitle}>Pontos Turísticos</Text>
            {sortedPlaceItineraryItems.map((item) => {
              const ponto = item.placeDetails;
              return (
                <View key={item.id} style={styles.programacaoCard}>
                  <Image
                    source={ponto.imageUrl ? { uri: ponto.imageUrl } : require('../assets/placeholder.png')}
                    style={styles.programacaoImageLeft}
                  />
                  <View style={styles.programacaoContentArea}>
                    <View style={styles.programacaoTextInfo}>
                      <Text style={styles.programacaoPontoTime}>Data: {item.visitDate}</Text>
                      <Text style={styles.programacaoPontoTime}>Pessoas: {item.numberOfPeople}</Text>
                      <Text style={styles.programacaoPontoName}>{ponto.title}</Text>
                      <Text style={styles.programacaoPontoInfo}>Entrada: {ponto.entryFee}</Text>
                    </View>
                    <View style={styles.programacaoActionsColumn}>
                      <TouchableOpacity style={styles.programacaoEditButton} onPress={() => handleEditItem(item)}>
                        <Text style={styles.programacaoEditButtonText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.programacaoRemoveButton} onPress={() => handleRemoveItem(item.id, ponto.title)}>
                        <Text style={styles.programacaoRemoveButtonText}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {itineraryItems.length === 0 && (
          <View style={[styles.centeredMessageContainer, { marginVertical: 30 }]}>
            <Text style={styles.infoText}>Sua programação está vazia.</Text>
            <Text style={styles.infoText}>Use os ícones '+' nos locais ou o botão "Adicionar" acima.</Text>
          </View>
        )}

        {itineraryItems.length > 0 && (
          <>
            <Text style={styles.programacaoSectionTitle}>Resumo da Programação</Text>
            <View style={styles.resumoContainer}>
              <View style={styles.resumoItem}>
                <Text style={styles.resumoLabel}>Custo Estimado (Ingressos):</Text>
                <View style={styles.resumoValueIcon}>
                  <Text style={styles.resumoValue}>{resumo.custoIngressos}</Text>
                  <MaterialCommunityIcons name="wallet-outline" size={24} color={theme.textoSecundario} />
                </View>
              </View>
              <View style={styles.resumoItem}>
                <Text style={styles.resumoLabel}>Total de Dias na Programação:</Text>
                <View style={styles.resumoValueIcon}>
                  <Text style={styles.resumoValue}>{resumo.diasTurismo}</Text>
                  <MaterialCommunityIcons name="calendar-check-outline" size={24} color={theme.textoSecundario} />
                </View>
              </View>
              <View style={[styles.resumoItem, { borderBottomWidth: 0 }]}>
                <Text style={styles.resumoLabel}>Distância Estimada (Percurso):</Text>
                <View style={styles.resumoValueIcon}>
                  <Text style={styles.resumoValue}>{resumo.distanciaPercorrida}</Text>
                  <MaterialCommunityIcons name="map-marker-distance" size={24} color={theme.textoSecundario} />
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {selectedItemForModal && selectedItemForModal.type === 'place' && (
        <AddDateModal
          visible={addDateModalVisible}
          onClose={handleCloseAddDateModal}
          place={selectedItemForModal.itemData}
          onAddToItinerary={isEditing ? (place, visitDate, numberOfPeople) => handleUpdateItinerary(selectedItemForModal.itineraryItemId, place, visitDate, numberOfPeople) : addPlaceToItinerary}
          isEditing={isEditing}
          initialDate={isEditing ? selectedItemForModal.existingData?.visitDate : undefined}
          initialPeople={isEditing ? selectedItemForModal.existingData?.numberOfPeople?.toString() : '1'}
        />
      )}
      {selectedItemForModal && selectedItemForModal.type === 'hotel' && (
        <AddHotelModal
          visible={addHotelModalVisible}
          onClose={handleCloseAddHotelModal}
          hotel={selectedItemForModal.itemData}
          onAddHotelToItinerary={isEditing ? (hotel, checkIn, checkOut) => handleUpdateItinerary(selectedItemForModal.itineraryItemId, hotel, checkIn, checkOut) : addHotelToItinerary}
          isEditing={isEditing}
          initialCheckInDate={isEditing && selectedItemForModal.existingData?.checkInDate ? selectedItemForModal.existingData.checkInDate : undefined}
          initialCheckOutDate={isEditing && selectedItemForModal.existingData?.checkOutDate ? selectedItemForModal.existingData.checkOutDate : undefined}
          itineraryItemId={isEditing ? selectedItemForModal.itineraryItemId : null}
        />
      )}

      <AddFromListModal
        visible={addFromListModalVisible}
        onClose={() => setAddFromListModalVisible(false)}
        places={allPlaces}
        isLoading={isLoadingAllPlaces}
        onItemSelected={handleItemSelectedFromList}
      />
    </View>
  );
}