import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../theme';

function formatCurrency(value) {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value) || 0)}`;
}

export function PackageBookingStats({ stats }) {
  const statItems = [
    { label: 'Total Bookings', value: stats.total, color: theme.colors.primary },
    { label: 'Pending', value: stats.pending, color: theme.colors.warning },
    { label: 'Confirmed', value: stats.confirmed, color: theme.colors.success },
    { label: 'Cancelled', value: stats.cancelled, color: theme.colors.danger },
    { label: 'Total Revenue', value: formatCurrency(stats.revenue), color: theme.colors.accent, wide: true },
  ];

  return (
    <View style={styles.grid}>
      {statItems.map((item) => (
        <View key={item.label} style={[styles.card, item.wide ? styles.cardWide : null]}>
          <Text style={[styles.value, { color: item.color }]}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  card: {
    flex: 1,
    minWidth: 105,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F1',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  cardWide: {
    minWidth: '100%',
  },
  value: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },
  label: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    textAlign: 'center',
  },
});
