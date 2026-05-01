import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { AppSelectField } from '../AppSelectField';
import { AppTextField } from '../AppTextField';
import { theme } from '../../theme';

function InitialsBadge({ initials }) {
  return (
    <View style={styles.initialsWrap}>
      <Text style={styles.initialsText}>{initials}</Text>
    </View>
  );
}

export function ReviewForm({
  customerName,
  customerEmail,
  rating,
  section,
  comment,
  errors,
  submitting,
  sections,
  submitLabel,
  onRatingChange,
  onSectionChange,
  onCommentChange,
  onSubmit,
}) {
  const initials = (customerName || 'GH')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'GH';

  return (
    <View style={styles.wrapper}>
      <AppCard style={styles.identityCard}>
        <InitialsBadge initials={initials} />
        <View style={styles.identityCopy}>
          <Text style={styles.identityEyebrow}>Reviewing As</Text>
          <Text style={styles.identityName}>{customerName || 'WildHaven Guest'}</Text>
          {customerEmail ? <Text style={styles.identityEmail}>{customerEmail}</Text> : null}
        </View>
        <View style={styles.identityAccent} />
      </AppCard>

      <AppCard style={styles.formCard} padded={false}>
        <View style={styles.formAccent} />
        <View style={styles.formContent}>
          <View style={styles.sectionTopRow}>
            <View style={styles.ratingBlock}>
              <Text style={styles.blockLabel}>Your Rating *</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((value) => {
                  const active = value <= rating;

                  return (
                    <Pressable
                      key={value}
                      onPress={() => onRatingChange(value)}
                      style={styles.starPressable}
                      accessibilityRole="button">
                      <Text style={[styles.starText, active ? styles.starTextActive : null]}>★</Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.rating ? <Text style={styles.errorText}>{errors.rating}</Text> : null}
            </View>

            <View style={styles.sectionBlock}>
              <AppSelectField
                label="Review Section *"
                value={section}
                onChange={onSectionChange}
                options={sections}
                placeholder="Choose a service"
                error={errors.section}
              />
            </View>
          </View>

          <View style={styles.reviewBlock}>
            <Text style={styles.blockLabel}>Your Review *</Text>
            <AppTextField
              label=""
              placeholder="Tell us about your experience at WildHaven..."
              value={comment}
              onChangeText={onCommentChange}
              multiline
              error={errors.comment}
              style={styles.reviewInput}
            />
            <Text style={styles.charCount}>{comment.length} chars</Text>
          </View>

          {errors.submit ? (
            <Text style={styles.errorText}>{errors.submit}</Text>
          ) : null}

          <AppButton
            title={submitting ? 'Submitting...' : submitLabel}
            onPress={onSubmit}
            disabled={submitting}
          />
        </View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.xl,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    backgroundColor: '#FFFEFB',
    borderColor: '#F0E3C8',
  },
  initialsWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  identityCopy: {
    flex: 1,
    gap: 4,
  },
  identityEyebrow: {
    color: theme.colors.accent,
    ...theme.typography.eyebrow,
  },
  identityName: {
    color: theme.colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  identityEmail: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  identityAccent: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: theme.radii.pill,
    backgroundColor: '#FDB515',
  },
  formCard: {
    overflow: 'hidden',
    backgroundColor: '#FFFEFB',
    borderColor: '#F0E3C8',
  },
  formAccent: {
    height: 8,
    backgroundColor: theme.colors.accent,
  },
  formContent: {
    padding: theme.spacing.xl,
    gap: theme.spacing.xl,
  },
  sectionTopRow: {
    gap: theme.spacing.xl,
  },
  ratingBlock: {
    gap: theme.spacing.md,
  },
  sectionBlock: {
    gap: theme.spacing.md,
  },
  blockLabel: {
    color: theme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  starRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  starPressable: {
    paddingVertical: 2,
  },
  starText: {
    fontSize: 48,
    lineHeight: 56,
    color: '#E5E7EB',
  },
  starTextActive: {
    color: '#FDB515',
  },
  reviewBlock: {
    gap: theme.spacing.sm,
  },
  reviewInput: {
    minHeight: 170,
  },
  charCount: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
    textAlign: 'right',
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.bodySmall,
  },
});
