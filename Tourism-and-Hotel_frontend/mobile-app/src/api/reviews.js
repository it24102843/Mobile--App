import { isAxiosError } from 'axios';

import { apiClient } from './client';
import { resolveMediaUrl } from '../utils/media';

function buildApiError(error, fallbackMessage) {
  if (isAxiosError(error)) {
    if (!error.response) {
      return new Error(
        'Unable to reach the backend. Make sure your mobile API URL points to your running server, not localhost.'
      );
    }

    return new Error(
      error.response?.data?.message || error.response?.data?.error || fallbackMessage
    );
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
}

function formatReviewDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return 'Recently added';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function sortReviewsByRatingAndDate(left, right) {
  const leftRating = Number(left?.rating || 0);
  const rightRating = Number(right?.rating || 0);

  if (rightRating !== leftRating) {
    return rightRating - leftRating;
  }

  const leftDate = left?.date ? new Date(left.date).getTime() : 0;
  const rightDate = right?.date ? new Date(right.date).getTime() : 0;

  return rightDate - leftDate;
}

export function normalizeReview(rawReview) {
  return {
    id: rawReview?._id,
    reviewerName: rawReview?.name || 'Guest Reviewer',
    profilePicture: resolveMediaUrl(rawReview?.profilePicture),
    rating: Number(rawReview?.rating || 0),
    comment: rawReview?.comment || '',
    date: rawReview?.date || null,
    dateLabel: formatReviewDate(rawReview?.date),
    section: rawReview?.section || 'General',
    statusLabel: rawReview?.isApproved ? 'Approved Review' : 'Pending Approval',
    statusVariant: rawReview?.isApproved ? 'primary' : 'warning',
    isApproved: Boolean(rawReview?.isApproved),
    raw: rawReview,
  };
}

export async function fetchReviews() {
  try {
    const response = await apiClient.get('/reviews');

    return [...response.data].sort(sortReviewsByRatingAndDate).map(normalizeReview);
  } catch (error) {
    throw buildApiError(error, 'Unable to load reviews right now.');
  }
}

export async function fetchReviewById(reviewId) {
  try {
    const response = await apiClient.get(`/reviews/${reviewId}`);
    return normalizeReview(response.data);
  } catch (error) {
    throw buildApiError(error, 'Unable to load this review right now.');
  }
}
