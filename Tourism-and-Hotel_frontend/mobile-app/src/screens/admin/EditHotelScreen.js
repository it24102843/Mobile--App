import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { HotelForm } from '../../components/admin/HotelForm';
import { useAuth } from '../../context/AuthContext';
import {
  extractAdminHotelRoomError,
  fetchAdminHotelsList,
  fetchHotelRecord,
  normalizeHotelFormValues,
  updateHotelRecord,
  validateHotelFormValues,
} from '../../services/adminHotelRoomApi';

export default function EditHotelScreen() {
  const router = useRouter();
  const { hotelId } = useLocalSearchParams();
  const { token } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [values, setValues] = useState(() => normalizeHotelFormValues());
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadRecord() {
      try {
        setLoading(true);
        setError('');
        const [hotel, hotelList] = await Promise.all([
          fetchHotelRecord(token, hotelId),
          fetchAdminHotelsList(token),
        ]);

        if (!active) {
          return;
        }

        setHotels(hotelList);
        setValues(normalizeHotelFormValues(hotel));
      } catch (loadError) {
        if (!active) return;
        setError(extractAdminHotelRoomError(loadError, 'Unable to load hotel details.'));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (token && hotelId) {
      void loadRecord();
    }

    return () => {
      active = false;
    };
  }, [hotelId, token]);

  function handleChange(field, nextValue) {
    setValues((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleToggleAmenity(key) {
    setValues((current) => ({
      ...current,
      amenities: {
        ...current.amenities,
        [key]: !current.amenities[key],
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
    const nextErrors = validateHotelFormValues({
      values,
      hotels,
      currentHotelId: values.hotelId,
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    const payload = {
      name: values.name.trim(),
      location: values.location.trim(),
      description: values.description.trim(),
      starRating: Number(values.starRating),
      contactEmail: values.contactEmail.trim(),
      contactPhone: values.contactPhone.trim(),
      isActive: values.isActive,
      amenities: values.amenities,
      images: values.images.filter((image) => image.trim()),
    };

    try {
      setSubmitting(true);
      await updateHotelRecord(token, values.hotelId, payload);
      Alert.alert('Hotel Updated', 'The hotel details were saved successfully.', [
        {
          text: 'OK',
          onPress: () => router.replace('/admin/hotel-rooms'),
        },
      ]);
    } catch (submitError) {
      Alert.alert(
        'Unable to update hotel',
        extractAdminHotelRoomError(submitError, 'Hotel update failed.')
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
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <AppButton title="Back" variant="secondary" onPress={() => router.replace('/admin/hotel-rooms')} />
            </View>
          </AppCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <HotelForm
          mode="edit"
          values={values}
          errors={errors}
          submitting={submitting}
          onChange={handleChange}
          onToggleAmenity={handleToggleAmenity}
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
  errorCard: {
    gap: 16,
  },
  errorText: {
    color: '#425063',
    fontSize: 15,
    lineHeight: 22,
  },
});
