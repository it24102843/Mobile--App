import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

function renderStars(starCount) {
  return new Array(Math.max(Number(starCount) || 0, 0)).fill(null).map((_, index) => (
    <MaterialCommunityIcons
      key={`star-${index}`}
      name="star"
      size={14}
      color={theme.colors.gold}
    />
  ));
}

function getStatusStyle(statusVariant) {
  if (statusVariant === 'danger') {
    return {
      backgroundColor: '#FDECEC',
      borderColor: '#F2B9B9',
      textColor: '#A03333',
    };
  }

  return {
    backgroundColor: '#E7F7EF',
    borderColor: '#B6E3CB',
    textColor: '#146948',
  };
}

export function HotelAdminCard({ hotel, onEdit, onDelete, deleteDisabled = false, deleteDisabledReason = '' }) {
  const statusStyle = getStatusStyle(hotel.statusVariant);

  return (
    <View style={styles.card}>
      <Image source={{ uri: hotel.imageUrl }} style={styles.image} resizeMode="cover" />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusStyle.backgroundColor,
                borderColor: statusStyle.borderColor,
              },
            ]}>
            <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
              {hotel.statusLabel}
            </Text>
          </View>

          <View style={styles.ratingRow}>
            {renderStars(hotel.starCount)}
            <Text style={styles.ratingLabel}>{hotel.ratingLabel}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={16}
            color={theme.colors.accent}
          />
          <Text style={styles.locationText}>{hotel.location}</Text>
        </View>

        <Text style={styles.title}>{hotel.name}</Text>

        <View style={styles.metaWrap}>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Hotel ID</Text>
            <Text style={styles.metaValue}>{hotel.hotelId}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Star Type</Text>
            <Text style={styles.metaValue}>{hotel.ratingLabel}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Rooms</Text>
            <Text style={styles.metaValue}>{hotel.roomCount}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Bookings</Text>
            <Text style={styles.metaValue}>{hotel.bookingHistoryCount || 0}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={onEdit}
            style={({ pressed }) => [styles.editButton, pressed ? styles.pressed : null]}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.colors.primary} />
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
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FFFFFF" />
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
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E4EAF3',
    ...theme.shadows.card,
  },
  image: {
    width: '100%',
    height: 198,
    backgroundColor: '#E9EEF6',
  },
  content: {
    padding: 18,
    gap: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
  },
  ratingLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  title: {
    color: '#13233E',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metaPill: {
    minWidth: 92,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#E7D9BA',
    backgroundColor: '#FFF9EF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  metaLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
  },
  metaValue: {
    color: '#13233E',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  editButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    backgroundColor: '#F6F8FC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    color: theme.colors.primary,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.danger,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.45,
  },
  deleteButtonText: {
    color: '#FFFFFF',
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
