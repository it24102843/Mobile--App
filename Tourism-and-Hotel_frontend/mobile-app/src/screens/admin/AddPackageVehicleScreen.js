import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { PackageVehicleForm } from '../../components/admin/PackageVehicleForm';
import { useAuth } from '../../context/AuthContext';
import {
  buildPackageVehiclePayload,
  createAdminPackageVehicle,
  fetchAdminPackageVehicles,
  validatePackageVehicleForm,
} from '../../services/adminPackageVehiclesApi';

const INITIAL_VALUES = {
  name: '',
  driverName: '',
  driverPhone: '',
  type: 'Safari Jeep',
  registrationNumber: '',
  capacity: '',
  pricePerDay: '',
  status: 'Available',
  description: '',
  assignedPackages: '',
  imageUrls: [''],
  ac: false,
  openRoof: false,
  fourWheelDrive: false,
  wifi: false,
  firstAidKit: true,
  coolerBox: false,
};

export default function AddPackageVehicleScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [existingVehicles, setExistingVehicles] = useState([]);

  useEffect(() => {
    void loadVehicles();
  }, [token]);

  async function loadVehicles() {
    if (!token) {
      return;
    }

    try {
      const response = await fetchAdminPackageVehicles(token);
      setExistingVehicles(response);
    } catch {
      setExistingVehicles([]);
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
    const validation = validatePackageVehicleForm(values, existingVehicles);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildPackageVehiclePayload(values);
      const response = await createAdminPackageVehicle(token, payload);
      Alert.alert(
        'Vehicle added',
        response?.message || 'The package vehicle was added successfully.',
        [
          {
            text: 'Go Back',
            onPress: () => router.replace('/admin/package-vehicles'),
          },
        ]
      );
    } catch (submitError) {
      Alert.alert(
        'Unable to add vehicle',
        submitError instanceof Error ? submitError.message : 'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminScreenWrapper
      title="Add Package Vehicle"
      subtitle="Fill in the vehicle details below...">
      <PackageVehicleForm
        title="Add Vehicle"
        subtitle="Create a live package vehicle record for your admin and booking flows."
        values={values}
        errors={errors}
        onChange={updateField}
        onAddImageField={addImageField}
        onRemoveImageField={removeImageField}
        submitLabel="Add Vehicle"
        secondaryLabel="Clear All"
        onSubmit={() => void handleSubmit()}
        onSecondary={clearAll}
        submitting={submitting}
      />
    </AdminScreenWrapper>
  );
}
