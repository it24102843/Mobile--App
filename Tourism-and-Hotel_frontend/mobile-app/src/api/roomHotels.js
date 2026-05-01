import { apiClient } from './client';
import { getHotelMedia } from '../config/hotelMedia';
import { getDefaultImage, resolveMediaCollection } from '../utils/media';

function formatCurrency(value, suffix = '') {
  if (typeof value !== 'number') {
    return null;
  }

  return `LKR ${new Intl.NumberFormat('en-LK').format(value)}${suffix}`;
}

function shorten(text, maxLength = 120) {
  if (!text) {
    return '';
  }

  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

export function normalizeRoomTypeValue(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/room/g, '')
    .trim();
}

export function buildHotelAmenityList(hotel) {
  const amenities = hotel?.amenities || {};

  return [
    { key: 'pool', label: 'Pool', enabled: Boolean(amenities.pool), icon: 'pool' },
    { key: 'spa', label: 'Spa', enabled: Boolean(amenities.spa), icon: 'spa' },
    { key: 'gym', label: 'Gym', enabled: Boolean(amenities.gym), icon: 'dumbbell' },
    {
      key: 'restaurant',
      label: 'Restaurant',
      enabled: Boolean(amenities.restaurant),
      icon: 'silverware-fork-knife',
    },
    { key: 'bar', label: 'Bar', enabled: Boolean(amenities.bar), icon: 'glass-cocktail' },
    {
      key: 'beachAccess',
      label: 'Beach Access',
      enabled: Boolean(amenities.beachAccess),
      icon: 'beach',
    },
  ];
}

export function buildRoomAmenityList(room) {
  const facilities = room?.facilities || {};

  return [
    {
      key: 'ac',
      label: 'Air Conditioning',
      enabled: Boolean(facilities.ac),
      icon: 'snowflake',
    },
    { key: 'wifi', label: 'Free WiFi', enabled: Boolean(facilities.wifi), icon: 'wifi' },
    {
      key: 'parking',
      label: 'Free Parking',
      enabled: Boolean(facilities.parking),
      icon: 'parking',
    },
    { key: 'tv', label: 'Smart TV', enabled: Boolean(facilities.tv), icon: 'television' },
    {
      key: 'hotWater',
      label: 'Hot Water',
      enabled: Boolean(facilities.hotWater),
      icon: 'shower',
    },
    { key: 'miniBar', label: 'Mini Bar', enabled: Boolean(facilities.miniBar), icon: 'glass-wine' },
  ];
}

export function getDefaultRoomPolicies() {
  return [
    { key: 'check-in', title: 'Check-In', value: 'From 2:00 PM' },
    { key: 'check-out', title: 'Check-Out', value: 'Before 12:00 PM' },
    { key: 'cancellation', title: 'Cancellation', value: 'Free up to 48h' },
  ];
}

export function normalizeHotelCard(hotel) {
  const hotelMedia = getHotelMedia(
    hotel,
    Array.isArray(hotel.images)
      ? hotel.images.map((image) => resolveMediaCollection(image, getDefaultImage()))
      : []
  );

  return {
    id: hotel.hotelId,
    title: hotel.name,
    subtitle: hotel.location,
    description: shorten(hotel.description),
    imageUrl: hotelMedia.primaryImage || getDefaultImage(),
    ratingLabel: hotel.starRating ? `${hotel.starRating} Star Resort` : 'Resort',
    amenities: buildHotelAmenityList(hotel),
    raw: hotel,
  };
}

export function normalizeRoomCard(room) {
  const facilities = buildRoomAmenityList(room)
    .filter((facility) => facility.enabled)
    .map((facility) => facility.label);
  const resolvedRoomType = room.roomType || room.type || room.category || room.room_type || 'Room';

  return {
    id: room.key,
    title: resolvedRoomType,
    subtitle: room.hotelName,
    description: shorten(room.description),
    imageUrl: resolveMediaCollection(room.images, getDefaultImage()),
    priceLabel: formatCurrency(room.price, '/night'),
    status: room.status || 'Available',
    capacity: room.capacity ?? 2,
    roomNumber: room.roomNumber,
    facilities,
    raw: room,
  };
}

export async function fetchHotelsList() {
  const response = await apiClient.get('/hotels');
  return response.data.map(normalizeHotelCard);
}

export async function fetchHotelDetails(hotelId) {
  const response = await apiClient.get(`/hotels/${hotelId}`);
  return response.data;
}

export async function fetchHotelByName(hotelName) {
  const response = await apiClient.get('/hotels');
  return (
    response.data.find(
      (hotel) => hotel.name?.trim().toLowerCase() === hotelName?.trim().toLowerCase()
    ) || null
  );
}

export async function fetchRoomsList(filters = {}) {
  const hasFilters =
    Boolean(filters.hotelName) ||
    Boolean(filters.checkIn) ||
    Boolean(filters.checkOut) ||
    Boolean(filters.guests) ||
    Boolean(filters.roomType);
  const requestFilters = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );

  try {
    console.log(
      '[RoomsApi] GET',
      `${apiClient.defaults.baseURL}${hasFilters ? '/rooms/search' : '/rooms'}`,
      requestFilters
    );
    const response = hasFilters
      ? await apiClient.get('/rooms/search', { params: requestFilters })
      : await apiClient.get('/rooms');

    const roomList = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.rooms)
        ? response.data.rooms
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

    console.log('[RoomsApi] Response count', roomList.length);

    return roomList.map(normalizeRoomCard);
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Unable to search available rooms right now.';

    throw new Error(message);
  }
}

export async function fetchRoomsByHotel(hotelName) {
  return fetchRoomsList({ hotelName });
}

export async function fetchRoomDetails(roomKey) {
  const response = await apiClient.get(`/rooms/${roomKey}`);
  return response.data;
}

export function calculateRoomPriceBreakdown(pricePerNight, checkInDate, checkOutDate, taxRate = 0.1) {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
    return {
      nights: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
    };
  }

  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  const subtotal = nights * (pricePerNight || 0);
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;

  return {
    nights,
    subtotal,
    tax,
    total,
  };
}
