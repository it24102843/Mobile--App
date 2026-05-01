import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppCard } from '../../components/AppCard';
import { PackageVehicleForm } from '../../components/admin/PackageVehicleForm';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { useAuth } from '../../context/AuthContext';
import {
  buildPackageVehiclePayload,
  fetchAdminPackageVehicleById,
  fetchAdminPackageVehicles,
  updateAdminPackageVehicle,
  validatePackageVehicleForm,
} from '../../services/adminPackageVehiclesApi';
import { theme } from '../../theme';

function toFormValues(vehicle) {
  return {
    name: vehicle.name || '',
    driverName: vehicle.driverName || '',
    driverPhone: vehicle.driverPhone || '',
    type: vehicle.type || 'Safari Jeep',
    registrationNumber: vehicle.registrationNumber || '',
    capacity: `${vehicle.capacity || ''}`,
    pricePerDay: `${vehicle.pricePerDay || ''}`,
    status: vehicle.statusLabel || 'Available',
    description: vehicle.description || '',
    assignedPackages: vehicle.assignedPackages.join(', '),
    imageUrls: vehicle.imageGallery.length ? vehicle.imageGallery : [vehicle.imageUrl],
    ac: Boolean(vehicle.features?.ac),
    openRoof: Boolean(vehicle.features?.openRoof),
    fourWheelDrive: Boolean(vehicle.features?.fourWheelDrive),
    wifi: Boolean(vehicle.features?.wifi),
    firstAidKit: vehicle.features?.firstAidKit !== false,
    coolerBox: Boolean(vehicle.features?.coolerBox),
  };
}

export default function EditPackageVehicleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();
  const vehicleId = typeof params.vehicleId === 'string' ? params.vehicleId : '';

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
        fetchAdminPackageVehicleById(token, vehicleId),
        fetchAdminPackageVehicles(token),
      ]);

      setValues(toFormValues(vehicle));
      setExistingVehicles(allVehicles);
    } catch (error) {
      setLoadingError(
        error instanceof Error ? error.message : 'Unable to load this package vehicle.'
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
      'Update vehicle?',
      'Save these changes to the live package vehicle inventory?',
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

    const validation = validatePackageVehicleForm(values, existingVehicles, {
      currentVehicleId: vehicleId,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildPackageVehiclePayload(values, {
        lockVehicleId: true,
        existingVehicleId: vehicleId,
      });

      const response = await updateAdminPackageVehicle(token, vehicleId, payload);
      Alert.alert(
        'Vehicle updated',
        response?.message || 'The package vehicle was updated successfully.',
        [
          {
            text: 'Back to List',
            onPress: () => router.replace('/admin/package-vehicles'),
          },
        ]
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
      title="Update Package Vehicle"
      subtitle="Adjust pricing, status, and transport details for this vehicle.">
      {loading ? <AlertText text="Loading package vehicle details..." /> : null}

      {!loading && loadingError ? <AlertText text={loadingError} danger /> : null}

      {!loading && !loadingError && values ? (
        <PackageVehicleForm
          title="Update Vehicle"
          subtitle="If you keep the current image URLs, the existing package vehicle images remain unchanged."
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
