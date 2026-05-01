import { apiClient } from './client';
import { getDefaultImage, resolveMediaCollection } from '../utils/media';

function shorten(text, maxLength = 110) {
  if (!text) {
    return '';
  }

  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

function formatCurrency(value) {
  if (typeof value !== 'number') {
    return null;
  }

  return `LKR ${new Intl.NumberFormat('en-LK').format(value)}`;
}

export function normalizeRestaurantCatalogItem(restaurant) {
  return {
    id: restaurant._id,
    title: restaurant.name,
    subtitle: restaurant.address,
    description: shorten(restaurant.description),
    imageUrl: resolveMediaCollection(restaurant.image, getDefaultImage()),
    priceLabel: restaurant.openingHours || 'Open for dining',
    badgeLabel: 'Restaurant',
    badgeVariant: 'accent',
    metaLabel: restaurant.phone || 'WildHaven dining',
    raw: restaurant,
  };
}

export function normalizeRestaurantMenuCatalogItem(menu) {
  const menuImageSource =
    Array.isArray(menu.image) && menu.image.length
      ? menu.image
      : menu.coverImage || getDefaultImage();

  return {
    id: menu._id,
    title: menu.name,
    subtitle: 'Restaurant Menu',
    description: shorten(menu.description || 'Explore the dishes available in this menu.'),
    imageUrl: resolveMediaCollection(menuImageSource, getDefaultImage()),
    priceLabel: 'Browse food items',
    badgeLabel: 'Menu',
    badgeVariant: 'info',
    metaLabel: menu.isActive === false ? 'Currently unavailable' : 'Available now',
    raw: menu,
  };
}

export function normalizeFoodItemCatalogItem(foodItem) {
  return {
    id: foodItem._id,
    title: foodItem.name,
    subtitle: foodItem.category || 'Food Item',
    description: shorten(foodItem.description),
    imageUrl: resolveMediaCollection(foodItem.image, getDefaultImage()),
    priceLabel: formatCurrency(foodItem.price),
    badgeLabel: foodItem.availability ? 'Available' : 'Unavailable',
    badgeVariant: foodItem.availability ? 'primary' : 'danger',
    metaLabel: foodItem.preparationTime
      ? `${foodItem.preparationTime} min preparation`
      : 'Prepared fresh',
    raw: foodItem,
  };
}

export async function fetchRestaurantsCatalog() {
  const response = await apiClient.get('/restaurants');

  return response.data.map(normalizeRestaurantCatalogItem);
}

export async function fetchRestaurantMenusCatalog(restaurantId) {
  const response = await apiClient.get(`/restaurants/${restaurantId}/menus`);

  return response.data.map(normalizeRestaurantMenuCatalogItem);
}

export async function fetchMenuFoodItemsCatalog(menuId) {
  const response = await apiClient.get(`/restaurants/menus/${menuId}/fooditems`);

  return response.data.map(normalizeFoodItemCatalogItem);
}

export async function fetchRestaurantById(restaurantId) {
  const response = await apiClient.get(`/restaurants/${restaurantId}`);
  return response.data;
}

export async function fetchRestaurantFoodItemById(foodItemId) {
  const response = await apiClient.get(`/restaurants/fooditems/${foodItemId}`);
  return response.data;
}
