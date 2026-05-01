import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

function getStatusStyle(statusVariant) {
  switch (statusVariant) {
    case 'danger':
      return {
        backgroundColor: '#FDECEC',
        borderColor: '#F2B9B9',
        textColor: '#A03333',
      };
    case 'accent':
      return {
        backgroundColor: '#FFF0DD',
        borderColor: '#FFD1A0',
        textColor: theme.colors.accent,
      };
    case 'primary':
      return {
        backgroundColor: '#EAF1FB',
        borderColor: '#C9D7EC',
        textColor: theme.colors.primary,
      };
    default:
      return {
        backgroundColor: '#F2EEFF',
        borderColor: '#D7D0FF',
        textColor: '#5440B5',
      };
  }
}

function ActionButton({ label, icon, style, textStyle, onPress, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        style,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}>
      <MaterialCommunityIcons name={icon} size={16} color={textStyle?.color || '#FFFFFF'} />
      <Text style={[styles.actionButtonText, textStyle]}>{label}</Text>
    </Pressable>
  );
}

export function BookingAdminCard({ booking, onApprove, onReject, actionDisabled = false }) {
  const statusStyle = getStatusStyle(booking.statusVariant);
  const isResolved =
    `${booking.bookingStatus ?? ''}`.toLowerCase() === 'confirmed' ||
    `${booking.bookingStatus ?? ''}`.toLowerCase() === 'cancelled';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Booking {booking.bookingId}</Text>
          <Text style={styles.subtitle}>
            {booking.roomLabel} - Room {booking.roomNumberLabel}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusStyle.backgroundColor,
              borderColor: statusStyle.borderColor,
            },
          ]}>
          <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
            {booking.bookingStatus}
          </Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Client</Text>
          <Text style={styles.metaValue}>{booking.guestLabel}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Hotel</Text>
          <Text style={styles.metaValue}>{booking.hotelLabel}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Check-In</Text>
          <Text style={styles.metaValue}>{booking.checkInDate}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Check-Out</Text>
          <Text style={styles.metaValue}>{booking.checkOutDate}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Guests</Text>
          <Text style={styles.metaValue}>{booking.numberOfGuests}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Total</Text>
          <Text style={styles.totalValue}>{booking.totalLabel}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.paymentRow}>
          <MaterialCommunityIcons
            name="credit-card-outline"
            size={16}
            color={theme.colors.textMuted}
          />
          <Text style={styles.paymentText}>
            {booking.paymentMethod || 'bank_deposit'} - {booking.paymentStatus || 'pending'}
          </Text>
        </View>

        {!isResolved ? (
          <View style={styles.actionRow}>
            <ActionButton
              label="Approve"
              icon="check"
              onPress={onApprove}
              disabled={actionDisabled}
              style={styles.approveButton}
              textStyle={styles.approveText}
            />
            <ActionButton
              label="Reject"
              icon="close"
              onPress={onReject}
              disabled={actionDisabled}
              style={styles.rejectButton}
              textStyle={styles.rejectText}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4EAF3',
    backgroundColor: '#FFFFFF',
    padding: 18,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#13233E',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  statusBadge: {
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metaItem: {
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#E7D9BA',
    backgroundColor: '#FFF9EF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  metaLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
  },
  metaValue: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  totalValue: {
    color: theme.colors.accent,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  footerRow: {
    gap: theme.spacing.md,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  approveButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  approveText: {
    color: '#FFFFFF',
  },
  rejectButton: {
    backgroundColor: theme.colors.dangerSurface,
    borderColor: theme.colors.dangerBorder,
  },
  rejectText: {
    color: theme.colors.danger,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.55,
  },
});
