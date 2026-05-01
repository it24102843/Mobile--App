import { isAxiosError } from 'axios';

import { apiClient } from '../api/client';
import { getHotelMedia } from '../config/hotelMedia';
import { createAuthConfig } from '../utils/api';
import { getDefaultImage, resolveMediaCollection, resolveMediaUrl } from '../utils/media';
import {
  hasMinLength,
  isNumberInRange,
  isPositiveInteger,
  isPositiveNumber,
  isValidEmail,
  isValidHttpUrl,
  isValidPhone,
} from '../utils/validation';

export const HOTEL_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export const ROOM_TYPE_OPTIONS = [
  { label: 'Standard', value: 'Standard' },
  { label: 'Deluxe', value: 'Deluxe' },
  { label: 'Suite', value: 'Suite' },
  { label: 'Family Suite', value: 'Family Suite' },
  { label: 'Pool Villa', value: 'Pool Villa' },
  { label: 'Garden Cottage', value: 'Garden Cottage' },
];

export const ROOM_STATUS_OPTIONS = [
  { label: 'Available', value: 'Available' },
  { label: 'Maintenance', value: 'Maintenance' },
];

export const STAR_RATING_OPTIONS = [
  { label: '1 Star', value: '1' },
  { label: '2 Stars', value: '2' },
  { label: '3 Stars', value: '3' },
  { label: '4 Stars', value: '4' },
  { label: '5 Stars', value: '5' },
];

