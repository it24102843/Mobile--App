import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { AppButton } from '../../components/AppButton';
import { AppTextField } from '../../components/AppTextField';
import { ScreenHeader } from '../../components/ScreenHeader';
import { AdminBookingCard } from '../../components/admin/AdminBookingCard';
import { AdminBookingFilters } from '../../components/admin/AdminBookingFilters';
import { AdminBookingStats } from '../../components/admin/AdminBookingStats';
import { RoomBookingBell } from '../../components/admin/RoomBookingBell';
import { RoomBookingNotificationModal } from '../../components/admin/RoomBookingNotificationModal';
import { SendCheckoutBillModal } from '../../components/admin/SendCheckoutBillModal';
import { useAuth } from '../../context/AuthContext';
import {
  fetchAdminRoomBookingNotifications,
  fetchAdminRoomBookingNotificationUnreadCount,
  markAllRoomBookingNotificationsRead,
  markRoomBookingNotificationRead,
} from '../../services/adminRoomNotificationsApi';
import {
  approveAdminRoomBooking,
  extractAdminRoomBookingsError,
  fetchAdminRoomBookings,
  markAdminRoomBookingRefunded,
  rejectAdminRoomBooking,
  ROOM_BOOKING_FILTERS,
  sendAdminCheckoutBill,
} from '../../services/adminRoomBookingsApi';
import { theme } from '../../theme';

function normalizeString(value) {
  return `${value ?? ''}`.trim().toLowerCase();
}

