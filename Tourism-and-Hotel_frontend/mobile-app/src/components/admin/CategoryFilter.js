import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { theme } from '../../theme';

export function CategoryFilter({ options, activeValue, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      {options.map((option) => {
        const isActive = option.value === activeValue;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.chip,
              isActive ? styles.chipActive : null,
            ]}>
            <Text style={[styles.chipLabel, isActive ? styles.chipLabelActive : null]}>
              {option.label}
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
    borderWidth: 1,
    borderColor: '#D8E1EE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  chipLabel: {
    color: theme.colors.primary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
});
