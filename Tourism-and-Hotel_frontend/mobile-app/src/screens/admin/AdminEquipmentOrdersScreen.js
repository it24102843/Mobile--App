import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { EquipmentOrderCard } from '../../components/admin/EquipmentOrderCard';
import { EquipmentOrderFilters } from '../../components/admin/EquipmentOrderFilters';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { useAuth } from '../../context/AuthContext';
import {
  EQUIPMENT_ORDER_FILTERS,
  fetchAdminEquipmentOrderById,
  fetchAdminEquipmentOrders,
  updateAdminEquipmentOrderStatus,
} from '../../services/adminEquipmentOrdersApi';
import { theme } from '../../theme';

function normalizeString(value) {
  return `${value ?? ''}`.trim().toLowerCase();
}

export default function AdminEquipmentOrdersScreen() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [actionOrderId, setActionOrderId] = useState(null);

  useEffect(() => {
    void loadOrders();
  }, [token]);

  async function loadOrders(isRefresh = false) {
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

      const response = await fetchAdminEquipmentOrders(token);
      setOrders(response.orders);
      setStats(response.stats);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load equipment orders right now.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const query = normalizeString(searchQuery);

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        [order.orderId, order.email].some((value) =>
          normalizeString(value).includes(query)
        );

      if (!matchesSearch) {
        return false;
      }

      if (activeFilter === 'all') {
        return true;
      }

      return normalizeString(order.statusLabel) === activeFilter;
    });
  }, [activeFilter, orders, searchQuery]);

  function confirmStatusUpdate(order, nextStatus) {
    Alert.alert(
      `${nextStatus} order?`,
      `${nextStatus} equipment order ${order.orderId} for ${order.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextStatus,
          style: nextStatus === 'Rejected' ? 'destructive' : 'default',
          onPress: () => void handleStatusUpdate(order, nextStatus),
        },
      ]
    );
  }

  async function handleStatusUpdate(order, nextStatus) {
    if (`${order.statusLabel}`.toLowerCase() !== 'pending') {
      Alert.alert('Action blocked', 'Only pending equipment orders can be updated here.');
      return;
    }

    try {
      setActionOrderId(order.orderId);
      const response = await updateAdminEquipmentOrderStatus(token, order.orderId, nextStatus);
      Alert.alert(
        'Order updated',
        response?.message || `Order marked as ${nextStatus}.`
      );
      await loadOrders(true);
    } catch (actionError) {
      Alert.alert(
        'Update failed',
        actionError instanceof Error
          ? actionError.message
          : 'Unable to update this equipment order right now.'
      );
    } finally {
      setActionOrderId(null);
    }
  }

  async function handleViewDetails(order) {
    try {
      const details = await fetchAdminEquipmentOrderById(token, order.orderId);
      const lines = [
        `Order ID: ${details.orderId || order.orderId}`,
        `Email: ${details.email || order.email}`,
        `Days: ${details.days || 0}`,
        `Start Date: ${order.startDateLabel}`,
        `End Date: ${order.endDateLabel}`,
        `Total Amount: ${order.totalAmountLabel}`,
        `Order Date: ${order.orderDateLabel}`,
        `Status: ${details.status || order.statusLabel}`,
      ];

      if (Array.isArray(details.orderedItems) && details.orderedItems.length) {
        lines.push('', 'Items:');
        details.orderedItems.forEach((item) => {
          lines.push(
            `- ${item.product?.name || 'Equipment'} x${item.quantity || 0} (${item.product?.key || 'N/A'})`
          );
        });
      }

      Alert.alert('Equipment Order Details', lines.join('\n'));
    } catch (detailError) {
      Alert.alert(
        'Unable to load details',
        detailError instanceof Error
          ? detailError.message
          : 'This equipment order could not be loaded.'
      );
    }
  }

  function renderStats() {
    const statItems = [
      { label: 'Approved', value: stats.approved, color: theme.colors.success },
      { label: 'Pending', value: stats.pending, color: theme.colors.warning },
      { label: 'Rejected', value: stats.rejected, color: theme.colors.danger },
    ];

    return (
      <View style={styles.statsRow}>
        {statItems.map((item) => (
          <View key={item.label} style={styles.statCard}>
            <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    );
  }

  function renderContent() {
    if (loading) {
      return (
        <AppCard style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText}>Loading equipment orders from MongoDB...</Text>
        </AppCard>
      );
    }

    if (error) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Retry" onPress={() => void loadOrders()} />
        </AppCard>
      );
    }

    if (!filteredOrders.length) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.stateTitle}>No equipment orders found</Text>
          <Text style={styles.stateText}>
            Try a different order ID, email, or status filter.
          </Text>
        </AppCard>
      );
    }

    return filteredOrders.map((order) => (
      <EquipmentOrderCard
        key={order.orderId}
        order={order}
        actionLoading={actionOrderId === order.orderId}
        onApprove={() => confirmStatusUpdate(order, 'Approved')}
        onReject={() => confirmStatusUpdate(order, 'Rejected')}
        onDetails={() => void handleViewDetails(order)}
      />
    ));
  }

  return (
    <AdminScreenWrapper
      title="Booking Management"
      subtitle={`${stats.total} Total Orders`}>
      <AppCard style={styles.toolbarCard}>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>{stats.total} Total Orders</Text>
        </View>

        {renderStats()}

        <AppTextField
          label="Search"
          placeholder="Search by order ID or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <EquipmentOrderFilters
          filters={EQUIPMENT_ORDER_FILTERS}
          activeFilter={activeFilter}
          onChange={setActiveFilter}
        />

        <View style={styles.refreshWrap}>
          <AppButton
            title={refreshing ? 'Refreshing...' : 'Refresh'}
            variant="secondary"
            onPress={() => void loadOrders(true)}
            disabled={refreshing}
          />
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
  totalBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radii.pill,
    backgroundColor: '#EEF5FF',
    borderWidth: 1,
    borderColor: '#D7E2F2',
  },
  totalBadgeText: {
    color: theme.colors.primary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: 90,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F1',
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
  refreshWrap: {
    minWidth: 130,
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
