import { Image, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { StatusBadge } from '../StatusBadge';
import { theme } from '../../theme';

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'Not available'}</Text>
    </View>
  );
}

export function RestaurantAdminCard({
  restaurant,
  deleting = false,
  onEdit,
  onDelete,
  onManageMenus,
}) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.previewRow}>
        <Image source={{ uri: restaurant.imageUrl }} style={styles.image} />
        <View style={styles.previewCopy}>
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>{restaurant.name}</Text>
              <Text style={styles.subtitle}>{restaurant.address}</Text>
            </View>
            <StatusBadge label={restaurant.statusLabel} variant={restaurant.statusVariant} />
          </View>

          <InfoRow label="Phone" value={restaurant.phone || 'Not provided'} />
          <InfoRow label="Opening Hours" value={restaurant.openingHours || 'Not provided'} />
          <InfoRow label="Menus" value={`${restaurant.menuCount || 0}`} />
          <InfoRow label="Food Items" value={`${restaurant.foodItemCount || 0}`} />
        </View>
      </View>

      <View style={styles.actionRow}>
        <View style={styles.flexButton}>
          <AppButton title="Manage Menus" variant="secondary" onPress={onManageMenus} />
        </View>
        <View style={styles.flexButton}>
          <AppButton title="Edit" variant="info" onPress={onEdit} />
        </View>
        <View style={styles.flexButton}>
          <AppButton
            title={deleting ? 'Deleting...' : 'Delete'}
            variant="danger"
            onPress={onDelete}
            disabled={deleting}
          />
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  previewRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primarySoft,
  },
  previewCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#13233E',
    ...theme.typography.sectionTitle,
  },
  subtitle: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  infoLabel: {
    flex: 1,
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  infoValue: {
    flex: 1,
    color: theme.colors.text,
    ...theme.typography.bodySmall,
    fontWeight: '700',
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  flexButton: {
    flex: 1,
    minWidth: 100,
  },
});
