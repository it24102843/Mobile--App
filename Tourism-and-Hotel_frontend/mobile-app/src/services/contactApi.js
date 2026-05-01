import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { API_BASE_URL } from '../config/env';

function createAuthConfig(token) {
  if (!token) {
    return undefined;
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function submitInquiry(payload, token) {
  try {
    const response = await apiClient.post('/inquiries', payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      if (!error.response) {
        throw new Error(
          `Unable to reach the backend at ${API_BASE_URL}. If you are using a physical phone, do not use localhost.`
        );
      }

      throw new Error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Unable to send your message right now.'
      );
    }

    throw error;
  }
}
