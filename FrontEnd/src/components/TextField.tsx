import { forwardRef, useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import IconButton from "./IconButton";

type Props = Omit<TextInputProps, "style"> & {
  label: string;
  helper?: string;
  error?: string;
};
export default forwardRef<TextInput, Props>(function TextField(
  { label, helper, error, secureTextEntry, onFocus, onBlur, ...input },
  ref,
) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}
      >
        <TextInput
          {...input}
          ref={ref}
          accessibilityLabel={input.accessibilityLabel ?? label}
          placeholderTextColor={theme.textoMuted}
          style={styles.input}
          secureTextEntry={secureTextEntry && !showPassword}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {secureTextEntry && (
          <IconButton
            icon={showPassword ? "eye-off" : "eye"}
            label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            disabled={input.editable === false}
            onPress={() => setShowPassword((value) => !value)}
          />
        )}
      </View>
      {(error || helper) && (
        <Text
          style={error ? styles.error : styles.caption}
          accessibilityLiveRegion={error ? "polite" : "none"}
        >
          {error || helper}
        </Text>
      )}
    </View>
  );
});
