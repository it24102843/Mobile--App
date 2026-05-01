import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { AppTextField } from '../AppTextField';
import { StarRating } from '../common/StarRating';
import { theme } from '../../theme';

export function ReviewReplyModal({
  visible,
  review,
  value,
  onChangeText,
  onClose,
  onSubmit,
  loading = false,
  error = '',
}) {
  if (!review) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Admin Reply</Text>
              <Text style={styles.title}>Reply to customer review</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={22} color={theme.colors.primary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <AppCard style={styles.reviewPreviewCard}>
              <Text style={styles.reviewerName}>{review.reviewerName}</Text>
              <Text style={styles.reviewerEmail}>{review.reviewerEmail}</Text>

              <View style={styles.ratingRow}>
                <StarRating rating={review.rating} size={18} color={theme.colors.accent} />
                <Text style={styles.ratingText}>{review.rating.toFixed(1)} / 5</Text>
              </View>

              <Text style={styles.reviewComment}>{review.comment}</Text>
            </AppCard>

            <AppTextField
              label="Reply Message"
              value={value}
              onChangeText={onChangeText}
              placeholder="Write a thoughtful admin reply..."
              multiline
              numberOfLines={5}
              error={error}
            />

            {review.adminReply?.message ? (
              <AppCard variant="subtle" style={styles.previousReplyCard}>
                <Text style={styles.previousReplyTitle}>Current reply</Text>
                <Text style={styles.previousReplyMessage}>{review.adminReply.message}</Text>
                {review.adminReply.repliedAtLabel ? (
                  <Text style={styles.previousReplyDate}>{review.adminReply.repliedAtLabel}</Text>
                ) : null}
              </AppCard>
            ) : null}
          </ScrollView>

          <View style={styles.actionsRow}>
            <View style={styles.flexButton}>
              <AppButton title="Cancel" variant="secondary" onPress={onClose} disabled={loading} />
            </View>
            <View style={styles.flexButton}>
              <AppButton
                title={loading ? 'Sending...' : 'Send Reply'}
                onPress={onSubmit}
                disabled={loading}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 59, 108, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
    ...theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: theme.colors.accentPressed,
    ...theme.typography.eyebrow,
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
  },
  scrollBody: {
    maxHeight: 420,
  },
  scrollContent: {
    gap: theme.spacing.lg,
  },
  reviewPreviewCard: {
    gap: theme.spacing.sm,
    backgroundColor: '#FFFEFB',
    borderColor: '#F0E3C8',
  },
  reviewerName: {
    color: theme.colors.text,
    ...theme.typography.label,
    fontWeight: '800',
  },
  reviewerEmail: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
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
  reviewComment: {
    color: theme.colors.text,
    ...theme.typography.body,
  },
  previousReplyCard: {
    gap: theme.spacing.xs,
  },
  previousReplyTitle: {
    color: theme.colors.primary,
    ...theme.typography.label,
    fontWeight: '700',
  },
  previousReplyMessage: {
    color: theme.colors.text,
    ...theme.typography.body,
  },
  previousReplyDate: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
});
