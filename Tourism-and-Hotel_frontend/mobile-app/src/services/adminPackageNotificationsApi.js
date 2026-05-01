import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { createAuthConfig } from '../utils/api';

function buildApiError(error, fallbackMessage) {
  if (isAxiosError(error)) {
    if (!error.response) {
      return new Error(
        'Unable to reach the backend. Make sure your mobile API URL points to the running server IP, not localhost.'
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

function formatCurrency(value) {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value) || 0)}`;
}

function formatDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return 'Date not set';
  }

  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatNotificationType(type) {
  const normalizedType = `${type || ''}`.trim().toLowerCase();

  if (normalizedType === 'cancelled') {
    return 'Cancelled Booking';
  }

  if (normalizedType === 'updated') {
    return 'Updated Booking';
  }

  return 'New Booking';
}

function normalizeNotification(rawNotification) {
  return {
    id: rawNotification._id,
    bookingId: rawNotification.bookingId || 'Booking ID unavailable',
    customerName: rawNotification.userName || 'Guest User',
    customerEmail: rawNotification.userEmail || 'Email unavailable',
    packageName: rawNotification.packageName || 'Package not set',
    guestCountLabel: `${Number(rawNotification.guests || 0)} guest(s)`,
    totalAmountLabel: formatCurrency(rawNotification.totalAmount),
    paymentMethod: rawNotification.paymentMethod || 'checkout',
    type: rawNotification.type || 'created',
    typeLabel: formatNotificationType(rawNotification.type),
    note: rawNotification.note || '',
    status: rawNotification.status || 'Pending',
    isRead: Boolean(rawNotification.isRead),
    createdAtLabel: formatDate(rawNotification.createdAt),
    tourDateLabel: formatDate(rawNotification.tourDate),
  };
}

export async function fetchAdminPackageBookingNotifications(token) {
  try {
    const response = await apiClient.get(
      '/package-bookings/notifications',
      createAuthConfig(token)
    );

    return {
      notifications: Array.isArray(response.data?.notifications)
        ? response.data.notifications.map(normalizeNotification)
        : [],
      unreadCount: Number(response.data?.unreadCount || 0),
    };
  } catch (error) {
    throw buildApiError(error, 'Unable to load package booking notifications right now.');
  }
}

export async function fetchAdminPackageBookingNotificationUnreadCount(token) {
  try {
    const response = await apiClient.get(
      '/package-bookings/notifications/unread-count',
      createAuthConfig(token)
    );
    return Number(response.data?.unreadCount || 0);
  } catch (error) {
    throw buildApiError(error, 'Unable to load package booking notification count.');
  }
}

export async function markAdminPackageBookingNotificationRead(token, notificationId) {
  try {
    const response = await apiClient.patch(
      `/package-bookings/notifications/${notificationId}/read`,
      {},
      createAuthConfig(token)
    );
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to mark this package booking notification as read.');
  }
}

export async function markAllAdminPackageBookingNotificationsRead(token) {
  try {
    const response = await apiClient.patch(
      '/package-bookings/notifications/read-all',
      {},
      createAuthConfig(token)
    );
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to mark all package booking notifications as read.');
  }
}
