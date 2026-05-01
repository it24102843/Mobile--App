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
import { PackageAdminCard } from '../../components/admin/PackageAdminCard';
import { PackageFilters } from '../../components/admin/PackageFilters';
import { useAuth } from '../../context/AuthContext';
import {
  deleteAdminPackage,
  fetchAdminPackages,
  PACKAGE_CATEGORY_FILTERS,
  PACKAGE_STATUS_FILTERS,
} from '../../services/adminPackagesApi';
import { theme } from '../../theme';

function normalizeString(value) {
  return `${value ?? ''}`.trim().toLowerCase();
}

export default function AdminPackagesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [deletingPackageId, setDeletingPackageId] = useState(null);

  useEffect(() => {
    void loadPackages();
  }, [token]);

  async function loadPackages(isRefresh = false) {
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

      const response = await fetchAdminPackages(token);
      setPackages(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load packages.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredPackages = useMemo(() => {
    const normalizedQuery = normalizeString(searchQuery);

    return packages.filter((item) => {
      const matchesSearch =
        !normalizedQuery ||
        [item.name, item.packageId, item.category, item.meetingPoint].some((value) =>
          normalizeString(value).includes(normalizedQuery)
        );

      if (!matchesSearch) {
        return false;
      }

      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }

      if (activeStatus === 'available' && !item.availability) {
        return false;
      }

      if (activeStatus === 'unavailable' && item.availability) {
        return false;
      }

      return true;
    });
  }, [activeCategory, activeStatus, packages, searchQuery]);

  function handleDelete(item) {
    Alert.alert(
      'Delete package?',
      `Delete ${item.name} (${item.packageId}) from package management?`,
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
      setDeletingPackageId(item.packageId);
      const response = await deleteAdminPackage(token, item.packageId);
      Alert.alert('Package deleted', response?.message || 'The package was deleted.');
      await loadPackages(true);
    } catch (deleteError) {
      Alert.alert(
        'Delete failed',
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete this package right now.'
      );
    } finally {
      setDeletingPackageId(null);
    }
  }

  function renderContent() {
    if (loading) {
      return (
        <AppCard style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText}>Loading packages from the backend...</Text>
        </AppCard>
      );
    }

    if (error) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Retry" onPress={() => void loadPackages()} />
        </AppCard>
      );
    }

    if (!filteredPackages.length) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.stateTitle}>No packages found</Text>
          <Text style={styles.stateText}>
            Empty search shows all packages. Try another keyword or filter.
          </Text>
        </AppCard>
      );
    }

    return filteredPackages.map((item) => (
      <PackageAdminCard
        key={item.packageId}
        item={item}
        deleting={deletingPackageId === item.packageId}
        onView={() => router.push(`/admin/packages-details/${item.packageId}`)}
        onEdit={() => router.push(`/admin/packages-edit/${item.packageId}`)}
        onDelete={() => handleDelete(item)}
      />
    ));
  }

  return (
    <AdminScreenWrapper
      title="Package Management"
      subtitle={`Manage your tourism packages • ${packages.length} package(s)`}>
      <AppCard style={styles.toolbarCard}>
        <AppTextField
          label="Search"
          placeholder="Search packages by name, ID, or category..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <PackageFilters
          title="Category"
          options={PACKAGE_CATEGORY_FILTERS}
          activeValue={activeCategory}
          onChange={setActiveCategory}
        />

        <PackageFilters
          title="Status"
          options={PACKAGE_STATUS_FILTERS}
          activeValue={activeStatus}
          onChange={setActiveStatus}
        />

        <View style={styles.buttonRow}>
          <View style={styles.flexButton}>
            <AppButton
              title={refreshing ? 'Refreshing...' : 'Refresh'}
              variant="secondary"
              onPress={() => void loadPackages(true)}
              disabled={refreshing}
            />
          </View>
          <View style={styles.flexButton}>
            <AppButton
              title="Add Package"
              onPress={() => router.push('/admin/packages-add')}
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
