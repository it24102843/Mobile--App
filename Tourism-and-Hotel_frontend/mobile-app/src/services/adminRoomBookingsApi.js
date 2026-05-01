import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { getHotelRoomImageByName } from '../config/hotelMedia';
import { createAuthConfig } from '../utils/api';
import { getDefaultImage, resolveMediaUrl } from '../utils/media';

export const ROOM_BOOKING_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Pay at Checkout', value: 'checkout' },
];

function formatCurrency(value) {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value) || 0)}`;
}

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return `${value}`;
  }

  return date.toLocaleDateString('en-CA');
}

function getStatusVariant(status, paymentStatus) {
  if (`${paymentStatus ?? ''}`.toLowerCase() === 'rejected') {
    return 'danger';
  }

  switch (`${status ?? ''}`.toLowerCase()) {
    case 'confirmed':
      return 'primary';
    case 'pending':
      return 'accent';
    case 'cancelled':
      return 'danger';
    case 'completed':
      return 'info';
    default:
      return 'info';
  }
}

function getRefundMeta(refundStatus) {
  switch (`${refundStatus ?? ''}`.toLowerCase()) {
    case 'pending_admin_refund':
      return { label: 'Refund Pending', variant: 'accent' };
    case 'processing':
      return { label: 'Refund Processing', variant: 'info' };
    case 'refunded':
      return { label: 'Refunded', variant: 'primary' };
    case 'not_required':
      return { label: 'Not Required', variant: 'info' };
    case 'not_eligible':
      return { label: 'Not Eligible', variant: 'danger' };
    default:
      return null;
  }
}

function getDisplayStatus(bookingStatus, paymentStatus) {
  if (`${paymentStatus ?? ''}`.toLowerCase() === 'rejected') {
    return 'Rejected';
  }

  switch (`${bookingStatus ?? ''}`.toLowerCase()) {
    case 'confirmed':
      return 'Confirmed';
    case 'pending':
      return 'Pending';
    case 'cancelled':
      return 'Cancelled';
    case 'completed':
      return 'Completed';
    default:
      return 'Pending';
  }
}

function getTaxAmount(booking) {
  const roomPrice = Number(booking?.room?.price || 0);
  const nights = Number(booking?.numberOfNights || 0);
  const roomTotal = roomPrice * nights;
  return Math.round(roomTotal * 0.15);
}

export function extractAdminRoomBookingsError(error, fallbackMessage) {
  if (isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      fallbackMessage
    );
  }

  return error instanceof Error ? error.message : fallbackMessage;
}

export function normalizeAdminRoomBooking(booking) {
  const taxAmount = getTaxAmount(booking);
  const roomCharge = Number(booking?.room?.price || 0) * Number(booking?.numberOfNights || 0);
  const totalAmount =
    Number(booking?.totalAmount) || roomCharge + taxAmount || Number(booking?.room?.price || 0);
  const directImage = resolveMediaUrl(booking?.room?.image, '');
  const hotelFallback = getHotelRoomImageByName(booking?.room?.hotelName, []);
  const bookingImageUrl =
    directImage && directImage !== getDefaultImage()
      ? directImage
      : hotelFallback || getDefaultImage();
  const refundMeta = getRefundMeta(booking?.refundStatus);

  return {
    ...booking,
    imageUrl: bookingImageUrl,
    hotelName: booking?.room?.hotelName || 'Hotel',
    roomType: booking?.room?.roomType || 'Room',
    roomNumber: booking?.room?.roomNumber || 'N/A',
    guestLabel: booking?.email || 'Guest',
    checkInLabel: formatDate(booking?.checkInDate),
    checkOutLabel: formatDate(booking?.checkOutDate),
    totalLabel: formatCurrency(totalAmount),
    statusLabel: getDisplayStatus(booking?.bookingStatus, booking?.paymentStatus),
    statusVariant: getStatusVariant(booking?.bookingStatus, booking?.paymentStatus),
    paymentMethodLabel:
      booking?.paymentMethod === 'checkout'
        ? 'Pay at Checkout'
        : booking?.paymentMethod === 'online'
          ? 'Online Payment'
          : 'Bank Deposit',
    paymentStatusLabel:
      booking?.paymentStatus === 'verified'
        ? 'Verified'
        : booking?.paymentStatus === 'rejected'
          ? 'Rejected'
          : 'Pending',
    refundStatusLabel: refundMeta?.label || '',
    refundStatusVariant: refundMeta?.variant || 'info',
    canMarkRefunded:
      `${booking?.bookingStatus ?? ''}`.toLowerCase() === 'cancelled' &&
      `${booking?.refundStatus ?? ''}`.toLowerCase() === 'pending_admin_refund',
    roomCharges: roomCharge,
    taxAmount,
    totalAmount,
    roomChargesLabel: formatCurrency(roomCharge),
    taxAmountLabel: formatCurrency(taxAmount),
    totalAmountLabel: formatCurrency(totalAmount),
    checkoutEmailSent: Boolean(booking?.checkoutEmailSent),
    slipUrl: booking?.paymentSlip ? resolveMediaUrl(booking.paymentSlip, '') : '',
  };
}

function buildStats(bookings) {
  return {
    total: bookings.length,
    confirmed: bookings.filter((booking) => booking.statusLabel === 'Confirmed').length,
    pending: bookings.filter((booking) => booking.statusLabel === 'Pending').length,
    rejected: bookings.filter((booking) => booking.statusLabel === 'Rejected').length,
    checkout: bookings.filter((booking) => booking.paymentMethod === 'checkout').length,
  };
}

export async function fetchAdminRoomBookings(token) {
  const response = await apiClient.get('/rooms/bookings/all', createAuthConfig(token));
  const bookings = Array.isArray(response.data)
    ? response.data.map(normalizeAdminRoomBooking)
    : [];

  return {
    bookings,
    stats: buildStats(bookings),
  };
}

export async function approveAdminRoomBooking(token, bookingId) {
  const response = await apiClient.put(
    `/rooms/bookings/${bookingId}/approve`,
    {},
    createAuthConfig(token)
  );
  return response.data;
}

export async function rejectAdminRoomBooking(token, bookingId) {
  const response = await apiClient.put(
    `/rooms/bookings/${bookingId}/reject`,
    {},
    createAuthConfig(token)
  );
  return response.data;
}

export async function sendAdminCheckoutBill(token, bookingId, forceResend = false) {
  const response = await apiClient.post(
    `/rooms/bookings/${bookingId}/send-checkout-email`,
    { forceResend },
    createAuthConfig(token)
  );
  return response.data;
}

export async function markAdminRoomBookingRefunded(token, booking) {
  const response = await apiClient.put(
    `/rooms/bookings/${booking.bookingId}/refund-status`,
    {
      refundStatus: 'refunded',
      refundAmount: Number(booking?.refundAmount ?? booking?.totalAmount ?? 0),
      refundMessage: 'Refund processed by admin.',
    },
    createAuthConfig(token)
  );

  return response.data;
}
