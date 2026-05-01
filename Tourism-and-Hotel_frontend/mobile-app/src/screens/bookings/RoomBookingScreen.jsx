import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { createRoomBooking } from '../../api/bookings';
import {
  calculateRoomPriceBreakdown,
  fetchHotelByName,
  fetchRoomDetails,
} from '../../api/roomHotels';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { BookingSuccessModal } from '../../components/common/BookingSuccessModal';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { GuestCounter } from '../../components/bookings/GuestCounter';
import { PaymentMethodCard } from '../../components/bookings/PaymentMethodCard';
import { DatePickerField } from '../../components/common/DatePickerField';
import { useAuth, useRequireAuth } from '../../hooks/useAuth';
import { getDefaultImage, resolveMediaCollection } from '../../utils/media';
import { theme } from '../../theme';
import { getStartOfToday, isDateAfter, isPositiveInteger } from '../../utils/validation';

function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTodayStart() {
  return getStartOfToday();
}

function buildValidationErrors({ checkInDate, checkOutDate, guests, room, paymentMethod }) {
  const errors = {};
  const checkIn = parseDate(checkInDate);
  const checkOut = parseDate(checkOutDate);
  const guestsNumber = Number(guests);
  const normalizedPaymentMethod = `${paymentMethod ?? ''}`.trim();

  if (!checkInDate) {
    errors.checkInDate = 'Check-in date is required.';
  } else if (!checkIn) {
    errors.checkInDate = 'Use a valid check-in date in YYYY-MM-DD format.';
  } else if (checkIn < getTodayStart()) {
    errors.checkInDate = 'Check-in cannot be in the past.';
  }

  if (!checkOutDate) {
    errors.checkOutDate = 'Check-out date is required.';
  } else if (!checkOut) {
    errors.checkOutDate = 'Use a valid check-out date in YYYY-MM-DD format.';
  } else if (checkIn && !isDateAfter(checkInDate, checkOutDate)) {
    errors.checkOutDate = 'Check-out date must be after check-in.';
  }

  if (!isPositiveInteger(guestsNumber)) {
    errors.guests = 'At least one guest is required.';
  } else if (room?.capacity && guestsNumber > room.capacity) {
    errors.guests = `This room allows up to ${room.capacity} guests.`;
  }

  if (!normalizedPaymentMethod) {
    errors.paymentMethod = 'Please select a payment method for this room booking.';
  } else if (!['bank_deposit', 'online', 'checkout'].includes(normalizedPaymentMethod)) {
    errors.paymentMethod = 'Please choose a valid payment method.';
  }

  return errors;
}

function getFirstValidationMessage(validationErrors, nights) {
  if (validationErrors.checkInDate) {
    return validationErrors.checkInDate;
  }

  if (validationErrors.checkOutDate) {
    return validationErrors.checkOutDate;
  }

  if (validationErrors.guests) {
    return validationErrors.guests;
  }

  if (validationErrors.paymentMethod) {
    return validationErrors.paymentMethod;
  }

  if (!nights || nights < 1) {
    return 'Please choose a valid stay period of at least 1 night.';
  }

  return '';
}

