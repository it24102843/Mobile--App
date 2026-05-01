import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { createAuthConfig } from '../utils/api';
import { getDefaultImage, resolveMediaCollection, resolveMediaUrl } from '../utils/media';
import { getStockMeta } from '../utils/gearRental';
import {
  hasMinLength,
  isNonNegativeInteger,
  isPositiveNumber,
  isRequired,
  isValidHttpUrl,
} from '../utils/validation';

export const EQUIPMENT_CATEGORIES = ['camp', 'tools', 'travel'];

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

function formatCurrency(value) {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value) || 0)}`;
}

export function normalizeEquipment(rawProduct) {
  const stockCount = Number(rawProduct?.stockCount || 0);
  const stockMeta = getStockMeta(stockCount);
  const gallery = Array.isArray(rawProduct?.image)
    ? rawProduct.image
        .filter((value) => typeof value === 'string' && value.trim())
        .map((value) => resolveMediaUrl(value, getDefaultImage()))
    : [resolveMediaCollection(rawProduct?.image, getDefaultImage())];

  const availability = rawProduct?.availability !== false && stockCount > 0;

  return {
    ...rawProduct,
    key: rawProduct?.key || '',
    name: rawProduct?.name || '',
    category: rawProduct?.category || 'uncategorized',
    description: rawProduct?.description || '',
    dailyRentalprice: Number(rawProduct?.dailyRentalprice || 0),
    stockCount,
    availability,
    availabilityLabel: availability ? 'Available' : 'Out of stock',
    availabilityVariant: availability ? 'success' : 'danger',
    stockLabel: stockMeta.label,
    stockVariant: stockMeta.variant,
    priceLabel: `${formatCurrency(rawProduct?.dailyRentalprice)} / day`,
    imageGallery: gallery.length ? gallery : [getDefaultImage()],
    imageUrl: gallery[0] || getDefaultImage(),
  };
}

export function buildEquipmentPayload(values, options = {}) {
  const stockCount = Number(values.stockCount || 0);
  const image = Array.isArray(values.imageUrls)
    ? values.imageUrls.filter((value) => typeof value === 'string' && value.trim())
    : [];

  return {
    key: options.lockKey ? options.existingKey : `${values.key || ''}`.trim(),
    name: `${values.name || ''}`.trim(),
    dailyRentalprice: Number(values.dailyRentalprice || 0),
    stockCount,
    category: `${values.category || ''}`.trim(),
    description: `${values.description || ''}`.trim(),
    image,
    availability: stockCount > 0,
    isRentable: true,
    pickupLocation: `${values.pickupLocation || 'Kataragama'}`.trim(),
  };
}

export function validateEquipmentForm(values, existingItems = [], options = {}) {
  const errors = {};
  const normalizedKey = `${values.key || ''}`.trim();
  const normalizedName = `${values.name || ''}`.trim();
  const normalizedCategory = `${values.category || ''}`.trim();
  const normalizedDescription = `${values.description || ''}`.trim();
  const price = Number(values.dailyRentalprice);
  const stockCount = Number(values.stockCount);
  const imageUrls = Array.isArray(values.imageUrls)
    ? values.imageUrls.map((value) => `${value || ''}`.trim())
    : [];
  const validImages = imageUrls.filter(Boolean);

  if (!normalizedKey) {
    errors.key = 'Equipment key is required.';
  } else if (!options.allowDuplicateKey) {
    const duplicate = existingItems.find(
      (item) => item.key?.toLowerCase() === normalizedKey.toLowerCase()
    );

    if (duplicate && duplicate.key !== options.currentKey) {
      errors.key = 'This equipment key already exists.';
    }
  }

  if (!normalizedName) {
    errors.name = 'Equipment name is required.';
  }

  if (!isPositiveNumber(price)) {
    errors.dailyRentalprice = 'Price per day must be a positive number.';
  }

  if (!isNonNegativeInteger(stockCount)) {
    errors.stockCount = 'Stock count cannot be negative.';
  }

  if (!isRequired(normalizedCategory)) {
    errors.category = 'Please choose a category.';
  }

  if (!normalizedDescription) {
    errors.description = 'Description is required.';
  } else if (!hasMinLength(normalizedDescription, 10)) {
    errors.description = 'Description must contain at least 10 characters.';
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

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export async function fetchAdminEquipment(token) {
  try {
    const response = await apiClient.get('/products', createAuthConfig(token));
    return Array.isArray(response.data)
      ? response.data.map(normalizeEquipment)
      : [];
  } catch (error) {
    throw buildApiError(error, 'Unable to load equipment right now.');
  }
}

export async function fetchAdminEquipmentByKey(token, key) {
  try {
    const response = await apiClient.get(`/products/${key}`, createAuthConfig(token));
    return normalizeEquipment(response.data);
  } catch (error) {
    throw buildApiError(error, 'Unable to load this equipment item right now.');
  }
}

export async function createAdminEquipment(token, payload) {
  try {
    const response = await apiClient.post('/products', payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to create this equipment item right now.');
  }
}

export async function updateAdminEquipment(token, key, payload) {
  try {
    const response = await apiClient.put(`/products/${key}`, payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to update this equipment item right now.');
  }
}

export async function deleteAdminEquipment(token, key) {
  try {
    const response = await apiClient.delete(`/products/${key}`, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to delete this equipment item right now.');
  }
}
