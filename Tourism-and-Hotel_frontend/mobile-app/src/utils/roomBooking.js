import { getHotelRoomImageByName } from '../config/hotelMedia';
import { getDefaultImage, resolveMediaUrl } from './media';

export function formatPaymentMethodLabel(method) {
  switch (method) {
    case 'bank_deposit':
      return 'Bank Deposit';
    case 'online':
      return 'Online Payment';
    case 'checkout':
      return 'Pay at Check-out';
    default:
      return method || 'Not selected';
  }
}

export function formatPaymentStatusLabel(status) {
  switch (status) {
    case 'verified':
      return 'Payment Verified';
    case 'rejected':
      return 'Payment Rejected';
    case 'pending':
      return 'Payment Pending';
    default:
      return status || 'Pending';
  }
}

export function getRefundStatusMeta(refundStatus) {
  switch (refundStatus) {
    case 'not_required':
      return { label: 'Not Required', variant: 'info' };
    case 'pending_admin_refund':
      return { label: 'Refund Pending', variant: 'warning' };
    case 'processing':
      return { label: 'Refund Processing', variant: 'info' };
    case 'refunded':
      return { label: 'Refunded', variant: 'primary' };
    case 'not_eligible':
      return { label: 'No Refund', variant: 'danger' };
    default:
      return null;
  }
}

function getHoursBetween(fromDate, toDate) {
  return (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60);
}

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function resolveRoomBookingImage(booking) {
  const directImage = resolveMediaUrl(booking?.room?.image, '');
  const hotelFallback = getHotelRoomImageByName(booking?.room?.hotelName, []);

  if (directImage && directImage !== getDefaultImage()) {
    return directImage;
  }

  if (hotelFallback) {
    return hotelFallback;
  }

  return getDefaultImage();
}

export function normalizeRoomBooking(booking) {
  const now = new Date();
  const createdAt = new Date(booking.createdAt || booking.bookingDate || Date.now());
  const checkInDate = new Date(booking.checkInDate || Date.now());
  const refundMeta = getRefundStatusMeta(booking.refundStatus);
  const paymentMethodLabel = formatPaymentMethodLabel(booking.paymentMethod);
  const paymentStatusLabel = formatPaymentStatusLabel(booking.paymentStatus);

  let bookingStatusMeta = {
    label: 'Pending Approval',
    variant: 'warning',
  };

  if (booking.bookingStatus === 'cancelled') {
    bookingStatusMeta = refundMeta || { label: 'Cancelled', variant: 'danger' };
  } else if (booking.paymentStatus === 'rejected') {
    bookingStatusMeta = { label: 'Payment Rejected', variant: 'danger' };
  } else if (booking.bookingStatus === 'confirmed' || (booking.isApproved && booking.paymentStatus === 'verified')) {
    bookingStatusMeta = { label: 'Confirmed', variant: 'primary' };
  } else if (booking.paymentMethod === 'checkout' && booking.isApproved) {
    bookingStatusMeta = { label: 'Pay at Check-out', variant: 'info' };
  } else if (booking.paymentStatus === 'pending') {
    bookingStatusMeta = { label: 'Pending Verification', variant: 'warning' };
  }

  let canCancel = false;
  let cancellationHint = '';
  const bookingAgeHours = getHoursBetween(createdAt, now);
  const hoursUntilCheckIn = getHoursBetween(now, checkInDate);
  const checkoutDeadline = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);
  const checkoutDeadlineLabel = formatDateTime(checkoutDeadline);

  if (booking.bookingStatus === 'completed') {
    canCancel = false;
    cancellationHint = 'This booking is no longer eligible for cancellation.';
  } else if (booking.bookingStatus !== 'cancelled' && now < checkInDate) {
    if (booking.paymentMethod === 'checkout') {
      canCancel = bookingAgeHours <= 48;
      cancellationHint = canCancel
        ? `Pay at checkout bookings can be cancelled only within 48 hours of booking. Cancellation deadline: ${checkoutDeadlineLabel}.`
        : 'Pay at checkout bookings can be cancelled only within 48 hours of booking.';
    } else {
      canCancel = hoursUntilCheckIn >= 72;
      cancellationHint = canCancel
        ? 'Online or bank paid bookings can be cancelled only at least 3 days before arrival. Admin will process your refund.'
        : 'Online or bank paid bookings can be cancelled only at least 3 days before arrival.';
    }
  } else if (booking.bookingStatus === 'cancelled') {
    cancellationHint = booking.cancellationMessage || 'This booking has already been cancelled.';
  } else {
    cancellationHint = 'This booking is no longer eligible for cancellation.';
  }

  return {
    ...booking,
    roomImageUrl: resolveRoomBookingImage(booking),
    paymentMethodLabel,
    paymentStatusLabel,
    bookingStatusMeta,
    refundStatusMeta: refundMeta,
    canCancel,
    cancellationHint,
  };
}
