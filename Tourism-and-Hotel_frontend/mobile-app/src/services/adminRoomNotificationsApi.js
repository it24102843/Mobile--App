import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { getHotelRoomImageByName } from '../config/hotelMedia';
import { createAuthConfig } from '../utils/api';
import { getDefaultImage, resolveMediaUrl } from '../utils/media';

function formatDateTime(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return `${value}`;
  }

  return date.toLocaleString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return `${value}`;
  }

  return date.toLocaleDateString('en-CA');
}

function formatCurrency(value) {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value) || 0)}`;
}

function formatNotificationType(value) {
  const normalizedValue = `${value || ''}`.trim().toLowerCase();

  if (normalizedValue === 'room_booking_cancelled') {
    return 'Cancelled Room Booking';
  }

  return 'Room Booking Notification';
}

function buildNotificationError(error, fallbackMessage) {
  if (isAxiosError(error)) {
    return new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        fallbackMessage
    );
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
}

function normalizeRoomBookingNotification(notification) {
  const room = notification?.bookingSnapshot?.room || {};
  const directImage = resolveMediaUrl(room.image, '');
  const imageUrl =
    directImage && directImage !== getDefaultImage()
      ? directImage
      : getHotelRoomImageByName(room.hotelName, []) || getDefaultImage();

  return {
    ...notification,
    id: notification?._id || notification?.id,
    imageUrl,
    bookingId: notification?.bookingId || 'N/A',
    email: notification?.email || 'Guest',
    hotelName: room.hotelName || 'Hotel',
    roomType: room.roomType || 'Room',
    roomNumber: room.roomNumber || 'N/A',
    checkInLabel: formatDate(notification?.bookingSnapshot?.checkInDate),
    checkOutLabel: formatDate(notification?.bookingSnapshot?.checkOutDate),
    nightsLabel: `${Number(notification?.bookingSnapshot?.numberOfNights || 0)} night(s)`,
    guestsLabel: `${Number(notification?.bookingSnapshot?.numberOfGuests || 0)} guest(s)`,
    totalLabel: formatCurrency(notification?.bookingSnapshot?.totalAmount),
    paymentMethodLabel:
      notification?.bookingSnapshot?.paymentMethod === 'checkout'
        ? 'Pay at Checkout'
        : notification?.bookingSnapshot?.paymentMethod === 'online'
          ? 'Online Payment'
          : 'Bank Deposit',
    typeLabel: formatNotificationType(notification?.type),
    refundNote:
      notification?.bookingSnapshot?.refundMessage ||
      notification?.notificationMessage ||
      'No refund note available.',
    cancellationTimeLabel: formatDateTime(notification?.cancellationDate),
  };
}

export async function fetchAdminRoomBookingNotifications(token) {
  try {
    const response = await apiClient.get(
      '/rooms/bookings/notifications',
      createAuthConfig(token)
    );

    const notifications = Array.isArray(response.data?.notifications)
      ? response.data.notifications.map(normalizeRoomBookingNotification)
      : [];

    return {
      notifications,
      unreadCount:
        Number(response.data?.unreadCount) ||
        notifications.filter((notification) => !notification.isRead).length,
    };
  } catch (error) {
    throw buildNotificationError(
      error,
      'Unable to load room booking notifications right now.'
    );
  }
}

export async function fetchAdminRoomBookingNotificationUnreadCount(token) {
  try {
    const response = await apiClient.get(
      '/rooms/bookings/notifications/unread-count',
      createAuthConfig(token)
    );

    return Number(response.data?.unreadCount) || 0;
  } catch (error) {
    throw buildNotificationError(
      error,
      'Unable to load unread room booking notification count right now.'
    );
  }
}

export async function markRoomBookingNotificationRead(token, notificationId) {
  try {
    const response = await apiClient.patch(
      `/rooms/bookings/notifications/${notificationId}/read`,
      {},
      createAuthConfig(token)
    );

    return response.data;
  } catch (error) {
    throw buildNotificationError(
      error,
      'Unable to mark this notification as read right now.'
    );
  }
}

export async function markAllRoomBookingNotificationsRead(token) {
  try {
    const response = await apiClient.patch(
      '/rooms/bookings/notifications/read-all',
      {},
      createAuthConfig(token)
    );

    return response.data;
  } catch (error) {
    throw buildNotificationError(
      error,
      'Unable to mark all notifications as read right now.'
    );
  }
}
