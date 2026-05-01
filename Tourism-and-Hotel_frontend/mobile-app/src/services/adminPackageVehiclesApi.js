import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { createAuthConfig } from '../utils/api';
import { getDefaultImage, resolveMediaCollection } from '../utils/media';

export const PACKAGE_VEHICLE_TYPES = [
  'Mahindra Jeep',
  'Toyota Hilux',
  'Safari Jeep',
  'Land Cruiser',
  'Minibus',
  'Van',
];

export const PACKAGE_VEHICLE_TYPE_FILTERS = [
  { label: 'All Types', value: 'all' },
  ...PACKAGE_VEHICLE_TYPES.map((type) => ({ label: type, value: type })),
];

export const PACKAGE_VEHICLE_STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Available', value: 'Available' },
  { label: 'On Trip', value: 'On Trip' },
  { label: 'Maintenance', value: 'Maintenance' },
];

export const PACKAGE_VEHICLE_FORM_STATUS_OPTIONS = PACKAGE_VEHICLE_STATUS_OPTIONS.filter(
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

function getStatusMeta(status) {
  switch (`${status || ''}`.trim().toLowerCase()) {
    case 'maintenance':
      return { label: 'Maintenance', variant: 'danger' };
    case 'on trip':
      return { label: 'On Trip', variant: 'warning' };
    default:
      return { label: 'Available', variant: 'primary' };
  }
}

export function normalizePackageVehicle(rawVehicle) {
  const images = Array.isArray(rawVehicle?.images)
    ? rawVehicle.images
        .filter((image) => typeof image === 'string' && image.trim())
        .map((image) => resolveMediaCollection(image, getDefaultImage()))
    : [];
  const statusMeta = getStatusMeta(rawVehicle?.status);
  const imageGallery = images.length ? images : [getDefaultImage()];

  return {
    ...rawVehicle,
    vehicleId: rawVehicle?.vehicleId || '',
    name: rawVehicle?.name || '',
    driverName: rawVehicle?.driverName || 'Driver not assigned',
    driverPhone: rawVehicle?.driverPhone || '',
    type: rawVehicle?.type || 'Vehicle',
    registrationNumber: rawVehicle?.registrationNumber || '',
    capacity: Number(rawVehicle?.capacity || 0),
    capacityLabel: `${Number(rawVehicle?.capacity || 0)} seats`,
    pricePerDay: Number(rawVehicle?.pricePerDay || 0),
    pricePerDayLabel: `${formatCurrency(rawVehicle?.pricePerDay)} / day`,
    status: statusMeta.label,
    statusLabel: statusMeta.label,
    statusVariant: statusMeta.variant,
    description: rawVehicle?.description || '',
    imageGallery,
    imageUrl: imageGallery[0] || getDefaultImage(),
    availability: rawVehicle?.availability !== false,
    assignedPackages: normalizeStringArray(rawVehicle?.assignedPackages),
    features: rawVehicle?.features || {},
  };
}

export function buildPackageVehiclePayload(values, options = {}) {
  const imageUrls = Array.isArray(values.imageUrls)
    ? values.imageUrls.filter((value) => `${value || ''}`.trim())
    : [];

  return {
    vehicleId: options.lockVehicleId ? options.existingVehicleId : undefined,
    name: `${values.name || ''}`.trim(),
    driverName: `${values.driverName || ''}`.trim(),
    driverPhone: `${values.driverPhone || ''}`.trim(),
    type: `${values.type || ''}`.trim(),
    registrationNumber: `${values.registrationNumber || ''}`.trim(),
    capacity: Number(values.capacity || 0),
    pricePerDay: Number(values.pricePerDay || 0),
    status: `${values.status || 'Available'}`.trim(),
    availability: `${values.status || 'Available'}`.trim() === 'Available',
    description: `${values.description || ''}`.trim(),
    images: imageUrls,
    assignedPackages: normalizeStringArray(values.assignedPackages),
    features: {
      ac: Boolean(values.ac),
      openRoof: Boolean(values.openRoof),
      fourWheelDrive: Boolean(values.fourWheelDrive),
      wifi: Boolean(values.wifi),
      firstAidKit: values.firstAidKit !== false,
      coolerBox: Boolean(values.coolerBox),
    },
  };
}

export function validatePackageVehicleForm(values, existingVehicles = [], options = {}) {
  const errors = {};
  const name = `${values.name || ''}`.trim();
  const driverName = `${values.driverName || ''}`.trim();
  const type = `${values.type || ''}`.trim();
  const registrationNumber = `${values.registrationNumber || ''}`.trim();
  const status = `${values.status || ''}`.trim();
  const capacity = Number(values.capacity);
  const pricePerDay = Number(values.pricePerDay);
  const imageUrls = Array.isArray(values.imageUrls)
    ? values.imageUrls.map((value) => `${value || ''}`.trim())
    : [];
  const validImages = imageUrls.filter(Boolean);

  if (!name) {
    errors.name = 'Vehicle name is required.';
  }

  if (!driverName) {
    errors.driverName = 'Driver name is required.';
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

    if (duplicateRegistration && duplicateRegistration.vehicleId !== options.currentVehicleId) {
      errors.registrationNumber = 'This registration number already exists.';
    }
  }

  if (!Number.isInteger(capacity) || capacity <= 0) {
    errors.capacity = 'Capacity must be a positive whole number.';
  }

  if (!Number.isFinite(pricePerDay) || pricePerDay <= 0) {
    errors.pricePerDay = 'Price per day must be a positive number.';
  }

  if (!status) {
    errors.status = 'Vehicle status is required.';
  }

  if (!validImages.length) {
    errors.image = 'Please enter at least one image URL.';
  }

  const imageFieldErrors = imageUrls.map((value) => {
    if (!value) {
      return 'Image URL is required.';
    }

    if (!/^https?:\/\//i.test(value)) {
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

export async function fetchAdminPackageVehicles(token) {
  try {
    const response = await apiClient.get('/package-vehicles', createAuthConfig(token));
    return Array.isArray(response.data) ? response.data.map(normalizePackageVehicle) : [];
  } catch (error) {
    throw buildApiError(error, 'Unable to load package vehicles right now.');
  }
}

export async function fetchAdminPackageVehicleById(token, vehicleId) {
  try {
    const response = await apiClient.get(
      `/package-vehicles/${vehicleId}`,
      createAuthConfig(token)
    );
    return normalizePackageVehicle(response.data);
  } catch (error) {
    throw buildApiError(error, 'Unable to load this package vehicle right now.');
  }
}

export async function createAdminPackageVehicle(token, payload) {
  try {
    const response = await apiClient.post(
      '/package-vehicles',
      payload,
      createAuthConfig(token)
    );
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to create this package vehicle right now.');
  }
}

export async function updateAdminPackageVehicle(token, vehicleId, payload) {
  try {
    const response = await apiClient.put(
      `/package-vehicles/${vehicleId}`,
      payload,
      createAuthConfig(token)
    );
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to update this package vehicle right now.');
  }
}

export async function deleteAdminPackageVehicle(token, vehicleId) {
  try {
    const response = await apiClient.delete(
      `/package-vehicles/${vehicleId}`,
      createAuthConfig(token)
    );
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to delete this package vehicle right now.');
  }
}
