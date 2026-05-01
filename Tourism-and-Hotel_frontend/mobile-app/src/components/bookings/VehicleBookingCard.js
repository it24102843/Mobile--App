import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { StatusBadge } from '../StatusBadge';
import { theme } from '../../theme';

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

export function VehicleBookingCard({ booking, onCancel, onDetails }) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{booking.vehicleName || 'Safari Vehicle'}</Text>
          <Text style={styles.subtitle}>Booking ID: {booking.bookingId}</Text>
        </View>
        <StatusBadge
          label={booking.statusMeta?.label || booking.status || 'Pending'}
          variant={booking.statusMeta?.variant || 'warning'}
        />
      </View>

      <View style={styles.previewRow}>
        <Image source={{ uri: booking.imageUrl }} style={styles.image} contentFit="cover" />
        <View style={styles.previewCopy}>
          <Text style={styles.previewTitle}>{booking.vehicleType || 'Safari Vehicle'}</Text>
          <Text style={styles.previewSubtitle}>
            {booking.regNo || 'Registration pending'} - {booking.passengers || 0} passenger(s)
          </Text>
        </View>
      </View>

      <InfoRow icon="calendar-start" label="Pickup Date" value={formatDate(booking.startDate)} />
      <InfoRow icon="calendar-end" label="Return Date" value={formatDate(booking.endDate)} />
      <InfoRow icon="calendar-range" label="Trip Length" value={`${booking.totalDays || 0} day(s)`} />
      <InfoRow icon="account-group-outline" label="Passengers" value={`${booking.passengers || 0}`} />
      <InfoRow
        icon="credit-card-outline"
        label="Payment Method"
        value={booking.paymentMethodLabel || 'Not selected'}
      />
      <InfoRow
        icon="check-decagram-outline"
        label="Payment Status"
        value={booking.paymentStatusLabel || 'Pending'}
      />
      <InfoRow icon="cash-multiple" label="Total Amount" value={formatCurrency(booking.totalPrice)} />

      {booking.specialRequests ? (
        <Text style={styles.noteText}>Special Requests: {booking.specialRequests}</Text>
      ) : null}

      <View style={styles.actionRow}>
        <View style={styles.flexAction}>
          <AppButton title="Details" variant="secondary" onPress={onDetails} />
        </View>
        {booking.canCancel ? (
          <View style={styles.flexAction}>
            <AppButton title="Cancel" variant="danger" onPress={onCancel} />
          </View>
        ) : null}
      </View>

      {booking.cancellationHint ? (
        <Text style={styles.hintText}>{booking.cancellationHint}</Text>
      ) : null}
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
    alignItems: 'flex-start',
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
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flexAction: {
    flex: 1,
  },
  noteText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  hintText: {
    color: theme.colors.warningText,
    ...theme.typography.bodySmall,
  },
});
