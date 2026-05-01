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

export function InquiryCard({ inquiry, onPress }) {
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

        <Text numberOfLines={2} style={styles.preview}>
          {inquiry.lastMessagePreview || inquiry.message || 'No message available.'}
        </Text>

        <View style={styles.footerRow}>
          <View style={styles.dateWrap}>
            <MaterialCommunityIcons name="clock-time-four-outline" size={16} color={theme.colors.textMuted} />
            <Text style={styles.dateText}>{inquiry.updatedLabel || inquiry.createdLabel}</Text>
          </View>

          {inquiry.unreadForUser > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{inquiry.unreadForUser} new</Text>
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
  preview: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flex: 1,
  },
  dateText: {
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
