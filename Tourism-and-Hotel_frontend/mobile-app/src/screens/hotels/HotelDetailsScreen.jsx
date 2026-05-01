import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  buildHotelAmenityList,
  fetchHotelDetails,
  fetchRoomsByHotel,
} from '../../api/roomHotels';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { BrandLogo } from '../../components/BrandLogo';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { HotelCard } from '../../components/hotels/HotelCard';
import { RoomCard } from '../../components/rooms/RoomCard';
import { RoomGallery } from '../../components/rooms/RoomGallery';
import { AmenityChip } from '../../components/rooms/AmenityChip';
import { getDefaultImage, resolveMediaCollection } from '../../utils/media';
import { getHotelMedia } from '../../config/hotelMedia';
import { theme } from '../../theme';

export default function HotelDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const hotelId = typeof params.hotelId === 'string' ? params.hotelId : '';
  const [state, setState] = useState({
    loading: true,
    hotel: null,
    rooms: [],
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function loadDetails() {
      try {
        const hotel = await fetchHotelDetails(hotelId);
        const rooms = await fetchRoomsByHotel(hotel.name);

        if (mounted) {
          setState({
            loading: false,
            hotel,
            rooms,
            error: null,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            hotel: null,
            rooms: [],
            error,
          });
        }
      }
    }

    loadDetails();

    return () => {
      mounted = false;
    };
  }, [hotelId]);

  const hotelAmenities = useMemo(
    () => buildHotelAmenityList(state.hotel).filter((item) => item.enabled),
    [state.hotel]
  );

  if (state.loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader title="Hotel Details" subtitle="Loading property details..." />
          <HomeSectionState loading />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (state.error || !state.hotel) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader title="Hotel Details" subtitle="We could not load this hotel." />
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load this hotel right now. Please try again.
            </Text>
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const hotelMedia = getHotelMedia(
    state.hotel,
    state.hotel.images?.length
      ? state.hotel.images.map((image) => resolveMediaCollection(image, getDefaultImage()))
      : []
  );
  const hotelImages = hotelMedia.gallery.length
    ? hotelMedia.gallery
    : [getDefaultImage()];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={state.hotel.name}
          subtitle={state.hotel.location}
          fallbackHref="/hotels"
        />

        <RoomGallery images={hotelImages} />

        <AppCard style={styles.identityCard}>
          <View style={styles.identityRow}>
            <BrandLogo size="sm" pressable href="/(tabs)" />
            <View style={styles.identityCopy}>
              <Text style={styles.identityEyebrow}>WildHaven Resort Stay</Text>
              <Text style={styles.identityTitle}>{state.hotel.name}</Text>
              <View style={styles.identityMetaRow}>
                <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.accent} />
                <Text style={styles.identityMeta}>{state.hotel.location}</Text>
                <Text style={styles.identityStars}>
                  {'★'.repeat(Number(state.hotel.starRating || 0))}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.description}>{state.hotel.description}</Text>

          <View style={styles.buttonRow}>
            <AppButton
              title="View Rooms"
              onPress={() =>
                router.push({
                  pathname: '/hotels/[hotelId]/rooms',
                  params: {
                    hotelId: state.hotel.hotelId,
                    hotelName: state.hotel.name,
                  },
                })
              }
            />
          </View>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Hotel Amenities</Text>
          <View style={styles.amenitiesWrap}>
            {hotelAmenities.map((item) => (
              <AmenityChip
                key={item.key}
                label={item.label}
                icon={item.icon}
                enabled={item.enabled}
              />
            ))}
          </View>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contact & Access</Text>
          <Text style={styles.infoLine}>Email: {state.hotel.contactEmail || 'Not provided'}</Text>
          <Text style={styles.infoLine}>Phone: {state.hotel.contactPhone || 'Not provided'}</Text>
          <Text style={styles.infoLine}>Location: {state.hotel.location}</Text>
        </AppCard>

        <View style={styles.previewHeader}>
          <Text style={styles.sectionTitle}>Available Rooms</Text>
          <Text style={styles.previewCount}>{state.rooms.length} room(s)</Text>
        </View>

        {!state.rooms.length ? (
          <HomeSectionState message="No rooms are currently available for this hotel." />
        ) : (
          state.rooms.slice(0, 3).map((room) => (
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
              onPress={() =>
                router.push({
                  pathname: '/rooms/[roomKey]',
                  params: {
                    roomKey: room.id,
                    hotelId: state.hotel.hotelId,
                    hotelName: state.hotel.name,
                  },
                })
              }
            />
          ))
        )}

        {state.rooms.length > 3 ? (
          <AppButton
            title="See All Rooms"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: '/hotels/[hotelId]/rooms',
                params: {
                  hotelId: state.hotel.hotelId,
                  hotelName: state.hotel.name,
                },
              })
            }
          />
        ) : null}
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
  identityCard: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  identityRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  identityCopy: {
    flex: 1,
    gap: 4,
  },
  identityEyebrow: {
    color: theme.colors.accent,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  identityTitle: {
    color: '#2E2419',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  identityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  identityMeta: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  identityStars: {
    color: theme.colors.accent,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  buttonRow: {
    marginTop: theme.spacing.xs,
  },
  sectionCard: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  sectionTitle: {
    color: '#2E2419',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  infoLine: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewCount: {
    color: theme.colors.accent,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
