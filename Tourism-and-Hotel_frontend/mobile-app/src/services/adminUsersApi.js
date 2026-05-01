import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { createAuthConfig } from '../utils/api';
import { resolveMediaUrl } from '../utils/media';

export const USER_ROLE_OPTIONS = [
  { label: 'All Roles', value: 'all' },
  { label: 'Admin', value: 'admin' },
  { label: 'Customer', value: 'customer' },
];

export const USER_STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Blocked', value: 'Blocked' },
];

export const EDITABLE_USER_ROLES = [
  { label: 'Admin', value: 'admin' },
  { label: 'Customer', value: 'customer' },
];

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

function formatDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getRoleVariant(role) {
  if (role === 'admin') {
    return 'info';
  }

  return 'primary';
}

function getStatusVariant(isBlocked) {
  return isBlocked ? 'danger' : 'primary';
}

function normalizeString(value) {
  return `${value ?? ''}`.trim();
}

export function normalizeAdminUser(rawUser) {
  const firstName = normalizeString(rawUser?.firstName);
  const lastName = normalizeString(rawUser?.lastName);
  const fullName = `${firstName} ${lastName}`.trim();
  const role = normalizeString(rawUser?.role).toLowerCase() || 'customer';
  const isBlocked = Boolean(rawUser?.isBlocked);

  return {
    ...rawUser,
    id: rawUser?.userId || rawUser?._id || '',
    mongoId: rawUser?._id || '',
    userId: rawUser?.userId || rawUser?._id || 'Not available',
    name: fullName || 'Unnamed user',
    firstName: firstName || '',
    lastName: lastName || '',
    email: normalizeString(rawUser?.email) || 'Email not available',
    phone: normalizeString(rawUser?.phone) || 'Phone not available',
    address: normalizeString(rawUser?.address) || 'Address not available',
    role,
    roleLabel: role === 'admin' ? 'Admin' : 'Customer',
    roleVariant: getRoleVariant(role),
    isBlocked,
    statusLabel: isBlocked ? 'Blocked' : 'Active',
    statusVariant: getStatusVariant(isBlocked),
    profilePicture: resolveMediaUrl(rawUser?.profilePicture),
    createdAt: rawUser?.createdAt || null,
    createdLabel: formatDate(rawUser?.createdAt),
  };
}

export async function fetchAdminUsers(token) {
  try {
    const response = await apiClient.get('/users/all', createAuthConfig(token));
    return (response.data || []).map(normalizeAdminUser);
  } catch (error) {
    throw buildApiError(error, 'Unable to load users right now.');
  }
}

export async function updateAdminUser(token, userId, payload) {
  try {
    const response = await apiClient.put(`/users/${userId}`, payload, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to update this user right now.');
  }
}

export async function toggleAdminUserBlock(token, userId) {
  try {
    const response = await apiClient.patch(`/users/${userId}/block`, {}, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to update this user status right now.');
  }
}

export async function deleteAdminUser(token, userId) {
  try {
    const response = await apiClient.delete(`/users/${userId}`, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to delete this user right now.');
  }
}
