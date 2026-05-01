import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';

import { AppCard } from '../../components/AppCard';
import { StarRating } from '../../components/common/StarRating';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { theme } from '../../theme';
import { getDefaultImage } from '../../utils/media';
import { fetchReviewById } from '../../services/reviewsApi';

function MetaChip({ label, approved }) {
  return (
    <View style={[styles.metaChip, approved ? styles.metaChipApproved : styles.metaChipSection]}>
      <Text style={[styles.metaChipText, approved ? styles.metaChipApprovedText : styles.metaChipSectionText]}>
        {label}
      </Text>
    </View>
  );
}

export default function ReviewDetailsScreen() {
  const params = useLocalSearchParams();
  const reviewId = typeof params.reviewId === 'string' ? params.reviewId : '';
  const [state, setState] = useState({
    loading: true,
    error: null,
    review: null,
  });

  useEffect(() => {
    let mounted = true;

    async function loadReview() {
      try {
        const review = await fetchReviewById(reviewId);

        if (mounted) {
          setState({
            loading: false,
            error: null,
            review,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            error,
            review: null,
          });
        }
      }
    }

    loadReview();

    return () => {
      mounted = false;
    };
  }, [reviewId]);

  if (state.loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader title="Review Details" subtitle="Loading review details..." fallbackHref="/reviews" />
          <HomeSectionState loading />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (state.error || !state.review) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader title="Review Details" subtitle="We could not load this review." fallbackHref="/reviews" />
          <AppCard variant="danger">
            <Text style={styles.errorText}>Unable to load this review right now. Please try again.</Text>
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const review = state.review;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Review Details"
          subtitle="Read the full WildHaven guest feedback entry."
          fallbackHref="/reviews"
        />

        <AppCard style={styles.heroCard}>
          <View style={styles.identityRow}>
            <Image
              source={{ uri: review.profilePicture || getDefaultImage() }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.identityCopy}>
              <Text style={styles.reviewerName}>{review.reviewerName}</Text>
              <Text style={styles.reviewerEmail}>{review.reviewerEmail || review.dateLabel}</Text>
            </View>
          </View>

          <View style={styles.ratingRow}>
            <StarRating rating={review.rating} size={24} color={theme.colors.accent} />
            <Text style={styles.ratingLabel}>{review.ratingLabel}</Text>
          </View>

          <View style={styles.metaRow}>
            <MetaChip label={review.section} />
            <Text style={styles.dateText}>{review.dateLabel}</Text>
            <MetaChip label={review.statusLabel} approved={review.isApproved} />
          </View>
        </AppCard>

        <AppCard style={styles.bodyCard}>
          <Text style={styles.bodyTitle}>Review Comment</Text>
          <Text style={styles.bodyText}>{review.comment || 'No review comment was provided.'}</Text>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.xl,
  },
  heroCard: {
    gap: theme.spacing.lg,
    backgroundColor: '#FFFEFB',
    borderColor: '#F0E3C8',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primarySoft,
  },
  identityCopy: {
    flex: 1,
    gap: 4,
  },
  reviewerName: {
    color: theme.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  reviewerEmail: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  ratingLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.body,
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
  },
  metaChipSection: {
    backgroundColor: '#FFF3DA',
  },
  metaChipApproved: {
    backgroundColor: '#DFF7E8',
  },
  metaChipText: {
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  metaChipSectionText: {
    color: '#A66A19',
  },
  metaChipApprovedText: {
    color: theme.colors.successText,
  },
  dateText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  bodyCard: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFEFB',
    borderColor: '#F0E3C8',
  },
  bodyTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  bodyText: {
    color: theme.colors.text,
    ...theme.typography.body,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
