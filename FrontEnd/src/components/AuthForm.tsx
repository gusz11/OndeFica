import { useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useDialog } from "../context/DialogContext";
import { useAuthForm } from "../hooks/useAuthForm";
import { useStyles } from "../styles/styles";
import { navigationRef } from "../navigation/root";
import Button from "./Button";
import Icon from "./Icon";
import IconButton from "./IconButton";
import TextField from "./TextField";

type Props = { mode: "login" | "register"; onSwitch: () => void };
export default function AuthForm({ mode, onSwitch }: Props) {
  const { notify } = useDialog();
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmationRef = useRef<TextInput>(null);
  const form = useAuthForm(mode, () =>
    notify(
      "Conta criada",
      "Sua conta está pronta. Entre com seu email e senha.",
      onSwitch,
    ),
  );
  const register = mode === "register";
  const submit = () => {
    void form.submit();
  };
  return (
    <SafeAreaView style={styles.container}>
      {register && (
        <View style={{ paddingHorizontal: 16 }}>
          <IconButton
            icon="arrow-left"
            label="Voltar para entrar"
            onPress={onSwitch}
            disabled={form.pending}
          />
        </View>
      )}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.formInner}>
            <View style={styles.hero}>
              <View
                style={[
                  styles.brandMark,
                  { width: 52, height: 52, borderRadius: 18, marginBottom: 12 },
                ]}
              >
                <Icon name="map-pin" size={26} color={theme.textoPrimario} />
              </View>
              <Text style={styles.eyebrow}>ONDEFICA · BRASÍLIA</Text>
              <Text style={styles.title}>
                {register
                  ? "Comece seu próximo roteiro."
                  : "Explore mais.\nPlaneje melhor."}
              </Text>
              <Text style={styles.muted}>
                {register
                  ? "Crie sua conta para guardar os lugares e momentos que você quer descobrir."
                  : "Entre para salvar seus lugares favoritos e organizar sua programação."}
              </Text>
            </View>
            <View style={styles.stack}>
              {register && (
                <TextField
                  label="Nome completo"
                  placeholder="Como podemos chamar você?"
                  value={form.name}
                  onChangeText={form.setName}
                  maxLength={120}
                  autoComplete="name"
                  editable={!form.pending}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              )}
              <TextField
                ref={emailRef}
                label="Email"
                placeholder="voce@exemplo.com"
                value={form.email}
                onChangeText={form.setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={254}
                autoComplete="email"
                editable={!form.pending}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <TextField
                ref={passwordRef}
                label="Senha"
                placeholder={register ? "Crie uma senha" : "Sua senha"}
                helper={register ? "Use entre 8 e 128 caracteres." : undefined}
                value={form.password}
                onChangeText={form.setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={128}
                autoComplete={register ? "new-password" : "current-password"}
                editable={!form.pending}
                returnKeyType={register ? "next" : "go"}
                onSubmitEditing={
                  register ? () => confirmationRef.current?.focus() : submit
                }
              />
              {register && (
                <TextField
                  ref={confirmationRef}
                  label="Confirmar senha"
                  placeholder="Repita sua senha"
                  value={form.confirmation}
                  onChangeText={form.setConfirmation}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={128}
                  autoComplete="new-password"
                  editable={!form.pending}
                  returnKeyType="go"
                  onSubmitEditing={submit}
                />
              )}
              {!!form.error && (
                <View style={styles.errorPanel}>
                  <Text style={styles.error} accessibilityLiveRegion="polite">
                    {form.error}
                  </Text>
                </View>
              )}
              <Button
                title={register ? "Criar minha conta" : "Entrar"}
                onPress={submit}
                loading={form.pending}
                icon="arrow-right"
              />
            </View>
            <Button
              title="Continuar explorando"
              variant="ghost"
              onPress={() => navigationRef.navigate("Main")}
              disabled={form.pending}
            />
            <View style={{ gap: 4 }}>
              <Text style={[styles.caption, { textAlign: "center" }]}>
                {register ? "Já tem uma conta?" : "Primeira vez por aqui?"}
              </Text>
              <Button
                title={register ? "Entrar na minha conta" : "Criar uma conta"}
                onPress={onSwitch}
                disabled={form.pending}
                variant="ghost"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
