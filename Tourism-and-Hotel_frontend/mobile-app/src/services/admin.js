import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { API_BASE_URL } from '../config/env';
import { createAuthConfig } from '../utils/api';

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

function extractArray(result, selector) {
  if (result.status !== 'fulfilled') {
    return [];
  }

  const value = selector ? selector(result.value.data) : result.value.data;
  return Array.isArray(value) ? value : [];
}

function sumBy(items, selector) {
  return items.reduce((total, item) => total + (Number(selector(item)) || 0), 0);
}

function isConfirmedStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ['confirmed', 'completed', 'approved', 'verified'].includes(normalized);
}

async function fetchRestaurantItemCount(restaurants, authConfig) {
  if (!Array.isArray(restaurants) || restaurants.length === 0) {
    return 0;
  }

  const results = await Promise.allSettled(
    restaurants
      .filter((restaurant) => restaurant?._id)
      .map((restaurant) =>
        apiClient.get(`/restaurants/${restaurant._id}/fooditems`, authConfig)
      )
  );

  return results.reduce((total, result) => {
    if (result.status !== 'fulfilled' || !Array.isArray(result.value.data)) {
      return total;
    }

    return total + result.value.data.length;
  }, 0);
}

export async function fetchAdminDashboardSummary(token) {
  try {
    const authConfig = createAuthConfig(token);
    const endpointEntries = [
      ['users', apiClient.get('/users/all', authConfig)],
      ['hotels', apiClient.get('/hotels', authConfig)],
      ['rooms', apiClient.get('/rooms', authConfig)],
      ['roomBookings', apiClient.get('/rooms/bookings/all', authConfig)],
      ['packages', apiClient.get('/packages', authConfig)],
      ['packageBookings', apiClient.get('/package-bookings', authConfig)],
      ['vehicles', apiClient.get('/vehicles', authConfig)],
      ['vehicleStats', apiClient.get('/vehicle-bookings/stats', authConfig)],
      ['products', apiClient.get('/products', authConfig)],
      ['orders', apiClient.get('/orders', authConfig)],
      ['foodOrders', apiClient.get('/food-orders', authConfig)],
      ['restaurants', apiClient.get('/restaurants', authConfig)],
      ['reviews', apiClient.get('/reviews', authConfig)],
      ['inquiries', apiClient.get('/inquiries', authConfig)],
      ['packageVehicles', apiClient.get('/package-vehicles', authConfig)],
    ];

    const settledResults = await Promise.allSettled(endpointEntries.map(([, request]) => request));
    const resultMap = Object.fromEntries(
      endpointEntries.map(([key], index) => [key, settledResults[index]])
    );
    const failedEndpoints = endpointEntries
      .map(([key], index) => {
        const result = settledResults[index];
        if (result.status === 'fulfilled') {
          return null;
        }

        const reason = isAxiosError(result.reason)
          ? result.reason.response?.data?.error ||
            result.reason.response?.data?.message ||
            result.reason.message
          : result.reason instanceof Error
            ? result.reason.message
            : 'Request failed';

        return { key, reason };
      })
      .filter(Boolean);

    const users = extractArray(resultMap.users);
    const hotels = extractArray(resultMap.hotels);
    const rooms = extractArray(resultMap.rooms);
    const roomBookings = extractArray(resultMap.roomBookings);
    const packages = extractArray(resultMap.packages);
    const packageBookings = extractArray(resultMap.packageBookings);
    const vehicles = extractArray(resultMap.vehicles);
    const products = extractArray(resultMap.products);
    const orders = extractArray(resultMap.orders);
    const foodOrders = extractArray(resultMap.foodOrders);
    const restaurants = extractArray(resultMap.restaurants);
    const reviews = extractArray(resultMap.reviews);
    const inquiries = extractArray(resultMap.inquiries);
    const packageVehicles = extractArray(resultMap.packageVehicles);
    const vehicleStats =
      resultMap.vehicleStats.status === 'fulfilled'
        ? resultMap.vehicleStats.value.data?.stats || {}
        : {};

    const restaurantItems = await fetchRestaurantItemCount(restaurants, authConfig);

    const pendingRoomBookings = roomBookings.filter(
      (booking) => String(booking?.bookingStatus || '').toLowerCase() === 'pending'
    ).length;
    const pendingPackageBookings = packageBookings.filter(
      (booking) => String(booking?.status || '').toLowerCase() === 'pending'
    ).length;
    const pendingEquipmentOrders = orders.filter(
      (order) => String(order?.status || '').toLowerCase() === 'pending'
    ).length;
    const pendingSafariBookings = Number(vehicleStats.pending) || 0;

    const roomRevenue = sumBy(
      roomBookings.filter((booking) => isConfirmedStatus(booking?.bookingStatus)),
      (booking) => booking?.totalAmount
    );
    const packageRevenue = sumBy(
      packageBookings.filter((booking) => isConfirmedStatus(booking?.status)),
      (booking) => booking?.totalPrice
    );
    const equipmentRevenue = sumBy(
      orders.filter((order) => isConfirmedStatus(order?.status)),
      (order) => order?.totalAmount
    );
    const safariRevenue = Number(vehicleStats.totalRevenue) || 0;

    const response = {
      summary: {
        users: users.length,
        hotels: hotels.length,
        rooms: rooms.length,
        roomBookings: roomBookings.length,
        totalBookings:
          roomBookings.length +
          packageBookings.length +
          orders.length +
          foodOrders.length +
          (Number(vehicleStats.totalBookings) || 0),
        packages: packages.length,
        packageBookings: packageBookings.length,
        vehicles: vehicles.length,
        gearItems: products.length,
        equipmentOrders: orders.length,
        foodOrders: foodOrders.length,
        restaurants: restaurants.length,
        restaurantItems,
        reviews: reviews.length,
        inquiries: inquiries.length,
        packageVehicles: packageVehicles.length,
        pendingBookings:
          pendingRoomBookings +
          pendingPackageBookings +
          pendingEquipmentOrders +
          pendingSafariBookings,
        pendingRoomBookings,
        pendingPackageBookings,
        pendingEquipmentOrders,
        pendingSafariBookings,
        totalRevenue: roomRevenue + packageRevenue + equipmentRevenue + safariRevenue,
        roomRevenue,
        packageRevenue,
        equipmentRevenue,
        safariRevenue,
      },
      debug: {
        apiBaseUrl: API_BASE_URL,
        failedEndpoints,
      },
    };

    console.log('[AdminDashboard] Summary response', response);
    return response;
  } catch (error) {
    throw buildApiError(error, 'Unable to load the admin dashboard right now.');
  }
}