export const HOTEL_AMENITY_OPTIONS = [
  { key: 'pool', label: 'Pool', icon: '🏊' },
  { key: 'spa', label: 'Spa', icon: '🧖' },
  { key: 'gym', label: 'Gym', icon: '🏋️' },
  { key: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { key: 'bar', label: 'Bar', icon: '🍸' },
  { key: 'beachAccess', label: 'Beach Access', icon: '🏖️' },
];

export const ROOM_FACILITY_OPTIONS = [
  { key: 'ac', label: 'AC', icon: '❄️' },
  { key: 'wifi', label: 'WiFi', icon: '📶' },
  { key: 'parking', label: 'Parking', icon: '🅿️' },
  { key: 'tv', label: 'Smart TV', icon: '📺' },
  { key: 'hotWater', label: 'Hot Water', icon: '🚿' },
  { key: 'miniBar', label: 'Mini Bar', icon: '🍾' },
];

function normalizeString(value) {
  return `${value ?? ''}`.trim().toLowerCase();
}

export function createGeneratedHotelId(name = '') {
  const slug = normalizeString(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()
    .replace(/-/g, '');

  return `HTL-${slug || 'HOTEL'}${Date.now().toString().slice(-4)}`;
}

export function createGeneratedRoomKey(roomNumber = '') {
  const sanitizedRoom = `${roomNumber ?? ''}`
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();

  return `RM-${sanitizedRoom || 'ROOM'}${Date.now().toString().slice(-4)}`;
}

export function isValidImageUrl(value) {
  if (!value) {
    return false;
  }

  return /^https?:\/\/\S+$/i.test(`${value}`.trim());
}

export function validateHotelFormValues({ values, hotels = [], currentHotelId = null }) {
  const nextErrors = {};
  const trimmedName = `${values?.name ?? ''}`.trim();
  const trimmedLocation = `${values?.location ?? ''}`.trim();
  const trimmedDescription = `${values?.description ?? ''}`.trim();
  const trimmedEmail = `${values?.contactEmail ?? ''}`.trim();
  const trimmedPhone = `${values?.contactPhone ?? ''}`.trim();
  const imageValues = Array.isArray(values?.images) ? values.images : [];
  const filledImages = imageValues.filter((image) => `${image ?? ''}`.trim());
  const duplicateHotel = hotels.find(
    (hotel) =>
      hotel?.hotelId !== currentHotelId &&
      normalizeString(hotel?.name) === normalizeString(trimmedName)
  );
  const starRating = Number(values?.starRating);

  if (!trimmedName) {
    nextErrors.name = 'Hotel name is required.';
  } else if (duplicateHotel) {
    nextErrors.name = 'A hotel with this name already exists.';
  }

  if (!trimmedLocation) {
    nextErrors.location = 'Location is required.';
  }

  if (!trimmedDescription) {
    nextErrors.description = 'Description is required.';
  } else if (!hasMinLength(trimmedDescription, 10)) {
    nextErrors.description = 'Description must contain at least 10 characters.';
  }

  if (!isNumberInRange(starRating, 1, 5)) {
    nextErrors.starRating = 'Star rating must be between 1 and 5.';
  }

  if (trimmedEmail && !isValidEmail(trimmedEmail)) {
    nextErrors.contactEmail = 'Enter a valid email address.';
  }

  if (trimmedPhone && !isValidPhone(trimmedPhone)) {
    nextErrors.contactPhone = 'Please enter a valid phone number.';
  }

  if (filledImages.some((image) => !isValidHttpUrl(image))) {
    nextErrors.images = 'Each image URL must start with http:// or https://';
  }

  return nextErrors;
}

export function validateRoomFormValues({
  values,
  rooms = [],
  hotels = [],
  currentRoomKey = null,
}) {
  const nextErrors = {};
  const trimmedRoomNumber = `${values?.roomNumber ?? ''}`.trim();
  const roomNumberValue = Number(trimmedRoomNumber);
  const trimmedDescription = `${values?.description ?? ''}`.trim();
  const selectedHotel = `${values?.hotelName ?? ''}`.trim();
  const price = Number(values?.price);
  const capacity = Number(values?.capacity);
  const imageValues = Array.isArray(values?.images) ? values.images : [];
  const filledImages = imageValues.filter((image) => `${image ?? ''}`.trim());
  const duplicateRoom = rooms.find(
    (room) =>
      room?.key !== currentRoomKey &&
      normalizeString(room?.hotelName) === normalizeString(selectedHotel) &&
      normalizeString(room?.roomNumber) === normalizeString(trimmedRoomNumber)
  );
  const hasSelectedHotel = hotels.some(
    (hotel) => normalizeString(hotel?.name) === normalizeString(selectedHotel)
  );
  const roomTypeValues = ROOM_TYPE_OPTIONS.map((option) => option.value);
  const roomStatusValues = ROOM_STATUS_OPTIONS.map((option) => option.value);

  if (!trimmedRoomNumber) {
    nextErrors.roomNumber = 'Room number is required.';
  } else if (!isPositiveInteger(roomNumberValue)) {
    nextErrors.roomNumber = 'Room number must be a positive whole number.';
  } else if (duplicateRoom) {
    nextErrors.roomNumber = 'This room number already exists in the selected hotel.';
  }

  if (!selectedHotel) {
    nextErrors.hotelName = 'Please select a hotel.';
  } else if (!hasSelectedHotel) {
    nextErrors.hotelName = 'Selected hotel is invalid.';
  }

  if (!values?.roomType) {
    nextErrors.roomType = 'Please select a room type.';
  } else if (!roomTypeValues.includes(values.roomType)) {
    nextErrors.roomType = 'Selected room type is invalid.';
  }

  if (!isPositiveNumber(price)) {
    nextErrors.price = 'Price per night must be greater than 0.';
  }

  if (!isPositiveInteger(capacity)) {
    nextErrors.capacity = 'Guest capacity must be a whole number greater than 0.';
  }

  if (!values?.status) {
    nextErrors.status = 'Please select a room status.';
  } else if (!roomStatusValues.includes(values.status)) {
    nextErrors.status = 'Selected room status is invalid.';
  }

  if (!trimmedDescription) {
    nextErrors.description = 'Description is required.';
  } else if (!hasMinLength(trimmedDescription, 10)) {
    nextErrors.description = 'Description must contain at least 10 characters.';
  }

  if (filledImages.some((image) => !isValidHttpUrl(image))) {
    nextErrors.images = 'Each image URL must start with http:// or https://';
  }

  return nextErrors;
}

function formatCurrency(value) {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value) || 0)}`;
}

function normalizeHotelImages(hotel) {
  const backendImages = Array.isArray(hotel?.images)
    ? hotel.images
        .filter((image) => typeof image === 'string' && image.trim())
        .map((image) => resolveMediaCollection(image, getDefaultImage()))
    : [];
  const hotelMedia = getHotelMedia(hotel, backendImages);

  return {
    primaryImage: hotelMedia.primaryImage || backendImages[0] || getDefaultImage(),
    gallery: hotelMedia.gallery?.length ? hotelMedia.gallery : backendImages,
  };
}

function normalizeRoomImage(room) {
  if (Array.isArray(room?.images) && room.images.length > 0) {
    return resolveMediaCollection(room.images, getDefaultImage());
  }

  if (room?.image) {
    return resolveMediaUrl(room.image, getDefaultImage());
  }

  return getDefaultImage();
}

function mapBookingStatusVariant(status) {
  switch (`${status ?? ''}`.toLowerCase()) {
    case 'confirmed':
    case 'approved':
      return 'primary';
    case 'pending':
      return 'accent';
    case 'cancelled':
    case 'rejected':
      return 'danger';
    default:
      return 'info';
  }
}

function mapRoomStatusVariant(status, availability) {
  if (!availability || `${status}`.toLowerCase() === 'maintenance') {
    return 'danger';
  }

  if (`${status}`.toLowerCase() === 'booked') {
    return 'warning';
  }

  return 'primary';
}

export function extractAdminHotelRoomError(error, fallbackMessage) {
  if (isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      fallbackMessage
    );
  }

  return error instanceof Error ? error.message : fallbackMessage;
}

export function normalizeHotelRecord(hotel, rooms = [], bookings = []) {
  const hotelRooms = rooms.filter(
    (room) => normalizeString(room.hotelName) === normalizeString(hotel.name)
  );
  const media = normalizeHotelImages(hotel);
  const hotelRoomKeys = hotelRooms.map((room) => room.key);
  const bookingHistoryCount = bookings.filter((booking) =>
    hotelRoomKeys.includes(booking?.roomKey)
  ).length;

  return {
    ...hotel,
    roomCount: hotelRooms.length,
    bookingHistoryCount,
    hasBookedRooms: bookingHistoryCount > 0,
    statusLabel: hotel.isActive ? 'Active' : 'Inactive',
    statusVariant: hotel.isActive ? 'primary' : 'danger',
    ratingLabel: `${hotel.starRating || 0} Star`,
    starCount: Number(hotel.starRating) || 0,
    imageUrl: media.primaryImage,
    gallery: media.gallery,
  };
}

export function normalizeHotelFormValues(hotel) {
  const imageValues =
    Array.isArray(hotel?.images) && hotel.images.length
      ? hotel.images.filter(
          (image) =>
            typeof image === 'string' &&
            image.trim() &&
            image.trim() !== getDefaultImage()
        )
      : [];

  return {
    hotelId: hotel?.hotelId || createGeneratedHotelId(hotel?.name || ''),
    name: hotel?.name || '',
    location: hotel?.location || '',
    description: hotel?.description || '',
    starRating: `${hotel?.starRating || 3}`,
    contactEmail: hotel?.contactEmail || '',
    contactPhone: hotel?.contactPhone || '',
    isActive: hotel?.isActive !== false,
    amenities: {
      pool: Boolean(hotel?.amenities?.pool),
      spa: Boolean(hotel?.amenities?.spa),
      gym: Boolean(hotel?.amenities?.gym),
      restaurant: Boolean(hotel?.amenities?.restaurant),
      bar: Boolean(hotel?.amenities?.bar),
      beachAccess: Boolean(hotel?.amenities?.beachAccess),
    },
    images: imageValues.length ? imageValues : [''],
  };
}

export function normalizeRoomRecord(room, bookings = []) {
  const bookingHistoryCount = bookings.filter(
    (booking) => normalizeString(booking?.roomKey) === normalizeString(room.key)
  ).length;

  return {
    ...room,
    imageUrl: normalizeRoomImage(room),
    bookingHistoryCount,
    hasBookingHistory: bookingHistoryCount > 0,
    availabilityLabel: room.availability ? room.status || 'Available' : 'Unavailable',
    statusVariant: mapRoomStatusVariant(room.status, room.availability),
    priceLabel: formatCurrency(room.price),
  };
}

export function normalizeRoomFormValues(room, defaultHotelName = '') {
  const imageValues =
    Array.isArray(room?.images) && room.images.length
      ? room.images.filter(
          (image) =>
            typeof image === 'string' &&
            image.trim() &&
            image.trim() !== getDefaultImage()
        )
      : [];

  return {
    key: room?.key || createGeneratedRoomKey(room?.roomNumber || ''),
    roomNumber: room?.roomNumber || '',
    hotelName: room?.hotelName || defaultHotelName || '',
    roomType: room?.roomType || ROOM_TYPE_OPTIONS[0]?.value || '',
    price: room?.price != null ? `${room.price}` : '',
    capacity: room?.capacity != null ? `${room.capacity}` : '2',
    status: room?.status || ROOM_STATUS_OPTIONS[0]?.value || 'Available',
    description: room?.description || '',
    facilities: {
      ac: Boolean(room?.facilities?.ac),
      wifi: Boolean(room?.facilities?.wifi),
      parking: Boolean(room?.facilities?.parking),
      tv: Boolean(room?.facilities?.tv),
      hotWater: Boolean(room?.facilities?.hotWater),
      miniBar: Boolean(room?.facilities?.miniBar),
    },
    images: imageValues.length ? imageValues : [''],
  };
}

export function normalizeBookingRecord(booking) {
  return {
    ...booking,
    imageUrl: normalizeRoomImage(booking?.room || booking),
    guestLabel: booking?.email || 'Client',
    roomLabel: booking?.room?.roomType || 'Room',
    hotelLabel: booking?.room?.hotelName || 'Hotel',
    roomNumberLabel: booking?.room?.roomNumber || 'N/A',
    totalLabel: formatCurrency(booking?.totalAmount),
    statusVariant: mapBookingStatusVariant(booking?.bookingStatus),
  };
}

export async function fetchHotelRoomManagementData(token) {
  const config = createAuthConfig(token);
  const [hotelsResponse, roomsResponse, bookingsResponse] = await Promise.all([
    apiClient.get('/hotels', config),
    apiClient.get('/rooms', config),
    apiClient.get('/rooms/bookings/all', config),
  ]);

  const rawBookings = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : [];
  const rooms = Array.isArray(roomsResponse.data)
    ? roomsResponse.data.map((room) => normalizeRoomRecord(room, rawBookings))
    : [];
  const hotels = Array.isArray(hotelsResponse.data)
    ? hotelsResponse.data.map((hotel) => normalizeHotelRecord(hotel, rooms, rawBookings))
    : [];
  const bookings = rawBookings.length
    ? rawBookings.map(normalizeBookingRecord)
    : [];

  return {
    hotels,
    rooms,
    bookings,
    counts: {
      hotels: hotels.length,
      rooms: rooms.length,
      bookings: bookings.length,
    },
  };
}

export async function fetchAdminHotelsList(token) {
  const response = await apiClient.get('/hotels', createAuthConfig(token));
  return Array.isArray(response.data) ? response.data.map((hotel) => normalizeHotelRecord(hotel)) : [];
}

export async function fetchHotelRecord(token, hotelId) {
  const response = await apiClient.get(`/hotels/${hotelId}`, createAuthConfig(token));
  return response.data;
}

export async function createHotelRecord(token, payload) {
  const response = await apiClient.post('/hotels', payload, createAuthConfig(token));
  return response.data;
}

export async function updateHotelRecord(token, hotelId, payload) {
  const response = await apiClient.put(
    `/hotels/${hotelId}`,
    payload,
    createAuthConfig(token)
  );
  return response.data;
}

export async function deleteHotelRecord(token, hotelId) {
  const response = await apiClient.delete(`/hotels/${hotelId}`, createAuthConfig(token));
  return response.data;
}

export async function fetchRoomRecord(token, roomKey) {
  const response = await apiClient.get(`/rooms/${roomKey}`, createAuthConfig(token));
  return response.data;
}

export async function createRoomRecord(token, payload) {
  const response = await apiClient.post('/rooms', payload, createAuthConfig(token));
  return response.data;
}

export async function updateRoomRecord(token, roomKey, payload) {
  const response = await apiClient.put(
    `/rooms/${roomKey}`,
    payload,
    createAuthConfig(token)
  );
  return response.data;
}

export async function deleteRoomRecord(token, roomKey) {
  const response = await apiClient.delete(`/rooms/${roomKey}`, createAuthConfig(token));
  return response.data;
}

export async function approveRoomBookingRecord(token, bookingId) {
  const response = await apiClient.put(
    `/rooms/bookings/${bookingId}/approve`,
    {},
    createAuthConfig(token)
  );
  return response.data;
}

export async function rejectRoomBookingRecord(token, bookingId) {
  const response = await apiClient.put(
    `/rooms/bookings/${bookingId}/reject`,
    {},
    createAuthConfig(token)
  );
  return response.data;
}
