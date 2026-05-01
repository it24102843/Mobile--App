import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import {
  cancelGearOrder,
  cancelVehicleBooking,
  fetchMyBookings,
} from '../../api/bookings';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { BrandLogo } from '../../components/BrandLogo';
import { PackageBookingCard } from '../../components/bookings/PackageBookingCard';
import { VehicleBookingCard } from '../../components/bookings/VehicleBookingCard';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth, useRequireAuth } from '../../hooks/useAuth';
import { cancelMyFoodOrder } from '../../services/foodOrdersApi';
import { cancelMyPackageBooking, normalizeMyPackageBooking } from '../../services/packageBookingsApi';
import { cancelMyRoomBooking } from '../../services/roomBookingsApi';
import { theme } from '../../theme';
import { getDefaultImage, resolveMediaUrl } from '../../utils/media';
import {
  formatPaymentMethodLabel,
  formatPaymentStatusLabel,
  getRefundStatusMeta,
  normalizeRoomBooking,
  resolveRoomBookingImage,
} from '../../utils/roomBooking';

const TABS = [
  { key: 'packages', label: 'Package Bookings' },
  { key: 'orders', label: 'Rental Orders' },
  { key: 'food', label: 'Food Orders' },
  { key: 'safari', label: 'Safari Bookings' },
  { key: 'rooms', label: 'Room Bookings' },
];

const EMPTY_MESSAGES = {
  packages: 'No package bookings found for this account yet.',
  orders: 'No rental orders found for this account yet.',
  food: 'No restaurant food orders found for this account yet.',
  safari: 'No safari vehicle bookings found for this account yet.',
  rooms: 'No room bookings found for this account yet.',
};

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
  if (typeof value !== 'number') {
    return 'LKR 0';
  }

  return `LKR ${new Intl.NumberFormat('en-LK').format(value)}`;
}

function normalizeOrderStatus(status) {
  switch (status) {
    case 'Approved':
    case 'Confirmed':
      return { label: status, variant: 'primary' };
    case 'Rejected':
    case 'Cancelled':
      return { label: status, variant: 'danger' };
    case 'Completed':
      return { label: 'Completed', variant: 'info' };
    default:
      return { label: status || 'Pending', variant: 'warning' };
  }
}

function normalizeFoodOrderStatus(status) {
  switch (status) {
    case 'Confirmed':
      return { label: 'Confirmed', variant: 'primary' };
    case 'Preparing':
      return { label: 'Preparing', variant: 'info' };
    case 'Completed':
      return { label: 'Completed', variant: 'info' };
    case 'Cancelled':
      return { label: 'Cancelled', variant: 'danger' };
    default:
      return { label: status || 'Pending', variant: 'warning' };
  }
}

function buildPackageCancellationMeta(booking) {
  const createdAt = new Date(booking?.createdAt);
  const now = Date.now();
  const createdAtTime = createdAt.getTime();
  const activeStatus = `${booking?.status || ''}`.trim();

  if (activeStatus === 'Cancelled') {
    return {
      canCancel: false,
      cancellationHint: 'This package booking has already been cancelled.',
    };
  }

  if (activeStatus === 'Completed') {
    return {
      canCancel: false,
      cancellationHint: 'Completed package bookings can no longer be cancelled.',
    };
  }

  if (activeStatus === 'Confirmed') {
    return {
      canCancel: false,
      cancellationHint: 'Confirmed package bookings can no longer be cancelled.',
    };
  }

  if (Number.isNaN(createdAtTime)) {
    return {
      canCancel: false,
      cancellationHint: 'Package bookings can only be cancelled within 24 hours of booking.',
    };
  }

  const diffMs = now - createdAtTime;
  const windowMs = 24 * 60 * 60 * 1000;

  if (diffMs > windowMs) {
    return {
      canCancel: false,
      cancellationHint: 'Cancellation window expired. Package bookings can only be cancelled within 24 hours of booking.',
    };
  }

  const remainingMs = Math.max(windowMs - diffMs, 0);
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    canCancel: true,
    cancellationHint: `Cancellation available. Cancel within: ${remainingHours}h ${remainingMinutes}m remaining.`,
  };
}

