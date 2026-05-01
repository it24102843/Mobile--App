import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppCard } from '../../components/AppCard';
import { BookingSuccessModal } from '../../components/common/BookingSuccessModal';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PackageBookingForm } from '../../components/packages/PackageBookingForm';
import { useAuth, useRequireAuth } from '../../hooks/useAuth';
import {
  createMyPackageBooking,
  validatePackageBookingForm,
} from '../../services/packageBookingsApi';
import {
  fetchPackageAddOns,
  fetchPackageById,
  fetchPackageVehicles,
} from '../../services/packagesApi';
import { theme } from '../../theme';

const BREAKFAST_PRICE = 550;
const LUNCH_PRICE = 650;

function isMealAddOn(addOn) {
  const title = `${addOn?.title || addOn?.name || ''}`.trim().toLowerCase();
  const category = `${addOn?.category || ''}`.trim().toLowerCase();
  return title === 'meal package' || title === 'meal' || category === 'meal';
}

const STEP_FIELDS = [
  ['tourDate', 'guests', 'contactNumber'],
  ['selectedVehicle'],
  [],
  ['paymentMethod'],
];

export default function PackageBookingScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const { isAuthenticated, token, user } = useAuth();
  const packageId = typeof params.packageId === 'string' ? params.packageId : '';
  const [state, setState] = useState({
    loading: true,
    error: null,
    pkg: null,
    vehicles: [],
    addOns: [],
  });
  const [values, setValues] = useState({
    tourDate: '',
    guests: 1,
    contactNumber: user?.phone || '',
    specialRequests: '',
    paymentMethod: 'online',
    selectedVehicleId: '',
    selectedAddOnIds: [],
    mealPackage: {
      breakfast: false,
      lunch: false,
    },
  });
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successState, setSuccessState] = useState({
    visible: false,
    bookingId: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth(`/packages/${packageId}/book`, {
        message: 'Please login or sign up to book this package',
      });
      return;
    }

    let mounted = true;

    async function loadBookingSetup() {
      try {
        const [pkg, addOns] = await Promise.all([
          fetchPackageById(packageId),
          fetchPackageAddOns(),
        ]);
        const vehicles = await fetchPackageVehicles(packageId, pkg?.title || pkg?.name || '');

        if (mounted) {
          setState({
            loading: false,
            error: null,
            pkg,
            vehicles,
            addOns,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            error,
            pkg: null,
            vehicles: [],
            addOns: [],
          });
        }
      }
    }

    loadBookingSetup();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, packageId, requireAuth]);

  const selectedVehicle = useMemo(
    () => state.vehicles.find((vehicle) => vehicle.vehicleId === values.selectedVehicleId) || null,
    [state.vehicles, values.selectedVehicleId]
  );

  const mealAddOn = useMemo(
    () => state.addOns.find((item) => isMealAddOn(item)) || null,
    [state.addOns]
  );

  const regularAddOns = useMemo(
    () => state.addOns.filter((item) => !isMealAddOn(item)),
    [state.addOns]
  );

  const selectedAddOns = useMemo(
    () => regularAddOns.filter((item) => values.selectedAddOnIds.includes(item.addonId)),
    [regularAddOns, values.selectedAddOnIds]
  );

  const mealPackageTotal = useMemo(() => {
    let total = 0;

    if (values.mealPackage?.breakfast) {
      total += BREAKFAST_PRICE;
    }

    if (values.mealPackage?.lunch) {
      total += LUNCH_PRICE;
    }

    return total;
  }, [values.mealPackage]);

  const mealPackageSummary = useMemo(() => {
    const selections = [];

    if (values.mealPackage?.breakfast) {
      selections.push('Breakfast');
    }

    if (values.mealPackage?.lunch) {
      selections.push('Lunch');
    }

    return selections;
  }, [values.mealPackage]);

  const vehicleTotal = useMemo(() => {
    if (!selectedVehicle || !state.pkg) {
      return 0;
    }

    const durationDays = Math.max(Number(state.pkg?.duration?.days || 1), 1);
    return Number(selectedVehicle.pricePerDay || 0) * durationDays;
  }, [selectedVehicle, state.pkg]);

  const addOnTotal = useMemo(
    () =>
      selectedAddOns.reduce((sum, item) => sum + Number(item.price || 0), 0) + mealPackageTotal,
    [selectedAddOns, mealPackageTotal]
  );

  const totalPrice = useMemo(
    () => (Number(state.pkg?.price || 0) * Number(values.guests || 1)) + vehicleTotal + addOnTotal,
    [state.pkg?.price, values.guests, vehicleTotal, addOnTotal]
  );

  if (!isAuthenticated) {
    return null;
  }

  const replaceErrorsForFields = (fields, nextErrors) => {
    setErrors((previous) => {
      const updated = { ...previous };

      fields.forEach((field) => {
        delete updated[field];
      });

      fields.forEach((field) => {
        if (nextErrors[field]) {
          updated[field] = nextErrors[field];
        }
      });

      return updated;
    });
  };

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

  const handleGuestChange = (value) => {
    handleChange('guests', value);
  };

  const handleToggleAddOn = (addonId) => {
    setValues((previous) => {
      const alreadySelected = previous.selectedAddOnIds.includes(addonId);

      return {
        ...previous,
        selectedAddOnIds: alreadySelected
          ? previous.selectedAddOnIds.filter((id) => id !== addonId)
          : [...previous.selectedAddOnIds, addonId],
      };
    });
  };

  const handleToggleMealOption = (field) => {
    setValues((previous) => ({
      ...previous,
      mealPackage: {
        ...previous.mealPackage,
        [field]: !previous.mealPackage?.[field],
      },
    }));
  };

  const validateStep = (stepIndex) => {
    if (!state.pkg) {
      return false;
    }

    const nextErrors = validatePackageBookingForm(values, state.pkg, {
      requireVehicleSelection: state.vehicles.length > 0,
      totalPrice,
    });
    const fields = STEP_FIELDS[stepIndex] || [];
    replaceErrorsForFields(fields, nextErrors);

    return fields.every((field) => !nextErrors[field]);
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setCurrentStep((previous) => Math.min(previous + 1, 3));
  };

  const handlePreviousStep = () => {
    setCurrentStep((previous) => Math.max(previous - 1, 0));
  };

  const handleSubmit = async () => {
    if (!state.pkg || submitting) {
      return;
    }

    console.log('Book Package pressed');

    const nextErrors = validatePackageBookingForm(values, state.pkg, {
      requireVehicleSelection: state.vehicles.length > 0,
      totalPrice,
    });
    setErrors({
      ...nextErrors,
      ...(Object.keys(nextErrors).length
        ? { submit: 'Please fix the highlighted booking details before submitting.' }
        : {}),
    });

    if (Object.keys(nextErrors).length) {
      console.log('Package booking blocked by validation:', nextErrors);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        packageId: state.pkg.packageId,
        userPhone: values.contactNumber.trim(),
        tourDate: values.tourDate.trim(),
        guests: Number(values.guests),
        selectedActivities: [],
        addOns: selectedAddOns.map((item) => ({
          addonId: item.addonId,
          name: item.title,
          category: item.category,
          price: item.price,
        })),
        mealPackage: {
          breakfast: Boolean(values.mealPackage?.breakfast),
          lunch: Boolean(values.mealPackage?.lunch),
          price: mealPackageTotal,
        },
        specialRequests: values.specialRequests.trim(),
        paymentMethod: values.paymentMethod,
        selectedVehicle: selectedVehicle
          ? {
              vehicleId: selectedVehicle.vehicleId,
              vehicleName: selectedVehicle.title,
              vehicleType: selectedVehicle.typeLabel,
              vehiclePricePerDay: selectedVehicle.pricePerDay,
            }
          : null,
        vehicleTotal,
        addOnTotal,
        totalPrice,
      };

      console.log('Payload:', payload);
      console.log('Token:', token);

      const response = await createMyPackageBooking(token, payload);

      setSuccessState({
        visible: true,
        bookingId: response?.booking?.bookingId || response?.bookingId || '',
      });
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        submit:
          error instanceof Error
            ? error.message
            : 'Unable to create the package booking right now.',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Package Booking"
          subtitle="Follow the same WildHaven package flow: trip details, vehicle, add-ons, and final confirmation."
          fallbackHref={packageId ? `/packages/${packageId}` : '/packages'}
        />

        {state.loading ? <HomeSectionState loading /> : null}

        {!state.loading && state.error ? (
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load this package booking flow right now. Please try again.
            </Text>
          </AppCard>
        ) : null}

        {!state.loading && state.pkg ? (
          <PackageBookingForm
            pkg={state.pkg}
            vehicles={state.vehicles}
            addOns={regularAddOns}
            mealAddOn={mealAddOn}
            values={values}
            errors={errors}
            currentStep={currentStep}
            totalPrice={totalPrice}
            selectedVehicle={selectedVehicle}
            vehicleTotal={vehicleTotal}
            selectedAddOns={selectedAddOns}
            mealPackageSummary={mealPackageSummary}
            mealPackageTotal={mealPackageTotal}
            addOnTotal={addOnTotal}
            submitting={submitting}
            customerName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
            customerEmail={user?.email || ''}
            onChange={handleChange}
            onGuestChange={handleGuestChange}
            onToggleAddOn={handleToggleAddOn}
            onToggleMealOption={handleToggleMealOption}
            onNextStep={handleNextStep}
            onPreviousStep={handlePreviousStep}
            onSubmit={handleSubmit}
          />
        ) : null}
      </ScrollView>

      <BookingSuccessModal
        visible={successState.visible}
        bookingId={successState.bookingId}
        serviceType={state.pkg?.title || state.pkg?.name || 'Package Booking'}
        totalAmount={totalPrice}
        date={values.tourDate}
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
