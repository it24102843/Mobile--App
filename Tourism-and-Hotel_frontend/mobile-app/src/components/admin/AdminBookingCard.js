import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

function getStatusStyles(variant) {
  switch (variant) {
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

function SmallAction({ label, onPress, variant = 'default', disabled = false }) {
  const actionStyle =
    variant === 'danger'
      ? styles.actionDanger
      : variant === 'accent'
        ? styles.actionAccent
        : styles.actionDefault;

  const textStyle =
    variant === 'danger'
      ? styles.actionDangerText
      : variant === 'accent'
        ? styles.actionAccentText
        : styles.actionDefaultText;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        actionStyle,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}>
      <Text style={[styles.actionText, textStyle]}>{label}</Text>
    </Pressable>
  );
}

export function AdminBookingCard({
  booking,
  actionLoading = false,
  onApprove,
  onReject,
  onViewSlip,
  onSendBill,
  onResendBill,
  onMarkRefunded,
}) {
  const badge = getStatusStyles(booking.statusVariant);
  const refundBadge = booking.refundStatusLabel
    ? getStatusStyles(booking.refundStatusVariant)
    : null;
  const showApproveReject = booking.statusLabel === 'Pending';
  const showSlip = Boolean(booking.slipUrl);
  const showCheckoutBill = booking.paymentMethod === 'checkout';
  const showRefundAction = booking.canMarkRefunded;

  return (
    <View style={styles.card}>
      <Image source={{ uri: booking.imageUrl }} style={styles.image} resizeMode="cover" />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.hotelName}>{booking.hotelName}</Text>
            <Text style={styles.roomText}>
              {booking.roomType} - Room {booking.roomNumber}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: badge.backgroundColor,
                borderColor: badge.borderColor,
              },
            ]}>
            <Text style={[styles.statusText, { color: badge.textColor }]}>
              {booking.statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="account-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.metaText}>{booking.guestLabel}</Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Booking ID</Text>
            <Text style={styles.metaValue}>{booking.bookingId || 'N/A'}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Guests</Text>
            <Text style={styles.metaValue}>{booking.numberOfGuests || 'N/A'}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Check-In</Text>
            <Text style={styles.metaValue}>{booking.checkInLabel}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Check-Out</Text>
            <Text style={styles.metaValue}>{booking.checkOutLabel}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Nights</Text>
            <Text style={styles.metaValue}>{booking.numberOfNights || 'N/A'}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Payment</Text>
            <Text style={styles.metaValue}>{booking.paymentMethodLabel}</Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{booking.totalLabel}</Text>
          </View>
          <Text style={styles.paymentStatus}>{booking.paymentStatusLabel}</Text>
        </View>

        {booking.refundStatusLabel ? (
          <View style={styles.refundRow}>
            <Text style={styles.refundLabel}>Refund Status</Text>
            <View
              style={[
                styles.refundBadge,
                {
                  backgroundColor: refundBadge?.backgroundColor,
                  borderColor: refundBadge?.borderColor,
                },
              ]}>
              <Text style={[styles.refundText, { color: refundBadge?.textColor }]}>
                {booking.refundStatusLabel}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.actionWrap}>
          {showApproveReject ? (
            <>
              <SmallAction
                label="Approve"
                variant="default"
                onPress={onApprove}
                disabled={actionLoading}
              />
              <SmallAction
                label="Reject"
                variant="danger"
                onPress={onReject}
                disabled={actionLoading}
              />
            </>
          ) : null}

          {showSlip ? (
            <SmallAction
              label="View Slip"
              variant="accent"
              onPress={onViewSlip}
              disabled={actionLoading}
            />
          ) : null}

          {showCheckoutBill && !booking.checkoutEmailSent ? (
            <SmallAction
              label="Send Checkout Bill"
              variant="default"
              onPress={onSendBill}
              disabled={actionLoading}
            />
          ) : null}

          {showCheckoutBill && booking.checkoutEmailSent ? (
            <SmallAction
              label="Resend Bill Email"
              variant="accent"
              onPress={onResendBill}
              disabled={actionLoading}
            />
          ) : null}

          {showRefundAction ? (
            <SmallAction
              label="Mark as Refunded"
              variant="accent"
              onPress={onMarkRefunded}
              disabled={actionLoading}
            />
          ) : null}

          {!showApproveReject && !showSlip && !showCheckoutBill && !showRefundAction ? (
            <View style={styles.staticLabelWrap}>
              <Text style={styles.staticLabel}>{booking.statusLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EAF3',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#E9EEF6',
  },
  content: {
    padding: 18,
    gap: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  hotelName: {
    color: '#13233E',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  roomText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  statusBadge: {
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: theme.colors.text,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metaPill: {
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
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  totalLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
  },
  totalValue: {
    color: theme.colors.accent,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  paymentStatus: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  refundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  refundLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
  },
  refundBadge: {
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refundText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  actionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionButton: {
    minHeight: 40,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  actionDefault: {
    backgroundColor: '#EEF5FF',
    borderColor: '#D7E2F2',
  },
  actionAccent: {
    backgroundColor: '#FFF0DD',
    borderColor: '#FFD1A0',
  },
  actionDanger: {
    backgroundColor: '#FDECEC',
    borderColor: '#F2B9B9',
  },
  actionText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  actionDefaultText: {
    color: theme.colors.primary,
  },
  actionAccentText: {
    color: theme.colors.accent,
  },
  actionDangerText: {
    color: theme.colors.danger,
  },
  staticLabelWrap: {
    paddingVertical: 8,
  },
  staticLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.55,
  },
});
