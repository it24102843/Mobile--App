import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { getDefaultImage, resolveMediaCollection, resolveMediaUrl } from '../utils/media';

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

function shorten(text, maxLength = 128) {
  if (!text) {
    return '';
  }

  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

function formatCurrency(value, suffix = '') {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value || 0))}${suffix}`;
}

function buildDurationLabel(duration) {
  const days = Number(duration?.days || 0);
  const nights = Number(duration?.nights || 0);

  if (!days && !nights) {
    return 'Duration shared on confirmation';
  }

  if (days && nights) {
    return `${days} day${days > 1 ? 's' : ''} / ${nights} night${nights > 1 ? 's' : ''}`;
  }

  if (days) {
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  return `${nights} night${nights > 1 ? 's' : ''}`;
}

export function normalizePackage(rawPackage) {
  const rawImages = Array.isArray(rawPackage?.images)
    ? rawPackage.images.filter((image) => typeof image === 'string' && image.trim())
    : [];

  const gallery = rawImages.length
    ? rawImages.map((image) => resolveMediaUrl(image, getDefaultImage()))
    : [getDefaultImage()];

  const maxGroupSize = Number(rawPackage?.maxGroupSize || 0);
  const meetingPoint = rawPackage?.meetingPoint?.trim() || 'Sri Lanka';
  const category = rawPackage?.category?.trim() || 'Package';
  const price = Number(rawPackage?.price || 0);

  return {
    ...rawPackage,
    id: rawPackage?.packageId || rawPackage?._id || '',
    packageId: rawPackage?.packageId || rawPackage?._id || '',
    title: rawPackage?.name?.trim() || 'WildHaven Package',
    category,
    description: rawPackage?.description?.trim() || 'Package description is not available yet.',
    descriptionPreview: shorten(rawPackage?.description?.trim() || ''),
    imageUrl: resolveMediaCollection(rawPackage?.images, getDefaultImage()),
    gallery,
    durationLabel: buildDurationLabel(rawPackage?.duration),
    durationMeta: buildDurationLabel(rawPackage?.duration),
    maxGuestsLabel: maxGroupSize ? `${maxGroupSize} people max` : 'Guest count on request',
    maxGroupSize,
    locationLabel: meetingPoint,
    meetingPoint,
    availability: Boolean(rawPackage?.availability),
    availabilityLabel: rawPackage?.availability ? 'Available' : 'Unavailable',
    price,
    priceLabel: formatCurrency(price, ' / person'),
    priceOnlyLabel: formatCurrency(price),
    highlights: Array.isArray(rawPackage?.highlights) ? rawPackage.highlights.filter(Boolean) : [],
    includes: Array.isArray(rawPackage?.includes) ? rawPackage.includes.filter(Boolean) : [],
    excludes: Array.isArray(rawPackage?.excludes) ? rawPackage.excludes.filter(Boolean) : [],
    customizationEnabled: Boolean(rawPackage?.customizationEnabled),
    rating: Number(rawPackage?.rating || 0),
  };
}

export function normalizePackageVehicle(rawVehicle) {
  const features = [];

  if (rawVehicle?.features?.openRoof) {
    features.push('Open Roof');
  }
  if (rawVehicle?.features?.fourWheelDrive) {
    features.push('4WD');
  }
  if (rawVehicle?.features?.wifi) {
    features.push('WiFi');
  }
  if (rawVehicle?.features?.firstAidKit) {
    features.push('First Aid');
  }
  if (rawVehicle?.features?.coolerBox) {
    features.push('Cooler Box');
  }
  if (rawVehicle?.features?.ac) {
    features.push('AC');
  }

  return {
    ...rawVehicle,
    id: rawVehicle?.vehicleId || rawVehicle?._id || '',
    vehicleId: rawVehicle?.vehicleId || rawVehicle?._id || '',
    title: rawVehicle?.name?.trim() || 'Package Vehicle',
    typeLabel: rawVehicle?.type?.trim() || 'Vehicle',
    capacityLabel: `${Number(rawVehicle?.capacity || 0)} seats`,
    imageUrl: resolveMediaCollection(rawVehicle?.images, getDefaultImage()),
    pricePerDay: Number(rawVehicle?.pricePerDay || 0),
    pricePerDayLabel: formatCurrency(rawVehicle?.pricePerDay, ' / day'),
    status: rawVehicle?.status || 'Available',
    features,
    driverName: rawVehicle?.driverName?.trim() || '',
  };
}

function normalizeAssignedPackageValues(value) {
  if (Array.isArray(value)) {
    return value.map((item) => `${item || ''}`.trim().toLowerCase()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
}

function vehicleMatchesPackage(vehicle, packageId, packageName) {
  const assignedPackages = normalizeAssignedPackageValues(vehicle?.assignedPackages);

  if (!assignedPackages.length) {
    return true;
  }

  const matchValues = [`${packageId || ''}`.trim().toLowerCase(), `${packageName || ''}`.trim().toLowerCase()].filter(Boolean);

  return assignedPackages.some((item) => matchValues.includes(item));
}

export function normalizePackageAddon(rawAddon) {
  const category = rawAddon?.category?.trim() || 'Add-on';
  const price = Number(rawAddon?.price || 0);

  return {
    ...rawAddon,
    id: rawAddon?.addonId || rawAddon?._id || '',
    addonId: rawAddon?.addonId || rawAddon?._id || '',
    title: rawAddon?.name?.trim() || 'Optional Extra',
    category,
    description: rawAddon?.description?.trim() || 'Optional enhancement for your package booking.',
    price,
    priceLabel: formatCurrency(price),
  };
}

export async function fetchPackages() {
  try {
    const response = await apiClient.get('/packages');
    return (response.data || []).map(normalizePackage);
  } catch (error) {
    throw buildApiError(error, 'Unable to load packages right now.');
  }
}

export async function fetchPackageById(packageId) {
  try {
    const response = await apiClient.get(`/packages/${packageId}`);
    return normalizePackage(response.data);
  } catch (error) {
    throw buildApiError(error, 'Unable to load this package right now.');
  }
}

export async function fetchPackageVehicles(packageId, packageName = '') {
  try {
    const response = await apiClient.get('/package-vehicles', {
      params: {
        packageId,
      },
    });

    const normalizedVehicles = Array.isArray(response.data)
      ? response.data.map(normalizePackageVehicle)
      : [];

    if (normalizedVehicles.length > 0) {
      return normalizedVehicles;
    }

    const fallbackResponse = await apiClient.get('/package-vehicles');
    const fallbackVehicles = Array.isArray(fallbackResponse.data)
      ? fallbackResponse.data.map(normalizePackageVehicle)
      : [];

    const matchedVehicles = fallbackVehicles.filter((vehicle) =>
      vehicleMatchesPackage(vehicle, packageId, packageName)
    );

    return matchedVehicles.length > 0 ? matchedVehicles : fallbackVehicles;
  } catch (error) {
    throw buildApiError(error, 'Unable to load package vehicles right now.');
  }
}

export async function fetchPackageAddOns() {
  try {
    const response = await apiClient.get('/addons');
    return (response.data || []).map(normalizePackageAddon);
  } catch (error) {
    throw buildApiError(error, 'Unable to load package add-ons right now.');
  }
}
