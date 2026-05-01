import { isAxiosError } from 'axios';

import { apiClient } from './client';
import { createAuthConfig } from '../utils/api';
import { getDefaultImage, resolveMediaCollection, resolveMediaUrl } from '../utils/media';
import { getStockMeta } from '../utils/gearRental';

function buildApiError(error, fallbackMessage) {
  if (isAxiosError(error)) {
    if (!error.response) {
      return new Error(
        'Unable to reach the backend. Make sure your mobile API URL points to your running server, not localhost.'
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

function normalizeGearProduct(rawProduct) {
  const stockCount = Number(rawProduct?.stockCount || 0);
  const stockMeta = getStockMeta(stockCount);
  const availabilityFlag = rawProduct?.availability !== false;
  const isRentable = rawProduct?.isRentable !== false;
  const gallery = Array.isArray(rawProduct?.image)
    ? rawProduct.image
        .filter((value) => typeof value === 'string' && value.trim())
        .map((value) => resolveMediaUrl(value, getDefaultImage()))
    : [resolveMediaCollection(rawProduct?.image, getDefaultImage())];

  return {
    key: rawProduct.key,
    id: rawProduct.key,
    name: rawProduct.name,
    title: rawProduct.name,
    description: rawProduct.description,
    category: rawProduct.category || 'Equipment',
    stockCount,
    availability: availabilityFlag && stockCount > 0 && isRentable,
    availabilityFlag,
    isRentable,
    pickupLocation: rawProduct.pickupLocation || 'WildHaven pickup point',
    dailyRentalprice: Number(rawProduct.dailyRentalprice || 0),
    imageUrl: gallery[0] || getDefaultImage(),
    imageGallery: gallery.length ? gallery : [getDefaultImage()],
    imageCount: gallery.length,
    stockLabel: stockMeta.label,
    stockVariant: stockMeta.variant,
    availabilityLabel:
      availabilityFlag && stockCount > 0 && isRentable
        ? 'Available for rental'
        : stockCount <= 0
          ? 'Out of stock'
          : availabilityFlag
            ? 'Rental unavailable'
            : 'Currently unavailable',
    rentableLabel: isRentable ? 'Rentable item' : 'Not rentable',
    raw: rawProduct,
  };
}

export async function fetchGearProducts() {
  try {
    const response = await apiClient.get('/products');

    return response.data
      .filter((product) => product.isRentable !== false)
      .map(normalizeGearProduct);
  } catch (error) {
    throw buildApiError(error, 'Unable to load rental products right now.');
  }
}

export async function fetchGearProductDetails(productKey) {
  try {
    const response = await apiClient.get(`/products/${productKey}`);
    return normalizeGearProduct(response.data);
  } catch (error) {
    throw buildApiError(error, 'Unable to load this rental product right now.');
  }
}

export async function requestGearQuote(payload) {
  try {
    const response = await apiClient.post('/orders/quote', payload);
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to calculate the rental quote right now.');
  }
}

export async function createGearRentalOrder(token, payload) {
  try {
    const response = await apiClient.post('/orders', payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to create the rental booking right now.');
  }
}

export async function fetchGearOrderById(token, orderId) {
  try {
    const response = await apiClient.get(`/orders/${orderId}`, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to load this rental order right now.');
  }
}
