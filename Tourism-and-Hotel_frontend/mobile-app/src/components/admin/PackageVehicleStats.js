import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../theme';

export function PackageVehicleStats({ stats }) {
  const statItems = [
    { label: 'Total', value: stats.total, color: theme.colors.primary },
    { label: 'Available', value: stats.available, color: theme.colors.success },
    { label: 'Maintenance', value: stats.maintenance, color: theme.colors.danger },
  ];

  return (
    <View style={styles.statsRow}>
      {statItems.map((item) => (
        <View key={item.label} style={styles.statCard}>
          <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: 90,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F1',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
  },
  statLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
});
