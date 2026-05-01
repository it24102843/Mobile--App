import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

function Badge({ label, variant }) {
  const isSuccess = variant === 'success';
  const isDanger = variant === 'danger';

  return (
    <View
      style={[
        styles.badge,
        isSuccess ? styles.badgeSuccess : null,
        isDanger ? styles.badgeDanger : null,
      ]}>
      <Text
        style={[
          styles.badgeText,
          isSuccess ? styles.badgeSuccessText : null,
          isDanger ? styles.badgeDangerText : null,
        ]}>
        {label}
      </Text>
    </View>
  );
}

function ActionButton({ icon, label, onPress, colorStyle, disabled }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        colorStyle,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}>
      <MaterialCommunityIcons name={icon} size={18} color="#FFFFFF" />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export function EquipmentAdminCard({
  item,
  onEdit,
  onDelete,
  deleting = false,
}) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" />

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={styles.keyText}>{item.key}</Text>
            <Text style={styles.nameText}>{item.name}</Text>
          </View>
          <Badge label={item.availabilityLabel} variant={item.availabilityVariant} />
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Price (Daily)</Text>
            <Text style={styles.metaValue}>{item.priceLabel}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Category</Text>
            <Text style={styles.metaValue}>{item.category}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Stock</Text>
            <Text style={styles.metaValue}>{item.stockCount}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>{item.stockLabel}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.actionRow}>
          <ActionButton
            icon="pencil-outline"
            label="Edit"
            onPress={onEdit}
            colorStyle={styles.editButton}
          />
          <ActionButton
            icon="trash-can-outline"
            label={deleting ? 'Deleting...' : 'Delete'}
            onPress={onDelete}
            colorStyle={styles.deleteButton}
            disabled={deleting}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F1',
    ...theme.shadows.card,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#E7EDF6',
  },
  content: {
    padding: 18,
    gap: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  titleCopy: {
    flex: 1,
    gap: 4,
  },
  keyText: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  nameText: {
    color: '#13233E',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
    backgroundColor: '#EEF5FF',
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '800',
  },
  badgeSuccess: {
    backgroundColor: '#E7F7EF',
  },
  badgeSuccessText: {
    color: '#146948',
  },
  badgeDanger: {
    backgroundColor: '#FFF0DD',
  },
  badgeDangerText: {
    color: theme.colors.accent,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metaItem: {
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6DCC8',
    backgroundColor: '#FFF9EF',
    padding: 12,
    gap: 4,
  },
  metaLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
  },
  metaValue: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...theme.shadows.subtle,
  },
  editButton: {
    backgroundColor: '#4D63D9',
  },
  deleteButton: {
    backgroundColor: theme.colors.danger,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.55,
  },
});
