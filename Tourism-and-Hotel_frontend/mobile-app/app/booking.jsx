import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  createGearOrder,
  createPackageBooking,
  createRoomBooking,
  createVehicleBooking,
} from '../src/api/bookings';
import {
  fetchPackageById,
  fetchProductByKey,
  fetchRoomByKey,
  fetchVehicleById,
  normalizeBookingItem,
} from '../src/api/catalog';
import { AppButton } from '../src/components/AppButton';
import { AppCard } from '../src/components/AppCard';
import { AppTextField } from '../src/components/AppTextField';
import { HomeSectionState } from '../src/components/home/HomeSectionState';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { useAuth, useRequireAuth } from '../src/hooks/useAuth';
import { theme } from '../src/theme';

function getDaysBetween(startValue, endValue) {
  const start = new Date(startValue);
  const end = new Date(endValue);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffInMs = end - start;

  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
}

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const requireAuth = useRequireAuth();
  const { isAuthenticated, token, user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [guests, setGuests] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState('1');

  const bookingType = typeof params.type === 'string' ? params.type : '';
  const itemId = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth(`/booking?type=${bookingType}&id=${itemId}`, { showAlert: false });
      return;
    }

    let mounted = true;

    async function loadItem() {
      try {
        let response;

        switch (bookingType) {
          case 'room':
            response = await fetchRoomByKey(itemId);
            break;
          case 'package':
            response = await fetchPackageById(itemId);
            break;
          case 'vehicle':
            response = await fetchVehicleById(itemId);
            break;
          case 'gear':
            response = await fetchProductByKey(itemId);
            break;
          default:
            response = null;
            break;
        }

        if (mounted) {
          setItem(response);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setItem(null);
          setLoading(false);
        }
      }
    }

    loadItem();

    return () => {
      mounted = false;
    };
  }, [bookingType, isAuthenticated, itemId, requireAuth]);

  const bookingPreview = useMemo(
    () => (item ? normalizeBookingItem(bookingType, item) : null),
    [bookingType, item]
  );

  const totalPrice = useMemo(() => {
    if (!item) {
      return 0;
    }

    if (bookingType === 'room') {
      return Math.max(getDaysBetween(startDate, endDate), 1) * (item.price || 0);
    }

    if (bookingType === 'package') {
      return (item.price || 0) * (Number(guests) || 1);
    }

    if (bookingType === 'vehicle') {
      return Math.max(getDaysBetween(startDate, endDate), 1) * (item.pricePerDay || 0);
    }

    if (bookingType === 'gear') {
      return (
        Math.max(Number(quantity) || 1, 1) *
        Math.max(getDaysBetween(startDate, endDate), 1) *
        (item.dailyRentalprice || 0)
      );
    }

    return 0;
  }, [bookingType, endDate, guests, item, quantity, startDate]);

  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = async () => {
    if (!item) {
      return;
    }

    setSubmitting(true);

    try {
      if (bookingType === 'room') {
        await createRoomBooking(token, {
          roomKey: item.key,
          checkInDate: startDate,
          checkOutDate: endDate,
          numberOfGuests: Number(guests) || 1,
          specialRequests: notes.trim(),
          paymentMethod: 'checkout',
          totalAmount: totalPrice,
        });
      } else if (bookingType === 'package') {
        await createPackageBooking(token, {
          packageId: item.packageId,
          packageName: item.name,
          userPhone: user?.phone || '',
          tourDate: startDate,
          guests: Number(guests) || 1,
          selectedActivities: [],
          specialRequests: notes.trim(),
          basePricePerPerson: item.price,
          totalPrice,
        });
      } else if (bookingType === 'vehicle') {
        const totalDays = Math.max(getDaysBetween(startDate, endDate), 1);

        await createVehicleBooking(token, {
          vehicleId: item._id,
          vehicleName: item.name,
          regNo: item.registrationNumber,
          vehicleType: item.type,
          capacity: item.capacity,
          pricePerDay: item.pricePerDay,
          startDate,
          endDate,
          totalDays,
          totalPrice,
          passengers: Number(guests) || 1,
          customerName: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
          customerEmail: user?.email,
          customerPhone: user?.phone || '',
          specialRequests: notes.trim(),
        });
      } else if (bookingType === 'gear') {
        await createGearOrder(token, {
          orderedItems: [{ key: item.key, qty: Number(quantity) || 1 }],
          days: Math.max(getDaysBetween(startDate, endDate), 1),
          startingDate: startDate,
          endingDate: endDate,
        });
      }

      Alert.alert('Success', 'Your request has been submitted successfully.');
      router.replace('/my-bookings');
    } catch (error) {
      Alert.alert(
        'Request Failed',
        error instanceof Error ? error.message : 'Unable to complete your request right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const actionLabel =
    bookingType === 'gear'
      ? 'Confirm Rental'
      : bookingType === 'vehicle'
        ? 'Confirm Vehicle Booking'
        : bookingType === 'package'
          ? 'Confirm Package Booking'
          : 'Confirm Room Booking';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Booking Flow"
          subtitle="Return to the previous screen using the back button."
          fallbackHref="/(tabs)"
        />

        <AppCard variant="primary" style={styles.heroCard}>
          <Text style={styles.heroTitle}>Protected Booking</Text>
          <Text style={styles.heroSubtitle}>
            You are signed in, so booking actions are now enabled for this account.
          </Text>
        </AppCard>

        {loading ? <HomeSectionState loading /> : null}

        {!loading && !bookingPreview ? (
          <HomeSectionState message="This item could not be loaded for booking." />
        ) : null}

        {!loading && bookingPreview ? (
          <>
            <AppCard style={styles.previewCard} padded={false}>
              <Image source={bookingPreview.imageUrl} style={styles.previewImage} contentFit="cover" />
              <Text style={styles.previewTitle}>{bookingPreview.title}</Text>
              <Text style={styles.previewSubtitle}>{bookingPreview.subtitle}</Text>
              <Text style={styles.previewDescription}>{bookingPreview.description}</Text>
              <Text style={styles.previewPrice}>{bookingPreview.priceLabel}</Text>
            </AppCard>

            <AppCard style={styles.formCard}>
              {(bookingType === 'room' || bookingType === 'vehicle' || bookingType === 'package') ? (
                <AppTextField
                  label={bookingType === 'package' ? 'Guests' : 'Guests / Passengers'}
                  keyboardType="numeric"
                  value={guests}
                  onChangeText={setGuests}
                />
              ) : null}

              {bookingType === 'gear' ? (
                <AppTextField
                  label="Quantity"
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              ) : null}

              <AppTextField
                label={bookingType === 'package' ? 'Tour Date (YYYY-MM-DD)' : 'Start Date (YYYY-MM-DD)'}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="2026-05-01"
              />

              {bookingType !== 'package' ? (
                <AppTextField
                  label="End Date (YYYY-MM-DD)"
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="2026-05-03"
                />
              ) : null}

              <AppTextField
                label="Special Requests"
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional notes"
                multiline
              />

              <AppCard variant="info">
                <Text style={styles.totalLabel}>Estimated Total</Text>
                <Text style={styles.totalValue}>
                  LKR {new Intl.NumberFormat('en-LK').format(totalPrice)}
                </Text>
              </AppCard>

              <AppButton
                title={submitting ? 'Submitting...' : actionLabel}
                onPress={handleSubmit}
                disabled={submitting || !startDate || (!endDate && bookingType !== 'package')}
              />
            </AppCard>
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
  previewCard: {
    overflow: 'hidden',
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primarySoft,
  },
  previewTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  previewSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  previewDescription: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  previewPrice: {
    color: theme.colors.primary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  formCard: {
    gap: theme.spacing.md,
  },
  totalLabel: {
    color: theme.colors.infoText,
    ...theme.typography.bodySmall,
  },
  totalValue: {
    color: theme.colors.info,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
});
