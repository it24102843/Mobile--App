import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../theme';

function StatCard({ label, value, tone = 'default' }) {
  const toneStyles =
    tone === 'accent'
      ? styles.accentCard
      : tone === 'danger'
        ? styles.dangerCard
        : tone === 'info'
          ? styles.infoCard
          : styles.defaultCard;

  return (
    <View style={[styles.card, toneStyles]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function AdminBookingStats({ stats }) {
  return (
    <View style={styles.grid}>
      <StatCard label="Confirmed" value={stats.confirmed || 0} tone="default" />
      <StatCard label="Pending" value={stats.pending || 0} tone="accent" />
      <StatCard label="Rejected" value={stats.rejected || 0} tone="danger" />
      <StatCard label="Pay at Checkout" value={stats.checkout || 0} tone="info" />
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
    flexGrow: 1,
    minWidth: '47%',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
    ...theme.shadows.subtle,
  },
  defaultCard: {
    backgroundColor: '#EEF5FF',
    borderColor: '#D7E2F2',
  },
  accentCard: {
    backgroundColor: '#FFF3E4',
    borderColor: '#FFD1A0',
  },
  dangerCard: {
    backgroundColor: '#FDECEC',
    borderColor: '#F2B9B9',
  },
  infoCard: {
    backgroundColor: '#F3EEFF',
    borderColor: '#D7D0FF',
  },
  label: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  value: {
    color: '#13233E',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
});
