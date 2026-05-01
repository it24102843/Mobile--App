import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../AppButton';
import { theme } from '../../theme';

export function SendCheckoutBillModal({
  visible,
  booking,
  sending = false,
  resendMode = false,
  onClose,
  onSend,
}) {
  if (!booking) {
    return null;
  }

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.copyBlock}>
              <Text style={styles.title}>Send Checkout Bill Email</Text>
              <Text style={styles.subtitle}>
                {resendMode ? 'Resend the checkout bill to the guest email.' : 'Send the checkout bill to the guest email.'}
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}>
            <View style={styles.panel}>
              <Text style={styles.panelLabel}>Email Recipient</Text>
              <Text style={styles.panelValue}>{booking.guestLabel}</Text>
            </View>

            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Booking Summary</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Booking ID</Text>
                <Text style={styles.rowValue}>{booking.bookingId || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Room</Text>
                <Text style={styles.rowValue}>
                  {booking.roomType} - Room {booking.roomNumber}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Hotel</Text>
                <Text style={styles.rowValue}>{booking.hotelName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Check-Out Date</Text>
                <Text style={styles.rowValue}>{booking.checkOutLabel}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Nights</Text>
                <Text style={styles.rowValue}>{booking.numberOfNights || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Bill Preview</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Room Charges</Text>
                <Text style={styles.rowValue}>{booking.roomChargesLabel}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Tax / Service Charge</Text>
                <Text style={styles.rowValue}>{booking.taxAmountLabel}</Text>
              </View>
              <View style={[styles.row, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Due</Text>
                <Text style={styles.totalValue}>{booking.totalAmountLabel}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.cancelButton, pressed ? styles.pressed : null]}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <View style={styles.sendWrap}>
              <AppButton
                title={sending ? 'Sending...' : resendMode ? 'Resend Bill Email' : 'Send Bill Email'}
                onPress={onSend}
                disabled={sending}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.38)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: theme.spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 54,
    height: 5,
    borderRadius: theme.radii.pill,
    backgroundColor: '#D4DBE7',
  },
  header: {
    gap: theme.spacing.xs,
  },
  copyBlock: {
    gap: 4,
  },
  title: {
    color: '#13233E',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  content: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  panel: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F1',
    backgroundColor: '#FFFDF9',
    padding: 16,
    gap: theme.spacing.sm,
  },
  panelLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
  },
  panelValue: {
    color: '#13233E',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#13233E',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  rowLabel: {
    flex: 1,
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    color: theme.colors.text,
    ...theme.typography.body,
    fontWeight: '700',
  },
  totalRow: {
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F1',
  },
  totalLabel: {
    color: '#13233E',
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
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  cancelButton: {
    minWidth: 110,
    minHeight: 54,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    backgroundColor: '#F7F9FC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cancelText: {
    color: theme.colors.primary,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  sendWrap: {
    flex: 1,
  },
  pressed: {
    opacity: 0.92,
  },
});
