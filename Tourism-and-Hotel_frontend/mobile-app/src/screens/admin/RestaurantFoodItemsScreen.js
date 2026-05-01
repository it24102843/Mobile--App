import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { FoodItemAdminCard } from '../../components/admin/FoodItemAdminCard';
import { PackageFilters } from '../../components/admin/PackageFilters';
import { useAuth } from '../../context/AuthContext';
import {
  deleteAdminFoodItem,
  fetchAdminFoodItemsByMenu,
  FOOD_AVAILABILITY_OPTIONS,
} from '../../services/adminRestaurantApi';
import { theme } from '../../theme';

function normalizeString(value) {
  return `${value ?? ''}`.trim().toLowerCase();
}

export default function RestaurantFoodItemsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();
  const menuId = typeof params.menuId === 'string' ? params.menuId : '';
  const restaurantId = typeof params.restaurantId === 'string' ? params.restaurantId : '';
  const restaurantName = typeof params.restaurantName === 'string' ? params.restaurantName : '';
  const menuName = typeof params.menuName === 'string' ? params.menuName : '';

  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [deletingFoodItemId, setDeletingFoodItemId] = useState(null);

  useEffect(() => {
    void loadFoodItems();
  }, [token, menuId]);

  async function loadFoodItems(isRefresh = false) {
    if (!token || !menuId) {
      return;
    }

    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetchAdminFoodItemsByMenu(token, menuId);
      setFoodItems(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load food items.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredFoodItems = useMemo(() => {
    const normalizedQuery = normalizeString(searchQuery);

    return foodItems.filter((foodItem) => {
      const matchesSearch =
        !normalizedQuery ||
        [foodItem.name, foodItem.category, foodItem.description].some((value) =>
          normalizeString(value).includes(normalizedQuery)
        );

      if (!matchesSearch) {
        return false;
      }

      if (activeStatus !== 'all' && foodItem.statusLabel !== activeStatus) {
        return false;
      }

      return true;
    });
  }, [activeStatus, foodItems, searchQuery]);

  function handleDelete(foodItem) {
    Alert.alert('Delete food item?', `Delete ${foodItem.name} from this menu?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void confirmDelete(foodItem),
      },
    ]);
  }

  async function confirmDelete(foodItem) {
    try {
      setDeletingFoodItemId(foodItem.id);
      const response = await deleteAdminFoodItem(token, foodItem.id);
      Alert.alert('Food item deleted', response?.message || 'The food item was deleted.');
      await loadFoodItems(true);
    } catch (deleteError) {
      Alert.alert(
        'Delete failed',
        deleteError instanceof Error ? deleteError.message : 'Unable to delete this food item.'
      );
    } finally {
      setDeletingFoodItemId(null);
    }
  }

  function renderContent() {
    if (loading) {
      return (
        <AppCard style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText}>Loading food items...</Text>
        </AppCard>
      );
    }

    if (error) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Retry" onPress={() => void loadFoodItems()} />
        </AppCard>
      );
    }

    if (!filteredFoodItems.length) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.stateTitle}>No food items found</Text>
          <Text style={styles.stateText}>
            Add the first food item to this menu or try a different search/filter.
          </Text>
        </AppCard>
      );
    }

    return filteredFoodItems.map((foodItem) => (
      <FoodItemAdminCard
        key={foodItem.id}
        foodItem={foodItem}
        deleting={deletingFoodItemId === foodItem.id}
        onEdit={() => router.push(`/admin/food-item-edit/${foodItem.id}`)}
        onDelete={() => handleDelete(foodItem)}
      />
    ));
  }

  return (
    <AdminScreenWrapper
      title="Restaurant Food Items"
      subtitle={
        menuName
          ? `${restaurantName || 'Restaurant'} - ${menuName} - ${foodItems.length} item(s)`
          : 'Manage food items in this menu.'
      }>
      <AppCard style={styles.toolbarCard}>
        <View style={styles.buttonRow}>
          <View style={styles.flexButton}>
            <AppButton
              title={refreshing ? 'Refreshing...' : 'Refresh'}
              variant="secondary"
              onPress={() => void loadFoodItems(true)}
              disabled={refreshing}
            />
          </View>
          <View style={styles.flexButton}>
            <AppButton
              title="Add Food Item"
              onPress={() =>
                router.push({
                  pathname: '/admin/food-item-add',
                  params: {
                    menuId,
                    restaurantId,
                    restaurantName,
                    menuName,
                  },
                })
              }
            />
          </View>
        </View>

        <AppTextField
          label="Search"
          placeholder="Search by food name, category, or description..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <PackageFilters
          title="Availability"
          options={FOOD_AVAILABILITY_OPTIONS}
          activeValue={activeStatus}
          onChange={setActiveStatus}
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
