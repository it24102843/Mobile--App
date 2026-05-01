import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateValue(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function DatePickerField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  placeholder = 'YYYY-MM-DD',
  error,
  style,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerValue = useMemo(() => parseDateValue(value) || new Date(), [value]);
  const minimumDateValue = useMemo(() => parseDateValue(minimumDate), [minimumDate]);
  const maximumDateValue = useMemo(() => parseDateValue(maximumDate), [maximumDate]);

  const handleChange = (_event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      onChange?.(formatDateValue(selectedDate));
    }
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => setShowPicker(true)}
        style={[
          styles.inputShell,
          error ? styles.inputShellError : null,
          style,
        ]}
      >
        <Text style={[styles.valueText, !value ? styles.placeholderText : null]}>
          {value || placeholder}
        </Text>
        <MaterialCommunityIcons
          name="calendar-month-outline"
          size={20}
          color={theme.colors.primary}
        />
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {showPicker ? (
        Platform.OS === 'ios' ? (
          <View style={styles.iosPickerWrap}>
            <DateTimePicker
              value={pickerValue}
              mode="date"
              display="inline"
              minimumDate={minimumDateValue || undefined}
              maximumDate={maximumDateValue || undefined}
              onChange={handleChange}
            />
            <Pressable onPress={() => setShowPicker(false)} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <DateTimePicker
            value={pickerValue}
            mode="date"
            display="default"
            minimumDate={minimumDateValue || undefined}
            maximumDate={maximumDateValue || undefined}
            onChange={handleChange}
          />
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.text,
    ...theme.typography.label,
  },
  inputShell: {
    minHeight: 54,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    ...theme.shadows.subtle,
  },
  inputShellError: {
    borderColor: theme.colors.errorBorder,
  },
  valueText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  placeholderText: {
    color: theme.colors.textSubtle,
  },
  error: {
    color: theme.colors.errorText,
    ...theme.typography.bodySmall,
  },
  iosPickerWrap: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  doneButtonText: {
    color: theme.colors.accent,
    ...theme.typography.label,
    fontWeight: '800',
  },
});
