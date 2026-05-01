import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../../theme';

export function FormChipSelector({
  label,
  options = [],
  values = {},
  onToggle,
  error,
}) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.chipWrap}>
        {options.map((option) => {
          const selected = Boolean(values?.[option.key]);

          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              onPress={() => onToggle?.(option.key)}
              style={({ pressed }) => [
                styles.chip,
                selected ? styles.chipSelected : null,
                pressed ? styles.pressed : null,
              ]}>
              {option.icon ? <Text style={styles.chipIcon}>{option.icon}</Text> : null}
              <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.md,
  },
  label: {
    color: '#6C7A90',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    minHeight: 38,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    backgroundColor: '#FAFBFD',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chipSelected: {
    borderColor: '#F4C359',
    backgroundColor: '#FFF8E7',
  },
  chipIcon: {
    fontSize: 13,
  },
  chipText: {
    color: '#667489',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#C66D14',
  },
  error: {
    color: theme.colors.errorText,
    ...theme.typography.bodySmall,
  },
  pressed: {
    opacity: 0.92,
  },
});
