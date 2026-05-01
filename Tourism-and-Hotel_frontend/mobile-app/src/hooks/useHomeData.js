import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchHomeGear,
  fetchHomeHotels,
  fetchHomePackages,
  fetchHomeRestaurantFoods,
  fetchHomeReviews,
  fetchHomeRooms,
  fetchHomeVehicles,
} from '../api/home';
import { homeHeroSlides } from '../config/homeHeroSlides';

function createSectionState() {
  return {
    data: [],
    loading: true,
    error: null,
  };
}

export function useHomeData() {
  const [sections, setSections] = useState({
    hotels: createSectionState(),
    rooms: createSectionState(),
    packages: createSectionState(),
    vehicles: createSectionState(),
    gear: createSectionState(),
    restaurantFoods: createSectionState(),
    reviews: createSectionState(),
  });

  const loadHomeData = useCallback(async () => {
    setSections((previous) => ({
      hotels: { ...previous.hotels, loading: true, error: null },
      rooms: { ...previous.rooms, loading: true, error: null },
      packages: { ...previous.packages, loading: true, error: null },
      vehicles: { ...previous.vehicles, loading: true, error: null },
      gear: { ...previous.gear, loading: true, error: null },
      restaurantFoods: { ...previous.restaurantFoods, loading: true, error: null },
      reviews: { ...previous.reviews, loading: true, error: null },
    }));

    const results = await Promise.allSettled([
      fetchHomeHotels(),
      fetchHomeRooms(),
      fetchHomePackages(),
      fetchHomeVehicles(),
      fetchHomeGear(),
      fetchHomeRestaurantFoods(),
      fetchHomeReviews(),
    ]);

    const [
      hotelsResult,
      roomsResult,
      packagesResult,
      vehiclesResult,
      gearResult,
      restaurantFoodsResult,
      reviewsResult,
    ] =
      results;

    setSections({
      hotels: {
        data: hotelsResult.status === 'fulfilled' ? hotelsResult.value : [],
        loading: false,
        error: hotelsResult.status === 'rejected' ? hotelsResult.reason : null,
      },
      rooms: {
        data: roomsResult.status === 'fulfilled' ? roomsResult.value : [],
        loading: false,
        error: roomsResult.status === 'rejected' ? roomsResult.reason : null,
      },
      packages: {
        data: packagesResult.status === 'fulfilled' ? packagesResult.value : [],
        loading: false,
        error: packagesResult.status === 'rejected' ? packagesResult.reason : null,
      },
      vehicles: {
        data: vehiclesResult.status === 'fulfilled' ? vehiclesResult.value : [],
        loading: false,
        error: vehiclesResult.status === 'rejected' ? vehiclesResult.reason : null,
      },
      gear: {
        data: gearResult.status === 'fulfilled' ? gearResult.value : [],
        loading: false,
        error: gearResult.status === 'rejected' ? gearResult.reason : null,
      },
      restaurantFoods: {
        data: restaurantFoodsResult.status === 'fulfilled' ? restaurantFoodsResult.value : [],
        loading: false,
        error:
          restaurantFoodsResult.status === 'rejected' ? restaurantFoodsResult.reason : null,
      },
      reviews: {
        data: reviewsResult.status === 'fulfilled' ? reviewsResult.value : [],
        loading: false,
        error: reviewsResult.status === 'rejected' ? reviewsResult.reason : null,
      },
    });
  }, []);

  const reloadReviews = useCallback(async () => {
    setSections((previous) => ({
      ...previous,
      reviews: {
        ...previous.reviews,
        loading: true,
        error: null,
      },
    }));

    try {
      const reviews = await fetchHomeReviews();

      setSections((previous) => ({
        ...previous,
        reviews: {
          data: reviews,
          loading: false,
          error: null,
        },
      }));
    } catch (error) {
      setSections((previous) => ({
        ...previous,
        reviews: {
          ...previous.reviews,
          loading: false,
          error,
        },
      }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        await loadHomeData();
      } catch {
        if (!mounted) {
          return;
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [loadHomeData]);

  const heroSlides = useMemo(() => homeHeroSlides, []);

  return {
    sections,
    heroSlides,
    reloadHomeData: loadHomeData,
    reloadReviews,
  };
}
