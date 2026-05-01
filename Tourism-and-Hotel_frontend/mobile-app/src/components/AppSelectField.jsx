import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../theme';

export function AppSelectField({
  label,
  value,
  options = [],
  placeholder = 'Select an option',
  error,
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) || null,
    [options, value]
  );

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        style={[
          styles.selector,
          isOpen ? styles.selectorOpen : null,
          error ? styles.selectorError : null,
        ]}
        onPress={() => setIsOpen((current) => !current)}>
        <Text style={[styles.selectorText, !selectedOption ? styles.placeholderText : null]}>
          {selectedOption?.label || placeholder}
        </Text>

        <MaterialCommunityIcons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={theme.colors.textMuted}
        />
      </Pressable>

      {isOpen ? (
        <View style={styles.dropdown}>
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isLast = index === options.length - 1;

            return (
              <Pressable
                key={option.value}
                style={[
                  styles.optionRow,
                  isSelected ? styles.optionRowSelected : null,
                  isLast ? styles.optionRowLast : null,
                ]}
                onPress={() => {
                  onChange?.(option.value);
                  setIsOpen(false);
                }}>
                <Text style={[styles.optionText, isSelected ? styles.optionTextSelected : null]}>
                  {option.label}
                </Text>

                {isSelected ? (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={theme.colors.accent}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  selector: {
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
  selectorOpen: {
    borderColor: theme.colors.accent,
  },
  selectorError: {
    borderColor: theme.colors.errorBorder,
  },
  selectorText: {
    flex: 1,
    color: theme.colors.text,
    ...theme.typography.body,
  },
  placeholderText: {
    color: theme.colors.textSubtle,
  },
  dropdown: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFDF9',
    overflow: 'hidden',
  },
  optionRow: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E3C8',
  },
  optionRowSelected: {
    backgroundColor: '#FFF3DA',
  },
  optionRowLast: {
    borderBottomWidth: 0,
  },
  optionText: {
    flex: 1,
    color: theme.colors.text,
    ...theme.typography.body,
  },
  optionTextSelected: {
    color: theme.colors.accent,
    fontWeight: '700',
  },
  error: {
    color: theme.colors.errorText,
    ...theme.typography.bodySmall,
  },
});
