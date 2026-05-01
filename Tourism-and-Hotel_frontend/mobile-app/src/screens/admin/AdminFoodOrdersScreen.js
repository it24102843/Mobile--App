import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppSelectField } from '../../components/AppSelectField';
import { AppTextField } from '../../components/AppTextField';
import { StatusBadge } from '../../components/StatusBadge';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { useAuth } from '../../context/AuthContext';
import {
  fetchAdminFoodOrders,
  FOOD_ORDER_STATUS_OPTIONS,
  updateAdminFoodOrderStatus,
} from '../../services/foodOrdersApi';
import { theme } from '../../theme';

function normalizeString(value) {
  return `${value ?? ''}`.trim().toLowerCase();
}

function formatCurrency(value) {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value) || 0)}`;
}

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function AdminFoodOrdersScreen() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

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

      const response = await fetchAdminFoodOrders(token);
      setOrders(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load food orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const normalizedQuery = normalizeString(searchQuery);

    return orders.filter((order) => {
      const matchesSearch =
        !normalizedQuery ||
        [
          order.orderId,
          order.customerName,
          order.customerEmail,
          order.restaurantName,
          order.foodName,
        ].some((value) => normalizeString(value).includes(normalizedQuery));

      if (!matchesSearch) {
        return false;
      }

      if (activeStatus !== 'all' && order.status !== activeStatus) {
        return false;
      }

      return true;
    });
  }, [activeStatus, orders, searchQuery]);

  async function handleStatusUpdate(order, nextStatus) {
    if (!token) {
      return;
    }

    const actionLabel = nextStatus === 'Confirmed' ? 'Approve' : 'Reject';
    const resultLabel = nextStatus === 'Confirmed' ? 'confirmed' : 'cancelled';

    if (order.status === nextStatus) {
      Alert.alert('No Change Needed', `This food order is already ${resultLabel}.`);
      return;
    }

    if (order.status === 'Cancelled') {
      Alert.alert('Order Already Rejected', 'This food order has already been cancelled.');
      return;
    }

    if (order.status === 'Confirmed' && nextStatus === 'Confirmed') {
      Alert.alert('Order Already Approved', 'This food order is already confirmed.');
      return;
    }

    Alert.alert(
      `${actionLabel} Food Order`,
      `Do you want to ${actionLabel.toLowerCase()} order ${order.orderId}?`,
      [
        { text: 'Keep as is', style: 'cancel' },
        {
          text: actionLabel,
          style: nextStatus === 'Cancelled' ? 'destructive' : 'default',
          onPress: () => void confirmStatusUpdate(order, nextStatus),
        },
      ]
    );
  }

  async function confirmStatusUpdate(order, nextStatus) {
    try {
      setUpdatingOrderId(order.id);
      const response = await updateAdminFoodOrderStatus(token, order.id, nextStatus);
      Alert.alert(
        'Food order updated',
        response?.message ||
          `The food order is now ${nextStatus === 'Confirmed' ? 'confirmed' : 'cancelled'}.`
      );

      await loadOrders(true);
    } catch (updateError) {
      Alert.alert(
        'Update failed',
        updateError instanceof Error
          ? updateError.message
          : 'Unable to update this food order right now.'
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function renderStateCard(title, message, retryable = false) {
    return (
      <AppCard style={styles.stateCard}>
        <Text style={styles.stateTitle}>{title}</Text>
        <Text style={styles.stateText}>{message}</Text>
        {retryable ? <AppButton title="Retry" onPress={() => void loadOrders()} /> : null}
      </AppCard>
    );
  }
  return (
    <AdminScreenWrapper
      title="Food Orders Management"
      subtitle={`Track restaurant orders, update customer requests, and manage live food orders - ${orders.length} order(s)`}>
      <AppCard style={styles.toolbarCard}>
        <View style={styles.buttonRow}>
          <View style={styles.flexButton}>
            <AppButton
              title={refreshing ? 'Refreshing...' : 'Refresh'}
              variant="secondary"
              onPress={() => void loadOrders(true)}
              disabled={refreshing}
            />
          </View>
        </View>

        <AppTextField
          label="Search"
          placeholder="Search by order ID, customer, email, restaurant, or food item..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <AppSelectField
          label="Status Filter"
          value={activeStatus}
          options={FOOD_ORDER_STATUS_OPTIONS}
          onChange={setActiveStatus}
        />
      </AppCard>

      {loading ? (
        <AppCard style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText}>Loading food orders from the backend...</Text>
        </AppCard>
      ) : null}

      {!loading && error ? renderStateCard('Unable to load food orders', error, true) : null}

      {!loading && !error && !filteredOrders.length
        ? renderStateCard(
            'No food orders found',
            'Try a different search term or filter to find restaurant orders.'
          )
        : null}

      {!loading && !error ? (
        <View style={styles.listWrap}>
          {filteredOrders.map((order) => (
            <AppCard key={order.id} style={styles.orderCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderCopy}>
                  <Text style={styles.cardTitle}>{order.foodName}</Text>
                  <Text style={styles.cardSubtitle}>
                    {order.orderId} - {order.restaurantName}
                  </Text>
                </View>
                <StatusBadge label={order.statusLabel} variant={order.statusVariant} />
              </View>

              <View style={styles.orderPreviewRow}>
                <Image source={{ uri: order.imageUrl }} style={styles.orderImage} contentFit="cover" />
                <View style={styles.orderPreviewCopy}>
                  <Text style={styles.previewTitle}>{order.customerName}</Text>
                  <Text style={styles.previewSubtitle}>{order.customerEmail}</Text>
                </View>
              </View>

              <InfoRow icon="storefront-outline" label="Restaurant" value={order.restaurantName} />
              <InfoRow icon="silverware-fork-knife" label="Food Item" value={order.foodName} />
              <InfoRow icon="basket-outline" label="Quantity" value={`${order.quantity}`} />
              <InfoRow icon="cash-multiple" label="Total" value={formatCurrency(order.totalAmount)} />
              <InfoRow icon="phone-outline" label="Contact" value={order.customerPhone} />
              <InfoRow icon="truck-delivery-outline" label="Method" value={order.fulfillmentMethod} />
              <InfoRow icon="calendar-range" label="Order Date" value={formatDate(order.orderDate)} />

              {order.specialNote ? (
                <Text style={styles.specialNote}>Special Note: {order.specialNote}</Text>
              ) : null}

              <View style={styles.buttonRow}>
                <View style={styles.flexButton}>
                  <AppButton
                    title={updatingOrderId === order.id ? 'Updating...' : 'Approve'}
                    variant="secondary"
                    onPress={() => handleStatusUpdate(order, 'Confirmed')}
                    disabled={
                      updatingOrderId === order.id ||
                      order.status === 'Confirmed' ||
                      order.status === 'Cancelled'
                    }
                  />
                </View>
                <View style={styles.flexButton}>
                  <AppButton
                    title={updatingOrderId === order.id ? 'Updating...' : 'Reject'}
                    variant="danger"
                    onPress={() => handleStatusUpdate(order, 'Cancelled')}
                    disabled={updatingOrderId === order.id || order.status === 'Cancelled'}
                  />
                </View>
              </View>
            </AppCard>
          ))}
        </View>
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
      <Text style={styles.infoValue}>{value || 'Not available'}</Text>
    </View>
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
  orderCard: {
    gap: theme.spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  cardHeaderCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  orderPreviewRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  orderImage: {
    width: 72,
    height: 72,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primarySoft,
  },
  orderPreviewCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  previewTitle: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  previewSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  specialNote: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  stateCard: {
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  stateTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
    textAlign: 'center',
  },
  stateText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
    textAlign: 'center',
  },
});
