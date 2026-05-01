import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppCard } from '../AppCard';
import { StatusBadge } from '../StatusBadge';
import { theme } from '../../theme';

function getStatusMeta(status) {
  switch (`${status || ''}`.toLowerCase()) {
    case 'closed':
      return { label: 'Closed', variant: 'danger' };
    case 'replied':
      return { label: 'Replied', variant: 'primary' };
    default:
      return { label: 'Open', variant: 'warning' };
  }
}

export function AdminInquiryCard({ inquiry, onPress }) {
  const status = getStatusMeta(inquiry.status);
  const hasUnread = inquiry.unreadForAdmin > 0;

  return (
    <Pressable onPress={onPress}>
      <AppCard style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.customerWrap}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={22}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.customerCopy}>
              <Text style={styles.customerName} numberOfLines={1}>
                {inquiry.fullName}
              </Text>
              <Text style={styles.customerEmail} numberOfLines={1}>
                {inquiry.email}
              </Text>
            </View>
          </View>

          {hasUnread ? (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{inquiry.unreadForAdmin}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.subject} numberOfLines={2}>
              {inquiry.subject}
            </Text>
            <Text style={styles.meta}>{inquiry.inquiryId}</Text>
          </View>
          <StatusBadge label={status.label} variant={status.variant} />
        </View>

        <View style={styles.messagePanel}>
          <Text style={styles.messageLabel}>Latest message</Text>
          <Text numberOfLines={3} style={styles.preview}>
            {inquiry.lastMessagePreview || inquiry.message}
          </Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="calendar-clock-outline"
              size={16}
              color={theme.colors.accent}
            />
            <Text style={styles.infoText} numberOfLines={1}>
              {inquiry.updatedLabel || inquiry.createdLabel}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="message-reply-text-outline"
              size={16}
              color={theme.colors.accent}
            />
            <Text style={styles.infoText} numberOfLines={1}>
              {hasUnread
                ? `${inquiry.unreadForAdmin} unread message${inquiry.unreadForAdmin > 1 ? 's' : ''}`
                : 'No unread messages'}
            </Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.dateText}>
            {inquiry.status === 'closed' ? 'Closed thread' : 'Tap to reply or view thread'}
          </Text>
          <View style={styles.actionPill}>
            <Text style={styles.actionText}>View Thread</Text>
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  customerWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerCopy: {
    flex: 1,
    gap: 2,
  },
  customerName: {
    color: theme.colors.text,
    ...theme.typography.label,
    fontWeight: '800',
  },
  customerEmail: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  unreadCountBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle,
  },
  unreadCountText: {
    color: theme.colors.textOnPrimary,
    ...theme.typography.bodySmall,
    fontWeight: '800',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  subject: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  meta: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  messagePanel: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  messageLabel: {
    color: theme.colors.accentPressed,
    ...theme.typography.eyebrow,
    letterSpacing: 1.3,
  },
  preview: {
    color: theme.colors.text,
    ...theme.typography.body,
  },
  metaGrid: {
    gap: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  dateText: {
    flex: 1,
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '600',
  },
  actionPill: {
    minHeight: 36,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  actionText: {
    color: theme.colors.accentPressed,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
});
