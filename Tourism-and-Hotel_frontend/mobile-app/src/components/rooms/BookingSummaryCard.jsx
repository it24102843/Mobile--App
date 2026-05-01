import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { theme } from '../../theme';

function formatCurrency(value) {
  return `LKR ${new Intl.NumberFormat('en-LK').format(value || 0)}`;
}

function formatDisplayDate(value) {
  if (!value) {
    return 'YYYY-MM-DD';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-CA').format(date);
}

export function BookingSummaryCard({
  pricePerNight,
  checkInDate,
  checkOutDate,
  nights,
  subtotal,
  tax,
  total,
  buttonLabel,
  onPress,
  disabled = false,
  compact = false,
}) {
  return (
    <AppCard style={[styles.card, compact ? styles.cardCompact : null]}>
      <Text style={styles.eyebrow}>Nightly Rate</Text>
      <Text style={styles.rateText}>
        {formatCurrency(pricePerNight)}
        <Text style={styles.rateSuffix}> /night</Text>
      </Text>

      <View style={styles.dateRow}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>Check-In</Text>
          <View style={styles.dateValueShell}>
            <Text style={styles.dateValue}>{formatDisplayDate(checkInDate)}</Text>
          </View>
        </View>

        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>Check-Out</Text>
          <View style={styles.dateValueShell}>
            <Text style={styles.dateValue}>{formatDisplayDate(checkOutDate)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.line} />

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>
          {formatCurrency(pricePerNight)} x {nights || 0} night
        </Text>
        <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Taxes & fees (10%)</Text>
        <Text style={styles.summaryValue}>{formatCurrency(tax)}</Text>
      </View>

      <View style={styles.line} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>

      {buttonLabel ? <AppButton title={buttonLabel} onPress={onPress} disabled={disabled} /> : null}

      <Text style={styles.footerHint}>Free cancellation · No hidden fees</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFBF4',
    borderColor: '#F0E3C8',
    gap: theme.spacing.md,
  },
  cardCompact: {
    padding: theme.spacing.lg,
  },
  eyebrow: {
    color: '#9E8E7A',
    ...theme.typography.eyebrow,
    letterSpacing: 1.8,
  },
  rateText: {
    color: theme.colors.accent,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  rateSuffix: {
    color: '#7F7365',
    fontSize: 17,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  dateBlock: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  dateLabel: {
    color: '#867A6C',
    ...theme.typography.eyebrow,
    letterSpacing: 1.6,
  },
  dateValueShell: {
    minHeight: 52,
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    borderColor: '#F0C24E',
    backgroundColor: '#FFF7D9',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dateValue: {
    color: '#3B3128',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  line: {
    height: 1,
    backgroundColor: '#E7DBC6',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  summaryLabel: {
    color: '#7C7165',
    ...theme.typography.body,
  },
  summaryValue: {
    color: '#2E2419',
    ...theme.typography.body,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#2E2419',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  totalValue: {
    color: theme.colors.accent,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  footerHint: {
    color: '#9C8F80',
    ...theme.typography.bodySmall,
    textAlign: 'center',
  },
});
