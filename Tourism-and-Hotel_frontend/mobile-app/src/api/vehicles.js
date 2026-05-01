import { isAxiosError } from 'axios';

import { apiClient } from './client';
import { getDefaultImage, resolveMediaCollection, resolveMediaUrl } from '../utils/media';

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

function normalizeVehicle(rawVehicle) {
  const gallery = Array.isArray(rawVehicle?.image)
    ? rawVehicle.image
        .filter((value) => typeof value === 'string' && value.trim())
        .map((value) => resolveMediaUrl(value, getDefaultImage()))
    : [resolveMediaCollection(rawVehicle?.image, getDefaultImage())];

  const availability = rawVehicle?.availability !== false;

  return {
    id: rawVehicle?._id,
    registrationNumber: rawVehicle?.registrationNumber || 'Not provided',
    name: rawVehicle?.name || 'Safari Vehicle',
    type: rawVehicle?.type || 'Safari Vehicle',
    capacity: Number(rawVehicle?.capacity || 0),
    pricePerDay: Number(rawVehicle?.pricePerDay || 0),
    description: rawVehicle?.description || 'No vehicle description available yet.',
    driverName: rawVehicle?.driverName || '',
    driverContact: rawVehicle?.driverContact || '',
    availability,
    availabilityLabel: availability ? 'Available for booking' : 'Currently unavailable',
    imageGallery: gallery.length ? gallery : [getDefaultImage()],
    imageUrl: gallery[0] || getDefaultImage(),
    imageCount: gallery.length,
    raw: rawVehicle,
  };
}

export async function fetchVehicleDetails(vehicleId) {
  try {
    const response = await apiClient.get(`/vehicles/${vehicleId}`);
    return normalizeVehicle(response.data);
  } catch (error) {
    throw buildApiError(error, 'Unable to load this safari vehicle right now.');
  }
}
