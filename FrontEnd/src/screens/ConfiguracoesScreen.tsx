import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { usePreferences } from "../context/PreferencesContext";
import { useStyles } from "../styles/styles";
import { useTabContentInset } from "../hooks/useTabContentInset";
import { requestLogin } from "../navigation/root";
import GuestPrompt from "../components/GuestPrompt";
import Header from "../components/Header";
import Icon from "../components/Icon";
import AparenciaModal from "../components/AparenciaModal";
import PreferencesModal from "../components/PreferencesModal";
import SobreModal from "../components/SobreModal";
import UserInfoModal from "../components/UserInfoModal";
import LegacyImportModal from "../components/LegacyImportModal";

const OPTIONS = [
  {
    id: "account",
    title: "Minha conta",
    description: "Seus dados e acesso ao aplicativo",
    icon: "user",
  },
  {
    id: "theme",
    title: "Aparência",
    description: "Escolha como você quer ver a cidade",
    icon: "moon",
  },
  {
    id: "preferences",
    title: "Preferências",
    description: "Unidade de distância do seu roteiro",
    icon: "sliders",
  },
  {
    id: "legacy",
    title: "Recuperar programação antiga",
    description: "Traga os roteiros salvos neste aparelho",
    icon: "archive",
  },
  {
    id: "about",
    title: "Sobre o OndeFica",
    description: "Conheça o aplicativo e seu desenvolvedor",
    icon: "info",
  },
] as const;
type Option = (typeof OPTIONS)[number]["id"];
export default function ConfiguracoesScreen() {
  const tabContentInset = useTabContentInset();
  const { theme, choice } = useTheme();
  const { userData } = useAuth();
  const { distanceUnit } = usePreferences();
  const styles = useStyles(theme);
  const [modal, setModal] = useState<Option | null>(null);
  const props = { visible: true, onClose: () => setModal(null) };
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Header />
      <FlatList
        data={OPTIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 24,
          paddingTop: 12,
          paddingBottom: 32 + tabContentInset,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <View style={{ gap: 24, paddingBottom: 24 }}>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>DO SEU JEITO</Text>
              <Text style={styles.title}>Configurações</Text>
              <Text style={styles.muted}>
                Pequenos ajustes para uma boa viagem.
              </Text>
            </View>
            {!userData && <GuestPrompt />}
            <View style={[styles.panel, styles.row, { flexWrap: "nowrap" }]}>
              <View style={styles.avatar}>
                <Icon name="user" size={24} color={theme.textoPrimario} />
              </View>
              <View style={[styles.flex, { gap: 4 }]}>
                <Text style={styles.subtitle}>
                  {userData?.full_name ?? "Visitante"}
                </Text>
                <Text style={styles.caption} numberOfLines={2}>
                  {userData?.email ?? "Exploração sem login"}
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.title}
            accessibilityHint={item.description}
            onPress={() => {
              if (!userData && (item.id === "account" || item.id === "legacy"))
                requestLogin();
              else setModal(item.id);
            }}
            style={({ pressed }) => [
              styles.settingsRow,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.brandMark}>
              <Icon name={item.icon} color={theme.textoSecundario} />
            </View>
            <View style={[styles.flex, { gap: 4 }]}>
              <Text style={styles.label}>{item.title}</Text>
              <Text style={styles.caption}>
                {item.id === "theme"
                  ? {
                      dark: "Escuro",
                      light: "Claro",
                      system: "Acompanhar o sistema",
                    }[choice]
                  : item.id === "preferences"
                    ? distanceUnit === "km"
                      ? "Distâncias em quilômetros"
                      : "Distâncias em milhas"
                    : item.description}
              </Text>
            </View>
            <Icon name="chevron-right" color={theme.textoMuted} size={18} />
          </Pressable>
        )}
        ListFooterComponent={
          <Text
            style={[styles.caption, { textAlign: "center", paddingTop: 32 }]}
          >
            OndeFica · Feito para descobrir Brasília
          </Text>
        }
      />
      {modal === "account" && <UserInfoModal {...props} />}
      {modal === "theme" && <AparenciaModal {...props} />}
      {modal === "preferences" && <PreferencesModal {...props} />}
      {modal === "about" && <SobreModal {...props} />}
      {modal === "legacy" && <LegacyImportModal {...props} />}
    </SafeAreaView>
  );
}
