import { API_BASE_URL } from '../config/env';

const DEFAULT_IMAGE =
  'https://www.shutterstock.com/image-vector/missing-picture-page-website-design-600nw-1552421075.jpg';

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

function normalizePath(value) {
  return value
    .replace(/\\/g, '/')
    .replace(/^https?:\/\/[^/]+\/+/, '')
    .replace(/^[A-Za-z]:\//, '')
    .replace(/^\.?\//, '')
    .replace(/^api\//i, '')
    .replace(/^uploads\/uploads\//i, 'uploads/')
    .replace(/^\/+/, '');
}

export function resolveMediaUrl(value, fallback = DEFAULT_IMAGE) {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return fallback;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const cleaned = normalizePath(trimmed);

  if (!cleaned) {
    return fallback;
  }

  if (cleaned.startsWith('uploads/')) {
    return `${API_ORIGIN}/${cleaned}`;
  }

  if (cleaned.includes('/')) {
    return `${API_ORIGIN}/${cleaned}`;
  }

  return `${API_ORIGIN}/uploads/${cleaned}`;
}

export function resolveMediaCollection(values, fallback = DEFAULT_IMAGE) {
  if (Array.isArray(values)) {
    const firstValid = values.find((value) => typeof value === 'string' && value.trim());
    return resolveMediaUrl(firstValid, fallback);
  }

  return resolveMediaUrl(values, fallback);
}

export function getDefaultImage() {
  return DEFAULT_IMAGE;
}
