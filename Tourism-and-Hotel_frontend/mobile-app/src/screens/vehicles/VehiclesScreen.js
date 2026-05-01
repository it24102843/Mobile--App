import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { VehicleCard } from '../../components/vehicles/VehicleCard';
import { fetchVehicles } from '../../services/vehiclesApi';
import { theme } from '../../theme';

export default function VehiclesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [state, setState] = useState({
    loading: true,
    error: null,
    vehicles: [],
  });

  useEffect(() => {
    let mounted = true;

    async function loadVehicles() {
      try {
        const vehicles = await fetchVehicles();

        if (mounted) {
          setState({
            loading: false,
            error: null,
            vehicles,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            error,
            vehicles: [],
          });
        }
      }
    }

    loadVehicles();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return state.vehicles;
    }

    return state.vehicles.filter((vehicle) =>
      [
        vehicle.title,
        vehicle.typeLabel,
        vehicle.registrationNumber,
        vehicle.description,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [search, state.vehicles]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Safari Vehicles"
          subtitle="Explore live WildHaven safari and transport vehicles before opening the full booking flow."
          fallbackHref="/(tabs)"
        />

        <AppCard variant="primary" style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>WildHaven Safari Fleet</Text>
          <Text style={styles.heroTitle}>Choose the right vehicle for your adventure</Text>
          <Text style={styles.heroSubtitle}>
            Browse available safari vehicles, compare capacity and rates, then continue into the dedicated booking form.
          </Text>
        </AppCard>

        <AppTextField
          label="Search Vehicles"
          placeholder="Search by vehicle name, type, or registration"
          value={search}
          onChangeText={setSearch}
        />

        {state.loading ? <HomeSectionState loading /> : null}

        {!state.loading && state.error ? (
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load safari vehicles right now. Please try again.
            </Text>
          </AppCard>
        ) : null}

        {!state.loading && !filteredVehicles.length ? (
          <HomeSectionState message="No safari vehicles matched your search." />
        ) : null}

        {!state.loading
          ? filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onPress={() => router.push(`/vehicles/${vehicle.id}`)}
              />
            ))
          : null}
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
    paddingVertical: theme.layout.screenPaddingVertical,
    gap: theme.spacing.xl,
  },
  heroCard: {
    gap: theme.spacing.sm,
  },
  heroEyebrow: {
    color: '#FFD39E',
    ...theme.typography.eyebrow,
  },
  heroTitle: {
    color: theme.colors.textOnDark,
    ...theme.typography.screenTitle,
  },
  heroSubtitle: {
    color: '#DDE7F4',
    ...theme.typography.body,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
