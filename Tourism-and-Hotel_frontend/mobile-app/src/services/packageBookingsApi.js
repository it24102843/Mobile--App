import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { createAuthConfig } from '../utils/api';
import { getDefaultImage, resolveMediaCollection } from '../utils/media';
import {
  isFutureOrToday,
  isPositiveInteger,
  isValidPhone,
  normalizeInput,
} from '../utils/validation';

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

export async function fetchMyPackageBookingById(token, bookingId) {
  try {
    const response = await apiClient.get(
      `/package-bookings/${bookingId}`,
      createAuthConfig(token)
    );
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to load this package booking right now.');
  }
}

export async function createMyPackageBooking(token, payload) {
  try {
    const response = await apiClient.post('/package-bookings', payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to create the package booking right now.');
  }
}

export async function cancelMyPackageBooking(token, bookingId) {
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

export function validatePackageBookingForm(values, pkg, options = {}) {
  const errors = {};
  const guests = Number(values.guests);
  const contactNumber = normalizeInput(values.contactNumber);
  const totalPrice = Number(options.totalPrice ?? values.totalPrice);

  if (!values.tourDate) {
    errors.tourDate = 'Tour date is required.';
  } else if (!isFutureOrToday(values.tourDate)) {
    const tourDate = new Date(values.tourDate);
    if (Number.isNaN(tourDate.getTime())) {
      errors.tourDate = 'Please enter a valid tour date.';
    } else {
      errors.tourDate = 'Tour date cannot be in the past.';
    }
  }

  if (!isPositiveInteger(guests)) {
    errors.guests = 'Guest count must be at least 1.';
  } else if (pkg?.maxGroupSize && guests > pkg.maxGroupSize) {
    errors.guests = `This package allows up to ${pkg.maxGroupSize} guests only.`;
  }

  if (!contactNumber) {
    errors.contactNumber = 'Contact number is required.';
  } else if (!isValidPhone(contactNumber)) {
    errors.contactNumber = 'Please enter a valid contact number.';
  }

  if (!['online', 'bank_deposit'].includes(`${values.paymentMethod || ''}`.trim())) {
    errors.paymentMethod = 'Please choose a valid payment method.';
  }

  if (options.requireVehicleSelection && !values.selectedVehicleId) {
    errors.selectedVehicle = 'Please select a package vehicle.';
  }

  if (values.mealSelected && !values.mealPackage?.breakfast && !values.mealPackage?.lunch) {
    errors.mealPackage = 'Please choose at least one meal option.';
  }

  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    errors.totalPrice = 'Total amount must be greater than 0.';
  }

  if (values.tourDate && !isFutureOrToday(values.tourDate)) {
    return errors;
  }

  if (values.tourDate) {
    const tourDate = new Date(values.tourDate);
    if (Number.isNaN(tourDate.getTime())) {
      errors.tourDate = 'Please enter a valid tour date.';
    }
  }

  return errors;
}

export function normalizeMyPackageBooking(booking) {
  return {
    ...booking,
    imageUrl: resolveMediaCollection(booking?.packageImage, getDefaultImage()),
  };
}
