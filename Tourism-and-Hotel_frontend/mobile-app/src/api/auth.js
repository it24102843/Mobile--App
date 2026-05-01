import { apiClient } from './client';

export async function loginUser(payload) {
  const response = await apiClient.post('/users/login', payload);
  return response.data;
}

export async function registerUser(payload) {
  const response = await apiClient.post('/users', {
    ...payload,
    role: 'customer',
  });

  return response.data;
}

export async function getCurrentUser(token) {
  const response = await apiClient.get('/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}
