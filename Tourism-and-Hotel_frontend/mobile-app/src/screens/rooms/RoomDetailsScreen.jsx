import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  buildRoomAmenityList,
  calculateRoomPriceBreakdown,
  fetchHotelByName,
  fetchRoomDetails,
  getDefaultRoomPolicies,
} from '../../api/roomHotels';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { GuestCounter } from '../../components/bookings/GuestCounter';
import { DatePickerField } from '../../components/common/DatePickerField';
import { AmenityChip } from '../../components/rooms/AmenityChip';
import { BookingSummaryCard } from '../../components/rooms/BookingSummaryCard';
import { RoomGallery } from '../../components/rooms/RoomGallery';
import { useRequireAuth } from '../../hooks/useAuth';
import { getDefaultImage, resolveMediaCollection } from '../../utils/media';
import { theme } from '../../theme';

function formatDisplayDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTomorrow(offset = 1) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return formatDisplayDate(date);
}

export default function RoomDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const roomKey = typeof params.roomKey === 'string' ? params.roomKey : '';
  const initialCheckInDate =
    typeof params.checkInDate === 'string' && params.checkInDate ? params.checkInDate : getTomorrow(1);
  const initialCheckOutDate =
    typeof params.checkOutDate === 'string' && params.checkOutDate ? params.checkOutDate : getTomorrow(2);
  const initialGuests = Number.parseInt(typeof params.guests === 'string' ? params.guests : '1', 10);
  const [checkInDate, setCheckInDate] = useState(initialCheckInDate);
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOutDate);
  const [guests, setGuests] = useState(Number.isInteger(initialGuests) && initialGuests > 0 ? initialGuests : 1);
  const [state, setState] = useState({
    loading: true,
    room: null,
    hotel: null,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function loadDetails() {
      try {
        const room = await fetchRoomDetails(roomKey);
        const hotel = await fetchHotelByName(room.hotelName);

        if (mounted) {
          setState({
            loading: false,
            room,
            hotel,
            error: null,
          });
          setGuests(Math.min(room.capacity || 1, 1));
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            room: null,
            hotel: null,
            error,
          });
        }
      }
    }

    loadDetails();

    return () => {
      mounted = false;
    };
  }, [roomKey]);

  const amenities = useMemo(() => buildRoomAmenityList(state.room), [state.room]);
  const policies = useMemo(() => getDefaultRoomPolicies(), []);
  const breakdown = useMemo(
    () => calculateRoomPriceBreakdown(state.room?.price, checkInDate, checkOutDate),
    [checkInDate, checkOutDate, state.room?.price]
  );

  if (state.loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader title="Room Details" subtitle="Loading room details..." />
          <HomeSectionState loading />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (state.error || !state.room) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader title="Room Details" subtitle="We could not load this room." />
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load this room right now. Please try again.
            </Text>
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const roomImages =
    state.room.images?.map((image) => resolveMediaCollection(image, getDefaultImage())) || [
      getDefaultImage(),
    ];

  const handleReserveNow = () => {
    const targetPath = `/rooms/${roomKey}/book?checkInDate=${encodeURIComponent(checkInDate)}&checkOutDate=${encodeURIComponent(checkOutDate)}&guests=${guests}`;

    if (!requireAuth(targetPath)) {
      return;
    }

    router.push({
      pathname: '/rooms/[roomKey]/book',
      params: {
        roomKey,
        checkInDate,
        checkOutDate,
        guests: String(guests),
        hotelId: state.hotel?.hotelId || '',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={state.room.roomType}
          subtitle={state.room.hotelName}
          fallbackHref={state.hotel ? `/hotels/${state.hotel.hotelId}/rooms` : '/rooms'}
        />

        <RoomGallery images={roomImages} />

        <View style={styles.identityShell}>
          <AppCard style={styles.identityCard}>
            {state.hotel ? (
              <View style={styles.hotelMiniRow}>
                <View style={styles.hotelThumb}>
                  <MaterialCommunityIcons name="home-city" size={18} color={theme.colors.accent} />
                </View>
                <View style={styles.hotelMiniCopy}>
                  <Text style={styles.hotelMiniName}>{state.hotel.name}</Text>
                  <View style={styles.hotelMiniMeta}>
                    <MaterialCommunityIcons name="map-marker" size={14} color={theme.colors.accent} />
                    <Text style={styles.hotelMiniLocation}>{state.hotel.location}</Text>
                    <Text style={styles.hotelMiniStars}>
                      {'★'.repeat(Number(state.hotel.starRating || 0))}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            <Text style={styles.roomTitle}>{state.room.roomType}</Text>

            <View style={styles.roomMetaRow}>
              <View style={styles.roomMetaItem}>
                <MaterialCommunityIcons name="door" size={16} color={theme.colors.textMuted} />
                <Text style={styles.roomMetaText}>Room {state.room.roomNumber}</Text>
              </View>

              <View style={styles.roomMetaItem}>
                <MaterialCommunityIcons name="account-group" size={16} color="#5B3A8A" />
                <Text style={styles.roomMetaText}>Up to {state.room.capacity} guests</Text>
              </View>

              <StatusBadge
                label={state.room.status || 'Available'}
                variant={state.room.status === 'Available' ? 'primary' : 'warning'}
              />
            </View>
          </AppCard>

          <AppCard style={styles.bookingCueCard}>
            <View style={styles.bookingCueHead}>
              <MaterialCommunityIcons name="calendar-check-outline" size={22} color={theme.colors.accent} />
              <Text style={styles.bookingCueTitle}>Booking Snapshot</Text>
            </View>
            <Text style={styles.bookingCueText}>
              Adjust your dates and guest count here, then continue with the same protected WildHaven booking flow.
            </Text>
          </AppCard>

          <BookingSummaryCard
            pricePerNight={state.room.price}
            checkInDate={checkInDate}
            checkOutDate={checkOutDate}
            nights={breakdown.nights}
            subtotal={breakdown.subtotal}
            tax={breakdown.tax}
            total={breakdown.total}
            buttonLabel="Reserve Now"
            onPress={handleReserveNow}
            disabled={!breakdown.nights}
          />
        </View>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Stay Preview</Text>
          <Text style={styles.sectionHelperText}>
            Fine-tune your stay details before opening the final booking screen.
          </Text>
          <View style={styles.dateFieldRow}>
            <DatePickerField
              label="Check-In"
              value={checkInDate}
              onChange={setCheckInDate}
              placeholder="YYYY-MM-DD"
              minimumDate={getTomorrow(0)}
              style={styles.goldField}
            />
            <DatePickerField
              label="Check-Out"
              value={checkOutDate}
              onChange={setCheckOutDate}
              placeholder="YYYY-MM-DD"
              minimumDate={checkInDate || getTomorrow(1)}
              style={styles.goldField}
            />
          </View>

          <View style={styles.guestWrap}>
            <Text style={styles.guestLabel}>Guests</Text>
            <GuestCounter value={guests} max={state.room.capacity || 1} onChange={setGuests} />
          </View>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About this room</Text>
          <Text style={styles.sectionBody}>{state.room.description}</Text>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesWrap}>
            {amenities.map((amenity) => (
              <AmenityChip
                key={amenity.key}
                label={amenity.label}
                icon={amenity.icon}
                enabled={amenity.enabled}
              />
            ))}
          </View>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Policies</Text>
          <View style={styles.policyWrap}>
            {policies.map((policy) => (
              <View key={policy.key} style={styles.policyCard}>
                <Text style={styles.policyTitle}>{policy.title}</Text>
                <Text style={styles.policyValue}>{policy.value}</Text>
              </View>
            ))}
          </View>
        </AppCard>
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
  identityShell: {
    gap: theme.spacing.lg,
  },
  identityCard: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  bookingCueCard: {
    gap: theme.spacing.sm,
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE5F1',
  },
  bookingCueHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  bookingCueTitle: {
    color: '#22324D',
    ...theme.typography.sectionTitle,
  },
  bookingCueText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  hotelMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  hotelThumb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF5E3',
    borderWidth: 1,
    borderColor: '#F2D7A1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotelMiniCopy: {
    flex: 1,
    gap: 2,
  },
  hotelMiniName: {
    color: theme.colors.accent,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  hotelMiniMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  hotelMiniLocation: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  hotelMiniStars: {
    color: theme.colors.accent,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  roomTitle: {
    color: '#2E2419',
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '800',
  },
  roomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  roomMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomMetaText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '600',
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
  sectionBody: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  sectionHelperText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    marginTop: -4,
  },
  dateFieldRow: {
    gap: theme.spacing.sm,
  },
  goldField: {
    backgroundColor: '#FFF7D9',
    borderColor: '#F0C24E',
  },
  guestWrap: {
    gap: theme.spacing.sm,
  },
  guestLabel: {
    color: '#857867',
    ...theme.typography.eyebrow,
  },
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  policyWrap: {
    gap: theme.spacing.md,
  },
  policyCard: {
    borderWidth: 1,
    borderColor: '#EADFCB',
    borderRadius: theme.radii.lg,
    backgroundColor: '#FFF9F0',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  policyTitle: {
    color: '#8B7D6A',
    ...theme.typography.eyebrow,
  },
  policyValue: {
    color: '#2E2419',
    ...theme.typography.body,
    fontWeight: '700',
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
