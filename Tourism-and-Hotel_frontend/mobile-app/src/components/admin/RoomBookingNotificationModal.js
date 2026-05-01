import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { theme } from '../../theme';

function NotificationCard({
  notification,
  actionLoading,
  onMarkRead,
}) {
  return (
    <View style={[styles.card, !notification.isRead ? styles.unreadCard : null]}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardTopCopy}>
          <Text style={styles.cardTitle}>{notification.hotelName}</Text>
          <Text style={styles.cardSubtitle}>Booking ID: {notification.bookingId}</Text>
        </View>

        <View style={[styles.statusBadge, notification.isRead ? styles.readBadge : styles.unreadBadge]}>
          <Text style={[styles.statusBadgeText, notification.isRead ? styles.readBadgeText : styles.unreadBadgeText]}>
            {notification.isRead ? 'Read' : 'Unread'}
          </Text>
        </View>
      </View>

      <View style={styles.typeBadgeRow}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{notification.typeLabel}</Text>
        </View>
      </View>

      <View style={styles.previewRow}>
        <Image source={{ uri: notification.imageUrl }} style={styles.image} contentFit="cover" />

        <View style={styles.previewCopy}>
          <Text style={styles.previewTitle}>
            {notification.roomType} • {notification.roomNumber}
          </Text>
          <Text style={styles.previewMeta}>{notification.email}</Text>
          <Text style={styles.previewMeta}>
            {notification.checkInLabel} → {notification.checkOutLabel}
          </Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Notification</Text>
          <Text style={styles.metaValue}>{notification.typeLabel}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Guests</Text>
          <Text style={styles.metaValue}>{notification.guestsLabel}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Nights</Text>
          <Text style={styles.metaValue}>{notification.nightsLabel}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Payment</Text>
          <Text style={styles.metaValue}>{notification.paymentMethodLabel}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Total</Text>
          <Text style={styles.metaValue}>{notification.totalLabel}</Text>
        </View>
      </View>

      <Text style={styles.cancelledAt}>
        Cancelled at: {notification.cancellationTimeLabel}
      </Text>
      <Text style={styles.refundNote}>{notification.refundNote}</Text>

      {!notification.isRead ? (
        <View style={styles.buttonRow}>
          <AppButton
            title={actionLoading ? 'Updating...' : 'Mark as Read'}
            onPress={onMarkRead}
            disabled={actionLoading}
          />
        </View>
      ) : null}
    </View>
  );
}

export function RoomBookingNotificationModal({
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
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Cancelled Booking Notifications</Text>
              <Text style={styles.headerSubtitle}>
                {unreadCount} unread cancellation notification(s)
              </Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={22} color={theme.colors.textHeading} />
            </Pressable>
          </View>

          <View style={styles.headerActions}>
            <AppButton
              title={markAllLoading ? 'Updating...' : 'Mark All as Read'}
              variant="secondary"
              onPress={onMarkAllRead}
              disabled={loading || markAllLoading || unreadCount === 0}
            />
          </View>

          {loading ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text style={styles.stateText}>Loading cancellation notifications...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateWrap}>
              <MaterialCommunityIcons name="alert-circle-outline" size={28} color={theme.colors.danger} />
              <Text style={styles.stateText}>{error}</Text>
              <View style={styles.retryWrap}>
                <AppButton title="Retry" onPress={onRetry} />
              </View>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.stateWrap}>
              <MaterialCommunityIcons name="bell-off-outline" size={28} color={theme.colors.textSubtle} />
              <Text style={styles.stateText}>No cancelled room booking notifications yet.</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}>
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  actionLoading={actionLoadingId === notification.id}
                  onMarkRead={() => onMarkRead(notification)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#F7F9FC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    gap: theme.spacing.md,
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
  headerTitle: {
    color: '#13233E',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    alignItems: 'flex-start',
  },
  listContent: {
    gap: theme.spacing.md,
    paddingBottom: 24,
  },
  stateWrap: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  stateText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    ...theme.typography.body,
  },
  retryWrap: {
    minWidth: 120,
  },
  card: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F1',
    padding: 16,
    gap: theme.spacing.sm,
    ...theme.shadows.card,
  },
  unreadCard: {
    borderColor: '#F5A623',
    backgroundColor: '#FFF9EE',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  cardTopCopy: {
    flex: 1,
  },
  cardTitle: {
    color: '#13233E',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
  },
  unreadBadge: {
    backgroundColor: '#FEF3C7',
  },
  readBadge: {
    backgroundColor: '#E2E8F1',
  },
  statusBadgeText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '800',
  },
  unreadBadgeText: {
    color: '#B45309',
  },
  readBadgeText: {
    color: '#475569',
  },
  previewRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  typeBadgeRow: {
    flexDirection: 'row',
  },
  typeBadge: {
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    backgroundColor: theme.colors.errorSurface,
    borderWidth: 1,
    borderColor: theme.colors.errorBorder,
  },
  typeBadgeText: {
    color: theme.colors.errorText,
    ...theme.typography.bodySmall,
    fontWeight: '800',
  },
  image: {
    width: 86,
    height: 86,
    borderRadius: 18,
    backgroundColor: '#E2E8F1',
  },
  previewCopy: {
    flex: 1,
    gap: 4,
  },
  previewTitle: {
    color: '#13233E',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  previewMeta: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metaItem: {
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F1',
    padding: 12,
    gap: 3,
  },
  metaLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
  },
  metaValue: {
    color: '#13233E',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  cancelledAt: {
    color: '#13233E',
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  refundNote: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  buttonRow: {
    marginTop: 4,
  },
});
