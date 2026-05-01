import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

function StatusBadge({ label, variant }) {
  const stylesByVariant =
    variant === 'success'
      ? {
          backgroundColor: '#E7F7EF',
          color: '#146948',
        }
      : variant === 'danger'
        ? {
            backgroundColor: '#FDECEC',
            color: '#A03333',
          }
        : {
            backgroundColor: '#FFF6DE',
            color: '#7A6118',
          };

  return (
    <View style={[styles.badge, { backgroundColor: stylesByVariant.backgroundColor }]}>
      <Text style={[styles.badgeText, { color: stylesByVariant.color }]}>{label}</Text>
    </View>
  );
}

function ActionButton({ label, onPress, variant = 'default', disabled = false }) {
  const backgroundColor =
    variant === 'danger'
      ? theme.colors.danger
      : variant === 'success'
        ? theme.colors.success
        : theme.colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor },
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function MetaItem({ label, value }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

export function EquipmentOrderCard({
  order,
  actionLoading = false,
  onApprove,
  onReject,
  onDetails,
}) {
  const lowerStatus = `${order.statusLabel}`.toLowerCase();
  const canUpdate = lowerStatus === 'pending';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Order {order.orderId}</Text>
          <Text style={styles.subtitle}>{order.email}</Text>
        </View>
        <StatusBadge label={order.statusLabel} variant={order.statusVariant} />
      </View>

      <View style={styles.metaGrid}>
        <MetaItem label="Days" value={order.daysLabel} />
        <MetaItem label="Start Date" value={order.startDateLabel} />
        <MetaItem label="End Date" value={order.endDateLabel} />
        <MetaItem label="Total Amount" value={order.totalAmountLabel} />
        <MetaItem label="Order Date" value={order.orderDateLabel} />
        <MetaItem label="Items" value={`${order.itemCount}`} />
      </View>

      <View style={styles.inlineRow}>
        <MaterialCommunityIcons name="package-variant-closed" size={18} color={theme.colors.primary} />
        <Text style={styles.inlineText}>{order.firstItemName}</Text>
      </View>

      <View style={styles.actionRow}>
        <ActionButton
          label="View Details"
          onPress={onDetails}
          disabled={actionLoading}
        />
        {canUpdate ? (
          <ActionButton
            label={actionLoading ? 'Updating...' : 'Approve'}
            variant="success"
            onPress={onApprove}
            disabled={actionLoading}
          />
        ) : null}
        {canUpdate ? (
          <ActionButton
            label={actionLoading ? 'Updating...' : 'Reject'}
            variant="danger"
            onPress={onReject}
            disabled={actionLoading}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F1',
    padding: 18,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#13233E',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '800',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metaItem: {
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7D9BA',
    backgroundColor: '#FFF9EF',
    padding: 12,
    gap: 4,
  },
  metaLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
  },
  metaValue: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.55,
  },
});
