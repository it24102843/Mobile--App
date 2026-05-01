import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppCard } from '../../components/AppCard';
import { EquipmentForm } from '../../components/admin/EquipmentForm';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { useAuth } from '../../context/AuthContext';
import {
  buildEquipmentPayload,
  fetchAdminEquipment,
  fetchAdminEquipmentByKey,
  updateAdminEquipment,
  validateEquipmentForm,
} from '../../services/adminEquipmentApi';
import { theme } from '../../theme';

function toFormValues(item) {
  return {
    key: item.key || '',
    name: item.name || '',
    dailyRentalprice: `${item.dailyRentalprice || ''}`,
    stockCount: `${item.stockCount || 0}`,
    category: item.category || 'camp',
    description: item.description || '',
    imageUrls: item.raw?.image?.length ? item.raw.image : [item.imageUrl],
    pickupLocation: item.pickupLocation || 'Kataragama',
  };
}

export default function EditEquipmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();
  const itemKey = typeof params.key === 'string' ? params.key : '';

  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [existingItems, setExistingItems] = useState([]);

  useEffect(() => {
    void loadEquipment();
  }, [itemKey, token]);

  async function loadEquipment() {
    if (!token || !itemKey) {
      return;
    }

    try {
      setLoading(true);
      setLoadingError(null);

      const [item, allItems] = await Promise.all([
        fetchAdminEquipmentByKey(token, itemKey),
        fetchAdminEquipment(token),
      ]);

      setValues(toFormValues(item));
      setExistingItems(allItems);
    } catch (error) {
      setLoadingError(
        error instanceof Error ? error.message : 'Unable to load this equipment item.'
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

    setErrors((current) => ({ ...current, [field]: undefined, image: undefined }));
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
    Alert.alert(
      'Update equipment?',
      'Save these changes to the live equipment inventory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => void handleSubmit(),
        },
      ]
    );
  }

  async function handleSubmit() {
    if (!values) {
      return;
    }

    const validation = validateEquipmentForm(values, existingItems, {
      currentKey: itemKey,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildEquipmentPayload(values, {
        lockKey: true,
        existingKey: itemKey,
      });

      const response = await updateAdminEquipment(token, itemKey, payload);
      Alert.alert(
        'Equipment updated',
        response?.message || 'The equipment item was updated successfully.',
        [
          {
            text: 'Back to List',
            onPress: () => router.replace('/admin/storage-equipment'),
          },
        ]
      );
    } catch (submitError) {
      Alert.alert(
        'Unable to update equipment',
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
      title="Update Equipment"
      subtitle="Adjust stock, pricing, and category settings for this item.">
      {loading ? (
        <AlertText text="Loading equipment details..." />
      ) : null}

      {!loading && loadingError ? (
        <AlertText text={loadingError} danger />
      ) : null}

      {!loading && !loadingError && values ? (
        <EquipmentForm
          title="Update Equipment"
          subtitle="The equipment key is locked. Stock controls live availability in your mobile and admin flows."
          values={values}
          errors={errors}
          onChange={updateField}
          onAddImageField={addImageField}
          onRemoveImageField={removeImageField}
          submitLabel="Update Equipment"
          secondaryLabel="Cancel"
          onSubmit={confirmSave}
          onSecondary={handleCancel}
          submitting={submitting}
          disableKey
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