function normalizePackageBooking(booking) {
  const cancellationMeta = buildPackageCancellationMeta(booking);

  return normalizeMyPackageBooking({
    ...booking,
    paymentMethodLabel: formatPaymentMethodLabel(booking.paymentMethod),
    paymentStatusLabel: formatPaymentStatusLabel(booking.paymentStatus),
    refundStatusMeta: getRefundStatusMeta(booking.refundStatus),
    canCancel: cancellationMeta.canCancel,
    cancellationHint: cancellationMeta.cancellationHint,
  });
}

function normalizeOrderBooking(order) {
  const startDate = new Date(order.startingDate);
  const normalizedStatus = `${order.status || ''}`.trim().toLowerCase();
  const canCancel =
    normalizedStatus !== 'cancelled' &&
    normalizedStatus !== 'completed' &&
    normalizedStatus !== 'approved' &&
    normalizedStatus !== 'confirmed' &&
    !Number.isNaN(startDate.getTime()) &&
    new Date() < startDate;

  return {
    ...order,
    paymentMethodLabel: formatPaymentMethodLabel(order.paymentMethod),
    paymentStatusLabel: formatPaymentStatusLabel(order.paymentStatus),
    refundStatusMeta: getRefundStatusMeta(order.refundStatus),
    canCancel,
  };
}

function buildSafariDetails(booking) {
  const lines = [
    `Booking ID: ${booking.bookingId}`,
    `Vehicle: ${booking.vehicleName}`,
    `Registration: ${booking.regNo}`,
    `Vehicle Type: ${booking.vehicleType}`,
    `Passengers: ${booking.passengers}`,
    `Trip Start: ${formatDate(booking.startDate)}`,
    `Trip End: ${formatDate(booking.endDate)}`,
    `Total Days: ${booking.totalDays}`,
    `Price / Day: ${formatCurrency(booking.pricePerDay)}`,
    `Total Price: ${formatCurrency(booking.totalPrice)}`,
    `Payment Method: ${booking.paymentMethodLabel || 'Not selected'}`,
    `Payment Status: ${booking.paymentStatusLabel || 'Pending'}`,
  ];

  if (booking.customerName) {
    lines.push(`Customer: ${booking.customerName}`);
  }

  if (booking.specialRequests) {
    lines.push(`Special Requests: ${booking.specialRequests}`);
  }

  return lines.join('\n');
}

function buildFoodOrderDetails(order) {
  const lines = [
    `Order ID: ${order.orderId}`,
    `Restaurant: ${order.restaurantName}`,
    `Food Item: ${order.foodName}`,
    `Quantity: ${order.quantity}`,
    `Pickup / Delivery: ${order.fulfillmentMethod}`,
    `Order Date: ${formatDate(order.orderDate)}`,
    `Total: ${formatCurrency(order.totalAmount)}`,
    `Customer: ${order.customerName}`,
    `Email: ${order.customerEmail || 'Not available'}`,
    `Contact: ${order.customerPhone || 'Not available'}`,
    `Status: ${order.statusLabel || order.status || 'Pending'}`,
  ];

  if (order.specialNote) {
    lines.push(`Special Note: ${order.specialNote}`);
  }

  return lines.join('\n');
}

function mapBookingsState(data) {
  return {
    packages: (data.packages || []).map(normalizePackageBooking),
    orders: (data.equipment || []).map(normalizeOrderBooking),
    food: data.food || [],
    safari: data.safari || [],
    rooms: (data.rooms || []).map(normalizeRoomBooking),
  };
}

