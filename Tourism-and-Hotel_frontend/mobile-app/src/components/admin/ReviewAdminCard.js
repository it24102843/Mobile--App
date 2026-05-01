import { Image, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { StatusBadge } from '../StatusBadge';
import { StarRating } from '../common/StarRating';
import { theme } from '../../theme';

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'Not available'}</Text>
    </View>
  );
}

export function ReviewAdminCard({
  review,
  approving = false,
  rejecting = false,
  deleting = false,
  replying = false,
  onApprove,
  onReject,
  onDelete,
  onReply,
}) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.identityRow}>
          <Image source={{ uri: review.profilePicture }} style={styles.avatar} />
          <View style={styles.identityCopy}>
            <Text style={styles.title}>{review.reviewerName}</Text>
            <Text style={styles.subtitle}>{review.reviewerEmail}</Text>
          </View>
        </View>
        <StatusBadge label={review.statusLabel} variant={review.statusVariant} />
      </View>

      <View style={styles.ratingRow}>
        <StarRating rating={review.rating} />
        <Text style={styles.ratingText}>{review.rating.toFixed(1)} / 5</Text>
      </View>

      <Text style={styles.comment}>{review.comment}</Text>

      <InfoRow label="Related Service" value={review.section} />
      <InfoRow label="Created" value={review.dateLabel} />

      {review.adminReply?.message ? (
        <View style={styles.replyCard}>
          <Text style={styles.replyEyebrow}>Replied</Text>
          <Text style={styles.replyMessage}>{review.adminReply.message}</Text>
          {review.adminReply.repliedAtLabel ? (
            <Text style={styles.replyDate}>{review.adminReply.repliedAtLabel}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <View style={styles.flexButton}>
          <AppButton
            title={replying ? 'Opening...' : review.adminReply?.message ? 'Edit Reply' : 'Reply'}
            variant="secondary"
            onPress={onReply}
            disabled={replying}
          />
        </View>
        <View style={styles.flexButton}>
          <AppButton
            title={approving ? 'Approving...' : 'Approve'}
            variant="info"
            onPress={onApprove}
            disabled={approving || review.isApproved}
          />
        </View>
        <View style={styles.flexButton}>
          <AppButton
            title={rejecting ? 'Rejecting...' : 'Reject'}
            variant="secondary"
            onPress={onReject}
            disabled={rejecting || !review.isApproved}
          />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  identityRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  ratingText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  comment: {
    color: theme.colors.text,
    ...theme.typography.body,
  },
  replyCard: {
    gap: theme.spacing.xs,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: '#F4D4A5',
  },
  replyEyebrow: {
    color: theme.colors.accentPressed,
    ...theme.typography.eyebrow,
    letterSpacing: 1.3,
  },
  replyMessage: {
    color: theme.colors.text,
    ...theme.typography.body,
  },
  replyDate: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
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
    minWidth: 90,
  },
});
