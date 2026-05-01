import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { CategoryFilter } from '../../components/admin/CategoryFilter';
import { EquipmentAdminCard } from '../../components/admin/EquipmentAdminCard';
import { useAuth } from '../../context/AuthContext';
import {
  deleteAdminEquipment,
  fetchAdminEquipment,
} from '../../services/adminEquipmentApi';
import { theme } from '../../theme';

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'camp', value: 'camp' },
  { label: 'tools', value: 'tools' },
  { label: 'travel', value: 'travel' },
];

function normalizeString(value) {
  return `${value ?? ''}`.trim().toLowerCase();
}

export default function AdminStorageEquipmentScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [deletingKey, setDeletingKey] = useState(null);

  useEffect(() => {
    void loadEquipment();
  }, [token]);

  async function loadEquipment(isRefresh = false) {
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

      const response = await fetchAdminEquipment(token);
      setItems(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load equipment.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeString(searchQuery);

    return items.filter((item) => {
      const matchesSearch =
        !normalizedQuery ||
        [item.name, item.key].some((value) =>
          normalizeString(value).includes(normalizedQuery)
        );

      if (!matchesSearch) {
        return false;
      }

      if (activeCategory === 'all') {
        return true;
      }

      return normalizeString(item.category) === activeCategory;
    });
  }, [activeCategory, items, searchQuery]);

  function handleDelete(item) {
    Alert.alert(
      'Delete equipment?',
      `Delete ${item.name} (${item.key}) from storage/equipment management?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void confirmDelete(item),
        },
      ]
    );
  }

  async function confirmDelete(item) {
    try {
      setDeletingKey(item.key);
      const response = await deleteAdminEquipment(token, item.key);
      Alert.alert('Equipment deleted', response?.message || 'The equipment item was deleted.');
      await loadEquipment(true);
    } catch (deleteError) {
      Alert.alert(
        'Delete failed',
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete this equipment item right now.'
      );
    } finally {
      setDeletingKey(null);
    }
  }

  function renderContent() {
    if (loading) {
      return (
        <AppCard style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText}>Loading equipment from the backend...</Text>
        </AppCard>
      );
    }

    if (error) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Retry" onPress={() => void loadEquipment()} />
        </AppCard>
      );
    }

    if (!filteredItems.length) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.stateTitle}>No equipment found</Text>
          <Text style={styles.stateText}>
            Empty search shows all equipment. Try another keyword or category.
          </Text>
        </AppCard>
      );
    }

    return filteredItems.map((item) => (
      <EquipmentAdminCard
        key={item.key}
        item={item}
        deleting={deletingKey === item.key}
        onEdit={() => router.push(`/admin/storage-equipment-edit/${item.key}`)}
        onDelete={() => handleDelete(item)}
      />
    ));
  }

  return (
    <AdminScreenWrapper
      title="Product Management"
      subtitle={`Manage your equipment inventory • ${items.length} item(s)`}>
      <AppCard style={styles.toolbarCard}>
        <AppTextField
          label="Search"
          placeholder="Search by name or key..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <CategoryFilter
          options={FILTER_OPTIONS}
          activeValue={activeCategory}
          onChange={setActiveCategory}
        />

        <View style={styles.buttonRow}>
          <View style={styles.flexButton}>
            <AppButton
              title={refreshing ? 'Refreshing...' : 'Refresh'}
              variant="secondary"
              onPress={() => void loadEquipment(true)}
              disabled={refreshing}
            />
          </View>
          <View style={styles.flexButton}>
            <AppButton
              title="Add New Equipment"
              onPress={() => router.push('/admin/storage-equipment-add')}
            />
          </View>
        </View>
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