export default function MyBookingsScreen() {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const { isAuthenticated, token } = useAuth();
  const [activeTab, setActiveTab] = useState('packages');
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: null,
  });

  const loadBookings = useCallback(async () => {
    if (!token) {
      return;
    }

    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));

    try {
      const data = await fetchMyBookings(token);

      setState({
        loading: false,
        data: mapBookingsState(data),
        error: null,
      });
    } catch (error) {
      setState({
        loading: false,
        data: null,
        error,
      });
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth('/my-bookings', { showAlert: false });
      return;
    }

    loadBookings();
  }, [isAuthenticated, requireAuth, loadBookings]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadBookings();
      }
    }, [isAuthenticated, loadBookings])
  );

  const activeItems = useMemo(() => {
    if (!state.data) {
      return [];
    }

    return state.data[activeTab] || [];
  }, [activeTab, state.data]);

  if (!isAuthenticated) {
    return null;
  }

  const handlePackageCancel = (booking) => {
    if (!booking.canCancel) {
      Alert.alert(
        'Cannot Cancel Booking',
        booking.cancellationHint || 'Package bookings can only be cancelled within 24 hours of booking.'
      );
      return;
    }

    Alert.alert(
      'Cancel Package Booking',
      `Do you want to cancel package booking ${booking.bookingId}?`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await cancelMyPackageBooking(token, booking.bookingId);
              Alert.alert(
                'Booking Cancelled',
                response?.message || 'Your package booking has been cancelled.'
              );
              await loadBookings();
            } catch (error) {
              Alert.alert(
                'Cancellation Failed',
                error instanceof Error
                  ? error.message
                  : 'Unable to cancel this package booking right now.'
              );
            }
          },
        },
      ]
    );
  };

  const handleRoomCancel = (booking) => {
    Alert.alert(
      'Cancel Room Booking',
      `Do you want to cancel room booking ${booking.bookingId}?`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
                const response = await cancelMyRoomBooking(token, booking.bookingId);
              Alert.alert(
                'Booking Updated',
                response?.message || 'Your room booking has been cancelled.'
              );
              await loadBookings();
            } catch (error) {
              Alert.alert(
                'Cancellation Failed',
                error instanceof Error
                  ? error.message
                  : 'Unable to cancel this room booking right now.'
              );
            }
          },
        },
      ]
    );
  };

  const handleSafariCancel = (booking) => {
    Alert.alert(
      'Cancel Safari Booking',
      `Do you want to cancel safari booking for ${booking.vehicleName}?`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await cancelVehicleBooking(token, booking._id);
              Alert.alert(
                'Booking Updated',
                response?.message || 'Your safari booking has been cancelled.'
              );
              await loadBookings();
            } catch (error) {
              Alert.alert(
                'Cancellation Failed',
                error instanceof Error
                  ? error.message
                  : 'Unable to cancel this safari booking right now.'
              );
            }
          },
        },
      ]
    );
  };

  const handleOrderCancel = (order) => {
    Alert.alert(
      'Cancel Rental Order',
      `Do you want to cancel rental order ${order.orderId}?`,
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await cancelGearOrder(token, order.orderId);
              Alert.alert(
                'Order Updated',
                response?.message || 'Your rental order has been cancelled.'
              );
              await loadBookings();
            } catch (error) {
              Alert.alert(
                'Cancellation Failed',
                error instanceof Error
                  ? error.message
                  : 'Unable to cancel this rental order right now.'
              );
            }
          },
        },
      ]
    );
  };

  const handleFoodOrderCancel = (order) => {
    if (!order.canCancel) {
      Alert.alert('Cannot Cancel Order', order.cancellationHint || 'This food order cannot be cancelled.');
      return;
    }

    Alert.alert(
      'Cancel Food Order',
      `Do you want to cancel food order ${order.orderId}?`,
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await cancelMyFoodOrder(token, order.id || order.orderId);
              Alert.alert(
                'Order Updated',
                response?.message || 'Your food order has been cancelled.'
              );
              await loadBookings();
            } catch (error) {
              Alert.alert(
                'Cancellation Failed',
                error instanceof Error
                  ? error.message
                  : 'Unable to cancel this food order right now.'
              );
            }
          },
        },
      ]
    );
  };

  const openDetails = (title, message) => {
    Alert.alert(title, message);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="My Bookings"
          subtitle="Manage your package bookings, rental orders, food orders, safari bookings, and room reservations."
        />

        <AppCard variant="primary" style={styles.heroCard}>
          <BrandLogo size="sm" pressable href="/(tabs)" />
          <Text style={styles.heroTitle}>My Bookings</Text>
          <Text style={styles.heroSubtitle}>
            Review your protected booking activity with the same WildHaven booking flow, adapted for mobile, including restaurant orders.
          </Text>
        </AppCard>

        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabButton,
                activeTab === tab.key ? styles.tabButtonActive : null,
              ]}>
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.key ? styles.tabLabelActive : null,
                ]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {state.loading ? <HomeSectionState loading /> : null}

        {!state.loading && state.error ? (
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load your bookings right now. Please try again.
            </Text>
            <View style={styles.retryWrap}>
              <AppButton title="Retry" onPress={loadBookings} />
            </View>
          </AppCard>
        ) : null}

        {!state.loading && !activeItems.length ? (
          <HomeSectionState message={EMPTY_MESSAGES[activeTab]} />
        ) : null}

        {!state.loading && activeTab === 'packages'
          ? activeItems.map((booking) => (
              <PackageBookingCard
                key={booking.bookingId}
                booking={booking}
                onCancel={() => handlePackageCancel(booking)}
                onDetails={() => router.push(`/bookings/packages/${booking.bookingId}`)}
              />
            ))
          : null}

        {!state.loading && activeTab === 'orders'
          ? activeItems.map((order) => (
              <OrderBookingCard
                key={order.orderId}
                order={order}
                onCancel={() => handleOrderCancel(order)}
                onDetails={() => router.push(`/bookings/orders/${order.orderId}`)}
              />
            ))
          : null}

        {!state.loading && activeTab === 'food'
          ? activeItems.map((order) => (
              <FoodOrderCard
                key={order.id || order.orderId}
                order={order}
                onCancel={() => handleFoodOrderCancel(order)}
                onDetails={() =>
                  openDetails('Food Order Details', buildFoodOrderDetails(order))
                }
              />
            ))
          : null}

        {!state.loading && activeTab === 'safari'
          ? activeItems.map((booking) => (
              <VehicleBookingCard
                key={booking.bookingId}
                booking={booking}
                onCancel={() => handleSafariCancel(booking)}
                onDetails={() =>
                  openDetails('Safari Booking Details', buildSafariDetails(booking))
                }
              />
            ))
          : null}

        {!state.loading && activeTab === 'rooms'
          ? activeItems.map((booking) => (
              <RoomBookingCard
                key={booking.bookingId}
                booking={booking}
                onCancel={() => handleRoomCancel(booking)}
                onDetails={() => router.push(`/bookings/rooms/${booking.bookingId}`)}
              />
            ))
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function OrderBookingCard({ order, onCancel, onDetails }) {
  const status = normalizeOrderStatus(order.status);
  const firstImage = order.orderedItems?.[0]?.product?.image;

  return (
    <AppCard style={styles.bookingCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderCopy}>
          <Text style={styles.cardTitle}>Rental Order</Text>
          <Text style={styles.cardSubtitle}>Order ID: {order.orderId}</Text>
        </View>
        <StatusBadge label={status.label} variant={status.variant} />
      </View>

      <View style={styles.orderPreviewRow}>
        <Image
          source={{ uri: resolveMediaUrl(firstImage, getDefaultImage()) }}
          style={styles.orderImage}
          contentFit="cover"
        />
        <View style={styles.orderPreviewCopy}>
          <Text style={styles.orderTitle}>
            {order.orderedItems?.[0]?.product?.name || 'Rental Items'}
          </Text>
          <Text style={styles.orderSubtitle}>
            {order.orderedItems?.length || 0} item(s) - {order.days} day(s)
          </Text>
        </View>
      </View>

      <InfoRow icon="calendar-start" label="Start" value={formatDate(order.startingDate)} />
      <InfoRow icon="calendar-end" label="End" value={formatDate(order.endingDate)} />
      <InfoRow icon="credit-card-outline" label="Payment Method" value={order.paymentMethodLabel} />
      <InfoRow icon="check-decagram-outline" label="Payment Status" value={order.paymentStatusLabel} />
      <InfoRow icon="cash-multiple" label="Total" value={formatCurrency(order.totalAmount)} />

      {order.refundStatusMeta ? (
        <InfoRow icon="cash-refund" label="Refund" value={order.refundStatusMeta.label} />
      ) : null}

      <View style={styles.actionRow}>
        <View style={styles.flexButton}>
          <AppButton title="Details" variant="secondary" onPress={onDetails} />
        </View>
        {order.canCancel ? (
          <View style={styles.flexButton}>
            <AppButton title="Cancel" variant="danger" onPress={onCancel} />
          </View>
        ) : null}
      </View>
    </AppCard>
  );
}

function FoodOrderCard({ order, onCancel, onDetails }) {
  const status = normalizeFoodOrderStatus(order.status);
  const orderImage = resolveMediaUrl(order.imageUrl, getDefaultImage());

  return (
    <AppCard style={styles.bookingCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderCopy}>
          <Text style={styles.cardTitle}>{order.foodName || 'Food Order'}</Text>
          <Text style={styles.cardSubtitle}>Order ID: {order.orderId}</Text>
        </View>
        <StatusBadge label={status.label} variant={status.variant} />
      </View>

      <View style={styles.orderPreviewRow}>
        <Image source={{ uri: orderImage }} style={styles.orderImage} contentFit="cover" />
        <View style={styles.orderPreviewCopy}>
          <Text style={styles.orderTitle}>{order.restaurantName || 'Restaurant'}</Text>
          <Text style={styles.orderSubtitle}>
            {order.quantity} item(s) - {order.fulfillmentMethod}
          </Text>
        </View>
      </View>

      <View style={styles.summaryHighlightBox}>
        <View>
          <Text style={styles.summaryHighlightLabel}>Order total</Text>
          <Text style={styles.summaryHighlightMeta}>{order.foodName || 'Food item selected'}</Text>
        </View>
        <Text style={styles.summaryHighlightValue}>{formatCurrency(order.totalAmount)}</Text>
      </View>

      <InfoRow icon="silverware-fork-knife" label="Food Item" value={order.foodName} />
      <InfoRow icon="calendar-range" label="Order Date" value={formatDate(order.orderDate)} />
      <InfoRow icon="account-outline" label="Customer" value={order.customerName} />
      <InfoRow icon="email-outline" label="Email" value={order.customerEmail || 'Not available'} />
      <InfoRow
        icon="phone-outline"
        label="Contact"
        value={order.customerPhone || 'Not available'}
      />
      <InfoRow icon="basket-outline" label="Quantity" value={`${order.quantity}`} />

      {order.specialNote ? (
        <View style={styles.notePanel}>
          <Text style={styles.notePanelLabel}>Special Note</Text>
          <Text style={styles.specialText}>{order.specialNote}</Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <View style={styles.flexButton}>
          <AppButton title="Details" variant="secondary" onPress={onDetails} />
        </View>
        {order.canCancel ? (
          <View style={styles.flexButton}>
            <AppButton title="Cancel" variant="danger" onPress={onCancel} />
          </View>
        ) : null}
      </View>

      {order.cancellationHint ? (
        <View style={styles.warningPanel}>
          <Text style={styles.noteText}>{order.cancellationHint}</Text>
        </View>
      ) : null}
    </AppCard>
  );
}

function RoomBookingCard({ booking, onCancel, onDetails }) {
  return (
    <AppCard style={styles.bookingCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderCopy}>
          <Text style={styles.cardTitle}>{booking.room?.hotelName || 'Room Booking'}</Text>
          <Text style={styles.cardSubtitle}>Booking ID: {booking.bookingId}</Text>
        </View>
        <StatusBadge
          label={booking.bookingStatusMeta.label}
          variant={booking.bookingStatusMeta.variant}
        />
      </View>

      <View style={styles.roomPreviewRow}>
        <Image
          source={{ uri: booking.roomImageUrl || resolveRoomBookingImage(booking) }}
          style={styles.roomImage}
          contentFit="cover"
        />
        <View style={styles.roomPreviewCopy}>
          <Text style={styles.orderTitle}>
            {booking.room?.roomType || 'Room'} - {booking.room?.roomNumber || '-'}
          </Text>
          <Text style={styles.orderSubtitle}>
            {formatCurrency(booking.room?.price)} / night
          </Text>
        </View>
      </View>

      <View style={styles.summaryHighlightBox}>
        <View>
          <Text style={styles.summaryHighlightLabel}>Stay total</Text>
          <Text style={styles.summaryHighlightMeta}>
            {booking.numberOfNights} night{booking.numberOfNights === 1 ? '' : 's'} · {booking.numberOfGuests} guest{booking.numberOfGuests === 1 ? '' : 's'}
          </Text>
        </View>
        <Text style={styles.summaryHighlightValue}>{formatCurrency(booking.totalAmount)}</Text>
      </View>

      <InfoRow icon="calendar-start" label="Check In" value={formatDate(booking.checkInDate)} />
      <InfoRow icon="calendar-end" label="Check Out" value={formatDate(booking.checkOutDate)} />
      <InfoRow icon="account-group-outline" label="Guests" value={`${booking.numberOfGuests}`} />
      <InfoRow icon="weather-night" label="Nights" value={`${booking.numberOfNights}`} />
      <InfoRow icon="credit-card-outline" label="Payment Method" value={booking.paymentMethodLabel} />
      <InfoRow icon="check-decagram-outline" label="Payment Status" value={booking.paymentStatusLabel} />

      {booking.refundStatusMeta ? (
        <InfoRow icon="cash-refund" label="Refund" value={booking.refundStatusMeta.label} />
      ) : null}

      {booking.specialRequests ? (
        <View style={styles.notePanel}>
          <Text style={styles.notePanelLabel}>Special Requests</Text>
          <Text style={styles.specialText}>{booking.specialRequests}</Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <View style={styles.flexButton}>
          <AppButton title="Details" variant="secondary" onPress={onDetails} />
        </View>
        {booking.canCancel ? (
          <View style={styles.flexButton}>
            <AppButton title="Cancel" variant="danger" onPress={onCancel} />
          </View>
        ) : null}
      </View>

      <View style={styles.warningPanel}>
        <Text style={styles.noteText}>{booking.cancellationHint}</Text>
      </View>

      {booking.refundMessage ? (
        <View style={styles.warningPanel}>
          <Text style={styles.noteText}>{booking.refundMessage}</Text>
        </View>
      ) : null}
    </AppCard>
  );
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  heroCard: {
    gap: theme.spacing.sm,
  },
  heroTitle: {
    color: theme.colors.textOnDark,
    ...theme.typography.screenTitle,
  },
  heroSubtitle: {
    color: '#DDE7F4',
    ...theme.typography.body,
  },
  tabRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  tabButton: {
    minHeight: 46,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
    minWidth: '47%',
    flexGrow: 1,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabLabel: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabLabelActive: {
    color: theme.colors.textOnDark,
  },
  bookingCard: {
    gap: theme.spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  cardHeaderCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  infoLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  infoValue: {
    color: theme.colors.text,
    ...theme.typography.bodySmall,
    fontWeight: '700',
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  flexButton: {
    flex: 1,
  },
  orderPreviewRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  orderImage: {
    width: 72,
    height: 72,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primarySoft,
  },
  roomPreviewRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  roomImage: {
    width: 88,
    height: 88,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primarySoft,
  },
  orderPreviewCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  roomPreviewCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  summaryHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: '#F2D39D',
    backgroundColor: '#FFF6E4',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  summaryHighlightLabel: {
    color: theme.colors.warningText,
    ...theme.typography.eyebrow,
  },
  summaryHighlightMeta: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    marginTop: 4,
  },
  summaryHighlightValue: {
    color: theme.colors.accent,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'right',
  },
  orderTitle: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  orderSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  specialText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  notePanel: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#DDE5F1',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: 6,
  },
  notePanelLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.eyebrow,
  },
  warningPanel: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#F2D39D',
    backgroundColor: '#FFF8E8',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  noteText: {
    color: theme.colors.warningText,
    ...theme.typography.bodySmall,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
  retryWrap: {
    marginTop: theme.spacing.md,
  },
});
