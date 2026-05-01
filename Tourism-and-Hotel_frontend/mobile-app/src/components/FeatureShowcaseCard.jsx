import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { AppCard } from './AppCard';
import { StatusBadge } from './StatusBadge';
import { theme } from '../theme';
import { getDefaultImage } from '../utils/media';

const accentStyles = {
  primary: {
    backgroundColor: theme.colors.primarySoft,
    iconColor: theme.colors.primary,
    borderColor: theme.colors.primaryMuted,
  },
  accent: {
    backgroundColor: theme.colors.accentSoft,
    iconColor: theme.colors.accent,
    borderColor: '#FFD1A0',
  },
  warning: {
    backgroundColor: theme.colors.warningSurface,
    iconColor: theme.colors.warning,
    borderColor: '#F1D47A',
  },
  info: {
    backgroundColor: theme.colors.infoSurface,
    iconColor: theme.colors.info,
    borderColor: theme.colors.infoBorder,
  },
};

export function FeatureShowcaseCard({
  title,
  subtitle,
  description,
  price,
  badge,
  icon,
  imageUrl,
  metaLabel,
  accent = 'primary',
  onPress,
}) {
  const currentAccent = accentStyles[accent] || accentStyles.primary;
  const [resolvedImageUrl, setResolvedImageUrl] = useState(imageUrl || null);

  useEffect(() => {
    setResolvedImageUrl(imageUrl || null);
  }, [imageUrl]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed ? styles.pressed : null]}>
      <AppCard padded={false} style={styles.card}>
        <View style={styles.imageWrap}>
          {resolvedImageUrl ? (
            <Image
              source={{ uri: resolvedImageUrl }}
              style={styles.image}
              contentFit="cover"
              onError={() => {
                if (resolvedImageUrl !== getDefaultImage()) {
                  setResolvedImageUrl(getDefaultImage());
                } else {
                  setResolvedImageUrl(null);
                }
              }}
            />
          ) : (
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: currentAccent.backgroundColor,
                  borderColor: currentAccent.borderColor,
                },
              ]}>
              <MaterialCommunityIcons name={icon} size={26} color={currentAccent.iconColor} />
            </View>
          )}

          <View style={styles.imageOverlay} />

          <View style={styles.badgeWrap}>
            {badge ? <StatusBadge label={badge} variant={accent} /> : null}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.topMetaRow}>
            {metaLabel ? <Text style={styles.metaLabel}>{metaLabel}</Text> : <View />}
            {price ? <Text style={styles.price}>{price}</Text> : null}
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Tap to explore</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={18}
              color={theme.colors.primary}
            />
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: 286,
    marginRight: theme.spacing.md,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ translateY: 1 }],
  },
  card: {
    width: 286,
    overflow: 'hidden',
    minHeight: 316,
    backgroundColor: '#FFFDF9',
    borderColor: '#EADFCB',
    borderRadius: 26,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  imageWrap: {
    height: 174,
    backgroundColor: theme.colors.primarySoft,
    justifyContent: 'flex-start',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 28, 51, 0.18)',
  },
  badgeWrap: {
    padding: theme.spacing.md,
  },
  iconWrap: {
    width: 156,
    height: 156,
    borderRadius: 0,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
    flex: 1,
  },
  topMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  metaLabel: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
    flex: 1,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.text,
    ...theme.typography.bodySmall,
    fontWeight: '600',
  },
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    flex: 1,
  },
  price: {
    color: theme.colors.primary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.xs,
    marginTop: 'auto',
  },
  footerText: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
});
