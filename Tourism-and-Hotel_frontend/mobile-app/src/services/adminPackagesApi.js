import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { createAuthConfig } from '../utils/api';
import { getDefaultImage, resolveMediaCollection } from '../utils/media';
import {
  hasMinLength,
  isNonNegativeInteger,
  isNumberInRange,
  isPositiveInteger,
  isPositiveNumber,
  isRequired,
  isValidHttpUrl,
} from '../utils/validation';

export const PACKAGE_CATEGORIES = [
  'Safari',
  'Wildlife',
  'Pilgrimage',
  'Adventure',
  'Cultural',
  'Nature',
  'Combined',
];

export const PACKAGE_CATEGORY_FILTERS = [
  { label: 'All', value: 'all' },
  ...PACKAGE_CATEGORIES.map((category) => ({ label: category, value: category })),
];

export const PACKAGE_STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Unavailable', value: 'unavailable' },
];

function buildApiError(error, fallbackMessage) {
  if (isAxiosError(error)) {
    if (!error.response) {
      return new Error(
        'Unable to reach the backend. Make sure your phone uses the running server IP, not localhost.'
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

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => `${item ?? ''}`.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function formatCurrency(value, suffix = '') {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value) || 0)}${suffix}`;
}

function formatDuration(duration) {
  const days = Number(duration?.days || 0);
  const nights = Number(duration?.nights || 0);

  if (!days && !nights) {
    return 'Duration not set';
  }

  return `${days} day(s)${nights ? ` / ${nights} night(s)` : ''}`;
}

export function normalizePackage(rawPackage) {
  const images = Array.isArray(rawPackage?.images)
    ? rawPackage.images
        .filter((image) => typeof image === 'string' && image.trim())
        .map((image) => resolveMediaCollection(image, getDefaultImage()))
    : [];

  const highlights = normalizeStringArray(rawPackage?.highlights);
  const includes = normalizeStringArray(rawPackage?.includes);
  const excludes = normalizeStringArray(rawPackage?.excludes);
  const availability = rawPackage?.availability !== false;
  const imageGallery = images.length ? images : [getDefaultImage()];

  return {
    ...rawPackage,
    packageId: rawPackage?.packageId || '',
    name: rawPackage?.name || '',
    category: rawPackage?.category || 'Safari',
    description: rawPackage?.description || '',
    descriptionPreview: `${rawPackage?.description || ''}`.trim().slice(0, 120).trim(),
    durationDays: Number(rawPackage?.duration?.days || 0),
    durationNights: Number(rawPackage?.duration?.nights || 0),
    durationLabel: formatDuration(rawPackage?.duration),
    price: Number(rawPackage?.price || 0),
    priceLabel: formatCurrency(rawPackage?.price),
    maxGroupSize: Number(rawPackage?.maxGroupSize || 0),
    maxGroupLabel: `${Number(rawPackage?.maxGroupSize || 0)} guests max`,
    meetingPoint: rawPackage?.meetingPoint || 'Kataragama Town Center',
    availability,
    availabilityLabel: availability ? 'Available' : 'Unavailable',
    availabilityVariant: availability ? 'primary' : 'warning',
    customizationEnabled: rawPackage?.customizationEnabled !== false,
    customizationLabel:
      rawPackage?.customizationEnabled !== false ? 'Customizable' : 'Fixed package',
    imageGallery,
    imageUrl: imageGallery[0] || getDefaultImage(),
    highlights,
    includes,
    excludes,
    rating: Number(rawPackage?.rating || 0),
    tagList: [...highlights.slice(0, 2), ...includes.slice(0, 2)].slice(0, 4),
  };
}

export function buildPackagePayload(values, options = {}) {
  const imageUrls = Array.isArray(values.imageUrls)
    ? values.imageUrls.filter((value) => `${value || ''}`.trim())
    : [];

  return {
    packageId: options.lockPackageId
      ? options.existingPackageId
      : `${values.packageId || ''}`.trim(),
    name: `${values.name || ''}`.trim(),
    category: `${values.category || ''}`.trim(),
    description: `${values.description || ''}`.trim(),
    duration: {
      days: Number(values.durationDays || 0),
      nights: Number(values.durationNights || 0),
    },
    price: Number(values.price || 0),
    maxGroupSize: Number(values.maxGroupSize || 0),
    highlights: normalizeStringArray(values.highlights),
    includes: normalizeStringArray(values.includes),
    excludes: normalizeStringArray(values.excludes),
    meetingPoint: `${values.meetingPoint || 'Kataragama Town Center'}`.trim(),
    availability: values.availability === 'available',
    customizationEnabled: values.customizationEnabled === 'enabled',
    images: imageUrls,
    rating: Number(values.rating || 0),
  };
}

export function validatePackageForm(values, existingPackages = [], options = {}) {
  const errors = {};
  const packageId = `${values.packageId || ''}`.trim();
  const name = `${values.name || ''}`.trim();
  const category = `${values.category || ''}`.trim();
  const description = `${values.description || ''}`.trim();
  const meetingPoint = `${values.meetingPoint || ''}`.trim();
  const price = Number(values.price);
  const durationDays = Number(values.durationDays);
  const durationNights = Number(values.durationNights);
  const maxGroupSize = Number(values.maxGroupSize);
  const rating = Number(values.rating || 0);
  const imageUrls = Array.isArray(values.imageUrls)
    ? values.imageUrls.map((value) => `${value || ''}`.trim())
    : [];
  const validImages = imageUrls.filter(Boolean);

  if (!packageId) {
    errors.packageId = 'Package ID is required.';
  } else if (!options.allowDuplicatePackageId) {
    const duplicatePackageId = existingPackages.find(
      (item) => item.packageId?.toLowerCase() === packageId.toLowerCase()
    );

    if (duplicatePackageId && duplicatePackageId.packageId !== options.currentPackageId) {
      errors.packageId = 'This package ID already exists.';
    }
  }

  if (!name) {
    errors.name = 'Package name is required.';
  } else {
    const duplicateName = existingPackages.find(
      (item) => item.name?.trim().toLowerCase() === name.toLowerCase()
    );

    if (duplicateName && duplicateName.packageId !== options.currentPackageId) {
      errors.name = 'This package name already exists.';
    }
  }

  if (!isRequired(category)) {
    errors.category = 'Please choose a package category.';
  }

  if (!description) {
    errors.description = 'Package description is required.';
  } else if (!hasMinLength(description, 10)) {
    errors.description = 'Package description must contain at least 10 characters.';
  }

  if (!isPositiveNumber(price)) {
    errors.price = 'Price must be a positive number.';
  }

  if (!isPositiveInteger(durationDays)) {
    errors.durationDays = 'Duration days must be at least 1.';
  }

  if (!isNonNegativeInteger(durationNights)) {
    errors.durationNights = 'Duration nights cannot be negative.';
  }

  if (!isPositiveInteger(maxGroupSize)) {
    errors.maxGroupSize = 'Maximum guests must be at least 1.';
  }

  if (!meetingPoint) {
    errors.meetingPoint = 'Meeting point is required.';
  }

  if (!validImages.length) {
    errors.image = 'Please enter at least one image URL.';
  }

  const imageFieldErrors = imageUrls.map((value) => {
    if (!value) {
      return 'Image URL is required.';
    }

    if (!isValidHttpUrl(value)) {
      return 'Image URL must start with http:// or https://';
    }

    return null;
  });

  if (imageFieldErrors.some(Boolean)) {
    errors.imageUrls = imageFieldErrors;
  }

  if (!isNumberInRange(rating, 0, 5)) {
    errors.rating = 'Rating must be between 0 and 5.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export async function fetchAdminPackages(token) {
  try {
    const response = await apiClient.get('/packages', createAuthConfig(token));
    return Array.isArray(response.data) ? response.data.map(normalizePackage) : [];
  } catch (error) {
    throw buildApiError(error, 'Unable to load packages right now.');
  }
}

export async function fetchAdminPackageById(token, packageId) {
  try {
    const response = await apiClient.get(`/packages/${packageId}`, createAuthConfig(token));
    return normalizePackage(response.data);
  } catch (error) {
    throw buildApiError(error, 'Unable to load this package right now.');
  }
}

export async function createAdminPackage(token, payload) {
  try {
    const response = await apiClient.post('/packages', payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to create this package right now.');
  }
}

export async function updateAdminPackage(token, packageId, payload) {
  try {
    const response = await apiClient.put(`/packages/${packageId}`, payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to update this package right now.');
  }
}

export async function deleteAdminPackage(token, packageId) {
  try {
    const response = await apiClient.delete(`/packages/${packageId}`, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to delete this package right now.');
  }
}
