import { apiClient } from './client';
import { getDefaultImage, resolveMediaCollection, resolveMediaUrl } from '../utils/media';
import { getHotelMedia } from '../config/hotelMedia';

function formatCurrency(value, suffix = '') {
  if (typeof value !== 'number') {
    return null;
  }

  return `LKR ${new Intl.NumberFormat('en-LK').format(value)}${suffix}`;
}

function shorten(text, maxLength = 96) {
  if (!text) {
    return '';
  }

  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

function normalizeRoomStatus(status) {
  switch (status) {
    case 'Booked':
      return 'warning';
    case 'Maintenance':
      return 'danger';
    default:
      return 'primary';
  }
}

function normalizeProductAccent(stockCount) {
  if (stockCount <= 0) {
    return 'danger';
  }

  if (stockCount <= 3) {
    return 'warning';
  }

  return 'accent';
}

function normalizeReviewDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return 'Recently added';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function sortReviewsByRatingAndDate(left, right) {
  const leftRating = Number(left?.rating || 0);
  const rightRating = Number(right?.rating || 0);

  if (rightRating !== leftRating) {
    return rightRating - leftRating;
  }

  const leftDate = left?.date ? new Date(left.date).getTime() : 0;
  const rightDate = right?.date ? new Date(right.date).getTime() : 0;

  return rightDate - leftDate;
}

export async function fetchHomeRooms() {
  const response = await apiClient.get('/rooms');

  return response.data.map((room) => ({
    id: room.key,
    title: `${room.roomType} Room`,
    subtitle: room.hotelName,
    description: shorten(room.description),
    imageUrl: resolveMediaCollection(room.images),
    priceLabel: formatCurrency(room.price, ' / night'),
    badgeLabel: room.status || room.roomType,
    badgeVariant: normalizeRoomStatus(room.status),
    route: `/rooms/${room.key}`,
    capacityLabel: `${room.capacity ?? 2} Guests`,
  }));
}

export async function fetchHomeHotels() {
  const response = await apiClient.get('/hotels');

  return response.data.map((hotel) => {
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
      priceLabel: hotel.starRating ? `${hotel.starRating} Star Resort` : null,
      badgeLabel: hotel.status || 'Featured Hotel',
      badgeVariant: hotel.status === 'Inactive' ? 'warning' : 'info',
      route: `/hotels/${hotel.hotelId}`,
      metaLabel: hotel.location,
    };
  });
}

export async function fetchHomePlaces() {
  return fetchHomeHotels();
}

export async function fetchHomePackages() {
  const response = await apiClient.get('/packages');

  return response.data.map((pkg) => ({
    id: pkg.packageId,
    title: pkg.name,
    subtitle: `${pkg.duration?.days ?? 1} day experience`,
    description: shorten(pkg.description),
    imageUrl: resolveMediaCollection(pkg.images),
    priceLabel: formatCurrency(pkg.price),
    badgeLabel: pkg.category,
    badgeVariant: 'accent',
    route: `/packages/${pkg.packageId}`,
    metaLabel: `${pkg.maxGroupSize ?? 10} Guests max`,
  }));
}

export async function fetchHomeVehicles() {
  const response = await apiClient.get('/vehicles');

  return response.data.map((vehicle) => ({
    id: vehicle._id || vehicle.registrationNumber,
    title: vehicle.name,
    subtitle: vehicle.type,
    description: shorten(vehicle.description),
    imageUrl: resolveMediaCollection(vehicle.image, getDefaultImage()),
    priceLabel: formatCurrency(vehicle.pricePerDay, ' / day'),
    badgeLabel: `${vehicle.capacity} Seats`,
    badgeVariant: 'primary',
    route: `/vehicles/${vehicle._id || vehicle.registrationNumber}`,
    metaLabel: vehicle.driverName ? `Driver: ${vehicle.driverName}` : 'Self or guided ride',
  }));
}

export async function fetchHomeGear() {
  const response = await apiClient.get('/products');

  return response.data
    .filter((product) => product.isRentable !== false)
    .map((product) => ({
      id: product.key,
      title: product.name,
      subtitle: product.category,
      description: shorten(product.description),
      imageUrl: resolveMediaCollection(product.image),
      priceLabel: formatCurrency(product.dailyRentalprice, ' / day'),
      badgeLabel:
        product.stockCount > 0 ? `${product.stockCount} in stock` : 'Out of stock',
      badgeVariant: normalizeProductAccent(product.stockCount),
      route: `/gear-rental/${product.key}`,
      metaLabel: product.pickupLocation || 'WildHaven pickup point',
    }));
}

export async function fetchHomeRestaurantFoods() {
  const restaurantResponse = await apiClient.get('/restaurants');
  const restaurants = Array.isArray(restaurantResponse.data) ? restaurantResponse.data : [];

  const foodResults = await Promise.allSettled(
    restaurants.slice(0, 6).map(async (restaurant) => {
      const response = await apiClient.get(`/restaurants/${restaurant._id}/fooditems`);
      const items = Array.isArray(response.data) ? response.data : [];

      return items
        .filter((item) => item?.availability !== false)
        .slice(0, 2)
        .map((item) => ({
          id: item._id,
          title: item.name,
          subtitle: item.category || 'Restaurant Food',
          description: shorten(item.description),
          imageUrl: resolveMediaCollection(item.image, getDefaultImage()),
          priceLabel: formatCurrency(item.price),
          badgeLabel: item.availability ? 'Available' : 'Unavailable',
          badgeVariant: item.availability ? 'accent' : 'danger',
          route: restaurant?._id ? `/restaurants/${restaurant._id}/menus` : '/restaurants',
          metaLabel: restaurant.name,
        }));
    })
  );

  return foodResults
    .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
    .slice(0, 8);
}

export async function fetchHomeReviews() {
  const response = await apiClient.get('/reviews');

  return [...response.data]
    .sort(sortReviewsByRatingAndDate)
    .map((review) => ({
      id: review._id,
      name: review.name,
      comment: review.comment,
      rating: review.rating || 0,
      section: review.section || 'Guest Review',
      date: review.date || null,
      dateLabel: normalizeReviewDate(review.date),
      profilePicture: resolveMediaUrl(review.profilePicture),
    }));
}
