import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { theme } from '../../theme';

function NotificationRow({ label, value }) {
  return (
    <View style={styles.notificationRow}>
      <Text style={styles.notificationLabel}>{label}</Text>
      <Text style={styles.notificationValue}>{value || 'Not available'}</Text>
    </View>
  );
}

function NotificationTypeBadge({ label }) {
  const normalizedLabel = `${label || ''}`.toLowerCase();
  const isCancelled = normalizedLabel.includes('cancel');
  const isUpdated = normalizedLabel.includes('update');

  return (
    <View
      style={[
        styles.typeBadge,
        isCancelled ? styles.typeBadgeCancelled : null,
        isUpdated ? styles.typeBadgeUpdated : null,
      ]}>
      <Text
        style={[
          styles.typeBadgeText,
          isCancelled ? styles.typeBadgeTextCancelled : null,
          isUpdated ? styles.typeBadgeTextUpdated : null,
        ]}>
        {label || 'Notification'}
      </Text>
    </View>
  );
}

export function PackageBookingNotificationModal({
  visible,
  notifications,
  unreadCount,
  loading,
  error,
  actionLoadingId,
  markAllLoading,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onRetry,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Package Booking Notifications</Text>
              <Text style={styles.subtitle}>{unreadCount} unread notification(s)</Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={22} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.headerActions}>
            <View style={styles.flexButton}>
              <AppButton
                title={markAllLoading ? 'Updating...' : 'Mark All Read'}
                variant="secondary"
                onPress={onMarkAllRead}
                disabled={markAllLoading || !notifications.length}
              />
            </View>
          </View>

          {loading ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text style={styles.stateText}>Loading package booking notifications...</Text>
            </View>
          ) : null}

          {!loading && error ? (
            <View style={styles.stateWrap}>
              <Text style={styles.errorText}>{error}</Text>
              <AppButton title="Retry" onPress={onRetry} />
            </View>
          ) : null}

          {!loading && !error ? (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {!notifications.length ? (
                <View style={styles.stateWrap}>
                  <MaterialCommunityIcons
                    name="bell-outline"
                    size={30}
                    color={theme.colors.textSubtle}
                  />
                  <Text style={styles.stateTitle}>No package booking notifications</Text>
                  <Text style={styles.stateText}>
                    New or cancelled package bookings will appear here once they are recorded.
                  </Text>
                </View>
              ) : (
                notifications.map((notification) => (
                  <AppCard key={notification.id} style={styles.notificationCard}>
                    <View style={styles.notificationHeader}>
                      <View style={styles.notificationHeaderCopy}>
                        <Text style={styles.notificationTitle}>{notification.bookingId}</Text>
                        <Text style={styles.notificationNote}>{notification.note}</Text>
                      </View>
                      <View style={styles.notificationHeaderMeta}>
                        <NotificationTypeBadge label={notification.typeLabel} />
                        {!notification.isRead ? <View style={styles.unreadDot} /> : null}
                      </View>
                    </View>

                    <NotificationRow label="Notification Type" value={notification.typeLabel} />
                    <NotificationRow label="Customer" value={notification.customerName} />
                    <NotificationRow label="Email" value={notification.customerEmail} />
                    <NotificationRow label="Package" value={notification.packageName} />
                    <NotificationRow label="Tour Date" value={notification.tourDateLabel} />
                    <NotificationRow label="Guests" value={notification.guestCountLabel} />
                    <NotificationRow label="Total" value={notification.totalAmountLabel} />
                    <NotificationRow label="Payment" value={notification.paymentMethod} />
                    <NotificationRow label="Created" value={notification.createdAtLabel} />

                    <View style={styles.notificationActions}>
                      <AppButton
                        title={actionLoadingId === notification.id ? 'Updating...' : notification.isRead ? 'Read' : 'Mark Read'}
                        variant="secondary"
                        onPress={() => onMarkRead(notification)}
                        disabled={notification.isRead || actionLoadingId === notification.id}
                      />
                    </View>
                  </AppCard>
                ))
              )}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#F8FAFD',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  title: {
    color: '#13233E',
    ...theme.typography.sectionTitle,
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F1',
  },
  headerActions: {
    flexDirection: 'row',
  },
  flexButton: {
    flex: 1,
  },
  scrollContent: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  stateWrap: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xl,
  },
  stateTitle: {
    color: '#13233E',
    ...theme.typography.sectionTitle,
    textAlign: 'center',
  },
  stateText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
    textAlign: 'center',
  },
  notificationCard: {
    gap: theme.spacing.sm,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  notificationHeaderMeta: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  notificationHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    color: '#13233E',
    ...theme.typography.label,
  },
  notificationNote: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.accent,
  },
  typeBadge: {
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.primaryMuted,
  },
  typeBadgeCancelled: {
    backgroundColor: theme.colors.errorSurface,
    borderColor: theme.colors.errorBorder,
  },
  typeBadgeUpdated: {
    backgroundColor: theme.colors.warningSurface,
    borderColor: '#F8D58C',
  },
  typeBadgeText: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '800',
  },
  typeBadgeTextCancelled: {
    color: theme.colors.errorText,
  },
  typeBadgeTextUpdated: {
    color: theme.colors.warningText,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  notificationLabel: {
    flex: 1,
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  notificationValue: {
    flex: 1,
    textAlign: 'right',
    color: theme.colors.text,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  notificationActions: {
    paddingTop: theme.spacing.sm,
  },
});
