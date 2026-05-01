import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { createAuthConfig } from '../utils/api';

function buildRoomBookingApiError(error, fallbackMessage) {
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

export async function cancelMyRoomBooking(token, bookingId) {
  try {
    const response = await apiClient.delete(
      `/rooms/bookings/${bookingId}/cancel`,
      createAuthConfig(token)
    );

    return response.data;
  } catch (error) {
    throw buildRoomBookingApiError(
      error,
      'Unable to cancel this room booking right now.'
    );
  }
}
