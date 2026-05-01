import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { StatusBadge } from '../StatusBadge';
import { theme } from '../../theme';

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || 'Not available'}</Text>
    </View>
  );
}

function getMealPackageLabel(mealPackage) {
  const selected = [];

  if (mealPackage?.breakfast) {
    selected.push('Breakfast');
  }

  if (mealPackage?.lunch) {
    selected.push('Lunch');
  }

  if (!selected.length) {
    return '';
  }

  return `${selected.join(', ')} - LKR ${new Intl.NumberFormat('en-LK').format(Number(mealPackage?.price || 0))}`;
}

export function PackageBookingCard({
  booking,
  actionLoading = false,
  onConfirm,
  onCancel,
  onDetails,
}) {
  const isPending = booking.statusLabel === 'Pending';
  const mealPackageLabel = getMealPackageLabel(booking.mealPackage);

  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.bookingId}>{booking.bookingId}</Text>
          <Text style={styles.packageName}>{booking.packageName}</Text>
        </View>
        <StatusBadge label={booking.statusLabel} variant={booking.statusVariant} />
      </View>

      <View style={styles.body}>
        <Row label="Customer" value={booking.customerName} />
        <Row label="Email" value={booking.customerEmail} />
        {booking.selectedVehicleLabel ? (
          <Row label="Package Vehicle" value={booking.selectedVehicleLabel} />
        ) : null}
        {mealPackageLabel ? (
          <Row label="Meal Package" value={mealPackageLabel} />
        ) : null}
        {Number(booking.addOnTotal || 0) > 0 ? (
          <Row
            label="Add-on Total"
            value={`LKR ${new Intl.NumberFormat('en-LK').format(Number(booking.addOnTotal || 0))}`}
          />
        ) : null}
        <Row label="Tour Date" value={booking.tourDateLabel} />
        <Row label="Guests" value={booking.guestCountLabel} />
        <Row label="Total Amount" value={booking.totalAmountLabel} />
        <Row label="Payment Method" value={booking.paymentMethod} />
        <Row label="Created" value={booking.orderDateLabel} />
      </View>

      <View style={styles.actionsRow}>
        <View style={styles.flexButton}>
          <AppButton title="View Details" variant="secondary" onPress={onDetails} />
        </View>
        <View style={styles.flexButton}>
          <AppButton
            title={actionLoading && isPending ? 'Working...' : 'Confirm'}
            onPress={onConfirm}
            disabled={!isPending || actionLoading}
          />
        </View>
        <View style={styles.flexButton}>
          <AppButton
            title={actionLoading && isPending ? 'Working...' : 'Cancel'}
            variant="danger"
            onPress={onCancel}
            disabled={!isPending || actionLoading}
          />
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  bookingId: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  packageName: {
    color: '#13233E',
    ...theme.typography.sectionTitle,
  },
  body: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  rowLabel: {
    flex: 1,
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  rowValue: {
    flex: 1,
    color: theme.colors.text,
    ...theme.typography.bodySmall,
    textAlign: 'right',
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  flexButton: {
    flex: 1,
    minWidth: 100,
  },
});
