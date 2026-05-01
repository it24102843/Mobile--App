import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { createGearRentalOrder, requestGearQuote } from '../../api/gearRental';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { BookingSuccessModal } from '../../components/common/BookingSuccessModal';
import { DatePickerField } from '../../components/common/DatePickerField';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useGearCart } from '../../context/GearCartContext';
import { useAuth, useRequireAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';
import {
  calculateGearCartTotal,
  calculateRentalDays,
  formatLkr,
  validateGearBooking,
} from '../../utils/gearRental';

function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getRelativeDate(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return formatDateString(date);
}

export default function GearCheckoutScreen() {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const { isAuthenticated, token } = useAuth();
  const { items, isHydrated, clearCart } = useGearCart();
  const [startDate, setStartDate] = useState(getRelativeDate(1));
  const [endDate, setEndDate] = useState(getRelativeDate(2));
  const [submitting, setSubmitting] = useState(false);
  const [quoteState, setQuoteState] = useState({
    loading: false,
    error: null,
    total: 0,
    days: 0,
  });
  const [successState, setSuccessState] = useState({
    visible: false,
    bookingId: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth('/gear-rental/checkout', { showAlert: false });
    }
  }, [isAuthenticated, requireAuth]);

  const validation = useMemo(
    () =>
      validateGearBooking({
        items,
        startDate,
        endDate,
      }),
    [endDate, items, startDate]
  );

  useEffect(() => {
    if (!isAuthenticated || !items.length || !validation.isValid) {
      setQuoteState((current) => ({
        ...current,
        loading: false,
        error: null,
        total: 0,
        days: validation.days,
      }));
      return;
    }

    let mounted = true;

    async function loadQuote() {
      setQuoteState((current) => ({
        ...current,
        loading: true,
        error: null,
      }));

      try {
        const quote = await requestGearQuote({
          orderedItems: items.map((item) => ({
            key: item.key,
            qty: item.quantity,
          })),
          startingDate: startDate,
          endingDate: endDate,
        });

        if (mounted) {
          setQuoteState({
            loading: false,
            error: null,
            total: Number(quote?.total || 0),
            days: Number(quote?.days || validation.days || 0),
          });
        }
      } catch (error) {
        if (mounted) {
          setQuoteState({
            loading: false,
            error,
            total: 0,
            days: validation.days,
          });
        }
      }
    }

    loadQuote();

    return () => {
      mounted = false;
    };
  }, [endDate, isAuthenticated, items, startDate, validation.days, validation.isValid]);

  const localDays = calculateRentalDays(startDate, endDate);
  const localTotal = calculateGearCartTotal(items, localDays);
  const totalAmount = quoteState.total || localTotal;
  const totalDays = quoteState.days || localDays;
  const firstValidationMessage =
    validation.errors.startDate || validation.errors.endDate || validation.errors.items || '';

  const handleConfirm = async () => {
    if (!isAuthenticated || submitting) {
      return;
    }

    if (!validation.isValid) {
      Alert.alert('Validation Error', firstValidationMessage);
      return;
    }

    setSubmitting(true);

    try {
      const response = await createGearRentalOrder(token, {
        orderedItems: items.map((item) => ({
          key: item.key,
          qty: item.quantity,
        })),
        startingDate: startDate,
        endingDate: endDate,
      });

      const orderId = response?.order?.orderId;

      clearCart();

      setSuccessState({
        visible: true,
        bookingId: orderId || '',
      });
    } catch (error) {
      Alert.alert(
        'Booking Failed',
        error instanceof Error
          ? error.message
          : 'Unable to create the rental booking right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader title="Rental Checkout" subtitle="Loading your rental cart..." fallbackHref="/gear-rental/cart" />
          <HomeSectionState loading />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!items.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader title="Rental Checkout" subtitle="Your cart is empty." fallbackHref="/gear-rental" />
          <AppCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No rental items selected</Text>
            <Text style={styles.emptyBody}>
              Add equipment to your cart before choosing rental dates and creating an order.
            </Text>
            <AppButton title="Browse Equipment" onPress={() => router.replace('/gear-rental')} />
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Complete Rental Booking"
          subtitle="Choose rental dates, review the live total, and confirm your equipment order."
          fallbackHref="/gear-rental/cart"
        />

        <AppCard style={styles.formCard}>
          <Text style={styles.sectionTitle}>Rental Period</Text>

          <View style={styles.dateFields}>
            <DatePickerField
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              minimumDate={formatDateString(new Date())}
              placeholder="YYYY-MM-DD"
              error={validation.errors.startDate}
              style={styles.goldField}
            />
            <DatePickerField
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              minimumDate={startDate || formatDateString(new Date())}
              placeholder="YYYY-MM-DD"
              error={validation.errors.endDate}
              style={styles.goldField}
            />
          </View>

          <Text style={styles.helperText}>
            Rental duration: {totalDays > 0 ? `${totalDays} day(s)` : 'Choose valid dates'}
          </Text>
        </AppCard>

        <AppCard style={styles.summaryCard} padded={false}>
          <View style={styles.summaryContent}>
            <Text style={styles.sectionTitle}>Booking Summary</Text>

            {items.map((item) => (
              <View key={item.key} style={styles.summaryItemRow}>
                <Image source={{ uri: item.imageUrl }} style={styles.summaryImage} contentFit="cover" />
                <View style={styles.summaryItemCopy}>
                  <Text style={styles.summaryItemTitle}>{item.name}</Text>
                  <Text style={styles.summaryItemMeta}>
                    Qty {item.quantity} • {formatLkr(item.dailyRentalprice)} / day
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{totalDays > 0 ? `${totalDays} day(s)` : '-'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>One-Day Cart Total</Text>
              <Text style={styles.summaryValue}>
                {formatLkr(items.reduce((total, item) => total + item.quantity * item.dailyRentalprice, 0))}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Booking Total</Text>
              <Text style={styles.totalValue}>{formatLkr(totalAmount)}</Text>
            </View>

            {quoteState.loading ? (
              <Text style={styles.quoteHelper}>Refreshing live quote from the backend...</Text>
            ) : null}

            {quoteState.error ? (
              <Text style={styles.quoteError}>
                {quoteState.error instanceof Error
                  ? quoteState.error.message
                  : 'Unable to refresh the live quote right now.'}
              </Text>
            ) : null}
          </View>
        </AppCard>

        {firstValidationMessage ? (
          <AppCard variant="danger">
            <Text style={styles.errorText}>{firstValidationMessage}</Text>
          </AppCard>
        ) : null}

        <AppButton
          title={submitting ? 'Creating Booking...' : 'Confirm & Create Booking'}
          onPress={handleConfirm}
          disabled={!validation.isValid || submitting}
        />
      </ScrollView>

      <BookingSuccessModal
        visible={successState.visible}
        bookingId={successState.bookingId}
        serviceType="Gear Rental"
        totalAmount={totalAmount}
        date={`${startDate} -> ${endDate}`}
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
  emptyCard: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  emptyTitle: {
    color: '#2E2419',
    ...theme.typography.sectionTitle,
  },
  emptyBody: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  formCard: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  summaryCard: {
    overflow: 'hidden',
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  summaryContent: {
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: '#2E2419',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  dateFields: {
    gap: theme.spacing.sm,
  },
  goldField: {
    backgroundColor: '#FFF7D9',
    borderColor: '#F0C24E',
  },
  helperText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  summaryItemRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  summaryImage: {
    width: 72,
    height: 72,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primarySoft,
  },
  summaryItemCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  summaryItemTitle: {
    color: theme.colors.text,
    ...theme.typography.body,
    fontWeight: '700',
  },
  summaryItemMeta: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  divider: {
    height: 1,
    backgroundColor: '#E7DBC6',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  summaryValue: {
    color: '#2E2419',
    ...theme.typography.body,
    fontWeight: '700',
  },
  totalValue: {
    color: theme.colors.accent,
    ...theme.typography.body,
    fontWeight: '800',
  },
  quoteHelper: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
  },
  quoteError: {
    color: theme.colors.warningText,
    ...theme.typography.bodySmall,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
