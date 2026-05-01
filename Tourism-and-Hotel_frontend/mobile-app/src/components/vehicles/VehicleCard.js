import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { StatusBadge } from '../StatusBadge';
import { theme } from '../../theme';

export function VehicleCard({ vehicle, onPress }) {
  return (
    <AppCard padded={false} style={styles.card}>
      <Image source={{ uri: vehicle.imageUrl }} style={styles.image} contentFit="cover" />
      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <StatusBadge
            label={vehicle.availabilityLabel}
            variant={vehicle.availability ? 'primary' : 'warning'}
          />
          <StatusBadge label={vehicle.capacityLabel} variant="info" />
        </View>

        <Text style={styles.title}>{vehicle.title}</Text>
        <Text style={styles.subtitle}>
          {vehicle.typeLabel} - {vehicle.registrationNumber}
        </Text>
        <Text style={styles.description}>{vehicle.description}</Text>

        <View style={styles.footerRow}>
          <View style={styles.priceWrap}>
            <Text style={styles.price}>{vehicle.pricePerDayLabel}</Text>
            <Text style={styles.driverText}>{vehicle.driverLabel}</Text>
          </View>
          <View style={styles.buttonWrap}>
            <AppButton title="View Details" onPress={onPress} />
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
    backgroundColor: '#E9EEF6',
  },
  content: {
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  footerRow: {
    gap: theme.spacing.md,
  },
  priceWrap: {
    gap: 4,
  },
  price: {
    color: theme.colors.accent,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  driverText: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
  },
  buttonWrap: {
    marginTop: theme.spacing.xs,
  },
});
