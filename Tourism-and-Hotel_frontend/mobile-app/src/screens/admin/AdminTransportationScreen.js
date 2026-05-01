import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { TransportationAdminCard } from '../../components/admin/TransportationAdminCard';
import { TransportationFilters } from '../../components/admin/TransportationFilters';
import { useAuth } from '../../context/AuthContext';
import {
  deleteAdminTransportation,
  fetchAdminTransportations,
  TRANSPORTATION_STATUS_OPTIONS,
} from '../../services/adminTransportationApi';
import { theme } from '../../theme';

function normalizeString(value) {
  return `${value ?? ''}`.trim().toLowerCase();
}

function buildTypeFilters(vehicles) {
  const types = Array.from(
    new Set(vehicles.map((vehicle) => `${vehicle.type || ''}`.trim()).filter(Boolean))
  ).sort((left, right) => left.localeCompare(right));

  return [{ label: 'All Types', value: 'all' }, ...types.map((type) => ({ label: type, value: type }))];
}

function buildStats(vehicles) {
  return vehicles.reduce(
    (summary, vehicle) => {
      summary.total += 1;
      if (vehicle.availability) {
        summary.available += 1;
      } else {
        summary.unavailable += 1;
      }
      return summary;
    },
    {
      total: 0,
      available: 0,
      unavailable: 0,
    }
  );
}

export default function AdminTransportationScreen() {
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

      const response = await fetchAdminTransportations(token);
      setVehicles(response);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Unable to load transportation records.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const typeFilters = useMemo(() => buildTypeFilters(vehicles), [vehicles]);
  const stats = useMemo(() => buildStats(vehicles), [vehicles]);

  const filteredVehicles = useMemo(() => {
    const normalizedQuery = normalizeString(searchQuery);

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        !normalizedQuery ||
        [vehicle.name, vehicle.id, vehicle.registrationNumber, vehicle.driverName].some((value) =>
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
      'Delete transportation vehicle?',
      `Delete ${vehicle.name} (${vehicle.registrationNumber}) from transportation management?`,
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
      setDeletingVehicleId(vehicle.id);
      const response = await deleteAdminTransportation(token, vehicle.id);
      Alert.alert('Vehicle deleted', response?.message || 'The vehicle was deleted.');
      await loadVehicles(true);
    } catch (deleteError) {
      Alert.alert(
        'Delete failed',
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete this transportation record right now.'
      );
    } finally {
      setDeletingVehicleId(null);
    }
  }

  function renderStats() {
    return (
      <View style={styles.statsRow}>
        <AppCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </AppCard>
        <AppCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>{stats.available}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </AppCard>
        <AppCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: theme.colors.danger }]}>{stats.unavailable}</Text>
          <Text style={styles.statLabel}>Unavailable</Text>
        </AppCard>
      </View>
    );
  }

  function renderContent() {
    if (loading) {
      return (
        <AppCard style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText}>Loading transportation data from the backend...</Text>
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
          <Text style={styles.stateTitle}>No transportation vehicles found</Text>
          <Text style={styles.stateText}>
            Try a different search term or filter to find matching records.
          </Text>
        </AppCard>
      );
    }

    return filteredVehicles.map((vehicle) => (
      <TransportationAdminCard
        key={vehicle.id}
        vehicle={vehicle}
        deleting={deletingVehicleId === vehicle.id}
        onView={() => router.push(`/admin/transportation-details/${vehicle.id}`)}
        onEdit={() => router.push(`/admin/transportation-edit/${vehicle.id}`)}
        onDelete={() => handleDelete(vehicle)}
      />
    ));
  }

  return (
    <AdminScreenWrapper
      title="Transportation Management"
      subtitle={`Manage transport vehicles - ${vehicles.length} record(s)`}>
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
              onPress={() => router.push('/admin/transportation-add')}
            />
          </View>
        </View>

        {renderStats()}

        <AppTextField
          label="Search"
          placeholder="Search by name, vehicle ID, registration number, or driver..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <TransportationFilters
          typeFilters={typeFilters}
          statusFilters={TRANSPORTATION_STATUS_OPTIONS}
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
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: 90,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
  },
  statLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
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
