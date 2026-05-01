import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { createAuthConfig } from '../utils/api';
import { getDefaultImage, resolveMediaCollection } from '../utils/media';
import {
  hasMinLength,
  isPositiveInteger,
  isPositiveNumber,
  isRequired,
  isValidHttpUrl,
  isValidPhone,
} from '../utils/validation';

export const TRANSPORTATION_STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Available', value: 'Available' },
  { label: 'Unavailable', value: 'Unavailable' },
];

export const TRANSPORTATION_FORM_STATUS_OPTIONS = TRANSPORTATION_STATUS_OPTIONS.filter(
  (option) => option.value !== 'all'
);

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

function formatCurrency(value) {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value) || 0)}`;
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => `${item ?? ''}`.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getStatusMeta(availability) {
  return availability !== false
    ? { label: 'Available', variant: 'primary' }
    : { label: 'Unavailable', variant: 'danger' };
}

export function normalizeTransportation(rawVehicle) {
  const images = Array.isArray(rawVehicle?.image)
    ? rawVehicle.image
        .filter((value) => typeof value === 'string' && value.trim())
        .map((value) => resolveMediaCollection(value, getDefaultImage()))
    : [];
  const gallery = images.length ? images : [getDefaultImage()];
  const statusMeta = getStatusMeta(rawVehicle?.availability);

  return {
    ...rawVehicle,
    id: rawVehicle?._id || '',
    shortId: rawVehicle?._id ? `${rawVehicle._id}`.slice(-8).toUpperCase() : 'N/A',
    name: rawVehicle?.name || 'Transportation Vehicle',
    type: rawVehicle?.type || 'Vehicle',
    registrationNumber: rawVehicle?.registrationNumber || 'Not provided',
    driverName: rawVehicle?.driverName || '',
    driverContact: rawVehicle?.driverContact || '',
    capacity: Number(rawVehicle?.capacity || 0),
    capacityLabel: `${Number(rawVehicle?.capacity || 0)} seats`,
    pricePerDay: Number(rawVehicle?.pricePerDay || 0),
    pricePerDayLabel: `${formatCurrency(rawVehicle?.pricePerDay)} / day`,
    description: rawVehicle?.description || '',
    availability: rawVehicle?.availability !== false,
    statusLabel: statusMeta.label,
    statusVariant: statusMeta.variant,
    imageGallery: gallery,
    imageUrl: gallery[0] || getDefaultImage(),
  };
}

export function buildTransportationPayload(values) {
  const images = normalizeStringArray(values.imageUrls).filter((value) => /^https?:\/\//i.test(value));
  const status = `${values.status || 'Available'}`.trim();

  return {
    registrationNumber: `${values.registrationNumber || ''}`.trim(),
    name: `${values.name || ''}`.trim(),
    type: `${values.type || ''}`.trim(),
    capacity: Number(values.capacity || 0),
    pricePerDay: Number(values.pricePerDay || 0),
    description: `${values.description || ''}`.trim(),
    driverName: `${values.driverName || ''}`.trim(),
    driverContact: `${values.driverContact || ''}`.trim(),
    availability: status === 'Available',
    image: images,
  };
}

export function validateTransportationForm(values, existingVehicles = [], options = {}) {
  const errors = {};
  const name = `${values.name || ''}`.trim();
  const type = `${values.type || ''}`.trim();
  const registrationNumber = `${values.registrationNumber || ''}`.trim();
  const description = `${values.description || ''}`.trim();
  const capacity = Number(values.capacity);
  const pricePerDay = Number(values.pricePerDay);
  const status = `${values.status || ''}`.trim();
  const imageUrls = Array.isArray(values.imageUrls)
    ? values.imageUrls.map((value) => `${value || ''}`.trim())
    : [];

  if (!name) {
    errors.name = 'Vehicle name is required.';
  }

  if (!type) {
    errors.type = 'Vehicle type is required.';
  }

  if (!registrationNumber) {
    errors.registrationNumber = 'Registration number is required.';
  } else {
    const duplicateRegistration = existingVehicles.find(
      (item) =>
        item.registrationNumber?.trim().toLowerCase() === registrationNumber.toLowerCase()
    );

    if (duplicateRegistration && duplicateRegistration.id !== options.currentVehicleId) {
      errors.registrationNumber = 'This registration number already exists.';
    }
  }

  if (!isPositiveInteger(capacity)) {
    errors.capacity = 'Capacity must be a positive whole number.';
  }

  if (!isPositiveNumber(pricePerDay)) {
    errors.pricePerDay = 'Price must be a positive number.';
  }

  if (!description) {
    errors.description = 'Description is required.';
  } else if (!hasMinLength(description, 10)) {
    errors.description = 'Description must contain at least 10 characters.';
  }

  if (!isRequired(status)) {
    errors.status = 'Status is required.';
  }

  if (`${values.driverContact || ''}`.trim() && !isValidPhone(values.driverContact)) {
    errors.driverContact = 'Driver contact number is invalid.';
  }

  const imageFieldErrors = imageUrls.map((value) => {
    if (!value) {
      return null;
    }

    if (!isValidHttpUrl(value)) {
      return 'Image URL must start with http:// or https://';
    }

    return null;
  });

  if (imageFieldErrors.some(Boolean)) {
    errors.imageUrls = imageFieldErrors;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export async function fetchAdminTransportations(token) {
  try {
    const response = await apiClient.get('/vehicles', createAuthConfig(token));
    return Array.isArray(response.data) ? response.data.map(normalizeTransportation) : [];
  } catch (error) {
    throw buildApiError(error, 'Unable to load transportation vehicles right now.');
  }
}

export async function fetchAdminTransportationById(token, id) {
  try {
    const response = await apiClient.get(`/vehicles/${id}`, createAuthConfig(token));
    return normalizeTransportation(response.data);
  } catch (error) {
    throw buildApiError(error, 'Unable to load this transportation record right now.');
  }
}

export async function createAdminTransportation(token, payload) {
  try {
    const response = await apiClient.post('/vehicles', payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to create this transportation record right now.');
  }
}

export async function updateAdminTransportation(token, id, payload) {
  try {
    const response = await apiClient.put(`/vehicles/${id}`, payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to update this transportation record right now.');
  }
}

export async function deleteAdminTransportation(token, id) {
  try {
    const response = await apiClient.delete(`/vehicles/${id}`, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to delete this transportation record right now.');
  }
}
