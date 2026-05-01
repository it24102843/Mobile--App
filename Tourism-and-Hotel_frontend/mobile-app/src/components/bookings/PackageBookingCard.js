import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { MealPackageSummary } from './MealPackageSummary';
import { StatusBadge } from '../StatusBadge';
import { theme } from '../../theme';
import { getDefaultImage, resolveMediaUrl } from '../../utils/media';
import {
  formatPaymentMethodLabel,
  formatPaymentStatusLabel,
  getRefundStatusMeta,
} from '../../utils/roomBooking';

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatCurrency(value) {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value || 0))}`;
}

function getStatusMeta(status) {
  switch (status) {
    case 'Confirmed':
      return { label: 'Confirmed', variant: 'primary' };
    case 'Completed':
      return { label: 'Completed', variant: 'info' };
    case 'Cancelled':
      return { label: 'Cancelled', variant: 'danger' };
    default:
      return { label: status || 'Pending', variant: 'warning' };
  }
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelWrap}>
        <MaterialCommunityIcons name={icon} size={18} color={theme.colors.primary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function PackageBookingCard({ booking, onCancel, onDetails }) {
  const status = getStatusMeta(booking.status);
  const canCancel = Boolean(booking.canCancel);
  const refundStatusMeta = getRefundStatusMeta(booking.refundStatus);
  const regularAddOnLabel = booking.addOns?.length
    ? booking.addOns.map((item) => item?.name || item?.title || 'Extra').join(', ')
    : '';

  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{booking.packageName || 'WildHaven Package'}</Text>
          <Text style={styles.subtitle}>Booking ID: {booking.bookingId || 'Not available'}</Text>
        </View>
        <StatusBadge label={status.label} variant={status.variant} />
      </View>

      <View style={styles.previewRow}>
        <Image
          source={{ uri: booking.imageUrl || resolveMediaUrl(booking.packageImage, getDefaultImage()) }}
          style={styles.image}
          contentFit="cover"
        />
        <View style={styles.previewCopy}>
          <Text style={styles.previewTitle}>{booking.packageName || 'WildHaven Package'}</Text>
          <Text style={styles.previewSubtitle}>
            {booking.guests || 0} guest(s) - {formatPaymentMethodLabel(booking.paymentMethod)}
          </Text>
        </View>
      </View>

      <InfoRow icon="calendar-range" label="Tour Date" value={formatDate(booking.tourDate)} />
      <InfoRow icon="account-group-outline" label="Guest Count" value={`${booking.guests || 0}`} />
      {booking.selectedVehicle?.vehicleName ? (
        <InfoRow
          icon="car-outline"
          label="Package Vehicle"
          value={booking.selectedVehicle.vehicleName}
        />
      ) : null}
      {regularAddOnLabel ? <InfoRow icon="gift-outline" label="Add-ons" value={regularAddOnLabel} /> : null}
      <MealPackageSummary mealPackage={booking.mealPackage} />
      {Number(booking.addOnTotal || 0) > 0 ? (
        <InfoRow
          icon="plus-circle-outline"
          label="Add-on Total"
          value={formatCurrency(booking.addOnTotal)}
        />
      ) : null}
      <InfoRow icon="cash-multiple" label="Total Amount" value={formatCurrency(booking.totalPrice)} />
      <InfoRow
        icon="credit-card-outline"
        label="Payment Method"
        value={formatPaymentMethodLabel(booking.paymentMethod)}
      />
      <InfoRow
        icon="check-decagram-outline"
        label="Payment Status"
        value={formatPaymentStatusLabel(booking.paymentStatus)}
      />

      {refundStatusMeta ? (
        <InfoRow icon="cash-refund" label="Refund" value={refundStatusMeta.label} />
      ) : null}

      {booking.cancellationHint ? (
        <Text style={styles.noteText}>{booking.cancellationHint}</Text>
      ) : null}

      {booking.specialRequests ? (
        <Text style={styles.noteText}>Special Request: {booking.specialRequests}</Text>
      ) : null}

      <View style={styles.actionRow}>
        <View style={styles.flexButton}>
          <AppButton title="View Booking" variant="secondary" onPress={onDetails} />
        </View>
        {canCancel ? (
          <View style={styles.flexButton}>
            <AppButton title="Cancel" variant="danger" onPress={onCancel} />
          </View>
        ) : null}
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
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  previewRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    alignItems: 'center',
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: theme.radii.lg,
    backgroundColor: '#E9EEF6',
  },
  previewCopy: {
    flex: 1,
    gap: 6,
  },
  previewTitle: {
    color: theme.colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  previewSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  infoLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  infoValue: {
    color: theme.colors.text,
    ...theme.typography.body,
    fontWeight: '800',
    textAlign: 'right',
    flexShrink: 1,
  },
  noteText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flexButton: {
    flex: 1,
  },
});
