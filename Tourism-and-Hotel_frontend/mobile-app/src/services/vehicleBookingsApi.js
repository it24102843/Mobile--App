import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { createAuthConfig } from '../utils/api';
import { getDefaultImage, resolveMediaCollection } from '../utils/media';
import {
  formatPaymentMethodLabel,
  formatPaymentStatusLabel,
} from '../utils/roomBooking';
import {
  getStartOfToday,
  isDateAfter,
  isPositiveInteger,
  isValidEmail,
  isValidPhone,
  normalizeInput,
  parseDateValue,
} from '../utils/validation';

export const VEHICLE_PAYMENT_OPTIONS = [
  {
    value: 'online',
    title: 'Online Payment',
    subtitle: 'Instant payment',
    description:
      'Use the online payment route when the backend payment flow is enabled.',
  },
  {
    value: 'bank_deposit',
    title: 'Bank Transfer',
    subtitle: 'Manual verification',
    description:
      'Reserve now and send your transfer details to the WildHaven team.',
  },
];

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

function startOfDay(value) {
  const date = parseDateValue(value) || new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function calculateVehicleBookingTotals(startDate, endDate, pricePerDay) {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return {
      totalDays: 0,
      totalPrice: 0,
    };
  }

  const totalDays = Math.max(
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    1
  );

  return {
    totalDays,
    totalPrice: totalDays * Number(pricePerDay || 0),
  };
}

export function validateVehicleBookingForm(values, vehicle) {
  const errors = {};
  const trimmedName = normalizeInput(values.customerName);
  const trimmedEmail = normalizeInput(values.customerEmail);
  const trimmedPhone = normalizeInput(values.customerPhone);
  const trimmedStartDate = normalizeInput(values.startDate);
  const trimmedEndDate = normalizeInput(values.endDate);
  const paymentMethod = normalizeInput(values.paymentMethod);
  const passengerCount = Number(values.passengers);

  if (!trimmedName) {
    errors.customerName = 'Full name is required.';
  }

  if (!trimmedEmail) {
    errors.customerEmail = 'Email is required.';
  } else if (!isValidEmail(trimmedEmail)) {
    errors.customerEmail = 'Enter a valid email address.';
  }

  if (!trimmedPhone) {
    errors.customerPhone = 'Phone number is required.';
  } else if (!isValidPhone(trimmedPhone)) {
    errors.customerPhone = 'Enter a valid contact number.';
  }

  if (!trimmedStartDate) {
    errors.startDate = 'Pickup date is required.';
  }

  if (!trimmedEndDate) {
    errors.endDate = 'Return date is required.';
  }

  const start = startOfDay(trimmedStartDate);
  const end = startOfDay(trimmedEndDate);
  const today = getStartOfToday();

  if (trimmedStartDate && Number.isNaN(start.getTime())) {
    errors.startDate = 'Use the format YYYY-MM-DD.';
  } else if (trimmedStartDate && start < today) {
    errors.startDate = 'Pickup date cannot be in the past.';
  }

  if (trimmedEndDate && Number.isNaN(end.getTime())) {
    errors.endDate = 'Use the format YYYY-MM-DD.';
  } else if (trimmedStartDate && trimmedEndDate && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && !isDateAfter(trimmedStartDate, trimmedEndDate)) {
    errors.endDate = 'Return date must be after the pickup date.';
  }

  if (!isPositiveInteger(values.passengers)) {
    errors.passengers = 'Passenger count must be a positive number.';
  } else if (vehicle?.capacity && passengerCount > Number(vehicle.capacity)) {
    errors.passengers = `This vehicle supports up to ${vehicle.capacity} passengers.`;
  }

  if (!paymentMethod) {
    errors.paymentMethod = 'Select a payment method.';
  } else if (!VEHICLE_PAYMENT_OPTIONS.some((option) => option.value === paymentMethod)) {
    errors.paymentMethod = 'Selected payment method is invalid.';
  }

  return errors;
}

export function normalizeMyVehicleBooking(booking) {
  const status = booking?.status || 'Pending';
  let statusMeta = { label: status, variant: 'warning' };

  if (status === 'Confirmed') {
    statusMeta = { label: 'Confirmed', variant: 'primary' };
  } else if (status === 'Completed') {
    statusMeta = { label: 'Completed', variant: 'info' };
  } else if (status === 'Cancelled') {
    statusMeta = { label: 'Cancelled', variant: 'danger' };
  }

  const startDate = new Date(booking?.startDate);
  const now = new Date();
  const canCancel =
    status !== 'Cancelled' &&
    status !== 'Completed' &&
    status !== 'Confirmed' &&
    !Number.isNaN(startDate.getTime()) &&
    now < startDate;

  let cancellationHint = '';

  if (status === 'Confirmed') {
    cancellationHint = 'Confirmed safari bookings can no longer be cancelled.';
  } else if (status === 'Cancelled') {
    cancellationHint = 'This safari booking has already been cancelled.';
  } else if (status === 'Completed') {
    cancellationHint = 'Completed safari bookings cannot be cancelled.';
  } else {
    cancellationHint =
      'Pending safari bookings can be cancelled only before the pickup date.';
  }

  return {
    ...booking,
    bookingId: booking?._id || 'Not available',
    paymentMethodLabel: formatPaymentMethodLabel(booking?.paymentMethod),
    paymentStatusLabel: formatPaymentStatusLabel(booking?.paymentStatus),
    statusMeta,
    canCancel,
    cancellationHint,
    imageUrl: booking?.vehicleId?.image
      ? resolveMediaCollection(booking.vehicleId.image, getDefaultImage())
      : getDefaultImage(),
  };
}

export async function createMyVehicleBooking(token, vehicle, values) {
  try {
    const { totalDays, totalPrice } = calculateVehicleBookingTotals(
      values.startDate,
      values.endDate,
      vehicle?.pricePerDay
    );

    const payload = {
      vehicleId: vehicle.id,
      vehicleName: vehicle.title,
      regNo: vehicle.registrationNumber,
      vehicleType: vehicle.typeLabel,
      capacity: vehicle.capacity,
      pricePerDay: vehicle.pricePerDay,
      startDate: values.startDate.trim(),
      endDate: values.endDate.trim(),
      totalDays,
      totalPrice,
      passengers: Number(values.passengers),
      customerName: values.customerName.trim(),
      customerEmail: values.customerEmail.trim().toLowerCase(),
      customerPhone: values.customerPhone.trim(),
      specialRequests: values.specialRequests?.trim() || '',
      paymentMethod: values.paymentMethod,
    };

    const response = await apiClient.post(
      '/vehicle-bookings',
      payload,
      createAuthConfig(token)
    );

    return response.data;
  } catch (error) {
    throw buildApiError(
      error,
      'Unable to create the safari vehicle booking right now.'
    );
  }
}
