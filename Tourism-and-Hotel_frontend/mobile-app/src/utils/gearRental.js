import {
  getStartOfToday,
  isPositiveInteger,
  parseDateValue,
} from './validation';

export function formatLkr(value) {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `LKR ${new Intl.NumberFormat('en-LK').format(amount)}`;
}

export function parseDateInput(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  return parseDateValue(value);
}

export function calculateRentalDays(startDate, endDate) {
  const start = parseDateInput(startDate);
  const end = parseDateInput(endDate);

  if (!start || !end) {
    return 0;
  }

  const diffInMs = end.getTime() - start.getTime();
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
}

export function getStockMeta(stockCount) {
  const units = Number(stockCount || 0);

  if (units <= 0) {
    return {
      label: 'Out of stock',
      variant: 'danger',
      available: false,
    };
  }

  if (units <= 3) {
    return {
      label: `${units} unit(s) left`,
      variant: 'warning',
      available: true,
    };
  }

  return {
    label: `${units} unit(s) available`,
    variant: 'primary',
    available: true,
  };
}

export function calculateGearItemSubtotal(item, days) {
  const quantity = Number(item?.quantity || 0);
  const pricePerDay = Number(item?.dailyRentalprice || 0);
  const safeDays = Math.max(Number(days || 0), 0);

  return quantity * pricePerDay * safeDays;
}

export function calculateGearCartOneDayTotal(items = []) {
  return items.reduce((total, item) => {
    const quantity = Number(item?.quantity || 0);
    const pricePerDay = Number(item?.dailyRentalprice || 0);
    return total + quantity * pricePerDay;
  }, 0);
}

export function calculateGearCartTotal(items = [], days = 0) {
  return items.reduce((total, item) => total + calculateGearItemSubtotal(item, days), 0);
}

export function validateGearBooking({ items = [], startDate, endDate }) {
  const errors = {};
  const days = calculateRentalDays(startDate, endDate);
  const parsedStartDate = parseDateInput(startDate);
  const parsedEndDate = parseDateInput(endDate);

  if (!items.length) {
    errors.items = 'Please add at least one equipment item to continue.';
  }

  if (!parsedStartDate) {
    errors.startDate = 'Please enter a valid rental start date.';
  } else if (parsedStartDate < getStartOfToday()) {
    errors.startDate = 'Rental start date cannot be in the past.';
  }

  if (!parsedEndDate) {
    errors.endDate = 'Please enter a valid rental end date.';
  }

  if (parsedStartDate && parsedEndDate && days <= 0) {
    errors.endDate = 'Rental end date must be after the start date.';
  }

  const invalidItem = items.find((item) => {
    const quantity = Number(item?.quantity || 0);
    const stockCount = Number(item?.stockCount || 0);
    return !isPositiveInteger(quantity) || quantity > stockCount || stockCount <= 0;
  });

  if (invalidItem) {
    errors.items = `${invalidItem.name} no longer has enough stock for the selected quantity.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    days,
  };
}

export function formatGearOrderStatus(status) {
  switch (status) {
    case 'Approved':
    case 'Confirmed':
      return { label: status, variant: 'primary' };
    case 'Completed':
      return { label: 'Completed', variant: 'info' };
    case 'Rejected':
    case 'Cancelled':
      return { label: status, variant: 'danger' };
    default:
      return { label: status || 'Pending', variant: 'warning' };
  }
}

export function normalizeGearOrder(order) {
  return {
    ...order,
    statusMeta: formatGearOrderStatus(order?.status),
    itemCount: Array.isArray(order?.orderedItems) ? order.orderedItems.length : 0,
  };
}
