import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppCard } from '../../components/AppCard';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { FoodItemForm } from '../../components/admin/FoodItemForm';
import { useAuth } from '../../context/AuthContext';
import {
  buildFoodItemPayload,
  fetchAdminFoodItemById,
  fetchAdminFoodItemsByMenu,
  updateAdminFoodItem,
  validateFoodItemForm,
} from '../../services/adminRestaurantApi';
import { theme } from '../../theme';

function toFormValues(foodItem) {
  return {
    name: foodItem.name || '',
    category: foodItem.category || 'Main Course',
    price: `${foodItem.price || ''}`,
    description: foodItem.description || '',
    preparationTime: foodItem.preparationTime ? `${foodItem.preparationTime}` : '',
    status: foodItem.statusLabel || 'Available',
    imageUrls: foodItem.imageGallery.length ? foodItem.imageGallery : [foodItem.imageUrl],
  };
}

export default function EditFoodItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();
  const foodItemId = typeof params.id === 'string' ? params.id : '';

  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [existingFoodItems, setExistingFoodItems] = useState([]);
  const [defaults, setDefaults] = useState({ menuId: '', restaurantId: '' });

  useEffect(() => {
    void loadFoodItem();
  }, [token, foodItemId]);

  async function loadFoodItem() {
    if (!token || !foodItemId) {
      return;
    }

    try {
      setLoading(true);
      setLoadingError(null);

      const foodItem = await fetchAdminFoodItemById(token, foodItemId);
      const itemsInMenu = await fetchAdminFoodItemsByMenu(token, foodItem.menuId);

      setValues(toFormValues(foodItem));
      setExistingFoodItems(itemsInMenu);
      setDefaults({
        menuId: foodItem.menuId,
        restaurantId: foodItem.restaurantId,
      });
    } catch (error) {
      setLoadingError(
        error instanceof Error ? error.message : 'Unable to load this food item.'
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
    Alert.alert('Update food item?', 'Save these changes to the live food item record?', [
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

    const validation = validateFoodItemForm(values, existingFoodItems, {
      currentFoodItemId: foodItemId,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildFoodItemPayload(values, defaults);
      const response = await updateAdminFoodItem(token, foodItemId, payload);
      Alert.alert(
        'Food item updated',
        response?.message || 'The food item was updated successfully.',
        [{ text: 'Back', onPress: () => router.back() }]
      );
    } catch (submitError) {
      Alert.alert(
        'Unable to update food item',
        submitError instanceof Error ? submitError.message : 'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminScreenWrapper
      title="Update Food Item"
      subtitle="Adjust pricing, availability, and presentation for this menu item.">
      {loading ? <AlertText text="Loading food item details..." /> : null}
      {!loading && loadingError ? <AlertText text={loadingError} danger /> : null}
      {!loading && !loadingError && values ? (
        <FoodItemForm
          title="Update Food Item"
          subtitle="If you keep the current image URLs, the existing food item images remain unchanged."
          values={values}
          errors={errors}
          onChange={updateField}
          onAddImageField={addImageField}
          onRemoveImageField={removeImageField}
          submitLabel="Update Food Item"
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
