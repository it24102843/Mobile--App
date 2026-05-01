import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { StarRating } from '../common/StarRating';
import { theme } from '../../theme';
import { getDefaultImage } from '../../utils/media';

function StatusChip({ label, tone = 'neutral' }) {
  return (
    <View
      style={[
        styles.metaChip,
        tone === 'section' ? styles.sectionChip : null,
        tone === 'statusApproved' ? styles.statusApprovedChip : null,
        tone === 'statusPending' ? styles.statusPendingChip : null,
      ]}>
      <Text
        style={[
          styles.metaChipText,
          tone === 'section' ? styles.sectionChipText : null,
          tone === 'statusApproved' ? styles.statusApprovedText : null,
          tone === 'statusPending' ? styles.statusPendingText : null,
        ]}>
        {label}
      </Text>
    </View>
  );
}

function AdminReplyPreview({ adminReply, unreadReply }) {
  if (!adminReply?.message) {
    return null;
  }

  return (
    <View style={styles.replyCard}>
      <View style={styles.replyHeaderRow}>
        <Text style={styles.replyTitle}>Admin Reply</Text>
        {unreadReply ? (
          <View style={styles.newReplyBadge}>
            <Text style={styles.newReplyBadgeText}>New reply</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.replyMessage}>{adminReply.message}</Text>
      {adminReply.repliedAtLabel ? <Text style={styles.replyDate}>{adminReply.repliedAtLabel}</Text> : null}
    </View>
  );
}

export function ReviewCard({
  review,
  compact = false,
  showActions = false,
  onPress,
  onEdit,
  onDelete,
}) {
  const imageSource = review.profilePicture || getDefaultImage();

  return (
    <Pressable disabled={!onPress} onPress={onPress}>
      <AppCard style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.ratingWrap}>
            <StarRating rating={review.rating} size={compact ? 18 : 20} color={theme.colors.accent} />
            <Text style={styles.ratingLabel}>{review.ratingLabel}</Text>
          </View>

          {showActions ? (
            <View style={styles.actionIconsRow}>
              <Pressable onPress={onEdit} style={[styles.actionIcon, styles.editIcon]} accessibilityRole="button">
                <MaterialCommunityIcons name="square-edit-outline" size={22} color={theme.colors.accent} />
              </Pressable>
              <Pressable onPress={onDelete} style={[styles.actionIcon, styles.deleteIcon]} accessibilityRole="button">
                <MaterialCommunityIcons name="delete" size={22} color={theme.colors.danger} />
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.identityRow}>
          <Image source={{ uri: imageSource }} style={styles.avatar} contentFit="cover" />
          <View style={styles.identityCopy}>
            <Text style={styles.name}>{review.reviewerName}</Text>
            {review.reviewerEmail ? <Text style={styles.email}>{review.reviewerEmail}</Text> : null}
          </View>
        </View>

        <Text style={styles.comment}>{review.comment}</Text>

        <AdminReplyPreview adminReply={review.adminReply} unreadReply={review.unreadReply} />

        <View style={styles.metaRow}>
          <StatusChip label={review.section || 'All'} tone="section" />
          <Text style={styles.dateText}>{review.dateLabel}</Text>
          <StatusChip
            label={review.statusLabel}
            tone={review.isApproved ? 'statusApproved' : 'statusPending'}
          />
        </View>

        {!showActions && onPress ? (
          <View style={styles.buttonWrap}>
            <AppButton title="See Details" variant="secondary" onPress={onPress} />
          </View>
        ) : null}
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFEFB',
    borderColor: '#F0E3C8',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  ratingLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.body,
  },
  actionIconsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    backgroundColor: '#FFF3DA',
  },
  deleteIcon: {
    backgroundColor: '#FFE8E8',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primarySoft,
  },
  identityCopy: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: theme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  email: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  comment: {
    color: theme.colors.text,
    ...theme.typography.body,
  },
  replyCard: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: '#F4D4A5',
  },
  replyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  replyTitle: {
    color: theme.colors.accentPressed,
    ...theme.typography.label,
    fontWeight: '800',
  },
  newReplyBadge: {
    borderRadius: theme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.primaryMuted,
  },
  newReplyBadgeText: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  replyMessage: {
    color: theme.colors.text,
    ...theme.typography.body,
  },
  replyDate: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metaChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radii.pill,
    backgroundColor: '#F7F1E7',
  },
  metaChipText: {
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  sectionChip: {
    backgroundColor: '#FFF3DA',
  },
  sectionChipText: {
    color: '#A66A19',
  },
  statusApprovedChip: {
    backgroundColor: '#DFF7E8',
  },
  statusApprovedText: {
    color: theme.colors.successText,
  },
  statusPendingChip: {
    backgroundColor: '#FFF8E5',
  },
  statusPendingText: {
    color: theme.colors.warningText,
  },
  dateText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  buttonWrap: {
    marginTop: theme.spacing.xs,
  },
});
