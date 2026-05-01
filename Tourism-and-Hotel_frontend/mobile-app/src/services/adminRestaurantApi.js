import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { createAuthConfig } from '../utils/api';
import { getDefaultImage, resolveMediaCollection } from '../utils/media';

export const RESTAURANT_STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

export const RESTAURANT_FORM_STATUS_OPTIONS = RESTAURANT_STATUS_OPTIONS.filter(
  (option) => option.value !== 'all'
);

export const FOOD_AVAILABILITY_OPTIONS = [
  { label: 'All Items', value: 'all' },
  { label: 'Available', value: 'Available' },
  { label: 'Unavailable', value: 'Unavailable' },
];

export const FOOD_FORM_STATUS_OPTIONS = FOOD_AVAILABILITY_OPTIONS.filter(
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

function getStatusMeta(isActive) {
  return isActive !== false
    ? { label: 'Active', variant: 'primary' }
    : { label: 'Inactive', variant: 'danger' };
}

function getAvailabilityMeta(availability) {
  return availability !== false
    ? { label: 'Available', variant: 'primary' }
    : { label: 'Unavailable', variant: 'danger' };
}

export function normalizeRestaurant(rawRestaurant) {
  const images = Array.isArray(rawRestaurant?.image)
    ? rawRestaurant.image
        .filter((image) => typeof image === 'string' && image.trim())
        .map((image) => resolveMediaCollection(image, getDefaultImage()))
    : [];
  const gallery = images.length ? images : [getDefaultImage()];
  const statusMeta = getStatusMeta(rawRestaurant?.isActive);

  return {
    ...rawRestaurant,
    id: rawRestaurant?._id || '',
    name: rawRestaurant?.name || 'Restaurant',
    address: rawRestaurant?.address || 'Address not provided',
    phone: rawRestaurant?.phone || '',
    description: rawRestaurant?.description || '',
    openingHours: rawRestaurant?.openingHours || '',
    menuCount: Number(rawRestaurant?.menuCount || 0),
    foodItemCount: Number(rawRestaurant?.foodItemCount || 0),
    isActive: rawRestaurant?.isActive !== false,
    statusLabel: statusMeta.label,
    statusVariant: statusMeta.variant,
    imageGallery: gallery,
    imageUrl: gallery[0] || getDefaultImage(),
  };
}

export function normalizeMenu(rawMenu) {
  const imageSource =
    Array.isArray(rawMenu?.image) && rawMenu.image.length
      ? rawMenu.image
      : rawMenu?.coverImage || getDefaultImage();

  const imageUrl = resolveMediaCollection(imageSource, getDefaultImage());
  const statusMeta = getStatusMeta(rawMenu?.isActive);

  return {
    ...rawMenu,
    id: rawMenu?._id || '',
    restaurantId: rawMenu?.restaurantId || '',
    name: rawMenu?.name || 'Menu',
    description: rawMenu?.description || '',
    foodItemCount: Number(rawMenu?.foodItemCount || 0),
    isActive: rawMenu?.isActive !== false,
    statusLabel: statusMeta.label,
    statusVariant: statusMeta.variant,
    imageUrl,
    imageGallery: [imageUrl],
  };
}

export function normalizeFoodItem(rawFoodItem) {
  const images = Array.isArray(rawFoodItem?.image)
    ? rawFoodItem.image
        .filter((image) => typeof image === 'string' && image.trim())
        .map((image) => resolveMediaCollection(image, getDefaultImage()))
    : [];
  const gallery = images.length ? images : [getDefaultImage()];
  const statusMeta = getAvailabilityMeta(rawFoodItem?.availability);

  return {
    ...rawFoodItem,
    id: rawFoodItem?._id || '',
    restaurantId: rawFoodItem?.restaurantId || '',
    menuId:
      typeof rawFoodItem?.menuId === 'object' && rawFoodItem?.menuId?._id
        ? rawFoodItem.menuId._id
        : rawFoodItem?.menuId || '',
    menuName:
      typeof rawFoodItem?.menuId === 'object' && rawFoodItem?.menuId?.name
        ? rawFoodItem.menuId.name
        : '',
    name: rawFoodItem?.name || 'Food Item',
    category: rawFoodItem?.category || 'Food Item',
    price: Number(rawFoodItem?.price || 0),
    priceLabel: formatCurrency(rawFoodItem?.price),
    description: rawFoodItem?.description || '',
    preparationTime:
      rawFoodItem?.preparationTime === null || rawFoodItem?.preparationTime === undefined
        ? ''
        : `${rawFoodItem.preparationTime}`,
    availability: rawFoodItem?.availability !== false,
    statusLabel: statusMeta.label,
    statusVariant: statusMeta.variant,
    imageGallery: gallery,
    imageUrl: gallery[0] || getDefaultImage(),
  };
}

export function buildRestaurantPayload(values) {
  return {
    name: `${values.name || ''}`.trim(),
    address: `${values.address || ''}`.trim(),
    phone: `${values.phone || ''}`.trim(),
    description: `${values.description || ''}`.trim(),
    openingHours: `${values.openingHours || ''}`.trim(),
    isActive: `${values.status || 'Active'}`.trim() === 'Active',
    image: normalizeStringArray(values.imageUrls),
  };
}

export function buildMenuPayload(values, restaurantId) {
  return {
    restaurantId,
    name: `${values.name || ''}`.trim(),
    description: `${values.description || ''}`.trim(),
    isActive: `${values.status || 'Active'}`.trim() === 'Active',
    image: normalizeStringArray(values.imageUrls),
  };
}

export function buildFoodItemPayload(values, defaults = {}) {
  const prep = `${values.preparationTime || ''}`.trim();

  return {
    restaurantId: defaults.restaurantId || values.restaurantId,
    menuId: defaults.menuId || values.menuId,
    name: `${values.name || ''}`.trim(),
    category: `${values.category || ''}`.trim(),
    price: Number(values.price || 0),
    description: `${values.description || ''}`.trim(),
    preparationTime: prep ? Number(prep) : null,
    availability: `${values.status || 'Available'}`.trim() === 'Available',
    image: normalizeStringArray(values.imageUrls),
  };
}

export function validateRestaurantForm(values, existingRestaurants = [], options = {}) {
  const errors = {};
  const name = `${values.name || ''}`.trim();
  const address = `${values.address || ''}`.trim();
  const description = `${values.description || ''}`.trim();
  const phone = `${values.phone || ''}`.trim();
  const imageUrls = Array.isArray(values.imageUrls)
    ? values.imageUrls.map((value) => `${value || ''}`.trim())
    : [];

  if (!name) {
    errors.name = 'Restaurant name is required.';
  } else {
    const duplicateRestaurant = existingRestaurants.find(
      (item) => item.name?.trim().toLowerCase() === name.toLowerCase()
    );

    if (duplicateRestaurant && duplicateRestaurant.id !== options.currentRestaurantId) {
      errors.name = 'A restaurant with this name already exists.';
    }
  }

  if (!address) {
    errors.address = 'Address is required.';
  }

  if (!description) {
    errors.description = 'Description is required.';
  }

  if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    errors.phone = 'Phone number is invalid.';
  }

  const imageFieldErrors = imageUrls.map((value) => {
    if (!value) {
      return null;
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

export function validateMenuForm(values, existingMenus = [], options = {}) {
  const errors = {};
  const name = `${values.name || ''}`.trim();
  const imageUrls = Array.isArray(values.imageUrls)
    ? values.imageUrls.map((value) => `${value || ''}`.trim())
    : [];

  if (!name) {
    errors.name = 'Menu name is required.';
  } else {
    const duplicateMenu = existingMenus.find(
      (item) => item.name?.trim().toLowerCase() === name.toLowerCase()
    );

    if (duplicateMenu && duplicateMenu.id !== options.currentMenuId) {
      errors.name = 'A menu with this name already exists.';
    }
  }

  const imageFieldErrors = imageUrls.map((value) => {
    if (!value) {
      return null;
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

export function validateFoodItemForm(values, existingFoodItems = [], options = {}) {
  const errors = {};
  const name = `${values.name || ''}`.trim();
  const category = `${values.category || ''}`.trim();
  const description = `${values.description || ''}`.trim();
  const preparationTime = `${values.preparationTime || ''}`.trim();
  const price = Number(values.price);
  const imageUrls = Array.isArray(values.imageUrls)
    ? values.imageUrls.map((value) => `${value || ''}`.trim())
    : [];

  if (!name) {
    errors.name = 'Food item name is required.';
  } else {
    const duplicateFoodItem = existingFoodItems.find(
      (item) => item.name?.trim().toLowerCase() === name.toLowerCase()
    );

    if (duplicateFoodItem && duplicateFoodItem.id !== options.currentFoodItemId) {
      errors.name = 'A food item with this name already exists in this menu.';
    }
  }

  if (!category) {
    errors.category = 'Category is required.';
  }

  if (!Number.isFinite(price) || price <= 0) {
    errors.price = 'Price must be a positive number.';
  }

  if (!description) {
    errors.description = 'Description is required.';
  }

  if (preparationTime && (!Number.isFinite(Number(preparationTime)) || Number(preparationTime) < 0)) {
    errors.preparationTime = 'Preparation time must be zero or a positive number.';
  }

  const imageFieldErrors = imageUrls.map((value) => {
    if (!value) {
      return null;
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

export async function fetchAdminRestaurants(token) {
  try {
    const response = await apiClient.get('/restaurants', createAuthConfig(token));
    return Array.isArray(response.data) ? response.data.map(normalizeRestaurant) : [];
  } catch (error) {
    throw buildApiError(error, 'Unable to load restaurants right now.');
  }
}

export async function fetchAdminRestaurantById(token, id) {
  try {
    const response = await apiClient.get(`/restaurants/${id}`, createAuthConfig(token));
    return normalizeRestaurant(response.data);
  } catch (error) {
    throw buildApiError(error, 'Unable to load this restaurant right now.');
  }
}

export async function createAdminRestaurant(token, payload) {
  try {
    const response = await apiClient.post('/restaurants', payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to create this restaurant right now.');
  }
}

export async function updateAdminRestaurant(token, id, payload) {
  try {
    const response = await apiClient.put(`/restaurants/${id}`, payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to update this restaurant right now.');
  }
}

export async function deleteAdminRestaurant(token, id) {
  try {
    const response = await apiClient.delete(`/restaurants/${id}`, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to delete this restaurant right now.');
  }
}

export async function fetchAdminMenusByRestaurant(token, restaurantId) {
  try {
    const response = await apiClient.get(
      `/restaurants/${restaurantId}/menus`,
      createAuthConfig(token)
    );
    return Array.isArray(response.data) ? response.data.map(normalizeMenu) : [];
  } catch (error) {
    throw buildApiError(error, 'Unable to load menus right now.');
  }
}

export async function fetchAdminMenuById(token, id) {
  try {
    const response = await apiClient.get(`/restaurants/menus/${id}`, createAuthConfig(token));
    return normalizeMenu(response.data);
  } catch (error) {
    throw buildApiError(error, 'Unable to load this menu right now.');
  }
}

export async function createAdminMenu(token, restaurantId, payload) {
  try {
    const response = await apiClient.post(
      `/restaurants/${restaurantId}/menus`,
      payload,
      createAuthConfig(token)
    );
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to create this menu right now.');
  }
}

export async function updateAdminMenu(token, id, payload) {
  try {
    const response = await apiClient.put(`/restaurants/menus/${id}`, payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to update this menu right now.');
  }
}

export async function deleteAdminMenu(token, id) {
  try {
    const response = await apiClient.delete(`/restaurants/menus/${id}`, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to delete this menu right now.');
  }
}

export async function fetchAdminFoodItemsByMenu(token, menuId) {
  try {
    const response = await apiClient.get(
      `/restaurants/menus/${menuId}/fooditems`,
      createAuthConfig(token)
    );
    return Array.isArray(response.data) ? response.data.map(normalizeFoodItem) : [];
  } catch (error) {
    throw buildApiError(error, 'Unable to load food items right now.');
  }
}

export async function fetchAdminFoodItemById(token, id) {
  try {
    const response = await apiClient.get(`/restaurants/fooditems/${id}`, createAuthConfig(token));
    return normalizeFoodItem(response.data);
  } catch (error) {
    throw buildApiError(error, 'Unable to load this food item right now.');
  }
}

export async function createAdminFoodItem(token, payload) {
  try {
    const response = await apiClient.post('/restaurants/fooditems', payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to create this food item right now.');
  }
}

export async function updateAdminFoodItem(token, id, payload) {
  try {
    const response = await apiClient.put(`/restaurants/fooditems/${id}`, payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to update this food item right now.');
  }
}

export async function deleteAdminFoodItem(token, id) {
  try {
    const response = await apiClient.delete(`/restaurants/fooditems/${id}`, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to delete this food item right now.');
  }
}
