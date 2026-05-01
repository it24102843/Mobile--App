import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { createAuthConfig } from '../utils/api';
import { getDefaultImage, resolveMediaCollection } from '../utils/media';

export const FULFILLMENT_METHOD_OPTIONS = [
  { label: 'Pickup', value: 'Pickup' },
  { label: 'Delivery', value: 'Delivery' },
];

export const FOOD_ORDER_STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Confirmed', value: 'Confirmed' },
  { label: 'Cancelled', value: 'Cancelled' },
];

export const FOOD_ORDER_EDITABLE_STATUS_OPTIONS = FOOD_ORDER_STATUS_OPTIONS.filter(
  (option) => option.value !== 'all'
);

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

function getStatusMeta(status) {
  switch (`${status || ''}`.trim().toLowerCase()) {
    case 'confirmed':
      return { label: 'Confirmed', variant: 'primary' };
    case 'preparing':
      return { label: 'Preparing', variant: 'info' };
    case 'completed':
      return { label: 'Completed', variant: 'info' };
    case 'cancelled':
      return { label: 'Cancelled', variant: 'danger' };
    default:
      return { label: status || 'Pending', variant: 'warning' };
  }
}

function canCancelFoodOrder(status) {
  const normalized = `${status || ''}`.trim().toLowerCase();
  return normalized === 'pending';
}

export function normalizeFoodOrder(rawOrder) {
  const statusMeta = getStatusMeta(rawOrder?.status);
  const canCancel = canCancelFoodOrder(rawOrder?.status);

  return {
    ...rawOrder,
    id: rawOrder?.id || rawOrder?._id || rawOrder?.orderId || '',
    orderId: rawOrder?.orderId || '',
    restaurantName: rawOrder?.restaurantName || 'Restaurant',
    menuName: rawOrder?.menuName || 'Menu',
    foodName: rawOrder?.foodName || 'Food Item',
    customerName: rawOrder?.customerName || 'Guest',
    customerEmail: rawOrder?.customerEmail || '',
    customerPhone: rawOrder?.customerPhone || '',
    specialNote: rawOrder?.specialNote || '',
    fulfillmentMethod: rawOrder?.fulfillmentMethod || 'Pickup',
    quantity: Number(rawOrder?.quantity || 0),
    price: Number(rawOrder?.price || 0),
    totalAmount: Number(rawOrder?.totalAmount || 0),
    orderDate: rawOrder?.orderDate || rawOrder?.createdAt || null,
    status: rawOrder?.status || 'Pending',
    statusLabel: statusMeta.label,
    statusVariant: statusMeta.variant,
    canCancel,
    cancellationHint: canCancel
      ? 'You can cancel this order while it is still pending.'
      : rawOrder?.status === 'Cancelled'
        ? 'This food order has already been cancelled.'
        : rawOrder?.status === 'Confirmed'
          ? 'Approved food orders can no longer be cancelled.'
        : rawOrder?.status === 'Completed'
          ? 'Completed food orders cannot be cancelled.'
          : 'This food order can no longer be cancelled.',
    imageUrl: resolveMediaCollection(rawOrder?.foodImage, getDefaultImage()),
  };
}

export async function createFoodOrder(token, payload) {
  try {
    const response = await apiClient.post('/food-orders', payload, createAuthConfig(token));
    return response.data?.order ? normalizeFoodOrder(response.data.order) : response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to place this food order right now.');
  }
}

export async function fetchMyFoodOrders(token) {
  try {
    const response = await apiClient.get('/food-orders/my', createAuthConfig(token));
    return Array.isArray(response.data) ? response.data.map(normalizeFoodOrder) : [];
  } catch (error) {
    throw buildApiError(error, 'Unable to load your food orders right now.');
  }
}

export async function fetchAdminFoodOrders(token) {
  try {
    const response = await apiClient.get('/food-orders', createAuthConfig(token));
    return Array.isArray(response.data) ? response.data.map(normalizeFoodOrder) : [];
  } catch (error) {
    throw buildApiError(error, 'Unable to load food orders right now.');
  }
}

export async function cancelMyFoodOrder(token, orderId) {
  try {
    const response = await apiClient.patch(
      `/food-orders/${orderId}/cancel`,
      {},
      createAuthConfig(token)
    );

    return response.data?.order
      ? {
          ...response.data,
          order: normalizeFoodOrder(response.data.order),
        }
      : response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to cancel this food order right now.');
  }
}

export async function updateAdminFoodOrder(token, orderId, payload) {
  try {
    const response = await apiClient.put(
      `/food-orders/${orderId}`,
      payload,
      createAuthConfig(token)
    );
    return response.data?.order ? normalizeFoodOrder(response.data.order) : response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to update this food order right now.');
  }
}

export async function updateAdminFoodOrderStatus(token, orderId, status) {
  try {
    const response = await apiClient.patch(
      `/food-orders/${orderId}/status`,
      { status },
      createAuthConfig(token)
    );
    return response.data?.order ? normalizeFoodOrder(response.data.order) : response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to update this food order status right now.');
  }
}

export async function deleteAdminFoodOrder(token, orderId) {
  try {
    const response = await apiClient.delete(
      `/food-orders/${orderId}`,
      createAuthConfig(token)
    );
    return response.data;
  } catch (error) {
    throw buildApiError(error, 'Unable to delete this food order right now.');
  }
}
