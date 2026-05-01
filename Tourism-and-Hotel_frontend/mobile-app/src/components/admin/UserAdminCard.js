import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

export function UserAdminCard({
  user,
  onEdit,
  onToggleBlock,
  onDelete,
  toggling = false,
  deleting = false,
  isCurrentUser = false,
}) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.identityRow}>
          <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
          <View style={styles.identityCopy}>
            <Text style={styles.title}>{user.name}</Text>
            <Text style={styles.subtitle}>{user.email}</Text>
            <Text style={styles.userId}>User ID: {user.userId}</Text>
          </View>
        </View>
        <View style={styles.badgeColumn}>
          <StatusBadge label={user.roleLabel} variant={user.roleVariant} />
          <StatusBadge label={user.statusLabel} variant={user.statusVariant} />
        </View>
      </View>

      <InfoRow label="Phone" value={user.phone} />
      <InfoRow label="Address" value={user.address} />
      <InfoRow label="Created" value={user.createdLabel} />

      {isCurrentUser ? (
        <View style={styles.noticeRow}>
          <MaterialCommunityIcons name="shield-account" size={18} color={theme.colors.infoText} />
          <Text style={styles.noticeText}>This is your current admin account.</Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <View style={styles.flexButton}>
          <AppButton title="Edit" variant="info" onPress={onEdit} />
        </View>
        <View style={styles.flexButton}>
          <AppButton
            title={toggling ? 'Updating...' : user.isBlocked ? 'Enable' : 'Disable'}
            variant={user.isBlocked ? 'primary' : 'secondary'}
            onPress={onToggleBlock}
            disabled={toggling || isCurrentUser}
          />
        </View>
        <View style={styles.flexButton}>
          <AppButton
            title={deleting ? 'Deleting...' : 'Delete'}
            variant="danger"
            onPress={onDelete}
            disabled={deleting || isCurrentUser}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  identityRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flex: 1,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.primarySoft,
  },
  identityCopy: {
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
  userId: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  badgeColumn: {
    gap: theme.spacing.sm,
    alignItems: 'flex-end',
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
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.infoSurface,
    borderWidth: 1,
    borderColor: theme.colors.infoBorder,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  noticeText: {
    color: theme.colors.infoText,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  flexButton: {
    flex: 1,
    minWidth: 92,
  },
});
