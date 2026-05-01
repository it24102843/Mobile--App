import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { API_BASE_URL } from '../config/env';
import { createAuthConfig } from '../utils/api';

function buildApiError(error, fallbackMessage) {
  if (isAxiosError(error)) {
    if (!error.response) {
      return new Error(
        `Unable to reach the backend at ${API_BASE_URL}. If you are using a physical phone, do not use localhost.`
      );
    }

    return new Error(
      error.response?.data?.message || error.response?.data?.error || fallbackMessage
    );
  }

  return error instanceof Error ? error : new Error(fallbackMessage);
}

function normalizeInquiry(rawInquiry) {
  const id = rawInquiry?.id ?? rawInquiry?._id ?? '';
  const isResolved = Boolean(rawInquiry?.isResolved);
  const dateValue = rawInquiry?.date || rawInquiry?.createdAt || null;
  const date = dateValue ? new Date(dateValue) : null;

  return {
    id: `${id}`,
    inquiryId: `INQ-${id}`,
    fullName: rawInquiry?.fullName || 'Guest Inquiry',
    email: rawInquiry?.email || 'No email provided',
    phone: rawInquiry?.phone || 'No phone provided',
    subject: rawInquiry?.subject || 'General Inquiry',
    message: rawInquiry?.message || 'No message provided.',
    response: rawInquiry?.response || '',
    isResolved,
    statusLabel: isResolved ? 'Resolved' : 'Open',
    createdAt: date,
    createdLabel: date
      ? `${date.toLocaleDateString('en-LK')} ${date.toLocaleTimeString('en-LK', {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : 'Date unavailable',
  };
}

export async function fetchAdminInquiries(token) {
  try {
    const response = await apiClient.get('/inquiries', createAuthConfig(token));
    const inquiries = Array.isArray(response.data) ? response.data : [];
    return inquiries
      .map(normalizeInquiry)
      .sort((first, second) => (second.createdAt?.getTime?.() || 0) - (first.createdAt?.getTime?.() || 0));
  } catch (error) {
    throw buildApiError(error, 'Unable to load inquiries right now.');
  }
}

export async function updateAdminInquiry(token, inquiryId, values) {
  try {
    const response = await apiClient.put(
      `/inquiries/${inquiryId}`,
      values,
      createAuthConfig(token)
    );

    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to update this inquiry right now.');
  }
}
