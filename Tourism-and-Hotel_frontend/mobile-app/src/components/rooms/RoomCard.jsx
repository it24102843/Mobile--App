import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { StatusBadge } from '../StatusBadge';
import { theme } from '../../theme';

function getStatusVariant(status) {
  switch (status) {
    case 'Booked':
      return 'warning';
    case 'Maintenance':
      return 'danger';
    default:
      return 'primary';
  }
}

export function RoomCard({
  title,
  hotelName,
  description,
  imageUrl,
  priceLabel,
  capacity,
  roomNumber,
  status,
  facilities = [],
  actionLabel = 'View Details',
  onPress,
  secondaryActionLabel,
  onSecondaryPress,
}) {
  return (
    <AppCard style={styles.card} padded={false}>
      <Image source={imageUrl} style={styles.image} contentFit="cover" transition={250} />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.copyBlock}>
            <Text style={styles.hotelName}>{hotelName}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>

          <StatusBadge label={status} variant={getStatusVariant(status)} />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="door" size={17} color={theme.colors.textMuted} />
            <Text style={styles.metaText}>Room {roomNumber}</Text>
          </View>

          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="account-group" size={17} color="#5B3A8A" />
            <Text style={styles.metaText}>Up to {capacity} guests</Text>
          </View>
        </View>

        <Text style={styles.description}>{description}</Text>

        {facilities.length ? (
          <View style={styles.facilitiesRow}>
            {facilities.map((facility) => (
              <View key={facility} style={styles.facilityChip}>
                <Text style={styles.facilityText}>{facility}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <Text style={styles.price}>{priceLabel}</Text>
          <View style={styles.actionRow}>
            <View style={styles.actionHalf}>
              <AppButton title={actionLabel} onPress={onPress} variant="secondary" />
            </View>
            {secondaryActionLabel && onSecondaryPress ? (
              <View style={styles.actionHalf}>
                <AppButton title={secondaryActionLabel} onPress={onSecondaryPress} />
              </View>
            ) : null}
          </View>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  copyBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  hotelName: {
    color: theme.colors.accent,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  title: {
    color: '#2E2419',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
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
    fontWeight: '600',
  },
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  facilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  facilityChip: {
    borderRadius: 999,
    backgroundColor: '#FFF2DE',
    borderWidth: 1,
    borderColor: '#F4D39A',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  facilityText: {
    color: theme.colors.accent,
    ...theme.typography.caption,
    fontWeight: '700',
  },
  footerRow: {
    gap: theme.spacing.md,
  },
  price: {
    color: theme.colors.accent,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionHalf: {
    flex: 1,
  },
});
