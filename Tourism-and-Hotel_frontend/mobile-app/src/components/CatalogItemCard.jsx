import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { AppButton } from './AppButton';
import { AppCard } from './AppCard';
import { StatusBadge } from './StatusBadge';
import { theme } from '../theme';
import { getDefaultImage } from '../utils/media';

export function CatalogItemCard({
  title,
  subtitle,
  description,
  imageUrl,
  priceLabel,
  badgeLabel,
  badgeVariant = 'primary',
  metaLabel,
  actionLabel,
  onActionPress,
}) {
  const [resolvedImageUrl, setResolvedImageUrl] = useState(imageUrl || getDefaultImage());

  useEffect(() => {
    setResolvedImageUrl(imageUrl || getDefaultImage());
  }, [imageUrl]);

  return (
    <AppCard style={styles.card} padded={false}>
      <Image
        source={resolvedImageUrl}
        style={styles.image}
        contentFit="cover"
        transition={250}
        onError={() => {
          if (resolvedImageUrl !== getDefaultImage()) {
            setResolvedImageUrl(getDefaultImage());
          }
        }}
      />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.copyBlock}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {badgeLabel ? <StatusBadge label={badgeLabel} variant={badgeVariant} /> : null}
        </View>

        {description ? <Text style={styles.description}>{description}</Text> : null}

        <View style={styles.metaRow}>
          {priceLabel ? <Text style={styles.price}>{priceLabel}</Text> : null}
          {metaLabel ? <Text style={styles.metaLabel}>{metaLabel}</Text> : null}
        </View>

        {actionLabel ? <AppButton title={actionLabel} onPress={onActionPress} /> : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 210,
    backgroundColor: theme.colors.primarySoft,
  },
  content: {
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  copyBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  metaRow: {
    gap: theme.spacing.xs,
  },
  price: {
    color: theme.colors.primary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  metaLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
  },
});
