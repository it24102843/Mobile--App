import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { FoodItemForm } from '../../components/admin/FoodItemForm';
import { useAuth } from '../../context/AuthContext';
import {
  buildFoodItemPayload,
  createAdminFoodItem,
  fetchAdminFoodItemsByMenu,
  validateFoodItemForm,
} from '../../services/adminRestaurantApi';

const INITIAL_VALUES = {
  name: '',
  category: 'Main Course',
  price: '',
  description: '',
  preparationTime: '',
  status: 'Available',
  imageUrls: [''],
};

export default function AddFoodItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();
  const menuId = typeof params.menuId === 'string' ? params.menuId : '';
  const restaurantId = typeof params.restaurantId === 'string' ? params.restaurantId : '';
  const menuName = typeof params.menuName === 'string' ? params.menuName : '';
  const restaurantName = typeof params.restaurantName === 'string' ? params.restaurantName : '';

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [existingFoodItems, setExistingFoodItems] = useState([]);

  useEffect(() => {
    void loadFoodItems();
  }, [token, menuId]);

  async function loadFoodItems() {
    if (!token || !menuId) {
      return;
    }

    try {
      const response = await fetchAdminFoodItemsByMenu(token, menuId);
      setExistingFoodItems(response);
    } catch {
      setExistingFoodItems([]);
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

  function handleCancel() {
    router.back();
  }

  async function handleSubmit() {
    const validation = validateFoodItemForm(values, existingFoodItems);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildFoodItemPayload(values, { menuId, restaurantId });
      const response = await createAdminFoodItem(token, payload);
      Alert.alert(
        'Food item added',
        response?.message || 'The food item was added successfully.',
        [
          {
            text: 'Back to Food Items',
            onPress: () =>
              router.replace({
                pathname: `/admin/restaurant-food-items/${menuId}`,
                params: { menuId, restaurantId, restaurantName, menuName },
              }),
          },
        ]
      );
    } catch (submitError) {
      Alert.alert(
        'Unable to add food item',
        submitError instanceof Error ? submitError.message : 'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminScreenWrapper
      title="Add Food Item"
      subtitle={`${restaurantName || 'Restaurant'} - ${menuName || 'Menu'}`}>
      <FoodItemForm
        title="Add Food Item"
        subtitle="Create a live food item for this restaurant menu."
        values={values}
        errors={errors}
        onChange={updateField}
        onAddImageField={addImageField}
        onRemoveImageField={removeImageField}
        submitLabel="Add Food Item"
        secondaryLabel="Cancel"
        onSubmit={() => void handleSubmit()}
        onSecondary={handleCancel}
        submitting={submitting}
      />
    </AdminScreenWrapper>
  );
}
