import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { cancelGearOrder } from '../../api/bookings';
import { fetchGearOrderById } from '../../api/gearRental';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth, useRequireAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';
import { formatGearOrderStatus, formatLkr, normalizeGearOrder } from '../../utils/gearRental';
import { resolveMediaUrl, getDefaultImage } from '../../utils/media';
import {
  formatPaymentMethodLabel,
  formatPaymentStatusLabel,
  getRefundStatusMeta,
} from '../../utils/roomBooking';

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
  }).format(date);
}

export default function GearOrderDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const { isAuthenticated, token } = useAuth();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';
  const [state, setState] = useState({
    loading: true,
    error: null,
    order: null,
  });
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth(`/bookings/orders/${orderId}`, { showAlert: false });
      return;
    }

    let mounted = true;

    async function loadOrder() {
      try {
        const order = await fetchGearOrderById(token, orderId);

        if (mounted) {
          setState({
            loading: false,
            error: null,
            order: normalizeGearOrder(order),
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            error,
            order: null,
          });
        }
      }
    }

    loadOrder();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, orderId, requireAuth, token]);

  const statusMeta = useMemo(
    () => state.order?.statusMeta || formatGearOrderStatus('Pending'),
    [state.order]
  );
  const refundMeta = useMemo(
    () => getRefundStatusMeta(state.order?.refundStatus),
    [state.order?.refundStatus]
  );
  const canCancel = useMemo(() => {
    const startDate = new Date(state.order?.startingDate);

    return (
      state.order?.status !== 'Cancelled' &&
      state.order?.status !== 'Completed' &&
      !Number.isNaN(startDate.getTime()) &&
      new Date() < startDate
    );
  }, [state.order]);

  if (!isAuthenticated) {
    return null;
  }

  const handleCancel = () => {
    if (!canCancel || cancelling) {
      return;
    }

    Alert.alert(
      'Cancel Rental Order',
      `Do you want to cancel rental order ${state.order.orderId}?`,
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              const response = await cancelGearOrder(token, state.order.orderId);
              Alert.alert(
                'Order Updated',
                response?.message || 'Your rental order has been cancelled.'
              );
              router.replace('/my-bookings');
            } catch (error) {
              Alert.alert(
                'Cancellation Failed',
                error instanceof Error
                  ? error.message
                  : 'Unable to cancel this rental order right now.'
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (state.loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader title="Rental Order" subtitle="Loading rental order details..." fallbackHref="/my-bookings" />
          <HomeSectionState loading />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (state.error || !state.order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader title="Rental Order" subtitle="We could not load this rental order." fallbackHref="/my-bookings" />
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load the rental order details right now. Please try again.
            </Text>
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Rental Order"
          subtitle={`Order ID: ${state.order.orderId}`}
          fallbackHref="/my-bookings"
        />

        <AppCard style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryTitle}>Storage / Equipment Rental</Text>
              <Text style={styles.summarySubtitle}>Created with real backend order data</Text>
            </View>
            <StatusBadge label={statusMeta.label} variant={statusMeta.variant} />
          </View>

          <InfoRow label="Start Date" value={formatDate(state.order.startingDate)} />
          <InfoRow label="End Date" value={formatDate(state.order.endingDate)} />
          <InfoRow label="Rental Duration" value={`${state.order.days} day(s)`} />
          <InfoRow label="Payment Method" value={formatPaymentMethodLabel(state.order.paymentMethod)} />
          <InfoRow label="Payment Status" value={formatPaymentStatusLabel(state.order.paymentStatus)} />
          <InfoRow label="Total Amount" value={formatLkr(state.order.totalAmount)} />
          {refundMeta ? <InfoRow label="Refund Status" value={refundMeta.label} /> : null}
        </AppCard>

        <AppCard style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>Selected Rental Items</Text>
          {state.order.orderedItems?.map((item, index) => (
            <View key={`${item.product?.key}-${index}`} style={styles.itemRow}>
              <Image
                source={{ uri: resolveMediaUrl(item.product?.image, getDefaultImage()) }}
                style={styles.itemImage}
                contentFit="cover"
              />
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>{item.product?.name || 'Rental Item'}</Text>
                <Text style={styles.itemMeta}>
                  Qty {item.quantity} - {formatLkr(item.product?.dailyRentalprice || 0)} / day
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                {formatLkr((item.quantity || 0) * (item.product?.dailyRentalprice || 0) * (state.order.days || 0))}
              </Text>
            </View>
          ))}
        </AppCard>

        {canCancel ? (
          <AppButton
            title={cancelling ? 'Cancelling...' : 'Cancel Rental Order'}
            variant="danger"
            onPress={handleCancel}
            disabled={cancelling}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  summaryCard: {
    gap: theme.spacing.md,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  summaryCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  summaryTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  summarySubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  itemsCard: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
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
  },
  itemRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primarySoft,
  },
  itemCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  itemTitle: {
    color: theme.colors.text,
    ...theme.typography.body,
    fontWeight: '700',
  },
  itemMeta: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  itemTotal: {
    color: theme.colors.accent,
    ...theme.typography.bodySmall,
    fontWeight: '800',
    textAlign: 'right',
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
