import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth, useRequireAuth } from '../../hooks/useAuth';
import {
  cancelMyPackageBooking,
  fetchMyPackageBookingById,
} from '../../services/packageBookingsApi';
import { theme } from '../../theme';
import {
  formatPaymentMethodLabel,
  formatPaymentStatusLabel,
  getRefundStatusMeta,
} from '../../utils/roomBooking';

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

function normalizePackageStatus(status) {
  switch (status) {
    case 'Confirmed':
      return { label: 'Confirmed', variant: 'primary' };
    case 'Completed':
      return { label: 'Completed', variant: 'info' };
    case 'Cancelled':
      return { label: 'Cancelled', variant: 'danger' };
    default:
      return { label: status || 'Pending', variant: 'warning' };
  }
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

  return `${selected.join(', ')} - ${formatCurrency(mealPackage?.price || 0)}`;
}

function normalizePackageBooking(booking) {
  return {
    ...booking,
    paymentMethodLabel: formatPaymentMethodLabel(booking.paymentMethod),
    paymentStatusLabel: formatPaymentStatusLabel(booking.paymentStatus),
    refundStatusMeta: getRefundStatusMeta(booking.refundStatus),
    statusMeta: normalizePackageStatus(booking.status),
    canCancel: booking.status !== 'Completed' && booking.status !== 'Cancelled',
  };
}

export default function PackageBookingDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const { isAuthenticated, token } = useAuth();
  const bookingId = typeof params.bookingId === 'string' ? params.bookingId : '';
  const [state, setState] = useState({
    loading: true,
    booking: null,
    error: null,
  });
  const [cancelling, setCancelling] = useState(false);

  const loadBooking = useCallback(async () => {
    if (!token || !bookingId) {
      return;
    }

    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));

    try {
      const booking = await fetchMyPackageBookingById(token, bookingId);

      setState({
        loading: false,
        booking,
        error: null,
      });
    } catch (error) {
      setState({
        loading: false,
        booking: null,
        error,
      });
    }
  }, [bookingId, token]);

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth(`/bookings/packages/${bookingId}`, { showAlert: false });
      return;
    }

    loadBooking();
  }, [bookingId, isAuthenticated, loadBooking, requireAuth]);

  const booking = useMemo(
    () => (state.booking ? normalizePackageBooking(state.booking) : null),
    [state.booking]
  );

  if (!isAuthenticated) {
    return null;
  }

  const handleCancel = () => {
    if (!booking?.canCancel || cancelling) {
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
              setCancelling(true);
              const response = await cancelMyPackageBooking(token, booking.bookingId);
              Alert.alert(
                'Booking Cancelled',
                response?.message || 'Your package booking has been cancelled.'
              );
              router.replace('/my-bookings');
            } catch (error) {
              Alert.alert(
                'Cancellation Failed',
                error instanceof Error
                  ? error.message
                  : 'Unable to cancel this package booking right now.'
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (state.loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader
            title="Package Booking Details"
            subtitle="Loading package booking details..."
            fallbackHref="/my-bookings"
          />
          <HomeSectionState loading />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (state.error || !booking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader
            title="Package Booking Details"
            subtitle="We could not load this package booking."
            fallbackHref="/my-bookings"
          />
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load this package booking right now. Please try again.
            </Text>
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Package Booking Details"
          subtitle={`Booking ID: ${booking.bookingId}`}
          fallbackHref="/my-bookings"
        />

        <AppCard style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>WildHaven Adventure Package</Text>
              <Text style={styles.heroTitle}>{booking.packageName}</Text>
              <Text style={styles.heroSubtitle}>
                View your selected package, payment details, guest count, and booking totals.
              </Text>
            </View>
            <StatusBadge label={booking.statusMeta.label} variant={booking.statusMeta.variant} />
          </View>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          <InfoRow icon="calendar-range" label="Tour Date" value={formatDate(booking.tourDate)} />
          <InfoRow icon="account-group-outline" label="Guests" value={`${booking.guests}`} />
          <InfoRow icon="cash" label="Base Price / Person" value={formatCurrency(booking.basePricePerPerson)} />
          <InfoRow icon="cash-multiple" label="Total Price" value={formatCurrency(booking.totalPrice)} />
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <InfoRow icon="account-outline" label="Name" value={booking.userName || 'Not available'} />
          <InfoRow icon="email-outline" label="Email" value={booking.userEmail || 'Not available'} />
          <InfoRow icon="phone-outline" label="Phone" value={booking.userPhone || 'Not available'} />
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment & Status</Text>
          <InfoRow icon="credit-card-outline" label="Payment Method" value={booking.paymentMethodLabel} />
          <InfoRow icon="check-decagram-outline" label="Payment Status" value={booking.paymentStatusLabel} />
          <InfoRow icon="clipboard-check-outline" label="Booking Status" value={booking.statusMeta.label} />
          {booking.refundStatusMeta ? (
            <InfoRow icon="cash-refund" label="Refund Status" value={booking.refundStatusMeta.label} />
          ) : null}
        </AppCard>

        {booking.selectedVehicle?.vehicleName ? (
          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Selected Vehicle</Text>
            <InfoRow icon="jeepney" label="Vehicle" value={booking.selectedVehicle.vehicleName} />
            <InfoRow icon="car-estate" label="Type" value={booking.selectedVehicle.vehicleType || 'Not available'} />
            <InfoRow
              icon="cash"
              label="Vehicle Price / Day"
              value={formatCurrency(booking.selectedVehicle.vehiclePricePerDay)}
            />
            <InfoRow icon="cash-plus" label="Vehicle Total" value={formatCurrency(booking.vehicleTotal)} />
          </AppCard>
        ) : null}

        {(booking.selectedActivities?.length || booking.addOns?.length || getMealPackageLabel(booking.mealPackage)) ? (
          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Selections</Text>
            {booking.selectedActivities?.length ? (
              <Text style={styles.bodyText}>
                Activities: {booking.selectedActivities.join(', ')}
              </Text>
            ) : null}
            {getMealPackageLabel(booking.mealPackage) ? (
              <Text style={styles.bodyText}>Meal Package: {getMealPackageLabel(booking.mealPackage)}</Text>
            ) : null}
            {booking.addOns?.length ? (
              <Text style={styles.bodyText}>
                Add-ons: {booking.addOns.map((item) => item?.name || item?.title || 'Extra').join(', ')}
              </Text>
            ) : null}
            {booking.addOnTotal ? (
              <InfoRow icon="plus-circle-outline" label="Add-on Total" value={formatCurrency(booking.addOnTotal)} />
            ) : null}
          </AppCard>
        ) : null}

        {booking.specialRequests ? (
          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Special Requests</Text>
            <Text style={styles.bodyText}>{booking.specialRequests}</Text>
          </AppCard>
        ) : null}

        {booking.canCancel ? (
          <AppButton
            title={cancelling ? 'Cancelling...' : 'Cancel Booking'}
            variant="danger"
            onPress={handleCancel}
            disabled={cancelling}
          />
        ) : null}

        <AppButton
          title="Back to My Bookings"
          variant="secondary"
          onPress={() => router.replace('/my-bookings')}
        />
      </ScrollView>
    </SafeAreaView>
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
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
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
  heroEyebrow: {
    color: theme.colors.accent,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  heroTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  heroSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  sectionCard: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  infoRow: {
    flexDirection: 'row',
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
    flex: 1,
  },
  bodyText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
