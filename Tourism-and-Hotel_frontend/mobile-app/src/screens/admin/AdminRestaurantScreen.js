import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { RestaurantAdminCard } from '../../components/admin/RestaurantAdminCard';
import { RestaurantFilters } from '../../components/admin/RestaurantFilters';
import { useAuth } from '../../context/AuthContext';
import {
  deleteAdminRestaurant,
  fetchAdminRestaurants,
  RESTAURANT_STATUS_OPTIONS,
} from '../../services/adminRestaurantApi';
import { theme } from '../../theme';

function normalizeString(value) {
  return `${value ?? ''}`.trim().toLowerCase();
}

export default function AdminRestaurantScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [deletingRestaurantId, setDeletingRestaurantId] = useState(null);

  useEffect(() => {
    void loadRestaurants();
  }, [token]);

  async function loadRestaurants(isRefresh = false) {
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

      const response = await fetchAdminRestaurants(token);
      setRestaurants(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load restaurants.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredRestaurants = useMemo(() => {
    const normalizedQuery = normalizeString(searchQuery);

    return restaurants.filter((restaurant) => {
      const matchesSearch =
        !normalizedQuery ||
        [restaurant.name, restaurant.address, restaurant.phone].some((value) =>
          normalizeString(value).includes(normalizedQuery)
        );

      if (!matchesSearch) {
        return false;
      }

      if (activeStatus !== 'all' && restaurant.statusLabel !== activeStatus) {
        return false;
      }

      return true;
    });
  }, [activeStatus, restaurants, searchQuery]);

  function handleDelete(restaurant) {
    Alert.alert(
      'Delete restaurant?',
      `Delete ${restaurant.name} and all of its menus and food items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void confirmDelete(restaurant),
        },
      ]
    );
  }

  async function confirmDelete(restaurant) {
    try {
      setDeletingRestaurantId(restaurant.id);
      const response = await deleteAdminRestaurant(token, restaurant.id);
      Alert.alert('Restaurant deleted', response?.message || 'The restaurant was deleted.');
      await loadRestaurants(true);
    } catch (deleteError) {
      Alert.alert(
        'Delete failed',
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete this restaurant right now.'
      );
    } finally {
      setDeletingRestaurantId(null);
    }
  }

  function renderContent() {
    if (loading) {
      return (
        <AppCard style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText}>Loading restaurant data from the backend...</Text>
        </AppCard>
      );
    }

    if (error) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Retry" onPress={() => void loadRestaurants()} />
        </AppCard>
      );
    }

    if (!filteredRestaurants.length) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.stateTitle}>No restaurants found</Text>
          <Text style={styles.stateText}>
            Try a different search term or filter to find matching restaurants.
          </Text>
        </AppCard>
      );
    }

    return filteredRestaurants.map((restaurant) => (
      <RestaurantAdminCard
        key={restaurant.id}
        restaurant={restaurant}
        deleting={deletingRestaurantId === restaurant.id}
        onEdit={() => router.push(`/admin/restaurant-edit/${restaurant.id}`)}
        onDelete={() => handleDelete(restaurant)}
        onManageMenus={() => router.push(`/admin/restaurant-menus/${restaurant.id}`)}
      />
    ));
  }

  return (
    <AdminScreenWrapper
      title="Restaurant Management"
      subtitle={`Manage restaurants, menus, and food items - ${restaurants.length} restaurant(s)`}>
      <AppCard style={styles.toolbarCard}>
        <View style={styles.buttonRow}>
          <View style={styles.flexButton}>
            <AppButton
              title={refreshing ? 'Refreshing...' : 'Refresh'}
              variant="secondary"
              onPress={() => void loadRestaurants(true)}
              disabled={refreshing}
            />
          </View>
          <View style={styles.flexButton}>
            <AppButton
              title="Add Restaurant"
              onPress={() => router.push('/admin/restaurant-add')}
            />
          </View>
          <View style={styles.flexButton}>
            <AppButton
              title="Food Orders"
              variant="info"
              onPress={() => router.push('/admin/food-orders')}
            />
          </View>
        </View>

        <AppTextField
          label="Search"
          placeholder="Search by restaurant name, address, or phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <RestaurantFilters
          statusFilters={RESTAURANT_STATUS_OPTIONS}
          activeStatus={activeStatus}
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
