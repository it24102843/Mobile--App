import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { API_BASE_URL } from '../config/env';
import { createAuthConfig } from '../utils/api';
import { normalizeInquiry } from './inquiriesApi';

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

export async function fetchAdminInquiries(token) {
  try {
    const response = await apiClient.get('/admin/inquiries', createAuthConfig(token));
    const inquiries = Array.isArray(response.data) ? response.data : [];
    return inquiries.map(normalizeInquiry);
  } catch (error) {
    throw buildApiError(error, 'Unable to load inquiries right now.');
  }
}

export async function fetchAdminInquiryById(token, inquiryId) {
  try {
    const response = await apiClient.get(`/admin/inquiries/${inquiryId}`, createAuthConfig(token));
    return normalizeInquiry(response.data);
  } catch (error) {
    throw buildApiError(error, 'Unable to load this inquiry right now.');
  }
}

export async function replyToAdminInquiry(token, inquiryId, message) {
  try {
    const response = await apiClient.post(
      `/admin/inquiries/${inquiryId}/reply`,
      { message },
      createAuthConfig(token)
    );
    return {
      ...response.data,
      inquiry: response.data?.inquiry ? normalizeInquiry(response.data.inquiry) : null,
    };
  } catch (error) {
    throw buildApiError(error, 'Unable to send this reply right now.');
  }
}

export async function updateAdminInquiryStatus(token, inquiryId, status) {
  try {
    const response = await apiClient.patch(
      `/admin/inquiries/${inquiryId}/status`,
      { status },
      createAuthConfig(token)
    );
    return {
      ...response.data,
      inquiry: response.data?.inquiry ? normalizeInquiry(response.data.inquiry) : null,
    };
  } catch (error) {
    throw buildApiError(error, 'Unable to update this inquiry status right now.');
  }
}

export async function markInquiryReadByAdmin(token, inquiryId) {
  try {
    const response = await apiClient.patch(
      `/admin/inquiries/${inquiryId}/read-admin`,
      {},
      createAuthConfig(token)
    );
    return {
      ...response.data,
      inquiry: response.data?.inquiry ? normalizeInquiry(response.data.inquiry) : null,
    };
  } catch (error) {
    throw buildApiError(error, 'Unable to update this inquiry right now.');
  }
}

export async function updateAdminInquiry(token, inquiryId, values) {
  if (typeof values?.isResolved === 'boolean') {
    return updateAdminInquiryStatus(token, inquiryId, values.isResolved ? 'closed' : 'open');
  }

  if (typeof values?.response === 'string' && values.response.trim()) {
    return replyToAdminInquiry(token, inquiryId, values.response);
  }

  throw new Error('Nothing to update for this inquiry.');
}
