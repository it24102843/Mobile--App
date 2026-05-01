import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppCard } from '../../components/AppCard';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { RestaurantForm } from '../../components/admin/RestaurantForm';
import { useAuth } from '../../context/AuthContext';
import {
  buildRestaurantPayload,
  fetchAdminRestaurantById,
  fetchAdminRestaurants,
  updateAdminRestaurant,
  validateRestaurantForm,
} from '../../services/adminRestaurantApi';
import { theme } from '../../theme';

function toFormValues(restaurant) {
  return {
    name: restaurant.name || '',
    address: restaurant.address || '',
    phone: restaurant.phone || '',
    openingHours: restaurant.openingHours || '',
    status: restaurant.statusLabel || 'Active',
    description: restaurant.description || '',
    imageUrls: restaurant.imageGallery.length ? restaurant.imageGallery : [restaurant.imageUrl],
  };
}

export default function EditRestaurantScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();
  const restaurantId = typeof params.id === 'string' ? params.id : '';

  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [existingRestaurants, setExistingRestaurants] = useState([]);

  useEffect(() => {
    void loadRestaurant();
  }, [token, restaurantId]);

  async function loadRestaurant() {
    if (!token || !restaurantId) {
      return;
    }

    try {
      setLoading(true);
      setLoadingError(null);

      const [restaurant, allRestaurants] = await Promise.all([
        fetchAdminRestaurantById(token, restaurantId),
        fetchAdminRestaurants(token),
      ]);

      setValues(toFormValues(restaurant));
      setExistingRestaurants(allRestaurants);
    } catch (error) {
      setLoadingError(
        error instanceof Error ? error.message : 'Unable to load this restaurant.'
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value, index) {
    setValues((current) => {
      if (!current) {
        return current;
      }

      if (field === 'imageUrls') {
        const nextImages = [...current.imageUrls];
        nextImages[index] = value;
        return { ...current, imageUrls: nextImages };
      }

      return { ...current, [field]: value };
    });

    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function addImageField() {
    setValues((current) =>
      current ? { ...current, imageUrls: [...current.imageUrls, ''] } : current
    );
  }

  function removeImageField(index) {
    setValues((current) => {
      if (!current) {
        return current;
      }

      const nextImages = current.imageUrls.filter((_, imageIndex) => imageIndex !== index);
      return { ...current, imageUrls: nextImages.length ? nextImages : [''] };
    });
  }

  function handleCancel() {
    router.back();
  }

  function confirmSave() {
    Alert.alert('Update restaurant?', 'Save these changes to the live restaurant record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Update',
        onPress: () => void handleSubmit(),
      },
    ]);
  }

  async function handleSubmit() {
    if (!values) {
      return;
    }

    const validation = validateRestaurantForm(values, existingRestaurants, {
      currentRestaurantId: restaurantId,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildRestaurantPayload(values);
      const response = await updateAdminRestaurant(token, restaurantId, payload);
      Alert.alert(
        'Restaurant updated',
        response?.message || 'The restaurant was updated successfully.',
        [{ text: 'Back to List', onPress: () => router.replace('/admin/restaurant') }]
      );
    } catch (submitError) {
      Alert.alert(
        'Unable to update restaurant',
        submitError instanceof Error ? submitError.message : 'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminScreenWrapper
      title="Update Restaurant"
      subtitle="Adjust restaurant details, timing, and visibility.">
      {loading ? <AlertText text="Loading restaurant details..." /> : null}
      {!loading && loadingError ? <AlertText text={loadingError} danger /> : null}
      {!loading && !loadingError && values ? (
        <RestaurantForm
          title="Update Restaurant"
          subtitle="If you keep the current image URLs, the existing restaurant images remain unchanged."
          values={values}
          errors={errors}
          onChange={updateField}
          onAddImageField={addImageField}
          onRemoveImageField={removeImageField}
          submitLabel="Update Restaurant"
          secondaryLabel="Cancel"
          onSubmit={confirmSave}
          onSecondary={handleCancel}
          submitting={submitting}
        />
      ) : null}
    </AdminScreenWrapper>
  );
}

function AlertText({ text, danger = false }) {
  return (
    <AppCard variant={danger ? 'danger' : 'info'}>
      <Text
        style={{
          color: danger ? theme.colors.errorText : theme.colors.textMuted,
          ...theme.typography.body,
        }}>
        {text}
      </Text>
    </AppCard>
  );
}
