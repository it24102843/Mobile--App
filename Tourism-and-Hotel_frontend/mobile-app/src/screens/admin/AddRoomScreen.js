import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { RoomForm } from '../../components/admin/RoomForm';
import { useAuth } from '../../context/AuthContext';
import {
  createGeneratedRoomKey,
  createRoomRecord,
  extractAdminHotelRoomError,
  fetchHotelRoomManagementData,
  normalizeRoomFormValues,
  validateRoomFormValues,
} from '../../services/adminHotelRoomApi';

export default function AddRoomScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState({ hotels: [], rooms: [] });
  const [values, setValues] = useState(() => normalizeRoomFormValues());
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError('');
        const response = await fetchHotelRoomManagementData(token);
        if (!active) return;
        setDashboard(response);
        setValues(normalizeRoomFormValues(null, response.hotels[0]?.name || ''));
      } catch (loadError) {
        if (!active) return;
        setError(extractAdminHotelRoomError(loadError, 'Unable to load room form data.'));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (token) {
      void loadData();
    }

    return () => {
      active = false;
    };
  }, [token]);

  const hotelOptions = useMemo(
    () => dashboard.hotels.map((hotel) => ({ label: hotel.name, value: hotel.name })),
    [dashboard.hotels]
  );

  function handleChange(field, nextValue) {
    setValues((current) => {
      const nextValues = { ...current, [field]: nextValue };
      if (field === 'roomNumber') {
        nextValues.key = createGeneratedRoomKey(nextValue);
      }
      return nextValues;
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleToggleFacility(key) {
    setValues((current) => ({
      ...current,
      facilities: {
        ...current.facilities,
        [key]: !current.facilities[key],
      },
    }));
  }

  function handleChangeImage(index, nextValue) {
    setValues((current) => {
      const nextImages = [...current.images];
      nextImages[index] = nextValue;
      return { ...current, images: nextImages };
    });
    setErrors((current) => ({ ...current, images: undefined }));
  }

  function handleAddImage() {
    setValues((current) => ({ ...current, images: [...current.images, ''] }));
  }

  function handleRemoveImage(index) {
    setValues((current) => {
      const nextImages = current.images.filter((_, imageIndex) => imageIndex !== index);
      return { ...current, images: nextImages.length ? nextImages : [''] };
    });
  }

  function validateForm() {
    const nextErrors = validateRoomFormValues({
      values,
      rooms: dashboard.rooms,
      hotels: dashboard.hotels,
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    const payload = {
      key: values.key,
      roomNumber: values.roomNumber.trim(),
      hotelName: values.hotelName,
      roomType: values.roomType,
      price: Number(values.price),
      capacity: Number(values.capacity),
      status: values.status,
      availability: values.status === 'Available',
      description: values.description.trim(),
      facilities: values.facilities,
      images: values.images.filter((image) => image.trim()),
    };

    try {
      setSubmitting(true);
      await createRoomRecord(token, payload);
      Alert.alert('Room Added', 'The new room was created successfully.', [
        {
          text: 'OK',
          onPress: () => router.replace('/admin/hotel-rooms'),
        },
      ]);
    } catch (submitError) {
      Alert.alert(
        'Unable to add room',
        extractAdminHotelRoomError(submitError, 'Room creation failed.')
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.stateWrap}>
          <ActivityIndicator size="large" color="#F28C28" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}>
          <AppCard variant="danger">
            <View style={styles.errorWrap}>
              <Text style={styles.errorText}>{error}</Text>
              <AppButton title="Back" variant="secondary" onPress={() => router.replace('/admin/hotel-rooms')} />
            </View>
          </AppCard>
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboard.hotels.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}>
          <AppCard variant="warning">
            <View style={styles.errorWrap}>
              <Text style={styles.errorText}>
                Add at least one hotel before creating rooms.
              </Text>
              <AppButton title="Back to Hotels & Rooms" onPress={() => router.replace('/admin/hotel-rooms')} />
            </View>
          </AppCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <RoomForm
          mode="add"
          values={values}
          errors={errors}
          hotelOptions={hotelOptions}
          submitting={submitting}
          onChange={handleChange}
          onToggleFacility={handleToggleFacility}
          onChangeImage={handleChangeImage}
          onAddImage={handleAddImage}
          onRemoveImage={handleRemoveImage}
          onCancel={() => router.back()}
          onSubmit={() => void handleSubmit()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EFF3F8',
  },
  page: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrap: {
    gap: 16,
  },
  errorText: {
    color: '#425063',
    fontSize: 15,
    lineHeight: 22,
  },
});
