import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { StatusBadge } from '../StatusBadge';
import { theme } from '../../theme';
import { getDefaultImage } from '../../utils/media';
import { formatLkr } from '../../utils/gearRental';

export function GearProductCard({ product, onPress, onAddToCart }) {
  const [resolvedImageUrl, setResolvedImageUrl] = useState(product.imageUrl || getDefaultImage());

  useEffect(() => {
    setResolvedImageUrl(product.imageUrl || getDefaultImage());
  }, [product.imageUrl]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed ? styles.pressed : null]}>
      <AppCard style={styles.card} padded={false}>
        <Image
          source={{ uri: resolvedImageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          onError={() => {
            if (resolvedImageUrl !== getDefaultImage()) {
              setResolvedImageUrl(getDefaultImage());
            }
          }}
        />

        <View style={styles.overlayRow}>
          <StatusBadge label={product.category} variant="info" />
          <StatusBadge label={product.stockLabel} variant={product.stockVariant} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.description} numberOfLines={3}>
            {product.description}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="cash-multiple" size={18} color={theme.colors.accent} />
              <Text style={styles.metaText}>{formatLkr(product.dailyRentalprice)} / day</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="map-marker" size={18} color={theme.colors.primary} />
              <Text style={styles.metaText}>{product.pickupLocation}</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <View style={styles.flexAction}>
              <AppButton title="View Details" variant="secondary" onPress={onPress} />
            </View>
            <View style={styles.flexAction}>
              <AppButton
                title={product.availability ? 'Add to Cart' : 'Out of Stock'}
                onPress={onAddToCart}
                disabled={!product.availability}
              />
            </View>
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.97,
  },
  card: {
    overflow: 'hidden',
    gap: 0,
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: theme.colors.primarySoft,
  },
  overlayRow: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  content: {
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
  },
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  metaRow: {
    gap: theme.spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  metaText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flexAction: {
    flex: 1,
  },
});