function formatCurrency(value) {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value) || 0)}`;
}

export default function RoomBookingScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const { isAuthenticated, token, user } = useAuth();
  const roomKey = typeof params.roomKey === 'string' ? params.roomKey : '';
  const [state, setState] = useState({
    loading: true,
    room: null,
    hotel: null,
    error: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [checkInDate, setCheckInDate] = useState(
    typeof params.checkInDate === 'string' ? params.checkInDate : formatDateString(new Date())
  );
  const [checkOutDate, setCheckOutDate] = useState(
    typeof params.checkOutDate === 'string'
      ? params.checkOutDate
      : formatDateString(new Date(Date.now() + 86400000))
  );
  const [guests, setGuests] = useState(
    Number(typeof params.guests === 'string' ? params.guests : '1') || 1
  );
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState({
    visible: false,
    bookingId: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth(`/rooms/${roomKey}/book`, { showAlert: false });
      return;
    }

    let mounted = true;

    async function loadRoom() {
      try {
        const room = await fetchRoomDetails(roomKey);
        const hotel = await fetchHotelByName(room.hotelName);

        if (mounted) {
          setState({
            loading: false,
            room,
            hotel,
            error: null,
          });
          setGuests((current) => Math.min(current || 1, room.capacity || 1));
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            room: null,
            hotel: null,
            error,
          });
        }
      }
    }

    loadRoom();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, requireAuth, roomKey]);

  const validationErrors = useMemo(
    () =>
      buildValidationErrors({
        checkInDate,
        checkOutDate,
        guests,
        room: state.room,
        paymentMethod,
      }),
    [checkInDate, checkOutDate, guests, paymentMethod, state.room]
  );

  const breakdown = useMemo(
    () => calculateRoomPriceBreakdown(state.room?.price, checkInDate, checkOutDate),
    [state.room?.price, checkInDate, checkOutDate]
  );

  const isFormValid =
    Boolean(state.room) && Object.keys(validationErrors).length === 0 && breakdown.nights > 0;
  const firstValidationMessage = getFirstValidationMessage(validationErrors, breakdown.nights);

  useEffect(() => {
    if (submitError) {
      setSubmitError('');
    }
  }, [checkInDate, checkOutDate, guests, notes, paymentMethod]);

  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = async () => {
    if (!state.room || submitting) {
      return;
    }

    if (!isFormValid) {
      setSubmitError(firstValidationMessage);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await createRoomBooking(token, {
        roomKey: state.room.key,
        checkInDate,
        checkOutDate,
        numberOfGuests: Number(guests),
        specialRequests: notes.trim(),
        paymentMethod,
        totalAmount: breakdown.total,
      });

      setSuccessState({
        visible: true,
        bookingId: response?.bookingId || response?.booking?.bookingId || '',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to complete this booking right now.';

      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (state.loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader title="Complete Your Booking" subtitle="Loading booking details..." />
          <HomeSectionState loading />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (state.error || !state.room) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader title="Complete Your Booking" subtitle="We could not load this room." />
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load this room booking flow right now. Please try again.
            </Text>
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const roomImage = resolveMediaCollection(state.room.images, getDefaultImage());
  const guestName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Signed-in guest';
  const guestEmail = user?.email || 'No email available';
  const guestPhone = user?.phone || 'Add a phone number in your profile';
  const roomMeta = [
    { icon: 'door-open', label: `Room ${state.room.roomNumber}` },
    { icon: 'account-group-outline', label: `Up to ${state.room.capacity} guests` },
    { icon: 'weather-night', label: `${breakdown.nights} night${breakdown.nights === 1 ? '' : 's'}` },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Complete Your Booking"
          subtitle="Fill in the details to confirm your stay."
          fallbackHref={`/rooms/${roomKey}`}
        />

        <View style={styles.layoutStack}>
          <AppCard style={styles.formShell}>
            <View style={styles.sectionHead}>
              <MaterialCommunityIcons name="calendar-month" size={24} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Stay Details</Text>
            </View>

            <View style={styles.dateFieldGroup}>
              <DatePickerField
                label="Check-In"
                value={checkInDate}
                onChange={setCheckInDate}
                placeholder="YYYY-MM-DD"
                minimumDate={formatDateString(new Date())}
                error={validationErrors.checkInDate}
                style={styles.goldField}
              />
              <DatePickerField
                label="Check-Out"
                value={checkOutDate}
                onChange={setCheckOutDate}
                placeholder="YYYY-MM-DD"
                minimumDate={checkInDate || formatDateString(new Date())}
                error={validationErrors.checkOutDate}
                style={styles.goldField}
              />
            </View>

            <View style={styles.guestSection}>
              <Text style={styles.inputEyebrow}>Guests</Text>
              <GuestCounter
                value={guests}
                max={state.room.capacity || 1}
                onChange={setGuests}
              />
              {validationErrors.guests ? (
                <Text style={styles.fieldError}>{validationErrors.guests}</Text>
              ) : null}
            </View>

            <AppTextField
              label="Special Requests (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Dietary needs, early check-in, special occasions..."
              multiline
              style={styles.goldField}
            />
          </AppCard>

          <AppCard style={styles.contactShell}>
            <View style={styles.sectionHead}>
              <MaterialCommunityIcons name="account-circle-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Guest & Contact Details</Text>
            </View>

            <Text style={styles.sectionSupportText}>
              These details come from your signed-in WildHaven account and will be used for this reservation.
            </Text>

            <View style={styles.detailGrid}>
              <View style={styles.detailTile}>
                <Text style={styles.detailTileLabel}>Guest</Text>
                <Text style={styles.detailTileValue}>{guestName}</Text>
              </View>
              <View style={styles.detailTile}>
                <Text style={styles.detailTileLabel}>Email</Text>
                <Text style={styles.detailTileValue}>{guestEmail}</Text>
              </View>
              <View style={styles.detailTile}>
                <Text style={styles.detailTileLabel}>Contact</Text>
                <Text style={styles.detailTileValue}>{guestPhone}</Text>
              </View>
              <View style={styles.detailTile}>
                <Text style={styles.detailTileLabel}>Booking Status</Text>
                <Text style={styles.detailTileValue}>Ready to confirm</Text>
              </View>
            </View>
          </AppCard>

          <AppCard style={styles.summaryShell} padded={false}>
            <View style={styles.summaryHero}>
              <Image source={roomImage} style={styles.summaryImage} contentFit="cover" />
              <View style={styles.summaryOverlay} />
              <View style={styles.summaryHeroContent}>
                <Text style={styles.summaryHotel}>{state.room.hotelName}</Text>
                <Text style={styles.summaryRoom}>{state.room.roomType}</Text>
                <View style={styles.metaPillRow}>
                  {roomMeta.map((item) => (
                    <View key={item.label} style={styles.metaPill}>
                      <MaterialCommunityIcons name={item.icon} size={14} color="#FDF4E2" />
                      <Text style={styles.metaPillLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.summaryContent}>
              <View style={styles.summaryHeadlineRow}>
                <View>
                  <Text style={styles.summaryEyebrow}>Booking Summary</Text>
                  <Text style={styles.summarySubcopy}>Review your stay before confirming the reservation.</Text>
                </View>
                <View style={styles.rateBadge}>
                  <Text style={styles.rateBadgeLabel}>{formatCurrency(state.room.price)}</Text>
                  <Text style={styles.rateBadgeSubcopy}>per night</Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Room</Text>
                <Text style={styles.summaryValue}>Room {state.room.roomNumber}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Check-In</Text>
                <Text style={styles.summaryValue}>{checkInDate}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Check-Out</Text>
                <Text style={styles.summaryValue}>{checkOutDate}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Nights</Text>
                <Text style={styles.summaryValue}>{breakdown.nights} night</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Guests</Text>
                <Text style={styles.summaryValue}>{guests}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{formatCurrency(state.room.price)} x {breakdown.nights}</Text>
                <Text style={styles.summaryValue}>{formatCurrency(breakdown.subtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (10%)</Text>
                <Text style={styles.summaryValue}>{formatCurrency(breakdown.tax)}</Text>
              </View>

              <View style={styles.totalHighlightBox}>
                <View style={styles.totalCopyWrap}>
                  <Text style={styles.totalHint}>Estimated grand total</Text>
                  <Text style={styles.totalLabel}>Total amount</Text>
                </View>
                <Text style={styles.totalValue}>{formatCurrency(breakdown.total)}</Text>
              </View>
            </View>
          </AppCard>
        </View>

        <AppCard style={styles.paymentShell}>
          <View style={styles.sectionHead}>
            <MaterialCommunityIcons name="credit-card-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          <Text style={styles.paymentHelperText}>
            Select how you want to pay for this room booking. If you choose Pay at Check-out,
            the bill will be settled at the hotel on your check-out date.
          </Text>

          <View style={styles.paymentGrid}>
            <PaymentMethodCard
              value="bank_deposit"
              title="Bank Deposit"
              subtitle="Transfer & upload slip"
              description="Manual verification"
              selected={paymentMethod === 'bank_deposit'}
              onPress={() => setPaymentMethod('bank_deposit')}
            />
            <PaymentMethodCard
              value="online"
              title="Online Payment"
              subtitle="Card / digital wallet"
              description="Online confirmation"
              selected={paymentMethod === 'online'}
              onPress={() => setPaymentMethod('online')}
            />
            <PaymentMethodCard
              value="checkout"
              title="Pay at Checkout"
              subtitle="Settle bill on departure"
              description="Front desk payment"
              selected={paymentMethod === 'checkout'}
              onPress={() => setPaymentMethod('checkout')}
            />
          </View>

          {validationErrors.paymentMethod ? (
            <Text style={styles.fieldError}>{validationErrors.paymentMethod}</Text>
          ) : null}

          {paymentMethod === 'bank_deposit' ? (
            <AppCard style={styles.paymentInfoCard}>
              <Text style={styles.paymentInfoTitle}>Bank Transfer Details</Text>
              <Text style={styles.paymentInfoText}>
                Bank: Commercial Bank of Ceylon - Account: Kadiraa Tourism Pvt Ltd
              </Text>
              <Text style={styles.paymentInfoText}>Account No: 1234 5678 9012</Text>
              <Text style={styles.paymentInfoText}>
                Transfer LKR {new Intl.NumberFormat('en-LK').format(breakdown.total)} and upload your slip after booking.
              </Text>
            </AppCard>
          ) : null}

          {paymentMethod === 'online' ? (
            <AppCard style={styles.paymentInfoCard}>
              <Text style={styles.paymentInfoTitle}>Online Payment</Text>
              <Text style={styles.paymentInfoText}>
                The backend currently records the booking with online payment selected. Gateway completion can be connected later.
              </Text>
            </AppCard>
          ) : null}

          {paymentMethod === 'checkout' ? (
            <AppCard style={styles.paymentInfoCard}>
              <Text style={styles.paymentInfoTitle}>Pay at Checkout</Text>
              <Text style={styles.paymentInfoText}>
                Your reservation is recorded with pay-later settlement. The payment must be completed at the hotel on your check-out date.
              </Text>
            </AppCard>
          ) : null}
        </AppCard>

        <AppButton
          title={submitting ? 'Confirming Booking...' : 'Confirm Booking'}
          onPress={handleSubmit}
          disabled={!state.room || submitting}
        />

        {!submitError && firstValidationMessage ? (
          <AppCard variant="danger">
            <Text style={styles.errorText}>{firstValidationMessage}</Text>
          </AppCard>
        ) : null}

        {submitError ? (
          <AppCard variant="danger">
            <Text style={styles.errorText}>{submitError}</Text>
          </AppCard>
        ) : null}
      </ScrollView>

      <BookingSuccessModal
        visible={successState.visible}
        bookingId={successState.bookingId}
        serviceType={`${state.room.roomType} • Room ${state.room.roomNumber}`}
        totalAmount={breakdown.total}
        date={`${checkInDate} → ${checkOutDate}`}
        onClose={() => setSuccessState((current) => ({ ...current, visible: false }))}
        onViewBookings={() => {
          setSuccessState((current) => ({ ...current, visible: false }));
          router.replace('/my-bookings?refresh=1');
        }}
      />
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
  layoutStack: {
    gap: theme.spacing.lg,
  },
  formShell: {
    gap: theme.spacing.lg,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  contactShell: {
    gap: theme.spacing.lg,
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE5F1',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: '#2E2419',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  dateFieldGroup: {
    gap: theme.spacing.sm,
  },
  goldField: {
    backgroundColor: '#FFF7D9',
    borderColor: '#F0C24E',
  },
  guestSection: {
    gap: theme.spacing.sm,
  },
  sectionSupportText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  detailGrid: {
    gap: theme.spacing.sm,
  },
  detailTile: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#DDE5F1',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: 4,
  },
  detailTileLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.eyebrow,
  },
  detailTileValue: {
    color: '#21314D',
    ...theme.typography.body,
    fontWeight: '700',
  },
  inputEyebrow: {
    color: '#857867',
    ...theme.typography.eyebrow,
  },
  fieldError: {
    color: theme.colors.errorText,
    ...theme.typography.bodySmall,
  },
  summaryShell: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderColor: '#F0E3C8',
  },
  summaryHero: {
    position: 'relative',
  },
  summaryImage: {
    width: '100%',
    height: 220,
    backgroundColor: theme.colors.primarySoft,
  },
  summaryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19, 39, 70, 0.42)',
  },
  summaryHeroContent: {
    position: 'absolute',
    left: theme.spacing.xl,
    right: theme.spacing.xl,
    bottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  summaryContent: {
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  summaryHotel: {
    color: '#FAD58C',
    ...theme.typography.eyebrow,
  },
  summaryRoom: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  metaPillRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metaPillLabel: {
    color: '#F8F9FB',
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  summaryHeadlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  summaryEyebrow: {
    color: theme.colors.textSubtle,
    ...theme.typography.eyebrow,
  },
  summarySubcopy: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    marginTop: 6,
    maxWidth: 210,
  },
  rateBadge: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#F2D39D',
    backgroundColor: '#FFF6E6',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'flex-end',
  },
  rateBadgeLabel: {
    color: theme.colors.accent,
    ...theme.typography.body,
    fontWeight: '800',
  },
  rateBadgeSubcopy: {
    color: theme.colors.warningText,
    ...theme.typography.bodySmall,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  summaryLabel: {
    color: '#7C7165',
    ...theme.typography.body,
    flex: 1,
  },
  summaryValue: {
    color: '#2E2419',
    ...theme.typography.body,
    fontWeight: '700',
    textAlign: 'right',
  },
  totalHighlightBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: '#F2D39D',
    backgroundColor: '#FFF6E4',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  totalCopyWrap: {
    flex: 1,
  },
  totalHint: {
    color: theme.colors.warningText,
    ...theme.typography.eyebrow,
  },
  totalLabel: {
    color: '#2E2419',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  totalValue: {
    color: theme.colors.accent,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    textAlign: 'right',
  },
  paymentShell: {
    gap: theme.spacing.lg,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  paymentGrid: {
    gap: theme.spacing.md,
  },
  paymentHelperText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
    lineHeight: 24,
  },
  paymentInfoCard: {
    gap: theme.spacing.sm,
    backgroundColor: '#FFF8EE',
    borderColor: '#EFD9B0',
  },
  paymentInfoTitle: {
    color: theme.colors.accent,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  paymentInfoText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
