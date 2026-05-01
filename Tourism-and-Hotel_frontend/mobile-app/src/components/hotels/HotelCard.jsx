import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { getDefaultImage } from '../../utils/media';
import { theme } from '../../theme';

export function HotelCard({
  title,
  location,
  description,
  imageUrl,
  ratingLabel,
  onPress,
}) {
  const [resolvedImageUrl, setResolvedImageUrl] = useState(imageUrl || getDefaultImage());

  useEffect(() => {
    setResolvedImageUrl(imageUrl || getDefaultImage());
  }, [imageUrl]);

  return (
    <AppCard style={styles.card} padded={false}>
      <Image
        source={{ uri: resolvedImageUrl }}
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
        <View style={styles.headerRow}>
          <View style={styles.copyBlock}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.accent} />
              <Text style={styles.location}>{location}</Text>
              <Text style={styles.rating}>{ratingLabel}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.description}>{description}</Text>

        <AppButton title="View Rooms" onPress={onPress} />
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
    height: 220,
    backgroundColor: theme.colors.primarySoft,
  },
  content: {
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
  },
  headerRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  copyBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    color: '#2E2419',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  location: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  rating: {
    color: theme.colors.accent,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
});
