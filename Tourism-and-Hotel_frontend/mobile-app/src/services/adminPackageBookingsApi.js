import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { createAuthConfig } from '../utils/api';

export const PACKAGE_BOOKING_FILTERS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Cancelled', value: 'cancelled' },
];

function buildApiError(error, fallbackMessage) {
  if (isAxiosError(error)) {
    if (!error.response) {
      return new Error(
        'Unable to reach the backend. Make sure your phone is using the running server IP, not localhost.'
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

function normalizeStatus(status) {
  const normalized = `${status || 'Pending'}`.trim();

  switch (normalized.toLowerCase()) {
    case 'confirmed':
      return {
        label: 'Confirmed',
        variant: 'primary',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        variant: 'danger',
      };
    default:
      return {
        label: 'Pending',
        variant: 'warning',
      };
  }
}

export function normalizePackageBooking(rawBooking) {
  const status = normalizeStatus(rawBooking?.status);
  const createdAt = rawBooking?.createdAt || rawBooking?.updatedAt || null;

  return {
    ...rawBooking,
    bookingId: rawBooking?.bookingId || 'Booking ID unavailable',
    customerName: rawBooking?.userName || 'Guest User',
    customerEmail: rawBooking?.userEmail || 'Email unavailable',
    packageName: rawBooking?.packageName || 'Package not set',
    selectedVehicleLabel: rawBooking?.selectedVehicle?.vehicleName || '',
    tourDateLabel: formatDate(rawBooking?.tourDate),
    guestCount: Number(rawBooking?.guests || 0),
    guestCountLabel: `${Number(rawBooking?.guests || 0)} guest(s)`,
    totalAmount: Number(rawBooking?.totalPrice || 0),
    totalAmountLabel: formatCurrency(rawBooking?.totalPrice),
    statusLabel: status.label,
    statusVariant: status.variant,
    orderDateLabel: formatDate(createdAt),
    paymentMethod: rawBooking?.paymentMethod || 'checkout',
  };
}

function buildStats(bookings) {
  const stats = {
    total: bookings.length,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    revenue: 0,
  };

  bookings.forEach((booking) => {
    const normalizedStatus = `${booking.statusLabel}`.toLowerCase();

    if (normalizedStatus === 'confirmed') {
      stats.confirmed += 1;
    } else if (normalizedStatus === 'cancelled') {
      stats.cancelled += 1;
    } else {
      stats.pending += 1;
    }

    if (normalizedStatus !== 'cancelled') {
      stats.revenue += Number(booking.totalAmount || 0);
    }
  });

  return stats;
}

export async function fetchAdminPackageBookings(token) {
  try {
    const response = await apiClient.get('/package-bookings', createAuthConfig(token));
    const bookings = Array.isArray(response.data)
      ? response.data.map(normalizePackageBooking)
      : [];

    return {
      bookings,
      stats: buildStats(bookings),
    };
  } catch (error) {
    throw buildApiError(error, 'Unable to load package bookings right now.');
  }
}

export async function fetchAdminPackageBookingById(token, bookingId) {
  try {
    const response = await apiClient.get(
      `/package-bookings/${bookingId}`,
      createAuthConfig(token)
    );
    return normalizePackageBooking(response.data);
  } catch (error) {
    throw buildApiError(error, 'Unable to load this package booking right now.');
  }
}

export async function updateAdminPackageBookingStatus(token, bookingId, status) {
  try {
    const response = await apiClient.put(
      `/package-bookings/${bookingId}/status`,
      { status },
      createAuthConfig(token)
    );
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to update this package booking right now.');
  }
}

export async function cancelAdminPackageBooking(token, bookingId) {
  try {
    const response = await apiClient.delete(
      `/package-bookings/${bookingId}`,
      createAuthConfig(token)
    );
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to cancel this package booking right now.');
  }
}
