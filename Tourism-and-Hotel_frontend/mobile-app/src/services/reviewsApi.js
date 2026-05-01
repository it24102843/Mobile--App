import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { createAuthConfig } from '../utils/api';
import { resolveMediaUrl } from '../utils/media';
import { hasMinLength, isNumberInRange, normalizeInput } from '../utils/validation';

function buildApiError(error, fallbackMessage) {
  if (isAxiosError(error)) {
    if (!error.response) {
      return new Error(
        'Unable to reach the backend. Make sure your mobile API URL points to your running server, not localhost.'
      );
    }

    return new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        fallbackMessage
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
  const rating = Math.max(0, Math.min(Number(rawReview?.rating || 0), 5));
  const isApproved = Boolean(rawReview?.isApproved);

  return {
    id: rawReview?._id,
    reviewerName: rawReview?.name || 'Guest Reviewer',
    reviewerEmail: rawReview?.email || '',
    profilePicture: resolveMediaUrl(rawReview?.profilePicture),
    rating,
    ratingLabel: `(${rating}/5)`,
    comment: rawReview?.comment || '',
    date: rawReview?.date || null,
    dateLabel: formatReviewDate(rawReview?.date),
    section: rawReview?.section || 'All',
    isApproved,
    statusLabel: isApproved ? 'Approved' : 'Pending Approval',
    statusVariant: isApproved ? 'primary' : 'warning',
    raw: rawReview,
  };
}

export function validateReviewForm(values) {
  const errors = {};
  const comment = normalizeInput(values.comment);
  const rating = Number(values.rating);

  if (!isNumberInRange(rating, 1, 5)) {
    errors.rating = 'Please select a rating between 1 and 5.';
  }

  if (!values.section) {
    errors.section = 'Please choose a review section.';
  }

  if (!comment) {
    errors.comment = 'Review comment is required.';
  } else if (!hasMinLength(comment, 10)) {
    errors.comment = 'Please enter at least 10 characters.';
  }

  return errors;
}

export async function fetchPublicReviews() {
  try {
    const response = await apiClient.get('/reviews');
    return [...(response.data || [])].sort(sortReviewsByRatingAndDate).map(normalizeReview);
  } catch (error) {
    throw buildApiError(error, 'Unable to load reviews right now.');
  }
}

export async function fetchMyReviews(token) {
  try {
    const response = await apiClient.get('/reviews/my-reviews', createAuthConfig(token));
    return [...(response.data || [])].sort(sortReviewsByRatingAndDate).map(normalizeReview);
  } catch (error) {
    throw buildApiError(error, 'Unable to load your reviews right now.');
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

export async function createMyReview(token, payload) {
  try {
    const response = await apiClient.post('/reviews', payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to submit your review right now.');
  }
}

export async function updateMyReview(token, reviewId, payload) {
  try {
    const response = await apiClient.put(`/reviews/${reviewId}`, payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to update your review right now.');
  }
}

export async function deleteMyReview(token, reviewId) {
  try {
    const response = await apiClient.delete(`/reviews/${reviewId}`, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to delete this review right now.');
  }
}
