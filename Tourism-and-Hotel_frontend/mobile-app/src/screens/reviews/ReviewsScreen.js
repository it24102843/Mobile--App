import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ReviewCard } from '../../components/reviews/ReviewCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth, useRequireAuth } from '../../hooks/useAuth';
import { fetchMyReviews, fetchPublicReviews, fetchUnreadReviewReplyCount } from '../../services/reviewsApi';
import { theme } from '../../theme';

export default function ReviewsScreen() {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const { isAuthenticated, token } = useAuth();
  const [state, setState] = useState({
    loading: true,
    error: null,
    reviews: [],
    myReviews: [],
    unreadReplyCount: 0,
  });

  const loadReviews = useCallback(async () => {
    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));

    try {
      const [reviews, myReviews, unreadReplyCount] = await Promise.all([
        fetchPublicReviews(),
        isAuthenticated && token ? fetchMyReviews(token) : Promise.resolve([]),
        isAuthenticated && token ? fetchUnreadReviewReplyCount(token) : Promise.resolve(0),
      ]);

      setState({
        loading: false,
        error: null,
        reviews,
        myReviews,
        unreadReplyCount,
      });
    } catch (error) {
      setState({
        loading: false,
        error,
        reviews: [],
        myReviews: [],
        unreadReplyCount: 0,
      });
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [loadReviews])
  );

  const handleWriteReview = () => {
    const target = '/reviews/create';

    if (!requireAuth(target, { message: 'Please login or sign up to submit a review' })) {
      return;
    }

    router.push(target);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Reviews & Feedback"
          subtitle="Read real WildHaven guest feedback and share your own experience."
          fallbackHref="/(tabs)"
        />

        <AppCard variant="primary" style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>WildHaven Reviews</Text>
          <Text style={styles.heroTitle}>Guest stories from real stays and adventures</Text>
          <Text style={styles.heroSubtitle}>
            Browse approved reviews from the live backend. Logged-in users can also write and track their own reviews.
          </Text>
          <View style={styles.heroButtonWrap}>
            <AppButton title="Write Review" onPress={handleWriteReview} />
          </View>
        </AppCard>

        {isAuthenticated && state.myReviews.length ? (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Your Reviews</Text>
              {state.unreadReplyCount > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{state.unreadReplyCount} new repl{state.unreadReplyCount > 1 ? 'ies' : 'y'}</Text>
                </View>
              ) : null}
            </View>
            {state.myReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onPress={() => router.push(`/reviews/${review.id}`)}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Guest Feedback</Text>

          {state.loading ? <HomeSectionState loading /> : null}

          {!state.loading && state.error ? (
            <AppCard variant="danger">
              <Text style={styles.errorText}>
                Unable to load reviews right now. Please try again.
              </Text>
            </AppCard>
          ) : null}

          {!state.loading && !state.reviews.length ? (
            <HomeSectionState
              message="No approved reviews are available yet."
              icon="message-text-outline"
            />
          ) : null}

          {!state.loading
            ? state.reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onPress={() => router.push(`/reviews/${review.id}`)}
                />
              ))
            : null}
        </View>
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
    gap: theme.spacing.sm,
  },
  heroEyebrow: {
    color: '#FFD39E',
    ...theme.typography.eyebrow,
  },
  heroTitle: {
    color: theme.colors.textOnDark,
    ...theme.typography.screenTitle,
  },
  heroSubtitle: {
    color: '#DDE7F4',
    ...theme.typography.body,
  },
  heroButtonWrap: {
    marginTop: theme.spacing.sm,
  },
  sectionWrap: {
    gap: theme.spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  unreadBadge: {
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.primaryMuted,
  },
  unreadBadgeText: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
