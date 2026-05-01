import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PackageBookingCard } from '../../components/admin/PackageBookingCard';
import { PackageBookingStats } from '../../components/admin/PackageBookingStats';
import { PackageBookingFilters } from '../../components/admin/PackageBookingFilters';
import { PackageBookingNotificationModal } from '../../components/admin/PackageBookingNotificationModal';
import { PackageBookingsBell } from '../../components/admin/PackageBookingsBell';
import { useAuth } from '../../context/AuthContext';
import {
  cancelAdminPackageBooking,
  fetchAdminPackageBookingById,
  fetchAdminPackageBookings,
  PACKAGE_BOOKING_FILTERS,
  updateAdminPackageBookingStatus,
} from '../../services/adminPackageBookingsApi';
import {
  fetchAdminPackageBookingNotificationUnreadCount,
  fetchAdminPackageBookingNotifications,
  markAdminPackageBookingNotificationRead,
  markAllAdminPackageBookingNotificationsRead,
} from '../../services/adminPackageNotificationsApi';
import { theme } from '../../theme';

function normalizeString(value) {
  return `${value ?? ''}`.trim().toLowerCase();
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

function EmptyState({ icon, title, message }) {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name={icon} size={34} color={theme.colors.textSubtle} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

export default function AdminPackageBookingsScreen() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [actionBookingId, setActionBookingId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
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

      const response = await fetchAdminPackageBookings(token);
      setBookings(response.bookings);
      setStats(response.stats);
      await loadUnreadNotificationCount();
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load package bookings right now.'
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
      const unreadCount = await fetchAdminPackageBookingNotificationUnreadCount(token);
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

      const response = await fetchAdminPackageBookingNotifications(token);
      setNotifications(response.notifications);
      setUnreadNotificationCount(response.unreadCount);
    } catch (loadError) {
      setNotificationError(
        loadError instanceof Error
          ? loadError.message
          : 'Package booking notifications could not be loaded right now.'
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
          booking.customerName,
          booking.customerEmail,
          booking.packageName,
          booking.selectedVehicleLabel,
        ].some((value) => normalizeString(value).includes(query));

      if (!matchesSearch) {
        return false;
      }

      if (activeFilter === 'all') {
        return true;
      }

      return normalizeString(booking.statusLabel) === activeFilter;
    });
  }, [activeFilter, bookings, searchQuery]);

  function confirmStatusUpdate(booking, nextStatus) {
    const isCancel = nextStatus === 'Cancelled';

    Alert.alert(
      isCancel ? 'Cancel booking?' : 'Confirm booking?',
      isCancel
        ? `Cancel package booking ${booking.bookingId} for ${booking.customerName}?`
        : `Confirm package booking ${booking.bookingId}?`,
      [
        { text: 'Back', style: 'cancel' },
        {
          text: isCancel ? 'Cancel Booking' : 'Confirm Booking',
          style: isCancel ? 'destructive' : 'default',
          onPress: () => void handleStatusUpdate(booking, nextStatus),
        },
      ]
    );
  }

  async function handleStatusUpdate(booking, nextStatus) {
    if (booking.statusLabel !== 'Pending') {
      Alert.alert('Action blocked', 'Only pending package bookings can be changed here.');
      return;
    }

    try {
      setActionBookingId(booking.bookingId);

      if (nextStatus === 'Cancelled') {
        const response = await cancelAdminPackageBooking(token, booking.bookingId);
        Alert.alert('Booking cancelled', response?.message || 'The package booking was cancelled.');
      } else {
        const response = await updateAdminPackageBookingStatus(token, booking.bookingId, nextStatus);
        Alert.alert('Booking updated', response?.message || `Booking marked as ${nextStatus}.`);
      }

      await loadBookings(true);
    } catch (actionError) {
      Alert.alert(
        'Action failed',
        actionError instanceof Error
          ? actionError.message
          : 'Unable to update this package booking right now.'
      );
    } finally {
      setActionBookingId(null);
    }
  }

  async function handleViewDetails(booking) {
    try {
      const details = await fetchAdminPackageBookingById(token, booking.bookingId);
      const lines = [
        `Booking ID: ${details.bookingId}`,
        `Customer: ${details.customerName}`,
        `Email: ${details.customerEmail}`,
        `Package: ${details.packageName}`,
        `Vehicle: ${details.selectedVehicleLabel || 'Not selected'}`,
        `Meal Package: ${getMealPackageLabel(details.mealPackage) || 'Not selected'}`,
        `Tour Date: ${details.tourDateLabel}`,
        `Guests: ${details.guestCountLabel}`,
        `Total Amount: ${details.totalAmountLabel}`,
        `Status: ${details.statusLabel}`,
        `Payment Method: ${details.paymentMethod}`,
        `Created: ${details.orderDateLabel}`,
      ];

      Alert.alert('Package Booking Details', lines.join('\n'));
    } catch (detailError) {
      Alert.alert(
        'Unable to load details',
        detailError instanceof Error
          ? detailError.message
          : 'This package booking could not be loaded.'
      );
    }
  }

  function handleDownloadReport() {
    Alert.alert(
      'Report action prepared',
      'A dedicated package booking report export endpoint is not available yet. The button is ready for that backend API when you add it.'
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
      await markAdminPackageBookingNotificationRead(token, notification.id);
      await loadNotifications();
      await loadUnreadNotificationCount();
    } catch (error) {
      Alert.alert(
        'Unable to update notification',
        error instanceof Error ? error.message : 'This notification could not be updated.'
      );
    } finally {
      setNotificationActionId(null);
    }
  }

  async function handleMarkAllNotificationsRead() {
    try {
      setNotificationActionId('all');
      await markAllAdminPackageBookingNotificationsRead(token);
      await loadNotifications();
      await loadUnreadNotificationCount();
    } catch (error) {
      Alert.alert(
        'Unable to update notifications',
        error instanceof Error ? error.message : 'The notifications could not be updated.'
      );
    } finally {
      setNotificationActionId(null);
    }
  }

  function renderContent() {
    if (loading) {
      return (
        <AppCard style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText}>Loading package booking dashboard...</Text>
        </AppCard>
      );
    }

    if (error) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Retry" onPress={() => void loadBookings()} />
        </AppCard>
      );
    }

    if (!filteredBookings.length) {
      return (
        <EmptyState
          icon="file-search-outline"
          title="No package bookings found"
          message="Try a different search or status filter. Real package bookings will appear here from MongoDB."
        />
      );
    }

    return filteredBookings.map((booking) => (
      <PackageBookingCard
        key={booking.bookingId}
        booking={booking}
        actionLoading={actionBookingId === booking.bookingId}
        onConfirm={() => confirmStatusUpdate(booking, 'Confirmed')}
        onCancel={() => confirmStatusUpdate(booking, 'Cancelled')}
        onDetails={() => void handleViewDetails(booking)}
      />
    ));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <ScreenHeader
            title="Package Booking Management"
            subtitle={`${stats.total} total bookings`}
            fallbackHref="/admin"
          />

          <View style={styles.topActionsRow}>
            <View style={styles.bellRow}>
              <PackageBookingsBell
                unreadCount={unreadNotificationCount}
                onPress={handleOpenNotifications}
              />
              <View style={styles.notificationPill}>
                <Text style={styles.notificationText}>
                  {unreadNotificationCount} notification(s)
                </Text>
              </View>
            </View>

            <View style={styles.heroButtons}>
              <View style={styles.badgeWrap}>
                <Text style={styles.totalBadgeText}>{stats.total} Total Bookings</Text>
              </View>
              <View style={styles.refreshWrap}>
                <AppButton
                  title={refreshing ? 'Refreshing...' : 'Refresh'}
                  variant="secondary"
                  onPress={() => void loadBookings(true)}
                  disabled={refreshing}
                />
              </View>
              <View style={styles.refreshWrap}>
                <AppButton
                  title="Download Report"
                  variant="info"
                  onPress={handleDownloadReport}
                />
              </View>
            </View>
          </View>

          <PackageBookingStats stats={stats} />

          <AppTextField
            label="Search"
            placeholder="Search by booking ID, customer, email, or package..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <PackageBookingFilters
            filters={PACKAGE_BOOKING_FILTERS}
            activeFilter={activeFilter}
            onChange={setActiveFilter}
          />
        </View>

        <View style={styles.listSection}>{renderContent()}</View>
      </ScrollView>

      <PackageBookingNotificationModal
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
  badgeWrap: {
    minHeight: 54,
    borderRadius: theme.radii.lg,
    backgroundColor: '#EEF5FF',
    borderWidth: 1,
    borderColor: '#D7E2F2',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalBadgeText: {
    color: theme.colors.primary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  refreshWrap: {
    minWidth: 130,
  },
  listSection: {
    gap: theme.spacing.lg,
  },
  stateCard: {
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  stateText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
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
});
