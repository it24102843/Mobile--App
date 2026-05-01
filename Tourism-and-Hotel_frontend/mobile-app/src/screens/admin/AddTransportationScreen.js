import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { TransportationForm } from '../../components/admin/TransportationForm';
import { useAuth } from '../../context/AuthContext';
import {
  buildTransportationPayload,
  createAdminTransportation,
  fetchAdminTransportations,
  validateTransportationForm,
} from '../../services/adminTransportationApi';

const INITIAL_VALUES = {
  name: '',
  type: '',
  registrationNumber: '',
  driverName: '',
  driverContact: '',
  capacity: '',
  pricePerDay: '',
  status: 'Available',
  description: '',
  imageUrls: [''],
};

export default function AddTransportationScreen() {
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
      const response = await fetchAdminTransportations(token);
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
    const validation = validateTransportationForm(values, existingVehicles);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildTransportationPayload(values);
      const response = await createAdminTransportation(token, payload);
      Alert.alert(
        'Transportation added',
        response?.message || 'The transportation vehicle was added successfully.',
        [{ text: 'Go Back', onPress: () => router.replace('/admin/transportation') }]
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
      title="Add Transportation"
      subtitle="Fill in the transportation details below...">
      <TransportationForm
        title="Add Vehicle"
        subtitle="Create a live transportation record for browsing, booking, and admin management."
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
