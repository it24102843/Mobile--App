import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { ReviewAdminCard } from '../../components/admin/ReviewAdminCard';
import { ReviewFilters } from '../../components/admin/ReviewFilters';
import { ReviewReplyModal } from '../../components/admin/ReviewReplyModal';
import { useAuth } from '../../context/AuthContext';
import {
  approveAdminReview,
  deleteAdminReview,
  fetchAdminReviews,
  rejectAdminReview,
  replyToAdminReview,
  REVIEW_RATING_OPTIONS,
  REVIEW_STATUS_OPTIONS,
} from '../../services/adminReviewsApi';
import { theme } from '../../theme';

function normalizeString(value) {
  return `${value ?? ''}`.trim().toLowerCase();
}

export default function AdminReviewsScreen() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [activeRating, setActiveRating] = useState('all');
  const [approvingReviewId, setApprovingReviewId] = useState(null);
  const [rejectingReviewId, setRejectingReviewId] = useState(null);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyError, setReplyError] = useState('');

  useEffect(() => {
    void loadReviews();
  }, [token]);

  async function loadReviews(isRefresh = false) {
    if (!token) {
      return;
    }

    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetchAdminReviews(token);
      setReviews(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load reviews.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredReviews = useMemo(() => {
    const normalizedQuery = normalizeString(searchQuery);

    return reviews.filter((review) => {
      const matchesSearch =
        !normalizedQuery ||
        [review.reviewerName, review.reviewerEmail, review.comment, review.section].some((value) =>
          normalizeString(value).includes(normalizedQuery)
        );

      if (!matchesSearch) {
        return false;
      }

      if (activeStatus !== 'all' && review.statusLabel !== activeStatus) {
        return false;
      }

      if (activeRating !== 'all' && `${Math.round(review.rating)}` !== activeRating) {
        return false;
      }

      return true;
    });
  }, [activeRating, activeStatus, reviews, searchQuery]);

  async function handleApprove(review) {
    try {
      setApprovingReviewId(review.id);
      const response = await approveAdminReview(token, review.id);
      Alert.alert('Review approved', response?.message || 'The review was approved.');
      await loadReviews(true);
    } catch (approveError) {
      Alert.alert(
        'Approve failed',
        approveError instanceof Error ? approveError.message : 'Unable to approve this review.'
      );
    } finally {
      setApprovingReviewId(null);
    }
  }

  async function handleReject(review) {
    try {
      setRejectingReviewId(review.id);
      const response = await rejectAdminReview(token, review.id);
      Alert.alert('Review rejected', response?.message || 'The review was rejected.');
      await loadReviews(true);
    } catch (rejectError) {
      Alert.alert(
        'Reject failed',
        rejectError instanceof Error ? rejectError.message : 'Unable to reject this review.'
      );
    } finally {
      setRejectingReviewId(null);
    }
  }

  function confirmDelete(review) {
    Alert.alert('Delete review?', `Delete the review from ${review.reviewerName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void handleDelete(review),
      },
    ]);
  }

  async function handleDelete(review) {
    try {
      setDeletingReviewId(review.id);
      const response = await deleteAdminReview(token, review.id);
      Alert.alert('Review deleted', response?.message || 'The review was deleted.');
      await loadReviews(true);
    } catch (deleteError) {
      Alert.alert(
        'Delete failed',
        deleteError instanceof Error ? deleteError.message : 'Unable to delete this review.'
      );
    } finally {
      setDeletingReviewId(null);
    }
  }

  function confirmApprove(review) {
    Alert.alert('Approve review?', `Approve ${review.reviewerName}'s review for public display?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => void handleApprove(review),
      },
    ]);
  }

  function confirmReject(review) {
    Alert.alert('Reject review?', `Move ${review.reviewerName}'s review out of public display?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        onPress: () => void handleReject(review),
      },
    ]);
  }

  function openReplyModal(review) {
    setSelectedReview(review);
    setReplyMessage(review.adminReply?.message || '');
    setReplyError('');
    setReplyModalVisible(true);
  }

  function closeReplyModal() {
    setReplyModalVisible(false);
    setSelectedReview(null);
    setReplyMessage('');
    setReplyError('');
  }

  async function handleSendReply() {
    if (!selectedReview) {
      return;
    }

    const message = `${replyMessage || ''}`.trim();

    if (!message) {
      setReplyError('Reply message is required.');
      return;
    }

    if (message.length < 5) {
      setReplyError('Reply message must contain at least 5 characters.');
      return;
    }

    try {
      setReplyError('');
      setReplyingReviewId(selectedReview.id);
      const response = await replyToAdminReview(token, selectedReview.id, message);
      Alert.alert('Reply sent', response?.message || 'Your reply was saved successfully.');
      closeReplyModal();
      await loadReviews(true);
    } catch (replyLoadError) {
      setReplyError(
        replyLoadError instanceof Error
          ? replyLoadError.message
          : 'Unable to send this reply right now.'
      );
    } finally {
      setReplyingReviewId(null);
    }
  }

  function renderContent() {
    if (loading) {
      return (
        <AppCard style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText}>Loading reviews from the backend...</Text>
        </AppCard>
      );
    }

    if (error) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Retry" onPress={() => void loadReviews()} />
        </AppCard>
      );
    }

    if (!filteredReviews.length) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.stateTitle}>No reviews found</Text>
          <Text style={styles.stateText}>
            Try a different search term or filter to find matching reviews.
          </Text>
        </AppCard>
      );
    }

    return filteredReviews.map((review) => (
      <ReviewAdminCard
        key={review.id}
        review={review}
        approving={approvingReviewId === review.id}
        rejecting={rejectingReviewId === review.id}
        deleting={deletingReviewId === review.id}
        replying={replyingReviewId === review.id}
        onApprove={() => confirmApprove(review)}
        onReject={() => confirmReject(review)}
        onDelete={() => confirmDelete(review)}
        onReply={() => openReplyModal(review)}
      />
    ));
  }

  return (
    <AdminScreenWrapper
      title="Reviews Management"
      subtitle={`Manage client reviews and approvals - ${reviews.length} review(s)`}>
      <AppCard style={styles.toolbarCard}>
        <View style={styles.buttonRow}>
          <View style={styles.flexButton}>
            <AppButton
              title={refreshing ? 'Refreshing...' : 'Refresh'}
              variant="secondary"
              onPress={() => void loadReviews(true)}
              disabled={refreshing}
            />
          </View>
        </View>

        <AppTextField
          label="Search"
          placeholder="Search by customer name, email, comment, or service..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <ReviewFilters
          statusFilters={REVIEW_STATUS_OPTIONS}
          ratingFilters={REVIEW_RATING_OPTIONS}
          activeStatus={activeStatus}
          activeRating={activeRating}
          onChangeStatus={setActiveStatus}
          onChangeRating={setActiveRating}
        />
      </AppCard>

      <View style={styles.listWrap}>{renderContent()}</View>

      <ReviewReplyModal
        visible={replyModalVisible}
        review={selectedReview}
        value={replyMessage}
        onChangeText={(text) => {
          setReplyMessage(text);
          if (replyError) {
            setReplyError('');
          }
        }}
        onClose={closeReplyModal}
        onSubmit={() => void handleSendReply()}
        loading={Boolean(replyingReviewId)}
        error={replyError}
      />
    </AdminScreenWrapper>
  );
}

const styles = StyleSheet.create({
  toolbarCard: {
    gap: theme.spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  flexButton: {
    flex: 1,
    minWidth: 140,
  },
  listWrap: {
    gap: theme.spacing.lg,
  },
  stateCard: {
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  stateTitle: {
    color: '#13233E',
    ...theme.typography.sectionTitle,
  },
  stateText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    ...theme.typography.body,
  },
  errorText: {
    color: theme.colors.errorText,
    textAlign: 'center',
    ...theme.typography.body,
  },
});
