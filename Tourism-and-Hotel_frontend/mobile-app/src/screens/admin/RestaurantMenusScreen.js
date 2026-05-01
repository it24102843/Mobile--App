import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { MenuAdminCard } from '../../components/admin/MenuAdminCard';
import { MenuForm } from '../../components/admin/MenuForm';
import { useAuth } from '../../context/AuthContext';
import {
  buildMenuPayload,
  createAdminMenu,
  deleteAdminMenu,
  fetchAdminMenusByRestaurant,
  fetchAdminRestaurantById,
  updateAdminMenu,
  validateMenuForm,
} from '../../services/adminRestaurantApi';
import { theme } from '../../theme';

const INITIAL_MENU_VALUES = {
  name: '',
  description: '',
  status: 'Active',
  imageUrls: [''],
};

function normalizeString(value) {
  return `${value ?? ''}`.trim().toLowerCase();
}

function toFormValues(menu) {
  return {
    name: menu.name || '',
    description: menu.description || '',
    status: menu.statusLabel || 'Active',
    imageUrls: menu.imageGallery?.length ? menu.imageGallery : [menu.imageUrl],
  };
}

export default function RestaurantMenusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();
  const restaurantId = typeof params.restaurantId === 'string' ? params.restaurantId : '';
  const [restaurant, setRestaurant] = useState(null);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [formValues, setFormValues] = useState(INITIAL_MENU_VALUES);
  const [formErrors, setFormErrors] = useState({});
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingMenuId, setDeletingMenuId] = useState(null);

  useEffect(() => {
    void loadData();
  }, [token, restaurantId]);

  async function loadData(isRefresh = false) {
    if (!token || !restaurantId) {
      return;
    }

    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [restaurantResponse, menusResponse] = await Promise.all([
        fetchAdminRestaurantById(token, restaurantId),
        fetchAdminMenusByRestaurant(token, restaurantId),
      ]);

      setRestaurant(restaurantResponse);
      setMenus(menusResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load menus.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredMenus = useMemo(() => {
    const normalizedQuery = normalizeString(searchQuery);

    return menus.filter((menu) => {
      if (!normalizedQuery) {
        return true;
      }

      return [menu.name, menu.description].some((value) =>
        normalizeString(value).includes(normalizedQuery)
      );
    });
  }, [menus, searchQuery]);

  function openCreateForm() {
    setEditingMenuId(null);
    setFormValues(INITIAL_MENU_VALUES);
    setFormErrors({});
    setFormVisible(true);
  }

  function openEditForm(menu) {
    setEditingMenuId(menu.id);
    setFormValues(toFormValues(menu));
    setFormErrors({});
    setFormVisible(true);
  }

  function closeForm() {
    setFormVisible(false);
    setEditingMenuId(null);
    setFormValues(INITIAL_MENU_VALUES);
    setFormErrors({});
  }

  function updateField(field, value, index) {
    setFormValues((current) => {
      if (field === 'imageUrls') {
        const nextImages = [...current.imageUrls];
        nextImages[index] = value;
        return { ...current, imageUrls: nextImages };
      }

      return { ...current, [field]: value };
    });

    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  function addImageField() {
    setFormValues((current) => ({ ...current, imageUrls: [...current.imageUrls, ''] }));
  }

  function removeImageField(index) {
    setFormValues((current) => {
      const nextImages = current.imageUrls.filter((_, imageIndex) => imageIndex !== index);
      return { ...current, imageUrls: nextImages.length ? nextImages : [''] };
    });
  }

  async function handleSubmit() {
    const validation = validateMenuForm(formValues, menus, { currentMenuId: editingMenuId });
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildMenuPayload(formValues, restaurantId);

      if (editingMenuId) {
        const response = await updateAdminMenu(token, editingMenuId, payload);
        Alert.alert('Menu updated', response?.message || 'The menu was updated successfully.');
      } else {
        const response = await createAdminMenu(token, restaurantId, payload);
        Alert.alert('Menu added', response?.message || 'The menu was added successfully.');
      }

      closeForm();
      await loadData(true);
    } catch (submitError) {
      Alert.alert(
        editingMenuId ? 'Unable to update menu' : 'Unable to add menu',
        submitError instanceof Error ? submitError.message : 'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(menu) {
    Alert.alert('Delete menu?', `Delete ${menu.name} and all of its food items?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void confirmDelete(menu),
      },
    ]);
  }

  async function confirmDelete(menu) {
    try {
      setDeletingMenuId(menu.id);
      const response = await deleteAdminMenu(token, menu.id);
      Alert.alert('Menu deleted', response?.message || 'The menu was deleted.');
      await loadData(true);
    } catch (deleteError) {
      Alert.alert(
        'Delete failed',
        deleteError instanceof Error ? deleteError.message : 'Unable to delete this menu.'
      );
    } finally {
      setDeletingMenuId(null);
    }
  }

  function renderContent() {
    if (loading) {
      return (
        <AppCard style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText}>Loading restaurant menus...</Text>
        </AppCard>
      );
    }

    if (error) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Retry" onPress={() => void loadData()} />
        </AppCard>
      );
    }

    if (!filteredMenus.length) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.stateTitle}>No menus found</Text>
          <Text style={styles.stateText}>
            Create the first menu for this restaurant or try a different search term.
          </Text>
        </AppCard>
      );
    }

    return filteredMenus.map((menu) => (
      <MenuAdminCard
        key={menu.id}
        menu={menu}
        deleting={deletingMenuId === menu.id}
        onEdit={() => openEditForm(menu)}
        onDelete={() => handleDelete(menu)}
        onManageFoodItems={() =>
          router.push({
            pathname: `/admin/restaurant-food-items/${menu.id}`,
            params: {
              restaurantId,
              restaurantName: restaurant?.name || '',
              menuName: menu.name,
            },
          })
        }
      />
    ));
  }

  return (
    <AdminScreenWrapper
      title="Restaurant Menus"
      subtitle={
        restaurant
          ? `${restaurant.name} - ${menus.length} menu(s)`
          : 'Manage restaurant menus and food sections.'
      }>
      <AppCard style={styles.toolbarCard}>
        <View style={styles.buttonRow}>
          <View style={styles.flexButton}>
            <AppButton
              title={refreshing ? 'Refreshing...' : 'Refresh'}
              variant="secondary"
              onPress={() => void loadData(true)}
              disabled={refreshing}
            />
          </View>
          <View style={styles.flexButton}>
            <AppButton title="Add Menu" onPress={openCreateForm} />
          </View>
        </View>

        <AppTextField
          label="Search"
          placeholder="Search menus by name or description..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </AppCard>

      {formVisible ? (
        <MenuForm
          values={formValues}
          errors={formErrors}
          onChange={updateField}
          onAddImageField={addImageField}
          onRemoveImageField={removeImageField}
          submitLabel={editingMenuId ? 'Update Menu' : 'Add Menu'}
          secondaryLabel="Cancel"
          onSubmit={() => void handleSubmit()}
          onSecondary={closeForm}
          submitting={submitting}
        />
      ) : null}

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
