import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { fetchRoomsList, normalizeRoomTypeValue } from '../../api/roomHotels';
import { AppCard } from '../../components/AppCard';
import { BrandLogo } from '../../components/BrandLogo';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { RoomCard } from '../../components/rooms/RoomCard';
import { useRequireAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';

export default function RoomsScreen() {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const params = useLocalSearchParams();
  const hotelId = typeof params.hotelId === 'string' ? params.hotelId : '';
  const hotelName = typeof params.hotelName === 'string' ? params.hotelName : '';
  const checkIn = typeof params.checkIn === 'string' ? params.checkIn : '';
  const checkOut = typeof params.checkOut === 'string' ? params.checkOut : '';
  const guests = typeof params.guests === 'string' ? params.guests : '';
  const roomType = typeof params.roomType === 'string' ? params.roomType : '';
  const [state, setState] = useState({
    loading: true,
    data: [],
    error: null,
    usedFallback: false,
  });

  const normalizedRequestedRoomType = normalizeRoomTypeValue(roomType);
  const requestedGuests = Number.parseInt(guests || '1', 10);

  const filterRoomsLocally = (rooms) =>
    rooms.filter((room) => {
      const roomHotelName = `${room.subtitle || ''}`.trim().toLowerCase();
      const roomRoomType = normalizeRoomTypeValue(room.title || room.raw?.roomType || room.raw?.type || room.raw?.category || room.raw?.room_type);
      const roomStatus = `${room.status || ''}`.trim().toLowerCase();

      if (hotelName && roomHotelName !== hotelName.trim().toLowerCase()) {
        return false;
      }

      if (normalizedRequestedRoomType && roomRoomType !== normalizedRequestedRoomType) {
        return false;
      }

      if (Number.isInteger(requestedGuests) && requestedGuests > 0 && Number(room.capacity || 0) < requestedGuests) {
        return false;
      }

      return roomStatus !== 'maintenance';
    });

  useEffect(() => {
    let mounted = true;

    async function loadRooms() {
      try {
        if (mounted) {
          setState({
            loading: true,
            data: [],
            error: null,
            usedFallback: false,
          });
        }

        const baseFilters = {
          hotelName,
          guests,
          roomType,
        };
        const availabilityFilters = {
          ...baseFilters,
          checkIn,
          checkOut,
        };
        console.log('[RoomsScreen] Availability params', availabilityFilters);
        console.log('[RoomsScreen] Selected roomType', roomType, normalizedRequestedRoomType);
        let rooms = await fetchRoomsList(availabilityFilters);
        let usedFallback = false;
        console.log('[RoomsScreen] Rooms after backend search', rooms.length);

        if (!rooms.length && (checkIn || checkOut)) {
          const allRooms = await fetchRoomsList({});
          rooms = filterRoomsLocally(allRooms);
          usedFallback = rooms.length > 0;
          console.log('[RoomsScreen] Rooms after fallback filter', rooms.length);
        }

        if (mounted) {
          setState({
            loading: false,
            data: rooms,
            error: null,
            usedFallback,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            data: [],
            error,
            usedFallback: false,
          });
        }
      }
    }

    loadRooms();

    return () => {
      mounted = false;
    };
  }, [checkIn, checkOut, guests, hotelName, roomType]);

  const title = hotelName ? `${hotelName} Rooms` : 'Rooms';
  const subtitle = hotelName
    ? 'Browse the available rooms for this selected hotel before opening the full room details page.'
    : state.usedFallback
      ? 'No exact rooms were free for those dates, so we are showing similar rooms that still match your stay preferences.'
    : checkIn || checkOut || guests || roomType
      ? 'Showing rooms that match your selected stay preferences and availability search.'
      : 'Browse all available rooms across your WildHaven hotel collection.';

  const handleViewDetails = (room) => {
    router.push({
      pathname: '/rooms/[roomKey]',
      params: {
        roomKey: room.id,
        hotelId,
        hotelName: hotelName || room.subtitle,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guests,
      },
    });
  };

  const handleBookNow = (room) => {
    const targetPath = `/rooms/${room.id}/book?checkInDate=${encodeURIComponent(checkIn)}&checkOutDate=${encodeURIComponent(checkOut)}&guests=${encodeURIComponent(guests || '1')}`;

    if (!requireAuth(targetPath, { message: 'Please login or sign up to book this room' })) {
      return;
    }

    router.push({
      pathname: '/rooms/[roomKey]/book',
      params: {
        roomKey: room.id,
        hotelId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guests: guests || '1',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={title} subtitle={subtitle} fallbackHref={hotelId ? `/hotels/${hotelId}` : '/(tabs)'} />

        <AppCard variant="primary" style={styles.heroCard}>
          <BrandLogo size="sm" pressable href="/(tabs)" />
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroSubtitle}>{subtitle}</Text>
        </AppCard>

        {state.loading ? <HomeSectionState loading /> : null}

        {!state.loading && state.error ? (
          <AppCard variant="danger">
            <Text style={styles.errorText}>{state.error?.message || 'Unable to load rooms right now.'}</Text>
          </AppCard>
        ) : null}

        {!state.loading && !state.data.length ? (
          <HomeSectionState message="No rooms match your selected dates and stay preferences." />
        ) : null}

        {!state.loading &&
          state.data.map((room) => (
            <RoomCard
              key={room.id}
              title={room.title}
              hotelName={room.subtitle}
              description={room.description}
              imageUrl={room.imageUrl}
              priceLabel={room.priceLabel}
              capacity={room.capacity}
              roomNumber={room.roomNumber}
              status={room.status}
              facilities={room.facilities}
              actionLabel="View Details"
              secondaryActionLabel="Book Now"
              onPress={() => handleViewDetails(room)}
              onSecondaryPress={() => handleBookNow(room)}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  heroCard: {
    gap: theme.spacing.sm,
  },
  heroTitle: {
    color: theme.colors.textOnDark,
    ...theme.typography.screenTitle,
  },
  heroSubtitle: {
    color: '#DDE7F4',
    ...theme.typography.body,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
