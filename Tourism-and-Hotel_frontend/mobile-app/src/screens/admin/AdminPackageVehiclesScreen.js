import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { PackageVehicleAdminCard } from '../../components/admin/PackageVehicleAdminCard';
import { PackageVehicleFilters } from '../../components/admin/PackageVehicleFilters';
import { PackageVehicleStats } from '../../components/admin/PackageVehicleStats';
import { useAuth } from '../../context/AuthContext';
import {
  deleteAdminPackageVehicle,
  fetchAdminPackageVehicles,
  PACKAGE_VEHICLE_STATUS_OPTIONS,
  PACKAGE_VEHICLE_TYPE_FILTERS,
} from '../../services/adminPackageVehiclesApi';
import { theme } from '../../theme';

function normalizeString(value) {
  return `${value ?? ''}`.trim().toLowerCase();
}

function buildStats(vehicles) {
  return vehicles.reduce(
    (summary, vehicle) => {
      summary.total += 1;
      if (vehicle.statusLabel === 'Available') {
        summary.available += 1;
      }
      if (vehicle.statusLabel === 'Maintenance') {
        summary.maintenance += 1;
      }
      return summary;
    },
    {
      total: 0,
      available: 0,
      maintenance: 0,
    }
  );
}

export default function AdminPackageVehiclesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [deletingVehicleId, setDeletingVehicleId] = useState(null);

  useEffect(() => {
    void loadVehicles();
  }, [token]);

  async function loadVehicles(isRefresh = false) {
    if (!token) {
      return;
    }

    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetchAdminPackageVehicles(token);
      setVehicles(response);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Unable to load package vehicles.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const stats = useMemo(() => buildStats(vehicles), [vehicles]);

  const filteredVehicles = useMemo(() => {
    const normalizedQuery = normalizeString(searchQuery);

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        !normalizedQuery ||
        [vehicle.name, vehicle.vehicleId, vehicle.registrationNumber].some((value) =>
          normalizeString(value).includes(normalizedQuery)
        );

      if (!matchesSearch) {
        return false;
      }

      if (activeType !== 'all' && vehicle.type !== activeType) {
        return false;
      }

      if (activeStatus !== 'all' && vehicle.statusLabel !== activeStatus) {
        return false;
      }

      return true;
    });
  }, [activeStatus, activeType, searchQuery, vehicles]);

  function handleDelete(vehicle) {
    Alert.alert(
      'Delete vehicle?',
      `Delete ${vehicle.name} (${vehicle.registrationNumber}) from package vehicles?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void confirmDelete(vehicle),
        },
      ]
    );
  }

  async function confirmDelete(vehicle) {
    try {
      setDeletingVehicleId(vehicle.vehicleId);
      const response = await deleteAdminPackageVehicle(token, vehicle.vehicleId);
      Alert.alert('Vehicle deleted', response?.message || 'The vehicle was deleted.');
      await loadVehicles(true);
    } catch (deleteError) {
      Alert.alert(
        'Delete failed',
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete this vehicle right now.'
      );
    } finally {
      setDeletingVehicleId(null);
    }
  }

  function renderContent() {
    if (loading) {
      return (
        <AppCard style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText}>Loading package vehicles from the backend...</Text>
        </AppCard>
      );
    }

    if (error) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Retry" onPress={() => void loadVehicles()} />
        </AppCard>
      );
    }

    if (!filteredVehicles.length) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.stateTitle}>No package vehicles found</Text>
          <Text style={styles.stateText}>
            Try a different search term or filter to find matching vehicles.
          </Text>
        </AppCard>
      );
    }

    return filteredVehicles.map((vehicle) => (
      <PackageVehicleAdminCard
        key={vehicle.vehicleId}
        vehicle={vehicle}
        deleting={deletingVehicleId === vehicle.vehicleId}
        onEdit={() => router.push(`/admin/package-vehicles-edit/${vehicle.vehicleId}`)}
        onDelete={() => handleDelete(vehicle)}
      />
    ));
  }

  return (
    <AdminScreenWrapper
      title="Package Vehicles"
      subtitle={`Manage safari and package transport • ${vehicles.length} vehicle(s)`}>
      <AppCard style={styles.toolbarCard}>
        <View style={styles.buttonRow}>
          <View style={styles.flexButton}>
            <AppButton
              title={refreshing ? 'Refreshing...' : 'Refresh'}
              variant="secondary"
              onPress={() => void loadVehicles(true)}
              disabled={refreshing}
            />
          </View>
          <View style={styles.flexButton}>
            <AppButton
              title="Add Vehicle"
              onPress={() => router.push('/admin/package-vehicles-add')}
            />
          </View>
        </View>

        <PackageVehicleStats stats={stats} />

        <AppTextField
          label="Search"
          placeholder="Search by name, vehicle ID, or registration number..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <PackageVehicleFilters
          typeFilters={PACKAGE_VEHICLE_TYPE_FILTERS}
          statusFilters={PACKAGE_VEHICLE_STATUS_OPTIONS}
          activeType={activeType}
          activeStatus={activeStatus}
          onChangeType={setActiveType}
          onChangeStatus={setActiveStatus}
        />
      </AppCard>

      <View style={styles.listWrap}>{renderContent()}</View>
    </AdminScreenWrapper>
  );
}

const styles = StyleSheet.create({
  toolbarCard: {
    gap: theme.spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  flexButton: {
    flex: 1,
    minWidth: 140,
  },
  listWrap: {
    gap: theme.spacing.lg,
  },
  stateCard: {
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  stateTitle: {
    color: '#13233E',
    ...theme.typography.sectionTitle,
  },
  stateText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    ...theme.typography.body,
  },
  errorText: {
    color: theme.colors.errorText,
    textAlign: 'center',
    ...theme.typography.body,
  },
});
