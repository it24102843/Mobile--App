import { getDefaultImage } from './media';

export function formatBookingTypeLabel(type) {
  switch (type) {
    case 'room':
      return 'Room';
    case 'safari':
      return 'Safari Vehicle';
    case 'storage':
      return 'Storage / Equipment';
    case 'package':
      return 'Package / Adventure';
    default:
      return 'Booking';
  }
}

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
      return 'Paid';
    case 'refunded':
      return 'Refunded';
    case 'rejected':
      return 'Rejected';
    case 'pending':
    default:
      return 'Pending';
  }
}

export function normalizeBookingStatusMeta(status) {
  switch (status) {
    case 'confirmed':
    case 'Confirmed':
      return { label: 'Confirmed', variant: 'primary' };
    case 'completed':
    case 'Completed':
      return { label: 'Completed', variant: 'info' };
    case 'cancelled':
    case 'Cancelled':
      return { label: 'Cancelled', variant: 'danger' };
    default:
      return { label: status || 'Pending', variant: 'warning' };
  }
}

export function normalizeRefundLabel(refundStatus) {
  switch (refundStatus) {
    case 'pending_admin_refund':
    case 'pending':
      return 'Refund Pending';
    case 'processing':
      return 'Refund Processing';
    case 'refunded':
      return 'Refunded';
    case 'not_eligible':
      return 'No Refund';
    default:
      return 'Not Applicable';
  }
}

export function normalizeUnifiedBooking(item) {
  return {
    ...item,
    typeLabel: formatBookingTypeLabel(item?.type),
    paymentMethodLabel: formatPaymentMethodLabel(item?.paymentMethod),
    paymentStatusLabel: formatPaymentStatusLabel(item?.paymentStatus),
    bookingStatusMeta: normalizeBookingStatusMeta(item?.bookingStatus),
    refundStatusLabel: normalizeRefundLabel(item?.refundStatus),
    image: item?.image || getDefaultImage(),
  };
}
