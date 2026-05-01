import { isAxiosError } from 'axios';

import { apiClient } from './client';
import { createAuthConfig } from '../utils/api';
import { normalizeFoodOrder } from '../services/foodOrdersApi';
import { normalizeMyVehicleBooking } from '../services/vehicleBookingsApi';

function buildApiError(error, fallbackMessage) {
  if (isAxiosError(error)) {
    if (!error.response) {
      return new Error('Unable to reach the backend. Make sure your mobile API URL points to your running server, not localhost.');
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

export async function createRoomBooking(token, payload) {
  try {
    const response = await apiClient.post(
      '/rooms/bookings/create',
      payload,
      createAuthConfig(token)
    );

    return response.data;
  } catch (error) {
    throw buildApiError(
      error,
      'Unable to complete the room booking right now.'
    );
  }
}

export async function createPackageBooking(token, payload) {
  try {
    const response = await apiClient.post(
      '/package-bookings',
      payload,
      createAuthConfig(token)
    );

    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to create the package booking right now.');
  }
}

export async function createVehicleBooking(token, payload) {
  try {
    const response = await apiClient.post(
      '/vehicle-bookings',
      payload,
      createAuthConfig(token)
    );

    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to create the safari vehicle booking right now.');
  }
}

export async function createGearOrder(token, payload) {
  try {
    const response = await apiClient.post('/orders', payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to create the rental booking right now.');
  }
}

export async function fetchMyBookings(token) {
  try {
    const [roomsResult, packagesResult, ordersResult, vehiclesResult, foodOrdersResult] =
      await Promise.allSettled([
        apiClient.get('/rooms/bookings/my', createAuthConfig(token)),
        apiClient.get('/package-bookings/my', createAuthConfig(token)),
        apiClient.get('/orders', createAuthConfig(token)),
        apiClient.get('/vehicle-bookings/user', createAuthConfig(token)),
        apiClient.get('/food-orders/my', createAuthConfig(token)),
      ]);

    return {
      rooms: roomsResult.status === 'fulfilled' ? roomsResult.value.data : [],
      packages: packagesResult.status === 'fulfilled' ? packagesResult.value.data : [],
      equipment: ordersResult.status === 'fulfilled' ? ordersResult.value.data : [],
      safari:
        vehiclesResult.status === 'fulfilled'
          ? (vehiclesResult.value.data?.bookings || []).map(normalizeMyVehicleBooking)
          : [],
      food:
        foodOrdersResult.status === 'fulfilled'
          ? (foodOrdersResult.value.data || []).map(normalizeFoodOrder)
          : [],
    };
  } catch (error) {
    throw buildApiError(error, 'Unable to load your booking history right now.');
  }
}

export async function fetchBookingDetails(token, type, bookingId) {
  try {
    const response = await apiClient.get(
      `/bookings/my/${type}/${bookingId}`,
      createAuthConfig(token)
    );

    return response.data?.booking;
  } catch (error) {
    throw buildApiError(error, 'Unable to load this booking right now.');
  }
}

export async function fetchRoomBookingById(token, bookingId) {
  try {
    const response = await apiClient.get(
      `/rooms/bookings/${bookingId}`,
      createAuthConfig(token)
    );

    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to load this room booking right now.');
  }
}

export async function fetchPackageBookingById(token, bookingId) {
  try {
    const response = await apiClient.get(
      `/package-bookings/${bookingId}`,
      createAuthConfig(token)
    );

    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to load this package booking right now.');
  }
}

export async function cancelPackageBooking(token, bookingId) {
  try {
    const response = await apiClient.delete(
      `/package-bookings/${bookingId}`,
      createAuthConfig(token)
    );

    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to cancel this package booking right now.');
  }
}

export async function cancelRoomBooking(token, bookingId) {
  try {
    const response = await apiClient.delete(
      `/rooms/bookings/${bookingId}/cancel`,
      createAuthConfig(token)
    );

    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to cancel this room booking right now.');
  }
}

export async function cancelVehicleBooking(token, bookingId) {
  try {
    const response = await apiClient.put(
      `/vehicle-bookings/${bookingId}/cancel`,
      {},
      createAuthConfig(token)
    );

    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to cancel this safari vehicle booking right now.');
  }
}

export async function cancelGearOrder(token, orderId) {
  try {
    const response = await apiClient.put(
      `/orders/${orderId}/cancel`,
      {},
      createAuthConfig(token)
    );

    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to cancel this equipment booking right now.');
  }
}

export async function createReview(token, payload) {
  try {
    const response = await apiClient.post('/reviews', payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to submit your review right now.');
  }
}
