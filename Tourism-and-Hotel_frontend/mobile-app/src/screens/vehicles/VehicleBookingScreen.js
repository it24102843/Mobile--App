import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppCard } from '../../components/AppCard';
import { BookingSuccessModal } from '../../components/common/BookingSuccessModal';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { VehicleBookingForm } from '../../components/vehicles/VehicleBookingForm';
import { useAuth, useRequireAuth } from '../../hooks/useAuth';
import {
  createMyVehicleBooking,
  validateVehicleBookingForm,
} from '../../services/vehicleBookingsApi';
import { fetchVehicleById } from '../../services/vehiclesApi';
import { theme } from '../../theme';

export default function VehicleBookingScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const { isAuthenticated, token, user } = useAuth();
  const vehicleId = typeof params.vehicleId === 'string' ? params.vehicleId : '';
  const [state, setState] = useState({
    loading: true,
    error: null,
    vehicle: null,
  });
  const [values, setValues] = useState({
    customerName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
    startDate: '',
    endDate: '',
    passengers: 1,
    specialRequests: '',
    paymentMethod: 'online',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successState, setSuccessState] = useState({
    visible: false,
    bookingId: '',
    message: 'Your safari vehicle booking has been successfully created.',
    totalAmount: '',
    date: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth(`/vehicles/${vehicleId}/book`, {
        message: 'Please login or sign up to book this vehicle',
      });
      return;
    }

    let mounted = true;

    async function loadVehicle() {
      try {
        const vehicle = await fetchVehicleById(vehicleId);

        if (mounted) {
          setState({
            loading: false,
            error: null,
            vehicle,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            error,
            vehicle: null,
          });
        }
      }
    }

    loadVehicle();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, requireAuth, vehicleId]);

  if (!isAuthenticated) {
    return null;
  }

  const handleChange = (field, value) => {
    setValues((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }

      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handlePassengersChange = (value) => {
    handleChange('passengers', value);
  };

  const handleSubmit = async () => {
    if (!state.vehicle || submitting) {
      return;
    }

    const nextErrors = validateVehicleBookingForm(values, state.vehicle);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await createMyVehicleBooking(token, state.vehicle, values);
      setSuccessState({
        visible: true,
        bookingId:
          response?.booking?.bookingId ||
          response?.booking?._id ||
          response?._id ||
          '',
        message:
          response?.message || 'Your safari vehicle booking has been successfully created.',
        totalAmount:
          response?.booking?.totalPrice ||
          response?.booking?.totalAmount ||
          '',
        date: response?.booking?.startDate || values.startDate,
      });
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        submit:
          error instanceof Error
            ? error.message
            : 'Unable to create the safari booking right now.',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Vehicle Booking"
          subtitle="Follow the same WildHaven safari booking flow shown in your web screenshots."
          fallbackHref={vehicleId ? `/vehicles/${vehicleId}` : '/vehicles'}
        />

        {state.loading ? <HomeSectionState loading /> : null}

        {!state.loading && state.error ? (
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load this safari vehicle booking form right now. Please try again.
            </Text>
          </AppCard>
        ) : null}

        {!state.loading && state.vehicle ? (
          <VehicleBookingForm
            vehicle={state.vehicle}
            values={values}
            errors={errors}
            submitting={submitting}
            onChange={handleChange}
            onPassengersChange={handlePassengersChange}
            onCancel={() => router.replace(`/vehicles/${vehicleId}`)}
            onSubmit={handleSubmit}
          />
        ) : null}
      </ScrollView>

      <BookingSuccessModal
        visible={successState.visible}
        title="Booking Confirmed"
        message={successState.message}
        bookingId={successState.bookingId}
        serviceType={state.vehicle?.title || 'Safari Vehicle'}
        totalAmount={successState.totalAmount}
        date={successState.date}
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
    paddingVertical: theme.layout.screenPaddingVertical,
    gap: theme.spacing.xl,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
