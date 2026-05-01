import { apiClient } from './client';
import {
  fetchHomeGear,
  fetchHomePackages,
  fetchHomePlaces,
  fetchHomeReviews,
  fetchHomeRooms,
  fetchHomeVehicles,
} from './home';
import { getDefaultImage, resolveMediaCollection, resolveMediaUrl } from '../utils/media';

function shorten(text, maxLength = 110) {
  if (!text) {
    return '';
  }

  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

function formatCurrency(value, suffix = '') {
  if (typeof value !== 'number') {
    return null;
  }

  return `LKR ${new Intl.NumberFormat('en-LK').format(value)}${suffix}`;
}

export async function fetchRoomsCatalog() {
  return fetchHomeRooms();
}

export async function fetchPackagesCatalog() {
  return fetchHomePackages();
}

export async function fetchVehiclesCatalog() {
  return fetchHomeVehicles();
}

export async function fetchGearCatalog() {
  return fetchHomeGear();
}

export async function fetchReviewsCatalog() {
  return fetchHomeReviews();
}

export async function fetchHotelsCatalog() {
  return fetchHomePlaces();
}

export async function fetchRestaurantsCatalog() {
  const response = await apiClient.get('/restaurants');

  return response.data.map((restaurant) => ({
    id: restaurant._id,
    title: restaurant.name,
    subtitle: restaurant.address,
    description: shorten(restaurant.description),
    imageUrl: resolveMediaCollection(restaurant.image, getDefaultImage()),
    priceLabel: restaurant.openingHours || 'Open for dining',
    badgeLabel: 'Restaurant',
    badgeVariant: 'accent',
    metaLabel: restaurant.phone || 'WildHaven dining',
  }));
}

export async function fetchRoomByKey(key) {
  const response = await apiClient.get(`/rooms/${key}`);
  return response.data;
}

export async function fetchPackageById(packageId) {
  const response = await apiClient.get(`/packages/${packageId}`);
  return response.data;
}

export async function fetchVehicleById(id) {
  const response = await apiClient.get(`/vehicles/${id}`);
  return response.data;
}

export async function fetchProductByKey(key) {
  const response = await apiClient.get(`/products/${key}`);
  return response.data;
}

export async function fetchRestaurantById(id) {
  const response = await apiClient.get(`/restaurants/${id}`);
  return response.data;
}

export function normalizeBookingItem(type, rawItem) {
  switch (type) {
    case 'room':
      return {
        id: rawItem.key,
        title: `${rawItem.roomType} Room`,
        subtitle: rawItem.hotelName,
        description: rawItem.description,
        imageUrl: resolveMediaCollection(rawItem.images),
        priceLabel: formatCurrency(rawItem.price, ' / night'),
      };
    case 'package':
      return {
        id: rawItem.packageId,
        title: rawItem.name,
        subtitle: rawItem.category,
        description: rawItem.description,
        imageUrl: resolveMediaCollection(rawItem.images),
        priceLabel: formatCurrency(rawItem.price, ' / person'),
      };
    case 'vehicle':
      return {
        id: rawItem._id,
        title: rawItem.name,
        subtitle: rawItem.type,
        description: rawItem.description,
        imageUrl: resolveMediaCollection(rawItem.image, getDefaultImage()),
        priceLabel: formatCurrency(rawItem.pricePerDay, ' / day'),
      };
    case 'gear':
      return {
        id: rawItem.key,
        title: rawItem.name,
        subtitle: rawItem.category,
        description: rawItem.description,
        imageUrl: resolveMediaCollection(rawItem.image),
        priceLabel: formatCurrency(rawItem.dailyRentalprice, ' / day'),
      };
    default:
      return {
        id: rawItem._id || rawItem.id,
        title: rawItem.name || rawItem.title || 'Selected item',
        subtitle: '',
        description: '',
        imageUrl: resolveMediaUrl(''),
        priceLabel: null,
      };
  }
}
