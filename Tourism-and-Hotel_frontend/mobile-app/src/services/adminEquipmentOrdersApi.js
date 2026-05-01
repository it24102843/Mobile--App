import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { createAuthConfig } from '../utils/api';

export const EQUIPMENT_ORDER_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Approved', value: 'approved' },
  { label: 'Pending', value: 'pending' },
  { label: 'Rejected', value: 'rejected' },
];

function buildApiError(error, fallbackMessage) {
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

function formatCurrency(value) {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value) || 0)}`;
}

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return `${value}`;
  }

  return date.toLocaleDateString('en-CA');
}

function getStatusVariant(status) {
  switch (`${status ?? ''}`.toLowerCase()) {
    case 'approved':
      return 'success';
    case 'pending':
      return 'warning';
    case 'rejected':
    case 'cancelled':
      return 'danger';
    default:
      return 'warning';
  }
}

export function normalizeEquipmentOrder(order) {
  const orderedItems = Array.isArray(order?.orderedItems) ? order.orderedItems : [];

  return {
    ...order,
    orderId: order?.orderId || 'N/A',
    email: order?.email || 'No email provided',
    daysLabel: `${Number(order?.days || 0)} day(s)`,
    startDateLabel: formatDate(order?.startingDate),
    endDateLabel: formatDate(order?.endingDate),
    totalAmountLabel: formatCurrency(order?.totalAmount),
    orderDateLabel: formatDate(order?.orderDate),
    statusLabel: order?.status || 'Pending',
    statusVariant: getStatusVariant(order?.status),
    itemCount: orderedItems.length,
    firstItemName: orderedItems[0]?.product?.name || 'Equipment Rental',
  };
}

function buildStats(orders) {
  return {
    total: orders.length,
    approved: orders.filter((order) => `${order.statusLabel}`.toLowerCase() === 'approved').length,
    pending: orders.filter((order) => `${order.statusLabel}`.toLowerCase() === 'pending').length,
    rejected: orders.filter((order) => `${order.statusLabel}`.toLowerCase() === 'rejected').length,
  };
}

export async function fetchAdminEquipmentOrders(token) {
  try {
    const response = await apiClient.get('/orders', createAuthConfig(token));
    const orders = Array.isArray(response.data)
      ? response.data.map(normalizeEquipmentOrder)
      : [];

    return {
      orders,
      stats: buildStats(orders),
    };
  } catch (error) {
    throw buildApiError(error, 'Unable to load equipment orders right now.');
  }
}

export async function fetchAdminEquipmentOrderById(token, orderId) {
  try {
    const response = await apiClient.get(`/orders/${orderId}`, createAuthConfig(token));
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to load this equipment order right now.');
  }
}

export async function updateAdminEquipmentOrderStatus(token, orderId, status) {
  try {
    const response = await apiClient.put(
      `/orders/status/${orderId}`,
      { status },
      createAuthConfig(token)
    );

    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to update this equipment order right now.');
  }
}
