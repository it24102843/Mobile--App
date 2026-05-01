import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import {
  getDefaultImage,
  resolveMediaCollection,
  resolveMediaUrl,
} from '../utils/media';

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

function formatCurrency(value, suffix = '') {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value || 0))}${suffix}`;
}

function normalizeGallery(values) {
  if (Array.isArray(values)) {
    const gallery = values
      .filter((value) => typeof value === 'string' && value.trim())
      .map((value) => resolveMediaUrl(value, getDefaultImage()));

    return gallery.length ? gallery : [getDefaultImage()];
  }

  return [resolveMediaCollection(values, getDefaultImage())];
}

export function normalizeVehicle(rawVehicle) {
  const imageGallery = normalizeGallery(rawVehicle?.image);
  const capacity = Number(rawVehicle?.capacity || 0);
  const pricePerDay = Number(rawVehicle?.pricePerDay || 0);
  const availability = rawVehicle?.availability !== false;

  return {
    id: rawVehicle?._id || rawVehicle?.registrationNumber || '',
    title: rawVehicle?.name || 'Safari Vehicle',
    name: rawVehicle?.name || 'Safari Vehicle',
    subtitle: rawVehicle?.type || 'Safari Vehicle',
    type: rawVehicle?.type || 'Safari Vehicle',
    typeLabel: rawVehicle?.type || 'Safari Vehicle',
    registrationNumber: rawVehicle?.registrationNumber || 'Not assigned',
    description:
      rawVehicle?.description || 'No safari vehicle description is available yet.',
    capacity,
    capacityLabel: capacity
      ? `${capacity} seat${capacity === 1 ? '' : 's'}`
      : 'Capacity not listed',
    pricePerDay,
    pricePerDayLabel: formatCurrency(pricePerDay, ' / day'),
    driverName: rawVehicle?.driverName || '',
    driverContact: rawVehicle?.driverContact || '',
    driverLabel: rawVehicle?.driverName
      ? `Driver: ${rawVehicle.driverName}`
      : 'Driver details not assigned',
    availability,
    availabilityLabel: availability ? 'Available' : 'Unavailable',
    imageUrl: imageGallery[0] || getDefaultImage(),
    imageGallery,
    imageCount: imageGallery.length,
    raw: rawVehicle,
  };
}

export async function fetchVehicles() {
  try {
    const response = await apiClient.get('/vehicles');

    return (response.data || [])
      .map(normalizeVehicle)
      .sort((left, right) => {
        if (left.availability !== right.availability) {
          return Number(right.availability) - Number(left.availability);
        }

        return left.title.localeCompare(right.title);
      });
  } catch (error) {
    throw buildApiError(
      error,
      'Unable to load safari vehicles right now.'
    );
  }
}

export async function fetchVehicleById(vehicleId) {
  try {
    const response = await apiClient.get(`/vehicles/${vehicleId}`);
    return normalizeVehicle(response.data);
  } catch (error) {
    throw buildApiError(
      error,
      'Unable to load this safari vehicle right now.'
    );
  }
}
