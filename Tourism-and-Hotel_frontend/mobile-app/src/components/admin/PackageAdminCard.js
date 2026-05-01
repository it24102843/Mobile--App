import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { StatusBadge } from '../StatusBadge';
import { theme } from '../../theme';

function InfoPill({ icon, label }) {
  return (
    <View style={styles.infoPill}>
      <MaterialCommunityIcons name={icon} size={16} color={theme.colors.primary} />
      <Text style={styles.infoPillText}>{label}</Text>
    </View>
  );
}

export function PackageAdminCard({
  item,
  deleting = false,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <AppCard style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <StatusBadge label={item.category} variant="accent" />
          <StatusBadge label={item.availabilityLabel} variant={item.availabilityVariant} />
        </View>

        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.packageId}>{item.packageId}</Text>
        <Text style={styles.description}>
          {item.descriptionPreview || 'Package description is not available yet.'}
        </Text>

        <View style={styles.infoGrid}>
          <InfoPill icon="calendar-range" label={item.durationLabel} />
          <InfoPill icon="account-group-outline" label={item.maxGroupLabel} />
          <InfoPill icon="cash-multiple" label={item.priceLabel} />
          <InfoPill icon="map-marker-outline" label={item.meetingPoint} />
        </View>

        {item.tagList.length ? (
          <View style={styles.tagsWrap}>
            {item.tagList.map((tag, index) => (
              <View key={`${tag}-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <View style={styles.flexButton}>
            <AppButton title="View" variant="secondary" onPress={onView} />
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
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 190,
    backgroundColor: '#E6ECF5',
  },
  content: {
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  title: {
    color: '#13233E',
    ...theme.typography.sectionTitle,
  },
  packageId: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoPillText: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tag: {
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: '#FAD2A1',
    backgroundColor: '#FFF5E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagText: {
    color: theme.colors.accent,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  flexButton: {
    flex: 1,
    minWidth: 90,
  },
});
