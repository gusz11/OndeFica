import { StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export const darkThemeColors = {
  backgroundPrincipal: '#0B0B0B',
  superficiePrimaria: '#2C2C2E',
  superficieSecundaria: '#191919',
  fundoFooter: '#1c1c1c',
  textoPrimario: 'white',
  textoSecundario: '#ccc',
  textoMuted: '#aaa',
  borda: '#333',
  divisorInterno: '#3a3a3a',
  botaoPrimarioFundo: '#D9D9D9',
  botaoPrimarioTexto: 'black',
  botaoSecundarioFundo: '#2C2C2E',
  textoBotaoAcaoAzul: '#396DDD',
  textoBotaoAcaoVermelho: '#F53232',
  iconeInativo: '#ccc',
  iconeAtivo: 'white',
  sombraIconeAtivo: '#FFFFFF',
};

export const lightThemeColors = {
  backgroundPrincipal: '#F0F2F5', 
  superficiePrimaria: '#FFFFFF',   
  superficieSecundaria: '#E8E8E8',
  fundoFooter: '#FAFAFA',
  textoPrimario: '#1C1C1E',     
  textoSecundario: '#555555',
  textoMuted: '#777777',
  borda: '#DCDCDC',
  divisorInterno: '#E0E0E0',
  botaoPrimarioFundo: '#929292',  
  botaoPrimarioTexto: 'black',
  botaoSecundarioFundo: '#929292', 
  textoBotaoAcaoAzul: '#007AFF',  
  textoBotaoAcaoVermelho: '#FF3B30', 
  iconeInativo: '#777777',
  iconeAtivo: '#929292', 
  sombraIconeAtivo: 'rgba(0,0,0,0.2)', 
};

export const getGlobalStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrincipal,
  },
  scroll: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.superficiePrimaria,
  },
  headerTitle: {
    padding: '8',
    marginTop: '25',
    fontSize: 24,
    fontWeight: '500',
    color: colors.textoPrimario,
  },

 dropdownPickerStyle: { 
    backgroundColor: colors.superficiePrimaria,
    minHeight: 38,
    borderWidth: 0, 
  },

  dropdownContainerStyle: {
    backgroundColor: colors.superficiePrimaria,
    borderColor: colors.borda,
  },
  dropdownTextStyle: { 
    fontSize: 16,
    color: colors.textoPrimario,
  },
  dropdownLabelStyle: {
    color: colors.textoPrimario,
  },
  dropdownListItemLabelStyle: { 
     color: colors.textoPrimario,
  },
  dropdownPlaceholderStyle: {
    color: colors.textoSecundario,
    fontSize: 16,
  },
  dropdownTickIconStyle: {
    tintColor: colors.iconeAtivo, 
  },

  searchRow: {
    marginTop: 8,
    marginHorizontal: 6,
    marginBottom: 4,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
  },
 inputContainerShort: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 5,
    flex: 0.45,
  },
  inputContainerLong: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: colors.superficiePrimaria, 
    borderRadius: 5,
    paddingHorizontal: 10,
    flex: 0.45, 
  },
  searchInput: {
    color: colors.textoPrimario,
    paddingVertical: 8, 
    fontSize: 16,
    flex: 1, 
  },
  card: {
    backgroundColor: colors.superficiePrimaria,
    margin: 6,
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardImage: {
    width: screenWidth * 0.42,          
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 8,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardTopRow: { 
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center', 
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textoPrimario,
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textoSecundario,
    marginVertical: 6,
    textAlign: 'justify', 
    lineHeight: 20, 
    fontWeight: '400'
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 2,
    paddingTop: 8,
    marginTop: 'auto',
  },
  button: { 
    backgroundColor: colors.botaoPrimarioFundo,
    paddingVertical: 4,
    paddingHorizontal: 18,
    borderRadius: 5,
  },
  buttonText: {
    color: colors.botaoPrimarioTexto,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    backgroundColor: colors.fundoFooter, 
    paddingVertical: 15, 
    borderTopWidth: 1, 
    borderTopColor: colors.borda, 
  },
  footerButton: { 
    flex: 1, 
    alignItems: 'center', 
    padding: 5, 
  },
  activeIconShadow: {
    shadowColor: colors.sombraIconeAtivo, 
    shadowOffset: {
      width: 0, 
      height: 0, 
    },
    shadowOpacity: 0.40, 
    shadowRadius: 4.00,
    elevation: 5, 
  },
  footerItem: {
    color: colors.textoSecundario, 
    fontSize: 12, 
    marginTop: 4, 
  },
  scrollViewPadding: { 
    flex: 1,
    paddingHorizontal: 10,
  },

  // Estilos para ProgramacaoScreen
  programacaoScreenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textoPrimario,
    textAlign: 'center',
    marginVertical: 8,
  },
  programacaoActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    paddingVertical: 10,
    width: '100%',
  },
  programacaoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.superficiePrimaria,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  programacaoActionButtonText: {
    color: colors.textoMuted,
    marginRight: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  programacaoSectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textoPrimario,
    marginBottom: 8,
    marginTop: 8,
  },
  programacaoCard: {
    backgroundColor: colors.superficieSecundaria,
    borderRadius: 5,
    padding: 10, 
    marginBottom: 8, 
    flexDirection: 'row', 
    alignItems: 'center', 
  },
  programacaoImageLeft: { 
    width: 100, 
    height: 100, 
    borderRadius: 5,
    marginRight: 10, 
    resizeMode: 'cover', 
  },
  programacaoContentArea: { 
    flex: 1, 
    flexDirection: 'row',
    justifyContent: 'space-between', 
  },
  programacaoTextInfo: { 
    flex: 1, 
    marginRight: 8, 
  },
  programacaoActionsColumn: { 
    flexDirection: 'column',
    justifyContent: 'center', 
  },
  programacaoHotelName: {
    fontSize: 16,
    color: colors.textoPrimario,
    marginBottom: 2,
  },
  programacaoHotelNamePrincipal: {
    fontSize: 18, 
    fontWeight: '400', 
    color: colors.textoPrimario,
    marginBottom: 2,
  },
  programacaoHotelArea: {
    fontSize: 13, 
    color: colors.textoMuted,
  },
  programacaoPontoTime: {
    fontSize: 16,
    fontWeight: '400', 
    color: colors.textoPrimario,
    marginBottom: 2,
  },
  programacaoPontoName: {
    fontSize: 16,
    color: colors.textoPrimario,
    fontWeight: '400', 
    marginBottom: 0,
  },
  programacaoPontoInfo: {
    fontSize: 13, 
    color: colors.textoSecundario,
    marginBottom: 1,
  },
  programacaoEditButton: {
    backgroundColor: colors.botaoSecundarioFundo,
    paddingVertical: 6, 
    paddingHorizontal: 12,
    borderRadius: 5,
    marginBottom: 12,
    minWidth: 110, 
    alignItems: 'center',
  },
  programacaoEditButtonText: {
    color: colors.textoBotaoAcaoAzul,
    fontSize: 12,
    fontWeight: '400',
  },
  programacaoRemoveButton: {
    backgroundColor: colors.botaoSecundarioFundo,
    paddingVertical: 6, 
    paddingHorizontal: 12,
    borderRadius: 5,
    minWidth: 110,
    alignItems: 'center', 
  },
  programacaoRemoveButtonText: {
    color: colors.textoBotaoAcaoVermelho,
    fontSize: 12,
    fontWeight: '400',
  },
  resumoContainer: {
    backgroundColor: colors.superficiePrimaria,
    borderRadius: 5,
    padding: 15,
    marginBottom: 20, 
  },
  resumoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divisorInterno,
  },
  resumoLabel: {
    color: colors.textoSecundario,
    fontSize: 14,
  },
  resumoValueIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resumoValue: {
    color: colors.textoPrimario,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },

  // Estilos para ConfiguracoesScreen
  configScreenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textoPrimario,
    textAlign: 'center',
    marginVertical: 16,
  },
  configOptionButton: {
    backgroundColor: colors.superficiePrimaria,
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  configOptionText: {
    color: colors.textoPrimario,
    fontSize: 16,
  },

  themeSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  themeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 5,
    borderWidth: 1,
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },


  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textoPrimario,
  },
  errorText: {
    fontSize: 18,
    color: colors.textoBotaoAcaoVermelho, 
    textAlign: 'center',
    marginBottom: 8,
  },
  errorTextSmall: {
    fontSize: 14,
    color: colors.textoSecundario,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    color: colors.textoSecundario,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.superficiePrimaria,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.borda,
  },
  retryButtonText: {
    color: colors.textoPrimario,
    fontSize: 16,
    fontWeight: '500',
  },
});