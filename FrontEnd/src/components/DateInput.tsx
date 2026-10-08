import { useState } from "react";
import { Platform, Text, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useTheme } from "../context/ThemeContext";
import { useStyles } from "../styles/styles";
import { formatDate, parseISODate, toISODate } from "../utils/dates";
import Button from "./Button";
import TextField from "./TextField";

export type DateInputProps = {
  label: string;
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  minimumDate?: string;
};
export default function DateInput({
  label,
  value,
  onChange,
  disabled,
  minimumDate,
}: DateInputProps) {
  const { theme, themeMode } = useTheme();
  const styles = useStyles(theme);
  const [open, setOpen] = useState(false);
  const update = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setOpen(false);
    if (event.type === "set" && date) onChange(toISODate(date));
  };
  return (
    <View style={{ gap: 8 }}>
      {Platform.OS === "web" ? (
        <TextField
          label={label}
          helper="Use o formato ano-mês-dia, por exemplo 2026-10-12."
          placeholder="AAAA-MM-DD"
          value={value}
          onChangeText={onChange}
          maxLength={10}
          editable={!disabled}
        />
      ) : (
        <>
          <Text style={styles.label}>{label}</Text>
          <Button
            title={formatDate(value)}
            onPress={() => setOpen((value) => !value)}
            disabled={disabled}
            secondary
            icon="calendar"
          />
          {open && (
            <DateTimePicker
              value={parseISODate(value) ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={update}
              themeVariant={themeMode}
              minimumDate={
                minimumDate
                  ? (parseISODate(minimumDate) ?? undefined)
                  : undefined
              }
            />
          )}
        </>
      )}
    </View>
  );
}
