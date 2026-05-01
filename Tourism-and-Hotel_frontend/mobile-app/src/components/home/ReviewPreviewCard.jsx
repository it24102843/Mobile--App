import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppCard } from '../AppCard';
import { theme } from '../../theme';

export function ReviewPreviewCard({ name, comment, rating, section, dateLabel, imageUrl }) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <Image source={{ uri: imageUrl }} style={styles.avatar} contentFit="cover" />
        <View style={styles.identity}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>
            {section} • {dateLabel}
          </Text>
        </View>
      </View>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialCommunityIcons
            key={star}
            name={star <= Math.round(rating) ? 'star' : 'star-outline'}
            size={18}
            color={theme.colors.warning}
          />
        ))}
      </View>

      <Text style={styles.comment}>{comment}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 290,
    marginRight: theme.spacing.md,
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primarySoft,
  },
  identity: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  name: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  meta: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  comment: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
});
