import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { RestaurantForm } from '../../components/admin/RestaurantForm';
import { useAuth } from '../../context/AuthContext';
import {
  buildRestaurantPayload,
  createAdminRestaurant,
  fetchAdminRestaurants,
  validateRestaurantForm,
} from '../../services/adminRestaurantApi';

const INITIAL_VALUES = {
  name: '',
  address: '',
  phone: '',
  openingHours: '',
  status: 'Active',
  description: '',
  imageUrls: [''],
};

export default function AddRestaurantScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [existingRestaurants, setExistingRestaurants] = useState([]);

  useEffect(() => {
    void loadRestaurants();
  }, [token]);

  async function loadRestaurants() {
    if (!token) {
      return;
    }

    try {
      const response = await fetchAdminRestaurants(token);
      setExistingRestaurants(response);
    } catch {
      setExistingRestaurants([]);
    }
  }

  function updateField(field, value, index) {
    setValues((current) => {
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
    setValues((current) => ({ ...current, imageUrls: [...current.imageUrls, ''] }));
  }

  function removeImageField(index) {
    setValues((current) => {
      const nextImages = current.imageUrls.filter((_, imageIndex) => imageIndex !== index);
      return { ...current, imageUrls: nextImages.length ? nextImages : [''] };
    });
  }

  function clearAll() {
    setValues(INITIAL_VALUES);
    setErrors({});
  }

  async function handleSubmit() {
    const validation = validateRestaurantForm(values, existingRestaurants);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildRestaurantPayload(values);
      const response = await createAdminRestaurant(token, payload);
      Alert.alert(
        'Restaurant added',
        response?.message || 'The restaurant was added successfully.',
        [{ text: 'Go Back', onPress: () => router.replace('/admin/restaurant') }]
      );
    } catch (submitError) {
      Alert.alert(
        'Unable to add restaurant',
        submitError instanceof Error ? submitError.message : 'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminScreenWrapper
      title="Add Restaurant"
      subtitle="Fill in the restaurant details below...">
      <RestaurantForm
        title="Add Restaurant"
        subtitle="Create a live restaurant record for menus, food items, and public browsing."
        values={values}
        errors={errors}
        onChange={updateField}
        onAddImageField={addImageField}
        onRemoveImageField={removeImageField}
        submitLabel="Add Restaurant"
        secondaryLabel="Clear All"
        onSubmit={() => void handleSubmit()}
        onSecondary={clearAll}
        submitting={submitting}
      />
    </AdminScreenWrapper>
  );
}
