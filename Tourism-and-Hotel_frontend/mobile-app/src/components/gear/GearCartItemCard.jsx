import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { StatusBadge } from '../StatusBadge';
import { theme } from '../../theme';
import { formatLkr, getStockMeta } from '../../utils/gearRental';

export function GearCartItemCard({
  item,
  quantity,
  onDecrease,
  onIncrease,
  onRemove,
  subtotalLabel,
}) {
  const stockMeta = getStockMeta(item.stockCount);

  return (
    <AppCard style={styles.card}>
      <View style={styles.topRow}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" />

        <View style={styles.copyBlock}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.subtitle}>{item.category}</Text>
          <StatusBadge label={stockMeta.label} variant={stockMeta.variant} />
          <Text style={styles.price}>{formatLkr(item.dailyRentalprice)} / day</Text>
        </View>
      </View>

      <View style={styles.counterRow}>
        <View style={styles.counterControls}>
          <View style={styles.counterButton}>
            <AppButton title="-" variant="secondary" onPress={onDecrease} disabled={quantity <= 1} />
          </View>
          <Text style={styles.quantityText}>{quantity}</Text>
          <View style={styles.counterButton}>
            <AppButton
              title="+"
              variant="secondary"
              onPress={onIncrease}
              disabled={quantity >= item.stockCount}
            />
          </View>
        </View>

        <View style={styles.subtotalBlock}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValue}>{subtotalLabel}</Text>
        </View>
      </View>

      <AppButton title="Remove Item" variant="danger" onPress={onRemove} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primarySoft,
  },
  copyBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  price: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  counterButton: {
    width: 58,
  },
  quantityText: {
    minWidth: 28,
    textAlign: 'center',
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  subtotalBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  subtotalLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  subtotalValue: {
    color: theme.colors.accent,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
});
