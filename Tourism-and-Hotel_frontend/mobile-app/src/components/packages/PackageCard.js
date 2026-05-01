import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

export function PackageCard({ item, onPress }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" />

      <View style={styles.content}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={3}>
          {item.descriptionPreview || item.description}
        </Text>

        <View style={styles.metaRow}>
          <Meta icon="clock-outline" label={item.durationLabel} />
          <Meta icon="account-group-outline" label={item.maxGuestsLabel} />
        </View>

        <View style={styles.metaRow}>
          <Meta icon="map-marker-outline" label={item.locationLabel} />
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.fromLabel}>FROM</Text>
            <Text style={styles.price}>{item.priceLabel}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}>
            <Text style={styles.buttonText}>View Details</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.accent} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Meta({ icon, label }) {
  return (
    <View style={styles.metaItem}>
      <MaterialCommunityIcons name={icon} size={14} color={theme.colors.accent} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E4DD',
    ...theme.shadows.card,
  },
  image: {
    width: '100%',
    height: 210,
    backgroundColor: '#E9EEF6',
  },
  content: {
    padding: 18,
    gap: theme.spacing.md,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
    backgroundColor: '#FFF2C7',
  },
  categoryText: {
    color: '#9C6A14',
    ...theme.typography.bodySmall,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#2E2419',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0E8DA',
  },
  fromLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  price: {
    color: theme.colors.accent,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  button: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: '#E6A14A',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buttonText: {
    color: theme.colors.accent,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
  },
});
