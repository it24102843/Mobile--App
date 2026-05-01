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

  return (
    <Pressable onPress={onPress}>
      <AppCard style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.subject}>{inquiry.subject}</Text>
            <Text style={styles.meta}>{inquiry.inquiryId}</Text>
          </View>
          <StatusBadge label={status.label} variant={status.variant} />
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account-outline" size={18} color={theme.colors.accent} />
          <Text style={styles.infoText}>{inquiry.fullName}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="email-outline" size={18} color={theme.colors.accent} />
          <Text style={styles.infoText}>{inquiry.email}</Text>
        </View>

        <Text numberOfLines={2} style={styles.preview}>
          {inquiry.lastMessagePreview || inquiry.message}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.dateText}>{inquiry.updatedLabel || inquiry.createdLabel}</Text>
          {inquiry.unreadForAdmin > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{inquiry.unreadForAdmin} unread</Text>
            </View>
          ) : null}
        </View>
      </AppCard>
    </Pressable>
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
  preview: {
    color: theme.colors.text,
    ...theme.typography.body,
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
  },
  unreadBadge: {
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.primaryMuted,
  },
  unreadText: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
});
