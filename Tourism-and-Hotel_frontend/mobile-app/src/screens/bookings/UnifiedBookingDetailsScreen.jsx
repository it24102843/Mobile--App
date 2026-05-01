import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import {
  cancelGearOrder,
  cancelPackageBooking,
  cancelRoomBooking,
  cancelVehicleBooking,
  fetchBookingDetails,
} from '../../api/bookings';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth, useRequireAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';
import { getDefaultImage, resolveMediaUrl } from '../../utils/media';
import { normalizeUnifiedBooking } from '../../utils/unifiedBookings';

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
  return `LKR ${new Intl.NumberFormat('en-LK').format(value || 0)}`;
}

export default function UnifiedBookingDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const requireAuth = useRequireAuth();
  const { isAuthenticated, token } = useAuth();
  const type = typeof params.type === 'string' ? params.type : '';
  const bookingId = typeof params.bookingId === 'string' ? params.bookingId : '';
  const [state, setState] = useState({
    loading: true,
    error: null,
    booking: null,
  });

  const loadBooking = useCallback(async () => {
    if (!token || !type || !bookingId) {
      return;
    }

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const booking = await fetchBookingDetails(token, type, bookingId);
      setState({
        loading: false,
        error: null,
        booking: normalizeUnifiedBooking(booking),
      });
    } catch (error) {
      setState({
        loading: false,
        error,
        booking: null,
      });
    }
  }, [bookingId, token, type]);

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth('/my-bookings', { showAlert: false });
      return;
    }

    loadBooking();
  }, [isAuthenticated, loadBooking, requireAuth]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadBooking();
      }
    }, [isAuthenticated, loadBooking])
  );

  const detailRows = useMemo(() => {
    const booking = state.booking;

    if (!booking) {
      return [];
    }

    const commonRows = [
      { label: 'Booking Type', value: booking.typeLabel },
      { label: 'Booking Status', value: booking.bookingStatusMeta.label },
      { label: 'Payment Method', value: booking.paymentMethodLabel },
      { label: 'Payment Status', value: booking.paymentStatusLabel },
      { label: 'Refund Status', value: booking.refundStatusLabel },
      { label: 'Start Date', value: formatDate(booking.startDate) },
      { label: 'End Date', value: formatDate(booking.endDate) },
      { label: 'Total Amount', value: formatCurrency(booking.totalAmount) },
    ];

    if (booking.type === 'room') {
      return [
        ...commonRows,
        { label: 'Hotel', value: booking.details?.room?.hotelName || 'Not available' },
        { label: 'Room', value: `${booking.details?.room?.roomType || 'Room'} - ${booking.details?.room?.roomNumber || ''}`.trim() },
        { label: 'Guests', value: `${booking.details?.numberOfGuests || 0}` },
        { label: 'Nights', value: `${booking.details?.numberOfNights || 0}` },
      ];
    }

    if (booking.type === 'package') {
      return [
        ...commonRows,
        { label: 'Package', value: booking.title },
        { label: 'Guests', value: `${booking.details?.guests || 0}` },
        { label: 'Base Price / Person', value: formatCurrency(booking.details?.basePricePerPerson || 0) },
        { label: 'Vehicle Total', value: formatCurrency(booking.details?.vehicleTotal || 0) },
        { label: 'Add-on Total', value: formatCurrency(booking.details?.addOnTotal || 0) },
      ];
    }

    if (booking.type === 'safari') {
      return [
        ...commonRows,
        { label: 'Vehicle', value: booking.title },
        { label: 'Registration', value: booking.details?.regNo || 'Not available' },
        { label: 'Passengers', value: `${booking.details?.passengers || 0}` },
        { label: 'Trip Days', value: `${booking.details?.totalDays || 0}` },
        { label: 'Price / Day', value: formatCurrency(booking.details?.pricePerDay || 0) },
      ];
    }

    if (booking.type === 'storage') {
      return [
        ...commonRows,
        { label: 'Order ID', value: booking.details?.orderId || booking.id },
        { label: 'Rental Days', value: `${booking.details?.days || 0}` },
        { label: 'Selected Items', value: `${booking.details?.orderedItems?.length || 0}` },
      ];
    }

    return commonRows;
  }, [state.booking]);

  if (!isAuthenticated) {
    return null;
  }

  const handleCancel = () => {
    if (!state.booking?.canCancel) {
      return;
    }

    Alert.alert(
      'Cancel Booking',
      'Do you want to cancel this booking?',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              if (state.booking.type === 'room') {
                await cancelRoomBooking(token, state.booking.id);
              } else if (state.booking.type === 'package') {
                await cancelPackageBooking(token, state.booking.id);
              } else if (state.booking.type === 'safari') {
                await cancelVehicleBooking(token, state.booking.id);
              } else if (state.booking.type === 'storage') {
                await cancelGearOrder(token, state.booking.id);
              }

              Alert.alert('Booking Cancelled', 'The booking has been updated successfully.');
              await loadBooking();
            } catch (error) {
              Alert.alert(
                'Cancellation Failed',
                error instanceof Error
                  ? error.message
                  : 'Unable to cancel this booking right now.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Booking Details"
          subtitle="Review the full booking information for this reservation."
          fallbackHref="/my-bookings"
        />

        {state.loading ? <HomeSectionState loading /> : null}

        {!state.loading && state.error ? (
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load this booking right now. Please try again.
            </Text>
            <View style={styles.retryWrap}>
              <AppButton title="Retry" onPress={loadBooking} />
            </View>
          </AppCard>
        ) : null}

        {!state.loading && state.booking ? (
          <>
            <AppCard style={styles.heroCard} padded={false}>
              <Image
                source={{ uri: resolveMediaUrl(state.booking.image, getDefaultImage()) }}
                style={styles.heroImage}
                contentFit="cover"
              />
              <View style={styles.heroContent}>
                <View style={styles.heroTopRow}>
                  <View style={styles.heroCopy}>
                    <Text style={styles.heroTitle}>{state.booking.title}</Text>
                    <Text style={styles.heroSubtitle}>{state.booking.typeLabel}</Text>
                  </View>
                  <StatusBadge
                    label={state.booking.bookingStatusMeta.label}
                    variant={state.booking.bookingStatusMeta.variant}
                  />
                </View>
              </View>
            </AppCard>

            <AppCard style={styles.detailsCard}>
              {detailRows.map((row) => (
                <View key={row.label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
              ))}
            </AppCard>

            {state.booking.details?.specialRequests ? (
              <AppCard style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Special Requests</Text>
                <Text style={styles.bodyText}>{state.booking.details.specialRequests}</Text>
              </AppCard>
            ) : null}

            {state.booking.type === 'package' && state.booking.details?.selectedVehicle?.vehicleName ? (
              <AppCard style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Selected Vehicle</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Vehicle</Text>
                  <Text style={styles.infoValue}>
                    {state.booking.details.selectedVehicle.vehicleName}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Vehicle Type</Text>
                  <Text style={styles.infoValue}>
                    {state.booking.details.selectedVehicle.vehicleType || 'Not available'}
                  </Text>
                </View>
              </AppCard>
            ) : null}

            {state.booking.type === 'package' && state.booking.details?.addOns?.length ? (
              <AppCard style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Selected Add-ons</Text>
                {state.booking.details.addOns.map((item, index) => (
                  <Text key={`${item?.name || 'addon'}-${index}`} style={styles.bodyText}>
                    {item?.name || 'Add-on'}
                  </Text>
                ))}
              </AppCard>
            ) : null}

            {state.booking.type === 'safari' ? (
              <AppCard style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Traveller Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Customer Name</Text>
                  <Text style={styles.infoValue}>
                    {state.booking.details?.customerName || 'Not available'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Customer Email</Text>
                  <Text style={styles.infoValue}>
                    {state.booking.details?.customerEmail || 'Not available'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Customer Phone</Text>
                  <Text style={styles.infoValue}>
                    {state.booking.details?.customerPhone || 'Not available'}
                  </Text>
                </View>
              </AppCard>
            ) : null}

            {state.booking.type === 'storage' && state.booking.details?.orderedItems?.length ? (
              <AppCard style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Selected Items</Text>
                {state.booking.details.orderedItems.map((item, index) => (
                  <View key={`${item.product?.key}-${index}`} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>
                      {item.product?.name || 'Equipment Item'} x{item.quantity}
                    </Text>
                    <Text style={styles.infoValue}>
                      {formatCurrency((item.product?.dailyRentalprice || 0) * (item.quantity || 0))}
                    </Text>
                  </View>
                ))}
              </AppCard>
            ) : null}

            {state.booking.type === 'package' && state.booking.details?.selectedActivities?.length ? (
              <AppCard style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Selected Activities</Text>
                <Text style={styles.bodyText}>
                  {state.booking.details.selectedActivities.join(', ')}
                </Text>
              </AppCard>
            ) : null}

            {state.booking.canCancel ? (
              <AppButton title="Cancel Booking" variant="danger" onPress={handleCancel} />
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
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
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 220,
    backgroundColor: theme.colors.primarySoft,
  },
  heroContent: {
    padding: theme.spacing.xl,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  heroCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  heroTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  heroSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  detailsCard: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  bodyText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    flex: 1,
  },
  infoValue: {
    color: theme.colors.text,
    ...theme.typography.bodySmall,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
  retryWrap: {
    marginTop: theme.spacing.md,
  },
});
