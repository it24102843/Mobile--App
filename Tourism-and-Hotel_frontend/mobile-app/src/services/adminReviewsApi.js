import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { createAuthConfig } from '../utils/api';
import { resolveMediaUrl } from '../utils/media';

export const REVIEW_STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Pending', value: 'Pending' },
];

export const REVIEW_RATING_OPTIONS = [
  { label: 'All Ratings', value: 'all' },
  { label: '5 Stars', value: '5' },
  { label: '4 Stars', value: '4' },
  { label: '3 Stars', value: '3' },
  { label: '2 Stars', value: '2' },
  { label: '1 Star', value: '1' },
];

function buildApiError(error, fallbackMessage) {
  if (isAxiosError(error)) {
    if (!error.response) {
      return new Error(
        'Unable to reach the backend. Make sure your phone uses the running server IP, not localhost.'
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

function formatReviewDateTime(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

export function normalizeAdminReview(rawReview) {
  const rating = Math.max(0, Math.min(5, Number(rawReview?.rating || 0)));
  const adminReplyMessage = rawReview?.adminReply?.message || '';

  return {
    ...rawReview,
    id: rawReview?._id || '',
    reviewerName: rawReview?.name || 'Guest Reviewer',
    reviewerEmail: rawReview?.email || 'Email not available',
    profilePicture: resolveMediaUrl(rawReview?.profilePicture),
    rating,
    comment: rawReview?.comment || 'No review comment available.',
    date: rawReview?.date || null,
    dateLabel: formatReviewDate(rawReview?.date),
    section: rawReview?.section || 'General',
    statusLabel: rawReview?.isApproved ? 'Approved' : 'Pending',
    statusVariant: rawReview?.isApproved ? 'primary' : 'warning',
    isApproved: Boolean(rawReview?.isApproved),
    adminReply: adminReplyMessage
      ? {
          message: adminReplyMessage,
          repliedBy: rawReview?.adminReply?.repliedBy || null,
          repliedAt: rawReview?.adminReply?.repliedAt || null,
          repliedAtLabel: formatReviewDateTime(rawReview?.adminReply?.repliedAt),
          readByUser: Boolean(rawReview?.adminReply?.readByUser),
        }
      : null,
  };
}

export async function fetchAdminReviews(token) {
  try {
    const response = await apiClient.get('/reviews', createAuthConfig(token));
    return [...response.data].sort(sortReviewsByRatingAndDate).map(normalizeAdminReview);
  } catch (error) {
    throw buildApiError(error, 'Unable to load reviews right now.');
  }
}

export async function approveAdminReview(token, reviewId) {
  try {
    const response = await apiClient.put(`/reviews/${reviewId}/approve`, {}, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to approve this review right now.');
  }
}

export async function rejectAdminReview(token, reviewId) {
  try {
    const response = await apiClient.put(`/reviews/${reviewId}/reject`, {}, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to reject this review right now.');
  }
}

export async function deleteAdminReview(token, reviewId) {
  try {
    const response = await apiClient.delete(`/reviews/${reviewId}`, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to delete this review right now.');
  }
}

export async function replyToAdminReview(token, reviewId, message) {
  try {
    const response = await apiClient.post(
      `/reviews/${reviewId}/reply`,
      { message },
      createAuthConfig(token)
    );
    return {
      ...response.data,
      review: response.data?.review ? normalizeAdminReview(response.data.review) : null,
    };
  } catch (error) {
    throw buildApiError(error, 'Unable to send this reply right now.');
  }
}
