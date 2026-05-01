import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppCard } from '../../components/AppCard';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ReviewForm } from '../../components/reviews/ReviewForm';
import { ScreenHeader } from '../../components/ScreenHeader';
import { reviewSections } from '../../config/reviewSections';
import { useAuth, useRequireAuth } from '../../hooks/useAuth';
import {
  createMyReview,
  fetchReviewById,
  updateMyReview,
  validateReviewForm,
} from '../../services/reviewsApi';
import { theme } from '../../theme';

export default function AddReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const requireAuth = useRequireAuth();
  const { isAuthenticated, token, user } = useAuth();
  const reviewId = typeof params.reviewId === 'string' ? params.reviewId : '';
  const isEditing = Boolean(reviewId);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [values, setValues] = useState({
    rating: 0,
    section: reviewSections[0]?.value || '',
    comment: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth('/reviews/create', {
        message: 'Please login or sign up to submit a review',
      });
      return;
    }

    if (!isEditing) {
      return;
    }

    let mounted = true;

    async function loadReview() {
      try {
        const review = await fetchReviewById(reviewId);

        if (mounted) {
          setValues({
            rating: review.rating || 0,
            section: review.section || reviewSections[0]?.value || '',
            comment: review.comment || '',
          });
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setLoading(false);
          Alert.alert(
            'Review Unavailable',
            error instanceof Error ? error.message : 'Unable to load this review right now.'
          );
          router.replace('/reviews');
        }
      }
    }

    loadReview();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, isEditing, requireAuth, reviewId, router]);

  const customerName = useMemo(
    () => `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    [user?.firstName, user?.lastName]
  );

  if (!isAuthenticated) {
    return null;
  }

  const handleFieldErrorClear = (field) => {
    setErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }

      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async () => {
    const nextErrors = validateReviewForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setSubmitting(true);

    try {
      if (isEditing) {
        await updateMyReview(token, reviewId, {
          rating: values.rating,
          section: values.section,
          comment: values.comment.trim(),
        });
      } else {
        await createMyReview(token, {
          rating: values.rating,
          section: values.section,
          comment: values.comment.trim(),
        });
      }

      Alert.alert(
        isEditing ? 'Review Updated' : 'Review Submitted',
        isEditing
          ? 'Your review has been updated successfully.'
          : 'Your review has been submitted successfully.'
      );
      router.replace('/reviews');
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        submit:
          error instanceof Error
            ? error.message
            : 'Unable to submit your review right now.',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={isEditing ? 'Edit Review' : 'Write Review'}
          subtitle="Follow the WildHaven review flow shown in your web design."
          fallbackHref="/reviews"
        />

        {loading ? <HomeSectionState loading /> : null}

        {!loading ? (
          <ReviewForm
            customerName={customerName}
            customerEmail={user?.email || ''}
            rating={values.rating}
            section={values.section}
            comment={values.comment}
            errors={errors}
            submitting={submitting}
            sections={reviewSections}
            submitLabel={isEditing ? 'Update Review' : 'Submit Review'}
            onRatingChange={(value) => {
              setValues((previous) => ({ ...previous, rating: value }));
              handleFieldErrorClear('rating');
            }}
            onSectionChange={(value) => {
              setValues((previous) => ({ ...previous, section: value }));
              handleFieldErrorClear('section');
            }}
            onCommentChange={(value) => {
              setValues((previous) => ({ ...previous, comment: value }));
              handleFieldErrorClear('comment');
            }}
            onSubmit={handleSubmit}
          />
        ) : null}

        {!loading && errors.submit ? (
          <AppCard variant="danger">
            <Text style={styles.errorText}>{errors.submit}</Text>
          </AppCard>
        ) : null}
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
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
