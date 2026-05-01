import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  cancelRoomBooking,
  fetchRoomBookingById,
} from '../../api/bookings';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth, useRequireAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';
import { normalizeRoomBooking, resolveRoomBookingImage } from '../../utils/roomBooking';

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

export default function RoomBookingDetailsScreen() {
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
      const booking = await fetchRoomBookingById(token, bookingId);

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
      requireAuth(`/bookings/rooms/${bookingId}`, { showAlert: false });
      return;
    }

    loadBooking();
  }, [bookingId, isAuthenticated, loadBooking, requireAuth]);

  const booking = useMemo(
    () => (state.booking ? normalizeRoomBooking(state.booking) : null),
    [state.booking]
  );

  if (!isAuthenticated) {
    return null;
  }

  const handleCancel = async () => {
    if (!booking || !booking.canCancel || cancelling) {
      return;
    }

    Alert.alert(
      'Cancel Room Booking',
      booking.cancellationHint,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              const response = await cancelRoomBooking(token, booking.bookingId);
              Alert.alert('Booking Updated', response?.message || 'Booking cancelled successfully.');
              await loadBooking();
            } catch (error) {
              Alert.alert(
                'Cancellation Failed',
                error instanceof Error
                  ? error.message
                  : 'Unable to cancel this booking right now.'
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
          <ScreenHeader title="Room Booking Details" subtitle="Loading your booking..." fallbackHref="/my-bookings" />
          <HomeSectionState loading />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (state.error || !booking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader title="Room Booking Details" subtitle="We could not load this booking." fallbackHref="/my-bookings" />
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load this booking right now. Please try again.
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
          title="Room Booking Details"
          subtitle={`Booking ID: ${booking.bookingId}`}
          fallbackHref="/my-bookings"
        />

        <AppCard style={styles.heroCard} padded={false}>
          <Image
            source={{ uri: booking.roomImageUrl || resolveRoomBookingImage(booking) }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.heroContent}>
            <Text style={styles.hotelName}>{booking.room?.hotelName || 'WildHaven Hotel'}</Text>
            <Text style={styles.roomName}>
              {booking.room?.roomType || 'Room'} - {booking.room?.roomNumber || '-'}
            </Text>
            <View style={styles.badgeRow}>
              <StatusBadge
                label={booking.bookingStatusMeta.label}
                variant={booking.bookingStatusMeta.variant}
              />
              {booking.refundStatusMeta ? (
                <StatusBadge
                  label={booking.refundStatusMeta.label}
                  variant={booking.refundStatusMeta.variant}
                />
              ) : null}
            </View>
          </View>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Stay Summary</Text>
          <InfoRow icon="calendar-start" label="Check-In" value={formatDate(booking.checkInDate)} />
          <InfoRow icon="calendar-end" label="Check-Out" value={formatDate(booking.checkOutDate)} />
          <InfoRow icon="account-group-outline" label="Guests" value={`${booking.numberOfGuests}`} />
          <InfoRow icon="weather-night" label="Nights" value={`${booking.numberOfNights}`} />
          <InfoRow icon="cash-multiple" label="Total Amount" value={formatCurrency(booking.totalAmount)} />
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment & Status</Text>
          <InfoRow icon="credit-card-outline" label="Payment Method" value={booking.paymentMethodLabel} />
          <InfoRow icon="check-decagram-outline" label="Payment Status" value={booking.paymentStatusLabel} />
          <InfoRow icon="clipboard-check-outline" label="Booking Status" value={booking.bookingStatusMeta.label} />
          {booking.refundStatusMeta ? (
            <InfoRow icon="cash-refund" label="Refund Status" value={booking.refundStatusMeta.label} />
          ) : null}
          {booking.refundAmount ? (
            <InfoRow icon="currency-usd" label="Refund Amount" value={formatCurrency(booking.refundAmount)} />
          ) : null}
        </AppCard>

        {booking.specialRequests ? (
          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Special Requests</Text>
            <Text style={styles.noteText}>{booking.specialRequests}</Text>
          </AppCard>
        ) : null}

        {booking.cancellationDate || booking.cancellationMessage || booking.refundMessage ? (
          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Cancellation / Refund</Text>
            {booking.cancellationDate ? (
              <InfoRow icon="calendar-remove" label="Cancelled On" value={formatDate(booking.cancellationDate)} />
            ) : null}
            {booking.cancellationMessage ? (
              <Text style={styles.noteText}>{booking.cancellationMessage}</Text>
            ) : null}
            {booking.refundMessage ? (
              <Text style={styles.noteText}>{booking.refundMessage}</Text>
            ) : null}
          </AppCard>
        ) : null}

        <AppCard variant="info">
          <Text style={styles.policyText}>{booking.cancellationHint}</Text>
        </AppCard>

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
    overflow: 'hidden',
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  heroImage: {
    width: '100%',
    height: 220,
    backgroundColor: theme.colors.primarySoft,
  },
  heroContent: {
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  hotelName: {
    color: theme.colors.accent,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  roomName: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
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
  noteText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  policyText: {
    color: theme.colors.infoText,
    ...theme.typography.body,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
