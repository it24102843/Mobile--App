import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/AppButton';
import { AppSelectField } from '../../components/AppSelectField';
import { AppTextField } from '../../components/AppTextField';
import { ScreenHeader } from '../../components/ScreenHeader';
import { AdminTabs } from '../../components/admin/AdminTabs';
import { BookingAdminCard } from '../../components/admin/BookingAdminCard';
import { HotelAdminCard } from '../../components/admin/HotelAdminCard';
import { RoomAdminCard } from '../../components/admin/RoomAdminCard';
import { useAuth } from '../../context/AuthContext';
import {
  approveRoomBookingRecord,
  createHotelRecord,
  createRoomRecord,
  deleteHotelRecord,
  deleteRoomRecord,
  extractAdminHotelRoomError,
  fetchHotelRoomManagementData,
  HOTEL_STATUS_OPTIONS,
  ROOM_STATUS_OPTIONS,
  ROOM_TYPE_OPTIONS,
  rejectRoomBookingRecord,
  updateHotelRecord,
  updateRoomRecord,
} from '../../services/adminHotelRoomApi';
import { getDefaultImage } from '../../utils/media';
import { theme } from '../../theme';

const TAB_OPTIONS = [
  { label: 'Hotels', value: 'hotels' },
  { label: 'All Rooms', value: 'rooms' },
  { label: 'Bookings', value: 'bookings' },
];

const INITIAL_HOTEL_FORM = {
  name: '',
  location: '',
  description: '',
  starRating: '3',
  imageUrl: '',
  status: 'active',
};

const INITIAL_ROOM_FORM = {
  hotelName: '',
  roomNumber: '',
  roomType: '',
  description: '',
  price: '',
  capacity: '2',
  imageUrl: '',
  status: 'Available',
};

function normalizeString(value) {
  return `${value ?? ''}`.trim().toLowerCase();
}

function createHotelId(name) {
  const slug = normalizeString(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `HTL-${slug || 'hotel'}-${Date.now()}`;
}

function createRoomKey(roomNumber) {
  const sanitizedNumber = `${roomNumber ?? ''}`.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return `RM-${sanitizedNumber || 'ROOM'}-${Date.now()}`;
}

function isValidImageUrl(value) {
  if (!value) {
    return true;
  }

  return /^https?:\/\/\S+$/i.test(value.trim());
}

function formatBookingDate(value) {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return `${value}`;
  }

  return date.toLocaleDateString('en-CA');
}

function FormSheet({
  visible,
  title,
  subtitle,
  children,
  onClose,
}) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View style={styles.modalCopy}>
              <Text style={styles.modalTitle}>{title}</Text>
              {subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}
            </View>

            <Pressable onPress={onClose} style={styles.modalCloseButton}>
              <MaterialCommunityIcons name="close" size={22} color={theme.colors.primary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContent}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EmptyState({ icon, title, message }) {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name={icon} size={34} color={theme.colors.textSubtle} />
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateMessage}>{message}</Text>
    </View>
  );
}

