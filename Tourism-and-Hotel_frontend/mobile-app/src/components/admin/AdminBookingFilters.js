import { ScrollView, Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '../../theme';

export function AdminBookingFilters({ filters, activeFilter, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {filters.map((filter) => {
        const isActive = filter.value === activeFilter;

        return (
          <Pressable
            key={filter.value}
            accessibilityRole="button"
            onPress={() => onChange?.(filter.value)}
            style={({ pressed }) => [
              styles.chip,
              isActive ? styles.activeChip : null,
              pressed ? styles.pressed : null,
            ]}>
            <Text style={[styles.chipText, isActive ? styles.activeChipText : null]}>
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.md,
  },
  chip: {
    minHeight: 40,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  activeChip: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  chipText: {
    color: theme.colors.primary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.92,
  },
});
