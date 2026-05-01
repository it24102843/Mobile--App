import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

function getBadgeStyle(statusVariant) {
  if (statusVariant === 'danger') {
    return {
      backgroundColor: '#FDECEC',
      borderColor: '#F2B9B9',
      textColor: '#A03333',
    };
  }

  if (statusVariant === 'warning') {
    return {
      backgroundColor: '#FFF8E5',
      borderColor: '#F1D47A',
      textColor: '#7A6118',
    };
  }

  return {
    backgroundColor: '#EAF1FB',
    borderColor: '#C9D7EC',
    textColor: theme.colors.primary,
  };
}

export function RoomAdminCard({ room, onEdit, onDelete, deleteDisabled = false, deleteDisabledReason = '' }) {
  const badgeStyle = getBadgeStyle(room.statusVariant);

  return (
    <View style={styles.card}>
      <Image source={{ uri: room.imageUrl }} style={styles.image} resizeMode="cover" />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.copyBlock}>
            <Text style={styles.title}>{room.roomType}</Text>
            <Text style={styles.subtitle}>
              Room {room.roomNumber} - {room.hotelName}
            </Text>
          </View>

          <View
            style={[
              styles.badge,
              {
                backgroundColor: badgeStyle.backgroundColor,
                borderColor: badgeStyle.borderColor,
              },
            ]}>
            <Text style={[styles.badgeText, { color: badgeStyle.textColor }]}>
              {room.availabilityLabel}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoPill}>
            <MaterialCommunityIcons
              name="cash"
              size={16}
              color={theme.colors.accent}
            />
            <Text style={styles.infoText}>{room.priceLabel}</Text>
          </View>

          <View style={styles.infoPill}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={styles.infoText}>Up to {room.capacity} guests</Text>
          </View>
          <View style={styles.infoPill}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={styles.infoText}>{room.bookingHistoryCount || 0} booking(s)</Text>
          </View>
        </View>

        <Text numberOfLines={3} style={styles.description}>
          {room.description}
        </Text>

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={onEdit}
            style={({ pressed }) => [styles.editButton, pressed ? styles.pressed : null]}>
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed ? styles.pressed : null,
              deleteDisabled ? styles.deleteButtonDisabled : null,
            ]}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        </View>

        {deleteDisabledReason ? (
          <Text style={styles.helperText}>{deleteDisabledReason}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4EAF3',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  image: {
    width: '100%',
    height: 172,
    backgroundColor: '#E9EEF6',
  },
  content: {
    padding: 18,
    gap: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  copyBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#13233E',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radii.lg,
    backgroundColor: '#FFF9EF',
    borderWidth: 1,
    borderColor: '#E7D9BA',
  },
  infoText: {
    color: theme.colors.text,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  editButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    backgroundColor: '#F6F8FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: theme.colors.primary,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.45,
  },
  deleteButtonText: {
    color: theme.colors.danger,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  helperText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  pressed: {
    opacity: 0.92,
  },
});