export default function HotelRoomManagementScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('hotels');
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboard, setDashboard] = useState({ hotels: [], rooms: [], bookings: [], counts: {} });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [hotelModalVisible, setHotelModalVisible] = useState(false);
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [hotelForm, setHotelForm] = useState(INITIAL_HOTEL_FORM);
  const [roomForm, setRoomForm] = useState(INITIAL_ROOM_FORM);
  const [hotelFormErrors, setHotelFormErrors] = useState({});
  const [roomFormErrors, setRoomFormErrors] = useState({});
  const [submittingHotel, setSubmittingHotel] = useState(false);
  const [submittingRoom, setSubmittingRoom] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingActionId, setBookingActionId] = useState(null);

  useEffect(() => {
    void loadDashboard();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void loadDashboard(true);
      }
    }, [token])
  );

  async function loadDashboard(isRefresh = false) {
    if (!token) {
      return;
    }

    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await fetchHotelRoomManagementData(token);
      setDashboard(response);
    } catch (loadError) {
      setError(extractAdminHotelRoomError(loadError, 'Unable to load hotel and room data.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredHotels = useMemo(() => {
    const query = normalizeString(searchQuery);

    if (!query) {
      return dashboard.hotels;
    }

    return dashboard.hotels.filter((hotel) =>
      [hotel.name, hotel.location, hotel.hotelId].some((value) =>
        normalizeString(value).includes(query)
      )
    );
  }, [dashboard.hotels, searchQuery]);

  const filteredRooms = useMemo(() => {
    const query = normalizeString(searchQuery);

    if (!query) {
      return dashboard.rooms;
    }

    return dashboard.rooms.filter((room) =>
      [room.roomType, room.roomNumber, room.hotelName].some((value) =>
        normalizeString(value).includes(query)
      )
    );
  }, [dashboard.rooms, searchQuery]);

  const filteredBookings = useMemo(() => {
    const query = normalizeString(searchQuery);

    const formattedBookings = dashboard.bookings.map((booking) => ({
      ...booking,
      checkInDate: formatBookingDate(booking.checkInDate),
      checkOutDate: formatBookingDate(booking.checkOutDate),
    }));

    if (!query) {
      return formattedBookings;
    }

    return formattedBookings.filter((booking) =>
      [
        booking.bookingId,
        booking.guestLabel,
        booking.hotelLabel,
        booking.roomLabel,
        booking.bookingStatus,
      ].some((value) => normalizeString(value).includes(query))
    );
  }, [dashboard.bookings, searchQuery]);

  const hotelOptions = useMemo(
    () =>
      dashboard.hotels.map((hotel) => ({
        label: hotel.name,
        value: hotel.name,
      })),
    [dashboard.hotels]
  );

  function openAddHotelModal() {
    router.push('/admin/hotels-add');
  }

  function openEditHotelModal(hotel) {
    router.push(`/admin/hotels-edit/${hotel.hotelId}`);
  }

  function openAddRoomModal() {
    if (dashboard.hotels.length === 0) {
      Alert.alert('Add a hotel first', 'Create at least one hotel before adding rooms.');
      return;
    }

    router.push('/admin/rooms-add');
  }

  function openEditRoomModal(room) {
    router.push(`/admin/rooms-edit/${room.key}`);
  }

  function validateHotelForm() {
    const nextErrors = {};
    const starRating = Number(hotelForm.starRating);
    const hotelName = hotelForm.name.trim();
    const location = hotelForm.location.trim();
    const description = hotelForm.description.trim();
    const imageUrl = hotelForm.imageUrl.trim();
    const duplicateHotel = dashboard.hotels.find((hotel) => {
      if (selectedHotel && hotel.hotelId === selectedHotel.hotelId) {
        return false;
      }

      return normalizeString(hotel.name) === normalizeString(hotelName);
    });

    if (!hotelName) {
      nextErrors.name = 'Hotel name is required.';
    } else if (duplicateHotel) {
      nextErrors.name = 'A hotel with this name already exists.';
    }

    if (!location) {
      nextErrors.location = 'Location is required.';
    }

    if (!description) {
      nextErrors.description = 'Description is required.';
    }

    if (!Number.isFinite(starRating) || starRating < 1 || starRating > 5) {
      nextErrors.starRating = 'Star rating must be between 1 and 5.';
    }

    if (!isValidImageUrl(imageUrl)) {
      nextErrors.imageUrl = 'Image URL must start with http:// or https://';
    }

    if (!HOTEL_STATUS_OPTIONS.some((option) => option.value === hotelForm.status)) {
      nextErrors.status = 'Please choose a valid hotel status.';
    }

    if (
      selectedHotel &&
      selectedHotel.roomCount > 0 &&
      normalizeString(selectedHotel.name) !== normalizeString(hotelName)
    ) {
      nextErrors.name =
        'Rename is blocked while this hotel already has rooms. Keep the same hotel name to protect linked rooms.';
    }

    setHotelFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateRoomForm() {
    const nextErrors = {};
    const price = Number(roomForm.price);
    const capacity = Number(roomForm.capacity);
    const roomNumber = `${roomForm.roomNumber}`.trim();
    const imageUrl = roomForm.imageUrl.trim();
    const duplicateRoom = dashboard.rooms.find((room) => {
      if (selectedRoom && room.key === selectedRoom.key) {
        return false;
      }

      return (
        normalizeString(room.hotelName) === normalizeString(roomForm.hotelName) &&
        normalizeString(room.roomNumber) === normalizeString(roomNumber)
      );
    });

    if (!roomForm.hotelName) {
      nextErrors.hotelName = 'Please select a hotel.';
    }

    if (!roomNumber) {
      nextErrors.roomNumber = 'Room number is required.';
    } else if (duplicateRoom) {
      nextErrors.roomNumber = 'This room number already exists in the selected hotel.';
    }

    if (!roomForm.roomType) {
      nextErrors.roomType = 'Please choose a room type.';
    }

    if (!roomForm.description.trim()) {
      nextErrors.description = 'Description is required.';
    }

    if (!Number.isFinite(price) || price <= 0) {
      nextErrors.price = 'Price must be a positive number.';
    }

    if (!Number.isFinite(capacity) || capacity < 1) {
      nextErrors.capacity = 'Guest capacity must be at least 1.';
    }

    if (!isValidImageUrl(imageUrl)) {
      nextErrors.imageUrl = 'Image URL must start with http:// or https://';
    }

    if (!ROOM_STATUS_OPTIONS.some((option) => option.value === roomForm.status)) {
      nextErrors.status = 'Please choose a valid room status.';
    }

    setRoomFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleHotelSubmit() {
    if (!validateHotelForm()) {
      return;
    }

    const payload = {
      ...(selectedHotel ? {} : { hotelId: createHotelId(hotelForm.name) }),
      name: hotelForm.name.trim(),
      location: hotelForm.location.trim(),
      description: hotelForm.description.trim(),
      starRating: Number(hotelForm.starRating),
      images: [hotelForm.imageUrl.trim() || getDefaultImage()],
      isActive: hotelForm.status === 'active',
      contactEmail: selectedHotel?.contactEmail || '',
      contactPhone: selectedHotel?.contactPhone || '',
      amenities: selectedHotel?.amenities || {
        pool: false,
        spa: false,
        gym: false,
        restaurant: false,
        bar: false,
        beachAccess: false,
      },
    };

    try {
      setSubmittingHotel(true);

      if (selectedHotel) {
        await updateHotelRecord(token, selectedHotel.hotelId, payload);
        Alert.alert('Hotel updated', 'The hotel details were saved successfully.');
      } else {
        await createHotelRecord(token, payload);
        Alert.alert('Hotel added', 'The new hotel was created successfully.');
      }

      setHotelModalVisible(false);
      await loadDashboard(true);
    } catch (submitError) {
      Alert.alert(
        'Unable to save hotel',
        extractAdminHotelRoomError(submitError, 'Hotel save failed.')
      );
    } finally {
      setSubmittingHotel(false);
    }
  }

  async function handleRoomSubmit() {
    if (!validateRoomForm()) {
      return;
    }

    const payload = {
      ...(selectedRoom ? {} : { key: createRoomKey(roomForm.roomNumber) }),
      roomNumber: `${roomForm.roomNumber}`.trim(),
      hotelName: roomForm.hotelName,
      roomType: roomForm.roomType,
      description: roomForm.description.trim(),
      price: Number(roomForm.price),
      capacity: Number(roomForm.capacity),
      images: [roomForm.imageUrl.trim() || getDefaultImage()],
      status: roomForm.status,
      availability: roomForm.status === 'Available',
      facilities: selectedRoom?.facilities || {
        ac: false,
        wifi: true,
        parking: false,
        tv: false,
        hotWater: true,
        miniBar: false,
      },
    };

    try {
      setSubmittingRoom(true);

      if (selectedRoom) {
        await updateRoomRecord(token, selectedRoom.key, payload);
        Alert.alert('Room updated', 'The room details were saved successfully.');
      } else {
        await createRoomRecord(token, payload);
        Alert.alert('Room added', 'The new room was created successfully.');
      }

      setRoomModalVisible(false);
      await loadDashboard(true);
    } catch (submitError) {
      Alert.alert(
        'Unable to save room',
        extractAdminHotelRoomError(submitError, 'Room save failed.')
      );
    } finally {
      setSubmittingRoom(false);
    }
  }

  function handleHotelDelete(hotel) {
    if (hotel.hasBookedRooms) {
      Alert.alert(
        'Cannot delete hotel',
        'Cannot delete. This item has booking history. You can mark it as inactive instead.'
      );
      return;
    }

    Alert.alert(
      'Delete hotel?',
      `Delete ${hotel.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHotelRecord(token, hotel.hotelId);
              Alert.alert('Hotel deleted', 'The hotel was removed successfully.');
              await loadDashboard(true);
            } catch (deleteError) {
              Alert.alert(
                'Unable to delete hotel',
                extractAdminHotelRoomError(deleteError, 'Hotel delete failed.')
              );
            }
          },
        },
      ]
    );
  }

  function handleRoomDelete(room) {
    if (room.hasBookingHistory) {
      Alert.alert(
        'Cannot delete room',
        'Cannot delete. This item has booking history. You can mark it as inactive instead.'
      );
      return;
    }

    Alert.alert(
      'Delete room?',
      `Delete ${room.roomType} - Room ${room.roomNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRoomRecord(token, room.key);
              Alert.alert('Room deleted', 'The room was removed successfully.');
              await loadDashboard(true);
            } catch (deleteError) {
              Alert.alert(
                'Unable to delete room',
                extractAdminHotelRoomError(deleteError, 'Room delete failed.')
              );
            }
          },
        },
      ]
    );
  }

  async function handleBookingAction(bookingId, actionType) {
    const booking = dashboard.bookings.find((item) => item.bookingId === bookingId);

    if (!booking) {
      Alert.alert('Booking missing', 'This booking could not be found. Please refresh the list.');
      return;
    }

    const status = `${booking.bookingStatus ?? ''}`.toLowerCase();
    if (status === 'confirmed' || status === 'cancelled') {
      Alert.alert(
        'Action blocked',
        'Only pending bookings can be approved or rejected from this screen.'
      );
      return;
    }

    try {
      setBookingActionId(bookingId);

      if (actionType === 'approve') {
        await approveRoomBookingRecord(token, bookingId);
        Alert.alert('Booking approved', 'The room booking is now confirmed.');
      } else {
        await rejectRoomBookingRecord(token, bookingId);
        Alert.alert('Booking rejected', 'The room booking was rejected.');
      }

      await loadDashboard(true);
    } catch (actionError) {
      Alert.alert(
        'Action failed',
        extractAdminHotelRoomError(actionError, 'Unable to update booking status.')
      );
    } finally {
      setBookingActionId(null);
    }
  }

  function renderContent() {
    if (loading) {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText}>Loading hotel, room, and booking data...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateCard}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={28}
            color={theme.colors.danger}
          />
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Try Again" onPress={() => void loadDashboard()} />
        </View>
      );
    }

    if (activeTab === 'hotels') {
      if (filteredHotels.length === 0) {
        return (
          <EmptyState
            icon="home-city-outline"
            title="No hotels found"
            message="Try a different search, or add your first hotel to start managing rooms."
          />
        );
      }

      return filteredHotels.map((hotel) => (
        <HotelAdminCard
          key={hotel.hotelId}
          hotel={hotel}
          onEdit={() => openEditHotelModal(hotel)}
          onDelete={() => handleHotelDelete(hotel)}
          deleteDisabled={hotel.hasBookedRooms}
          deleteDisabledReason={
            hotel.hasBookedRooms
              ? 'Cannot delete. This item has booking history. You can mark it as inactive instead.'
              : ''
          }
        />
      ));
    }

    if (activeTab === 'rooms') {
      if (filteredRooms.length === 0) {
        return (
          <EmptyState
            icon="bed-king-outline"
            title="No rooms found"
            message="Try a different search or add a room to the selected hotel inventory."
          />
        );
      }

      return filteredRooms.map((room) => (
        <RoomAdminCard
          key={room.key}
          room={room}
          onEdit={() => openEditRoomModal(room)}
          onDelete={() => handleRoomDelete(room)}
          deleteDisabled={room.hasBookingHistory}
          deleteDisabledReason={
            room.hasBookingHistory
              ? 'Cannot delete. This item has booking history. You can mark it as inactive instead.'
              : ''
          }
        />
      ));
    }

    if (filteredBookings.length === 0) {
      return (
        <EmptyState
          icon="file-document-outline"
          title="No bookings found"
          message="When room bookings are created, they will appear here for admin review."
        />
      );
    }

    return filteredBookings.map((booking) => (
      <View key={booking.bookingId} style={styles.bookingWrap}>
        <BookingAdminCard
          booking={booking}
          actionDisabled={bookingActionId === booking.bookingId}
          onApprove={() => {
            Alert.alert(
              'Approve booking?',
              `Approve booking ${booking.bookingId} for ${booking.guestLabel}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Approve',
                  onPress: () => void handleBookingAction(booking.bookingId, 'approve'),
                },
              ]
            );
          }}
          onReject={() => {
            Alert.alert(
              'Reject booking?',
              `Reject booking ${booking.bookingId}? This will mark it as cancelled.`,
              [
                { text: 'Keep Pending', style: 'cancel' },
                {
                  text: 'Reject',
                  style: 'destructive',
                  onPress: () => void handleBookingAction(booking.bookingId, 'reject'),
                },
              ]
            );
          }}
        />

        {bookingActionId === booking.bookingId ? (
          <View style={styles.bookingActionOverlay}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.bookingActionText}>Updating booking...</Text>
          </View>
        ) : null}
      </View>
    ));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <ScreenHeader
            title="Hotel & Room Management"
            subtitle={`Manage your hotels and rooms - ${dashboard.counts.hotels || 0} hotels - ${
              dashboard.counts.rooms || 0
            } rooms`}
            fallbackHref="/admin"
          />

          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryLabel}>Hotels</Text>
              <Text style={styles.summaryValue}>{dashboard.counts.hotels || 0}</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryLabel}>Rooms</Text>
              <Text style={styles.summaryValue}>{dashboard.counts.rooms || 0}</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryLabel}>Bookings</Text>
              <Text style={styles.summaryValue}>{dashboard.counts.bookings || 0}</Text>
            </View>
          </View>

          <AdminTabs tabs={TAB_OPTIONS} activeTab={activeTab} onChange={setActiveTab} />

          <AppTextField
            label="Search"
            placeholder="Search hotels by name or location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {activeTab !== 'bookings' ? (
            <View style={styles.actionRow}>
              <View style={styles.actionButtonWrap}>
                <AppButton title="+ Add Hotel" onPress={openAddHotelModal} />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={openAddRoomModal}
                style={({ pressed }) => [
                  styles.addRoomButton,
                  pressed ? styles.pressed : null,
                ]}>
                <Text style={styles.addRoomButtonText}>+ Add Room</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.actionRow}>
              <View style={styles.refreshButtonWrap}>
                <AppButton
                  title={refreshing ? 'Refreshing...' : 'Refresh Bookings'}
                  onPress={() => void loadDashboard(true)}
                  disabled={refreshing}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.listSection}>{renderContent()}</View>
      </ScrollView>

      <FormSheet
        visible={hotelModalVisible}
        onClose={() => !submittingHotel && setHotelModalVisible(false)}
        title={selectedHotel ? 'Edit Hotel' : 'Add Hotel'}
        subtitle="Save complete hotel details with real backend validation.">
        <AppTextField
          label="Hotel Name"
          value={hotelForm.name}
          onChangeText={(value) => setHotelForm((current) => ({ ...current, name: value }))}
          error={hotelFormErrors.name}
          placeholder="WildHaven Resort"
        />
        <AppTextField
          label="Location"
          value={hotelForm.location}
          onChangeText={(value) =>
            setHotelForm((current) => ({ ...current, location: value }))
          }
          error={hotelFormErrors.location}
          placeholder="Ella, Sri Lanka"
        />
        <AppTextField
          label="Description"
          value={hotelForm.description}
          onChangeText={(value) =>
            setHotelForm((current) => ({ ...current, description: value }))
          }
          error={hotelFormErrors.description}
          placeholder="Write a short hotel description..."
          multiline
        />
        <AppTextField
          label="Star Rating"
          value={hotelForm.starRating}
          onChangeText={(value) =>
            setHotelForm((current) => ({ ...current, starRating: value }))
          }
          error={hotelFormErrors.starRating}
          placeholder="3"
          keyboardType="numeric"
        />
        <AppTextField
          label="Image URL"
          value={hotelForm.imageUrl}
          onChangeText={(value) =>
            setHotelForm((current) => ({ ...current, imageUrl: value }))
          }
          error={hotelFormErrors.imageUrl}
          placeholder="https://..."
        />
        <AppSelectField
          label="Status"
          value={hotelForm.status}
          options={HOTEL_STATUS_OPTIONS}
          onChange={(value) => setHotelForm((current) => ({ ...current, status: value }))}
          error={hotelFormErrors.status}
        />

        <View style={styles.modalActionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setHotelModalVisible(false)}
            style={({ pressed }) => [styles.modalGhostButton, pressed ? styles.pressed : null]}>
            <Text style={styles.modalGhostButtonText}>Cancel</Text>
          </Pressable>
          <View style={styles.modalPrimaryWrap}>
            <AppButton
              title={submittingHotel ? 'Saving...' : selectedHotel ? 'Save Hotel' : 'Create Hotel'}
              onPress={() => void handleHotelSubmit()}
              disabled={submittingHotel}
            />
          </View>
        </View>
      </FormSheet>

      <FormSheet
        visible={roomModalVisible}
        onClose={() => !submittingRoom && setRoomModalVisible(false)}
        title={selectedRoom ? 'Edit Room' : 'Add Room'}
        subtitle="Create or update room inventory inside the selected hotel.">
        <AppSelectField
          label="Hotel"
          value={roomForm.hotelName}
          options={hotelOptions}
          onChange={(value) => setRoomForm((current) => ({ ...current, hotelName: value }))}
          error={roomFormErrors.hotelName}
        />
        <AppTextField
          label="Room Number"
          value={roomForm.roomNumber}
          onChangeText={(value) => setRoomForm((current) => ({ ...current, roomNumber: value }))}
          error={roomFormErrors.roomNumber}
          placeholder="101"
        />
        <AppSelectField
          label="Room Type"
          value={roomForm.roomType}
          options={ROOM_TYPE_OPTIONS}
          onChange={(value) => setRoomForm((current) => ({ ...current, roomType: value }))}
          error={roomFormErrors.roomType}
        />
        <AppTextField
          label="Description"
          value={roomForm.description}
          onChangeText={(value) =>
            setRoomForm((current) => ({ ...current, description: value }))
          }
          error={roomFormErrors.description}
          placeholder="Describe this room..."
          multiline
        />
        <AppTextField
          label="Price"
          value={roomForm.price}
          onChangeText={(value) => setRoomForm((current) => ({ ...current, price: value }))}
          error={roomFormErrors.price}
          placeholder="18500"
          keyboardType="numeric"
        />
        <AppTextField
          label="Capacity"
          value={roomForm.capacity}
          onChangeText={(value) => setRoomForm((current) => ({ ...current, capacity: value }))}
          error={roomFormErrors.capacity}
          placeholder="2"
          keyboardType="numeric"
        />
        <AppTextField
          label="Image URL"
          value={roomForm.imageUrl}
          onChangeText={(value) => setRoomForm((current) => ({ ...current, imageUrl: value }))}
          error={roomFormErrors.imageUrl}
          placeholder="https://..."
        />
        <AppSelectField
          label="Availability Status"
          value={roomForm.status}
          options={ROOM_STATUS_OPTIONS}
          onChange={(value) => setRoomForm((current) => ({ ...current, status: value }))}
          error={roomFormErrors.status}
        />

        <View style={styles.modalActionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setRoomModalVisible(false)}
            style={({ pressed }) => [styles.modalGhostButton, pressed ? styles.pressed : null]}>
            <Text style={styles.modalGhostButtonText}>Cancel</Text>
          </Pressable>
          <View style={styles.modalPrimaryWrap}>
            <AppButton
              title={submittingRoom ? 'Saving...' : selectedRoom ? 'Save Room' : 'Create Room'}
              onPress={() => void handleRoomSubmit()}
              disabled={submittingRoom}
            />
          </View>
        </View>
      </FormSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF2F7',
  },
  contentContainer: {
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  heroCard: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F1',
    padding: 20,
    gap: theme.spacing.lg,
    ...theme.shadows.card,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  summaryPill: {
    flexGrow: 1,
    minWidth: 96,
    borderRadius: theme.radii.lg,
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E2E8F1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  summaryLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
  },
  summaryValue: {
    color: '#13233E',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionButtonWrap: {
    flex: 1,
    minWidth: 150,
  },
  refreshButtonWrap: {
    minWidth: 180,
  },
  addRoomButton: {
    flex: 1,
    minWidth: 150,
    minHeight: 54,
    borderRadius: theme.radii.lg,
    backgroundColor: '#7D61F5',
    borderWidth: 1,
    borderColor: '#7D61F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    ...theme.shadows.subtle,
  },
  addRoomButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  listSection: {
    gap: theme.spacing.lg,
  },
  stateCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F1',
    padding: 24,
    alignItems: 'center',
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  stateText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  errorText: {
    color: theme.colors.errorText,
    textAlign: 'center',
    ...theme.typography.body,
  },
  emptyState: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F1',
    padding: 28,
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.shadows.card,
  },
  emptyStateTitle: {
    color: '#13233E',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyStateMessage: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    ...theme.typography.body,
  },
  bookingWrap: {
    position: 'relative',
  },
  bookingActionOverlay: {
    position: 'absolute',
    right: 18,
    top: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: '#E2E8F1',
  },
  bookingActionText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
  },
  modalSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: theme.spacing.md,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 54,
    height: 5,
    borderRadius: theme.radii.pill,
    backgroundColor: '#D4DBE7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  modalCopy: {
    flex: 1,
    gap: 4,
  },
  modalTitle: {
    color: '#13233E',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  modalCloseButton: {
    width: 42,
    height: 42,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E2E8F1',
  },
  modalContent: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalGhostButton: {
    minWidth: 110,
    minHeight: 54,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    backgroundColor: '#F7F9FC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalGhostButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  modalPrimaryWrap: {
    flex: 1,
  },
  pressed: {
    opacity: 0.92,
  },
});
