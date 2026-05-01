import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { RoomGallery } from '../../components/rooms/RoomGallery';
import { useRequireAuth } from '../../hooks/useAuth';
import { fetchVehicleById } from '../../services/vehiclesApi';
import { theme } from '../../theme';

function formatLkr(value) {
  return `LKR ${new Intl.NumberFormat('en-LK').format(value || 0)}`;
}

const BOOKING_RULES = [
  {
    key: 'availability',
    icon: 'calendar-check-outline',
    title: 'Availability check',
    body: 'The backend only allows booking when the selected vehicle is marked as available.',
  },
  {
    key: 'dates',
    icon: 'calendar-range',
    title: 'Valid trip dates',
    body: 'End date must be after the selected start date.',
  },
  {
    key: 'overlap',
    icon: 'car-clock',
    title: 'No overlapping bookings',
    body: 'The same safari vehicle cannot be booked for overlapping date ranges.',
  },
];

export default function VehicleDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const vehicleId = typeof params.vehicleId === 'string' ? params.vehicleId : '';
  const [state, setState] = useState({
    loading: true,
    error: null,
    vehicle: null,
  });

  useEffect(() => {
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
  }, [vehicleId]);

  const gallery = useMemo(() => state.vehicle?.imageGallery || [], [state.vehicle]);

  const handleBookNow = () => {
    const targetPath = `/vehicles/${vehicleId}/book`;

    if (!requireAuth(targetPath, { message: 'Please login or sign up to book this vehicle' })) {
      return;
    }

    router.push(targetPath);
  };

  if (state.loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader
            title="Vehicle Details"
            subtitle="Loading safari vehicle details..."
            fallbackHref="/vehicles"
          />
          <HomeSectionState loading />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (state.error || !state.vehicle) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader
            title="Vehicle Details"
            subtitle="We could not load this safari vehicle."
            fallbackHref="/vehicles"
          />
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load the safari vehicle details right now. Please try again.
            </Text>
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const hasDriver = Boolean(state.vehicle.driverName || state.vehicle.driverContact);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={state.vehicle.name}
          subtitle="Review the safari vehicle details and continue into the dedicated booking flow."
          fallbackHref="/vehicles"
        />

        <RoomGallery images={gallery} />

        <AppCard style={styles.identityCard}>
          <View style={styles.badgeRow}>
            <StatusBadge label={state.vehicle.type} variant="info" />
            <StatusBadge
              label={state.vehicle.availabilityLabel}
              variant={state.vehicle.availability ? 'primary' : 'warning'}
            />
          </View>

          <Text style={styles.vehicleTitle}>{state.vehicle.name}</Text>
          <Text style={styles.vehicleBody}>{state.vehicle.description}</Text>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <InfoRow icon="card-text-outline" label="Registration Number" value={state.vehicle.registrationNumber} />
          <InfoRow icon="car-estate" label="Vehicle Type" value={state.vehicle.type} />
          <InfoRow icon="seat-passenger" label="Seating Capacity" value={`${state.vehicle.capacity} passenger(s)`} />
          <InfoRow icon="cash-multiple" label="Price" value={`${formatLkr(state.vehicle.pricePerDay)} / day`} />
          <InfoRow icon="check-decagram-outline" label="Availability" value={state.vehicle.availabilityLabel} />
          <InfoRow icon="image-multiple-outline" label="Gallery Images" value={`${state.vehicle.imageCount}`} />
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Driver Information</Text>
          <InfoRow
            icon="account-tie"
            label="Driver Name"
            value={state.vehicle.driverName || 'Driver details not assigned'}
          />
          <InfoRow
            icon="phone-outline"
            label="Driver Contact"
            value={state.vehicle.driverContact || 'Driver contact not assigned'}
          />
          <Text style={styles.helperText}>
            {hasDriver
              ? 'This safari vehicle already has driver information stored in your backend.'
              : 'No driver assignment is stored for this vehicle in the backend yet.'}
          </Text>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>Vehicle pricing</Text>
          <Text style={styles.bookingLead}>Reserve this safari vehicle with live backend pricing</Text>
          <Text style={styles.helperText}>
            The booking flow calculates the total from the daily rate and selected travel dates, while the backend checks for date overlap before confirmation.
          </Text>
          <View style={styles.actionRow}>
            <View style={styles.flexAction}>
              <AppButton title="Browse Vehicles" variant="secondary" onPress={() => router.push('/vehicles')} />
            </View>
            <View style={styles.flexAction}>
              <AppButton
                title={state.vehicle.availability ? 'Book Vehicle' : 'Unavailable'}
                onPress={handleBookNow}
                disabled={!state.vehicle.availability}
              />
            </View>
          </View>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Booking Rules</Text>
          <View style={styles.rulesWrap}>
            {BOOKING_RULES.map((rule) => (
              <View key={rule.key} style={styles.ruleCard}>
                <MaterialCommunityIcons name={rule.icon} size={20} color={theme.colors.primary} />
                <View style={styles.ruleCopy}>
                  <Text style={styles.ruleTitle}>{rule.title}</Text>
                  <Text style={styles.ruleBody}>{rule.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </AppCard>

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
  identityCard: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  vehicleTitle: {
    color: '#2E2419',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
  },
  vehicleBody: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  sectionCard: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  sectionEyebrow: {
    color: theme.colors.accent,
    ...theme.typography.eyebrow,
  },
  sectionTitle: {
    color: '#2E2419',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  bookingLead: {
    color: '#2E2419',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
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
  helperText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  rulesWrap: {
    gap: theme.spacing.md,
  },
  ruleCard: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#EADFCB',
    borderRadius: theme.radii.lg,
    backgroundColor: '#FFF9F0',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  ruleCopy: {
    flex: 1,
    gap: 2,
  },
  ruleTitle: {
    color: '#2E2419',
    ...theme.typography.body,
    fontWeight: '700',
  },
  ruleBody: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  flexAction: {
    flex: 1,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
