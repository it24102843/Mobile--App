import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppCard } from '../../components/AppCard';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { TransportationForm } from '../../components/admin/TransportationForm';
import { useAuth } from '../../context/AuthContext';
import {
  buildTransportationPayload,
  fetchAdminTransportationById,
  fetchAdminTransportations,
  updateAdminTransportation,
  validateTransportationForm,
} from '../../services/adminTransportationApi';
import { theme } from '../../theme';

function toFormValues(vehicle) {
  return {
    name: vehicle.name || '',
    type: vehicle.type || '',
    registrationNumber: vehicle.registrationNumber || '',
    driverName: vehicle.driverName || '',
    driverContact: vehicle.driverContact || '',
    capacity: `${vehicle.capacity || ''}`,
    pricePerDay: `${vehicle.pricePerDay || ''}`,
    status: vehicle.statusLabel || 'Available',
    description: vehicle.description || '',
    imageUrls: vehicle.imageGallery.length ? vehicle.imageGallery : [vehicle.imageUrl],
  };
}

export default function EditTransportationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();
  const vehicleId = typeof params.id === 'string' ? params.id : '';

  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [existingVehicles, setExistingVehicles] = useState([]);

  useEffect(() => {
    void loadVehicle();
  }, [token, vehicleId]);

  async function loadVehicle() {
    if (!token || !vehicleId) {
      return;
    }

    try {
      setLoading(true);
      setLoadingError(null);

      const [vehicle, allVehicles] = await Promise.all([
        fetchAdminTransportationById(token, vehicleId),
        fetchAdminTransportations(token),
      ]);

      setValues(toFormValues(vehicle));
      setExistingVehicles(allVehicles);
    } catch (error) {
      setLoadingError(
        error instanceof Error ? error.message : 'Unable to load this transportation record.'
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
    Alert.alert('Update transportation?', 'Save these changes to the live transportation list?', [
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

    const validation = validateTransportationForm(values, existingVehicles, {
      currentVehicleId: vehicleId,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildTransportationPayload(values);
      const response = await updateAdminTransportation(token, vehicleId, payload);
      Alert.alert(
        'Transportation updated',
        response?.message || 'The transportation record was updated successfully.',
        [{ text: 'Back to List', onPress: () => router.replace('/admin/transportation') }]
      );
    } catch (submitError) {
      Alert.alert(
        'Unable to update vehicle',
        submitError instanceof Error ? submitError.message : 'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminScreenWrapper
      title="Update Transportation"
      subtitle="Adjust transport details, pricing, and availability for this vehicle.">
      {loading ? <AlertText text="Loading transportation details..." /> : null}
      {!loading && loadingError ? <AlertText text={loadingError} danger /> : null}
      {!loading && !loadingError && values ? (
        <TransportationForm
          title="Update Vehicle"
          subtitle="If you keep the current image URLs, the existing transportation images remain unchanged."
          values={values}
          errors={errors}
          onChange={updateField}
          onAddImageField={addImageField}
          onRemoveImageField={removeImageField}
          submitLabel="Update Vehicle"
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
