export const AMAYA_HILLS_PRIMARY_IMAGE =
  'https://cf.bstatic.com/xdata/images/hotel/max1024x768/188372814.jpg?k=00346a8a28a66a8f02b69fa1abf22aed6df27f3661b5aac94fd7d739a08a49e2&o=';
export const AMAYA_HILLS_ROOM_IMAGE =
  'https://cf.bstatic.com/xdata/images/hotel/max1024x768/188393632.jpg?k=049949189268d7c648a83faa26269ade3ba93a1163206bf543d72938143b6d09&o=';

export const hotelImageOverrides = {
  'amaya hills': {
    primaryImage: AMAYA_HILLS_PRIMARY_IMAGE,
    roomImage: AMAYA_HILLS_ROOM_IMAGE,
    gallery: [
      AMAYA_HILLS_PRIMARY_IMAGE,
      AMAYA_HILLS_ROOM_IMAGE,
      'https://cf.bstatic.com/xdata/images/hotel/max1024x768/95672257.jpg?k=2212da2809f1435333a0583115720f8b2cd5557506ea4d320d4b29ec81c7f0c5&o=',
    ],
  },
  'amaya heels': {
    primaryImage: AMAYA_HILLS_PRIMARY_IMAGE,
    roomImage: AMAYA_HILLS_ROOM_IMAGE,
    gallery: [
      AMAYA_HILLS_PRIMARY_IMAGE,
      AMAYA_HILLS_ROOM_IMAGE,
      'https://cf.bstatic.com/xdata/images/hotel/max1024x768/95672257.jpg?k=2212da2809f1435333a0583115720f8b2cd5557506ea4d320d4b29ec81c7f0c5&o=',
    ],
  },
};

export function getHotelImageOverride(hotel) {
  const normalizedName = hotel?.name?.trim()?.toLowerCase?.() || '';

  if (!normalizedName) {
    return null;
  }

  return (
    hotelImageOverrides[normalizedName] ||
    Object.entries(hotelImageOverrides).find(([key]) => normalizedName.includes(key))?.[1] ||
    null
  );
}

export function getHotelMedia(hotel, fallbackImages = []) {
  const imageOverride = getHotelImageOverride(hotel);
  const backendImages = Array.isArray(fallbackImages)
    ? fallbackImages.filter((image) => typeof image === 'string' && image.trim())
    : [];
  const overrideGallery = Array.isArray(imageOverride?.gallery)
    ? imageOverride.gallery.filter((image) => typeof image === 'string' && image.trim())
    : [];
  const mergedGallery = [...overrideGallery];

  backendImages.forEach((image) => {
    if (!mergedGallery.includes(image)) {
      mergedGallery.push(image);
    }
  });

  return {
    primaryImage:
      imageOverride?.primaryImage || mergedGallery[0] || backendImages[0] || null,
    gallery: mergedGallery,
  };
}

export function getHotelPrimaryImageByName(name, fallbackImages = []) {
  const hotelMedia = getHotelMedia({ name }, fallbackImages);
  return hotelMedia.primaryImage || fallbackImages[0] || null;
}

export function getHotelRoomImageByName(name, fallbackImages = []) {
  const imageOverride = getHotelImageOverride({ name });
  const hotelMedia = getHotelMedia({ name }, fallbackImages);

  return (
    imageOverride?.roomImage ||
    hotelMedia.gallery?.[1] ||
    hotelMedia.primaryImage ||
    fallbackImages[0] ||
    null
  );
}
