import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppCard } from '../../components/AppCard';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { StatusBadge } from '../../components/StatusBadge';
import { RoomGallery } from '../../components/rooms/RoomGallery';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminTransportationById } from '../../services/adminTransportationApi';
import { theme } from '../../theme';

function formatLkr(value) {
  return `LKR ${new Intl.NumberFormat('en-LK').format(value || 0)}`;
}

export default function TransportationDetailsScreen() {
  const params = useLocalSearchParams();
  const { token } = useAuth();
  const vehicleId = typeof params.id === 'string' ? params.id : '';
  const [state, setState] = useState({
    loading: true,
    error: null,
    vehicle: null,
  });

  useEffect(() => {
    let mounted = true;

    async function loadVehicle() {
      try {
        const vehicle = await fetchAdminTransportationById(token, vehicleId);

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

    if (token && vehicleId) {
      void loadVehicle();
    }

    return () => {
      mounted = false;
    };
  }, [token, vehicleId]);

  return (
    <AdminScreenWrapper
      title="Transportation Details"
      subtitle="Review the full transportation record before editing or deleting it.">
      {state.loading ? <HomeSectionState loading /> : null}

      {!state.loading && (state.error || !state.vehicle) ? (
        <AppCard variant="danger">
          <Text style={styles.errorText}>
            Unable to load this transportation record right now. Please try again.
          </Text>
        </AppCard>
      ) : null}

      {!state.loading && state.vehicle ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <RoomGallery images={state.vehicle.imageGallery} />

          <AppCard style={styles.identityCard}>
            <View style={styles.badgeRow}>
              <StatusBadge label={state.vehicle.type} variant="info" />
              <StatusBadge
                label={state.vehicle.statusLabel}
                variant={state.vehicle.statusVariant}
              />
            </View>

            <Text style={styles.vehicleTitle}>{state.vehicle.name}</Text>
            <Text style={styles.vehicleBody}>{state.vehicle.description}</Text>
          </AppCard>

          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Vehicle Details</Text>
            <InfoRow icon="identifier" label="Vehicle ID" value={state.vehicle.id} />
            <InfoRow
              icon="card-text-outline"
              label="Registration Number"
              value={state.vehicle.registrationNumber}
            />
            <InfoRow icon="car-estate" label="Vehicle Type" value={state.vehicle.type} />
            <InfoRow icon="seat-passenger" label="Seating Capacity" value={state.vehicle.capacityLabel} />
            <InfoRow icon="cash-multiple" label="Price" value={`${formatLkr(state.vehicle.pricePerDay)} / day`} />
          </AppCard>

          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Driver Information</Text>
            <InfoRow
              icon="account-tie"
              label="Driver Name"
              value={state.vehicle.driverName || 'Driver not assigned'}
            />
            <InfoRow
              icon="phone-outline"
              label="Driver Contact"
              value={state.vehicle.driverContact || 'Driver contact not assigned'}
            />
          </AppCard>
        </ScrollView>
      ) : null}
    </AdminScreenWrapper>
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
  content: {
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
  sectionTitle: {
    color: '#2E2419',
    fontSize: 24,
    lineHeight: 30,
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
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
