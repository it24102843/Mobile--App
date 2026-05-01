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

function formatDateTime(value) {
  if (!value) {
    return 'Date unavailable';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return `${date.toLocaleDateString('en-LK')} ${date.toLocaleTimeString('en-LK', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function normalizeMessage(message) {
  return {
    id: `${message?.id || message?._id || message?.createdAt || Math.random()}`,
    senderId: message?.senderId || null,
    senderRole: message?.senderRole || 'user',
    message: message?.message || '',
    createdAt: message?.createdAt || null,
    createdLabel: formatDateTime(message?.createdAt),
    readByUser: Boolean(message?.readByUser),
    readByAdmin: Boolean(message?.readByAdmin),
  };
}

export function normalizeInquiry(rawInquiry) {
  const id = `${rawInquiry?.id ?? rawInquiry?._id ?? ''}`;
  const messages = Array.isArray(rawInquiry?.messages)
    ? rawInquiry.messages.map(normalizeMessage)
    : [];
  const lastMessage = messages[messages.length - 1] || null;
  const unreadForUser = Number(rawInquiry?.unreadForUser || 0);
  const unreadForAdmin = Number(rawInquiry?.unreadForAdmin || 0);
  const status = `${rawInquiry?.status || (rawInquiry?.isResolved ? 'closed' : 'open')}`.toLowerCase();

  return {
    id,
    inquiryId: `INQ-${id}`,
    userId: rawInquiry?.userId || null,
    fullName: rawInquiry?.fullName || 'Guest Inquiry',
    email: rawInquiry?.email || 'No email provided',
    phone: rawInquiry?.phone || '',
    subject: rawInquiry?.subject || 'General Inquiry',
    message: rawInquiry?.message || '',
    response: rawInquiry?.response || '',
    status,
    statusLabel:
      status === 'closed' ? 'Closed' : status === 'replied' ? 'Replied' : 'Open',
    isResolved: status === 'closed' || Boolean(rawInquiry?.isResolved),
    createdAt: rawInquiry?.createdAt || rawInquiry?.date || null,
    updatedAt: rawInquiry?.updatedAt || rawInquiry?.createdAt || rawInquiry?.date || null,
    createdLabel: formatDateTime(rawInquiry?.createdAt || rawInquiry?.date),
    updatedLabel: formatDateTime(rawInquiry?.updatedAt || rawInquiry?.createdAt || rawInquiry?.date),
    messages,
    lastMessage,
    lastMessagePreview: lastMessage?.message || rawInquiry?.response || rawInquiry?.message || '',
    unreadForUser,
    unreadForAdmin,
  };
}

export async function submitInquiry(payload, token) {
  try {
    const response = await apiClient.post('/inquiries', payload, createAuthConfig(token));
    return {
      ...response.data,
      inquiry: response.data?.inquiry ? normalizeInquiry(response.data.inquiry) : null,
    };
  } catch (error) {
    throw buildApiError(error, 'Unable to send your message right now.');
  }
}

export async function fetchMyInquiries(token) {
  try {
    const response = await apiClient.get('/inquiries/my', createAuthConfig(token));
    const inquiries = Array.isArray(response.data) ? response.data : [];
    return inquiries.map(normalizeInquiry);
  } catch (error) {
    throw buildApiError(error, 'Unable to load your inquiries right now.');
  }
}

export async function fetchMyInquiryById(token, inquiryId) {
  try {
    const response = await apiClient.get(`/inquiries/${inquiryId}`, createAuthConfig(token));
    return normalizeInquiry(response.data);
  } catch (error) {
    throw buildApiError(error, 'Unable to load this inquiry right now.');
  }
}

export async function sendInquiryMessage(token, inquiryId, message) {
  try {
    const response = await apiClient.post(
      `/inquiries/${inquiryId}/messages`,
      { message },
      createAuthConfig(token)
    );
    return {
      ...response.data,
      inquiry: response.data?.inquiry ? normalizeInquiry(response.data.inquiry) : null,
    };
  } catch (error) {
    throw buildApiError(error, 'Unable to send your message right now.');
  }
}

export async function markInquiryReadByUser(token, inquiryId) {
  try {
    const response = await apiClient.patch(
      `/inquiries/${inquiryId}/read-user`,
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
