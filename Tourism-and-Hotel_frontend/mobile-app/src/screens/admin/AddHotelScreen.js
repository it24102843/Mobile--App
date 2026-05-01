import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { HotelForm } from '../../components/admin/HotelForm';
import { useAuth } from '../../context/AuthContext';
import {
  createGeneratedHotelId,
  createHotelRecord,
  extractAdminHotelRoomError,
  fetchAdminHotelsList,
  normalizeHotelFormValues,
  validateHotelFormValues,
} from '../../services/adminHotelRoomApi';

export default function AddHotelScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [values, setValues] = useState(() => normalizeHotelFormValues());
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadHotels() {
      try {
        setLoading(true);
        setError('');
        const nextHotels = await fetchAdminHotelsList(token);
        if (!active) return;
        setHotels(nextHotels);
      } catch (loadError) {
        if (!active) return;
        setError(extractAdminHotelRoomError(loadError, 'Unable to load hotel form data.'));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (token) {
      void loadHotels();
    }

    return () => {
      active = false;
    };
  }, [token]);

  const screenError = useMemo(() => error, [error]);

  function handleChange(field, nextValue) {
    setValues((current) => {
      const nextValues = { ...current, [field]: nextValue };
      if (field === 'name') {
        nextValues.hotelId = createGeneratedHotelId(nextValue);
      }
      return nextValues;
    });

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
    const nextErrors = validateHotelFormValues({ values, hotels });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    const payload = {
      hotelId: values.hotelId,
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
      await createHotelRecord(token, payload);
      Alert.alert('Hotel Added', 'The new hotel was created successfully.', [
        {
          text: 'OK',
          onPress: () => router.replace('/admin/hotel-rooms'),
        },
      ]);
    } catch (submitError) {
      Alert.alert(
        'Unable to add hotel',
        extractAdminHotelRoomError(submitError, 'Hotel creation failed.')
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

  if (screenError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}>
          <AppCard variant="danger">
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{screenError}</Text>
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
          mode="add"
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