function EmptyState({ icon, title, message }) {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name={icon} size={34} color={theme.colors.textSubtle} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

export default function AdminRoomBookingsScreen() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    rejected: 0,
    checkout: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [actionBookingId, setActionBookingId] = useState(null);
  const [billModalVisible, setBillModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [resendMode, setResendMode] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState(null);
  const [notificationActionId, setNotificationActionId] = useState(null);

  useEffect(() => {
    void loadBookings();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void loadUnreadNotificationCount();
      }
    }, [token])
  );

  async function loadBookings(isRefresh = false) {
    if (!token) {
      return;
    }

    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const bookingsResult = await fetchAdminRoomBookings(token);

      setBookings(bookingsResult.bookings);
      setStats(bookingsResult.stats);
      await loadUnreadNotificationCount();
    } catch (loadError) {
      setError(
        extractAdminRoomBookingsError(loadError, 'Unable to load room bookings right now.')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadUnreadNotificationCount() {
    if (!token) {
      return;
    }

    try {
      const unreadCount = await fetchAdminRoomBookingNotificationUnreadCount(token);
      setUnreadNotificationCount(unreadCount);
    } catch {
      setUnreadNotificationCount(0);
    }
  }

  async function loadNotifications(showLoader = false) {
    if (!token) {
      return;
    }

    try {
      setNotificationError(null);
      if (showLoader) {
        setNotificationsLoading(true);
      }

      const response = await fetchAdminRoomBookingNotifications(token);
      setNotifications(response.notifications);
      setUnreadNotificationCount(response.unreadCount);
    } catch (notificationError) {
      setNotificationError(
        notificationError instanceof Error
          ? notificationError.message
          : 'Room booking notifications could not be loaded right now.'
      );
    } finally {
      if (showLoader) {
        setNotificationsLoading(false);
      }
    }
  }

  const filteredBookings = useMemo(() => {
    const query = normalizeString(searchQuery);

    return bookings.filter((booking) => {
      const matchesSearch =
        !query ||
        [
          booking.bookingId,
          booking.guestLabel,
          booking.roomType,
          booking.hotelName,
          booking.roomNumber,
        ].some((value) => normalizeString(value).includes(query));

      if (!matchesSearch) {
        return false;
      }

      if (activeFilter === 'all') {
        return true;
      }

      if (activeFilter === 'rejected') {
        return booking.paymentStatus === 'rejected' || booking.statusLabel === 'Rejected';
      }

      if (activeFilter === 'checkout') {
        return booking.paymentMethod === 'checkout';
      }

      return normalizeString(booking.bookingStatus) === activeFilter;
    });
  }, [activeFilter, bookings, searchQuery]);

  function confirmBookingAction(booking, actionType) {
    const isApprove = actionType === 'approve';
    Alert.alert(
      isApprove ? 'Approve booking?' : 'Reject booking?',
      isApprove
        ? `Approve booking ${booking.bookingId} for ${booking.guestLabel}?`
        : `Reject booking ${booking.bookingId}? This will mark it as rejected/cancelled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isApprove ? 'Approve' : 'Reject',
          style: isApprove ? 'default' : 'destructive',
          onPress: () => void handleBookingAction(booking, actionType),
        },
      ]
    );
  }

  async function handleBookingAction(booking, actionType) {
    const currentStatus = normalizeString(booking.statusLabel);

    if (currentStatus !== 'pending') {
      Alert.alert(
        'Action blocked',
        'Only pending bookings can be approved or rejected from this screen.'
      );
      return;
    }

    try {
      setActionBookingId(booking.bookingId);

      if (actionType === 'approve') {
        await approveAdminRoomBooking(token, booking.bookingId);
        Alert.alert('Booking approved', 'The room booking is now confirmed.');
      } else {
        await rejectAdminRoomBooking(token, booking.bookingId);
        Alert.alert('Booking rejected', 'The room booking was marked as rejected.');
      }

      await loadBookings(true);
    } catch (actionError) {
      Alert.alert(
        'Action failed',
        extractAdminRoomBookingsError(actionError, 'Unable to update booking status.')
      );
    } finally {
      setActionBookingId(null);
    }
  }

  function confirmRefundAction(booking) {
    if (!booking?.canMarkRefunded) {
      Alert.alert(
        'Refund action unavailable',
        'Only cancelled online or bank-paid bookings with Refund Pending can be marked as refunded.'
      );
      return;
    }

    Alert.alert(
      'Mark as refunded?',
      `Mark refund as completed for booking ${booking.bookingId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Refunded',
          onPress: () => void handleMarkRefunded(booking),
        },
      ]
    );
  }

  async function handleMarkRefunded(booking) {
    try {
      setActionBookingId(booking.bookingId);
      await markAdminRoomBookingRefunded(token, booking);
      Alert.alert('Refund updated', 'This room booking is now marked as refunded.');
      await loadBookings(true);
    } catch (refundError) {
      Alert.alert(
        'Refund update failed',
        extractAdminRoomBookingsError(refundError, 'Unable to update refund status right now.')
      );
    } finally {
      setActionBookingId(null);
    }
  }

  async function handleViewSlip(booking) {
    if (!booking.slipUrl) {
      Alert.alert('No payment slip', 'This booking does not have a payment slip yet.');
      return;
    }

    const canOpen = await Linking.canOpenURL(booking.slipUrl);
    if (!canOpen) {
      Alert.alert('Unable to open slip', 'This payment slip link is not supported on this device.');
      return;
    }

    await Linking.openURL(booking.slipUrl);
  }

  function openBillModal(booking, resend = false) {
    if (booking.paymentMethod !== 'checkout') {
      Alert.alert(
        'Checkout bill not available',
        'Checkout bill email is only available for Pay at Checkout bookings.'
      );
      return;
    }

    if (!booking.guestLabel || booking.guestLabel === 'Guest') {
      Alert.alert('Missing email', 'This booking does not have a valid guest email address.');
      return;
    }

    setSelectedBooking(booking);
    setResendMode(resend);
    setBillModalVisible(true);
  }

  async function handleSendCheckoutBill() {
    if (!selectedBooking) {
      return;
    }

    if (selectedBooking.paymentMethod !== 'checkout') {
      Alert.alert(
        'Checkout bill not allowed',
        'Only pay at checkout bookings can receive this bill email.'
      );
      return;
    }

    if (!selectedBooking.guestLabel || selectedBooking.guestLabel === 'Guest') {
      Alert.alert('Missing email', 'This booking does not have a valid guest email address.');
      return;
    }

    try {
      setActionBookingId(selectedBooking.bookingId);
      await sendAdminCheckoutBill(token, selectedBooking.bookingId, resendMode);
      Alert.alert(
        resendMode ? 'Bill email resent' : 'Bill email sent',
        `Checkout bill email was sent to ${selectedBooking.guestLabel}.`
      );
      setBillModalVisible(false);
      setSelectedBooking(null);
      setResendMode(false);
      await loadBookings(true);
    } catch (sendError) {
      Alert.alert(
        'Unable to send bill',
        extractAdminRoomBookingsError(sendError, 'Checkout bill email could not be sent.')
      );
    } finally {
      setActionBookingId(null);
    }
  }

  function handleDownloadReport() {
    Alert.alert(
      'Report action prepared',
      'A dedicated mobile download report endpoint is not available yet. The button is ready for backend report export when you add that API.'
    );
  }

  function handleOpenNotifications() {
    setNotificationModalVisible(true);
    void loadNotifications(true);
  }

  async function handleMarkNotificationRead(notification) {
    if (!notification?.id) {
      return;
    }

    try {
      setNotificationActionId(notification.id);
      await markRoomBookingNotificationRead(token, notification.id);
      await loadNotifications();
      await loadUnreadNotificationCount();
    } catch (notificationError) {
      Alert.alert(
        'Unable to update notification',
        notificationError instanceof Error
          ? notificationError.message
          : 'This notification could not be marked as read.'
      );
    } finally {
      setNotificationActionId(null);
    }
  }

  async function handleMarkAllNotificationsRead() {
    try {
      setNotificationActionId('all');
      await markAllRoomBookingNotificationsRead(token);
      await loadNotifications();
      await loadUnreadNotificationCount();
    } catch (notificationError) {
      Alert.alert(
        'Unable to update notifications',
        notificationError instanceof Error
          ? notificationError.message
          : 'The room booking notifications could not be updated.'
      );
    } finally {
      setNotificationActionId(null);
    }
  }

  function renderContent() {
    if (loading) {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText}>Loading room booking dashboard...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateCard}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={28}
            color={theme.colors.danger}
          />
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Try Again" onPress={() => void loadBookings()} />
        </View>
      );
    }

    if (filteredBookings.length === 0) {
      return (
        <EmptyState
          icon="file-search-outline"
          title="No room bookings found"
          message="Try a different search or filter. When bookings exist in MongoDB, they will appear here."
        />
      );
    }

    return filteredBookings.map((booking) => (
      <View key={booking.bookingId} style={styles.cardWrap}>
        <AdminBookingCard
          booking={booking}
          actionLoading={actionBookingId === booking.bookingId}
          onApprove={() => confirmBookingAction(booking, 'approve')}
          onReject={() => confirmBookingAction(booking, 'reject')}
          onViewSlip={() => void handleViewSlip(booking)}
          onSendBill={() => openBillModal(booking, false)}
          onResendBill={() => openBillModal(booking, true)}
          onMarkRefunded={() => confirmRefundAction(booking)}
        />

        {actionBookingId === booking.bookingId ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.loadingOverlayText}>Updating booking...</Text>
          </View>
        ) : null}
      </View>
    ));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <ScreenHeader
            title="All Room Bookings"
            subtitle={`${stats.total || 0} total bookings`}
            fallbackHref="/admin"
          />

          <View style={styles.topActionsRow}>
            <View style={styles.bellRow}>
              <RoomBookingBell
                unreadCount={unreadNotificationCount}
                onPress={handleOpenNotifications}
              />
              <View style={styles.notificationPill}>
                <Text style={styles.notificationText}>
                  {unreadNotificationCount} cancelled notification(s)
                </Text>
              </View>
            </View>

            <View style={styles.heroButtons}>
              <View style={styles.refreshWrap}>
                <AppButton
                  title={refreshing ? 'Refreshing...' : 'Refresh'}
                  onPress={() => void loadBookings(true)}
                  disabled={refreshing}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={handleDownloadReport}
                style={({ pressed }) => [
                  styles.reportButton,
                  pressed ? styles.pressed : null,
                ]}>
                <MaterialCommunityIcons name="download-outline" size={18} color="#FFFFFF" />
                <Text style={styles.reportButtonText}>Download Report</Text>
              </Pressable>
            </View>
          </View>

          <AdminBookingStats stats={stats} />

          <AppTextField
            label="Search"
            placeholder="Search by booking ID, email, room type, or hotel..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <AdminBookingFilters
            filters={ROOM_BOOKING_FILTERS}
            activeFilter={activeFilter}
            onChange={setActiveFilter}
          />
        </View>

        <View style={styles.listSection}>{renderContent()}</View>
      </ScrollView>

      <SendCheckoutBillModal
        visible={billModalVisible}
        booking={selectedBooking}
        resendMode={resendMode}
        sending={Boolean(selectedBooking && actionBookingId === selectedBooking.bookingId)}
        onClose={() => {
          if (actionBookingId === selectedBooking?.bookingId) {
            return;
          }
          setBillModalVisible(false);
          setSelectedBooking(null);
          setResendMode(false);
        }}
        onSend={() => void handleSendCheckoutBill()}
      />

      <RoomBookingNotificationModal
        visible={notificationModalVisible}
        notifications={notifications}
        unreadCount={unreadNotificationCount}
        loading={notificationsLoading}
        error={notificationError}
        actionLoadingId={notificationActionId}
        markAllLoading={notificationActionId === 'all'}
        onClose={() => {
          if (notificationActionId) {
            return;
          }
          setNotificationModalVisible(false);
        }}
        onMarkRead={(notification) => void handleMarkNotificationRead(notification)}
        onMarkAllRead={() => void handleMarkAllNotificationsRead()}
        onRetry={() => void loadNotifications(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF2F7',
  },
  contentContainer: {
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  heroCard: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F1',
    padding: 20,
    gap: theme.spacing.lg,
    ...theme.shadows.card,
  },
  topActionsRow: {
    gap: theme.spacing.sm,
  },
  bellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  notificationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radii.pill,
    backgroundColor: '#EEF5FF',
    borderWidth: 1,
    borderColor: '#D7E2F2',
  },
  notificationText: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  heroButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  refreshWrap: {
    minWidth: 120,
  },
  reportButton: {
    minHeight: 54,
    borderRadius: theme.radii.lg,
    backgroundColor: '#7D61F5',
    borderWidth: 1,
    borderColor: '#7D61F5',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...theme.shadows.subtle,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  listSection: {
    gap: theme.spacing.lg,
  },
  stateCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F1',
    padding: 24,
    alignItems: 'center',
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  stateText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  errorText: {
    color: theme.colors.errorText,
    textAlign: 'center',
    ...theme.typography.body,
  },
  emptyState: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F1',
    padding: 28,
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.shadows.card,
  },
  emptyTitle: {
    color: '#13233E',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyMessage: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    ...theme.typography.body,
  },
  cardWrap: {
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    right: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: '#E2E8F1',
  },
  loadingOverlayText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  pressed: {
    opacity: 0.92,
  },
});
