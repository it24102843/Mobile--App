import { ScrollView, Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '../../theme';

export function EquipmentOrderFilters({ filters, activeFilter, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      {filters.map((filter) => {
        const active = filter.value === activeFilter;
        return (
          <Pressable
            key={filter.value}
            onPress={() => onChange(filter.value)}
            style={[styles.chip, active ? styles.chipActive : null]}>
            <Text style={[styles.label, active ? styles.labelActive : null]}>
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.sm,
  },
  chip: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: theme.radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E1EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  label: {
    color: theme.colors.primary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
