import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

export function AdminInquiryFilters({
  searchQuery,
  onChangeSearch,
  activeFilter,
  onSelectFilter,
}) {
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'replied', label: 'Replied' },
    { key: 'closed', label: 'Closed' },
    { key: 'unread', label: 'Unread' },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textSubtle} />
        <TextInput
          value={searchQuery}
          onChangeText={onChangeSearch}
          placeholder="Search by name, email, or subject"
          placeholderTextColor={theme.colors.textSubtle}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}>
        {filters.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <Pressable
              key={filter.key}
              onPress={() => onSelectFilter(filter.key)}
              style={[styles.chip, isActive ? styles.activeChip : null]}>
              <Text style={[styles.chipText, isActive ? styles.activeChipText : null]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.md,
  },
  searchWrap: {
    minHeight: 54,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.shadows.subtle,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 0,
  },
  chipsRow: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeChip: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },
  chipText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  activeChipText: {
    color: theme.colors.accentPressed,
  },
});
