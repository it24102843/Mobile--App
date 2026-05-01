import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { EquipmentForm } from '../../components/admin/EquipmentForm';
import { useAuth } from '../../context/AuthContext';
import {
  buildEquipmentPayload,
  createAdminEquipment,
  fetchAdminEquipment,
  validateEquipmentForm,
} from '../../services/adminEquipmentApi';

const INITIAL_VALUES = {
  key: '',
  name: '',
  dailyRentalprice: '',
  stockCount: '',
  category: 'camp',
  description: '',
  imageUrls: [''],
  pickupLocation: 'Kataragama',
};

export default function AddEquipmentScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [existingItems, setExistingItems] = useState([]);

  useEffect(() => {
    void loadEquipment();
  }, [token]);

  async function loadEquipment() {
    if (!token) {
      return;
    }

    try {
      const response = await fetchAdminEquipment(token);
      setExistingItems(response);
    } catch {
      setExistingItems([]);
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

    setErrors((current) => ({ ...current, [field]: undefined, image: undefined }));
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
    const validation = validateEquipmentForm(values, existingItems);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildEquipmentPayload(values);
      const response = await createAdminEquipment(token, payload);
      Alert.alert(
        'Equipment added',
        response?.message || 'The equipment item was added successfully.',
        [
          {
            text: 'Go Back',
            onPress: () => router.replace('/admin/storage-equipment'),
          },
        ]
      );
    } catch (submitError) {
      Alert.alert(
        'Unable to add equipment',
        submitError instanceof Error
          ? submitError.message
          : 'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminScreenWrapper
      title="Add Equipment"
      subtitle="Fill in the equipment details below...">
      <EquipmentForm
        title="Add Equipment"
        subtitle="Fill in the equipment details below, then save the item into your live MongoDB inventory."
        values={values}
        errors={errors}
        onChange={updateField}
        onAddImageField={addImageField}
        onRemoveImageField={removeImageField}
        submitLabel="Add Equipment"
        secondaryLabel="Clear All"
        onSubmit={() => void handleSubmit()}
        onSecondary={clearAll}
        submitting={submitting}
      />
    </AdminScreenWrapper>
  );
}
