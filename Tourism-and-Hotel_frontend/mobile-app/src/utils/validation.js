export function normalizeInput(value) {
  return `${value ?? ''}`.trim();
}

export function normalizeEmail(value) {
  return normalizeInput(value).toLowerCase();
}

export function normalizePhone(value) {
  return normalizeInput(value).replace(/\s+/g, '');
}

export function isRequired(value) {
  return normalizeInput(value).length > 0;
}

export function hasMinLength(value, minLength) {
  return normalizeInput(value).length >= Number(minLength || 0);
}

export function hasNumber(value) {
  return /\d/.test(`${value ?? ''}`);
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export function isValidPhone(value, options = {}) {
  const digitsOnly = `${value ?? ''}`.replace(/[^\d]/g, '');
  const minimumDigits = Number(options.minimumDigits || 10);
  const maximumDigits = Number(options.maximumDigits || 15);

  if (!digitsOnly) {
    return false;
  }

  if (digitsOnly.length < minimumDigits || digitsOnly.length > maximumDigits) {
    return false;
  }

  return /^\+?[0-9\-() ]+$/.test(normalizeInput(value));
}

export function isPositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

export function isNonNegativeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
}

export function isPositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
}

export function isNonNegativeInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0;
}

export function isNumberInRange(value, min, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max;
}

export function parseDateValue(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isPastDate(value) {
  const date = parseDateValue(value);
  if (!date) {
    return false;
  }

  return date < getStartOfToday();
}

export function isFutureOrToday(value) {
  const date = parseDateValue(value);
  if (!date) {
    return false;
  }

  return date >= getStartOfToday();
}

export function isDateAfter(startValue, endValue) {
  const startDate = parseDateValue(startValue);
  const endDate = parseDateValue(endValue);

  if (!startDate || !endDate) {
    return false;
  }

  return endDate > startDate;
}

export function calculateDateDifferenceInDays(startValue, endValue) {
  const startDate = parseDateValue(startValue);
  const endDate = parseDateValue(endValue);

  if (!startDate || !endDate) {
    return 0;
  }

  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

export function isValidHttpUrl(value) {
  return /^https?:\/\/\S+$/i.test(normalizeInput(value));
}
