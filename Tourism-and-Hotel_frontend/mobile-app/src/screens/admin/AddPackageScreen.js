import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { PackageForm } from '../../components/admin/PackageForm';
import { useAuth } from '../../context/AuthContext';
import {
  buildPackagePayload,
  createAdminPackage,
  fetchAdminPackages,
  validatePackageForm,
} from '../../services/adminPackagesApi';

const INITIAL_VALUES = {
  packageId: '',
  name: '',
  category: 'Safari',
  description: '',
  durationDays: '',
  durationNights: '0',
  price: '',
  maxGroupSize: '10',
  highlights: '',
  includes: '',
  excludes: '',
  meetingPoint: 'Kataragama Town Center',
  availability: 'available',
  customizationEnabled: 'enabled',
  imageUrls: [''],
  rating: '0',
};

export default function AddPackageScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [existingPackages, setExistingPackages] = useState([]);

  useEffect(() => {
    void loadPackages();
  }, [token]);

  async function loadPackages() {
    if (!token) {
      return;
    }

    try {
      const response = await fetchAdminPackages(token);
      setExistingPackages(response);
    } catch {
      setExistingPackages([]);
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
    const validation = validatePackageForm(values, existingPackages);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildPackagePayload(values);
      const response = await createAdminPackage(token, payload);
      Alert.alert(
        'Package added',
        response?.message || 'The package was added successfully.',
        [
          {
            text: 'Go Back',
            onPress: () => router.replace('/admin/packages'),
          },
        ]
      );
    } catch (submitError) {
      Alert.alert(
        'Unable to add package',
        submitError instanceof Error ? submitError.message : 'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminScreenWrapper
      title="Add Package"
      subtitle="Fill in the package details below...">
      <PackageForm
        title="Add Package"
        subtitle="Create a live tourism package that will appear in your admin dashboard and client browsing flows."
        values={values}
        errors={errors}
        onChange={updateField}
        onAddImageField={addImageField}
        onRemoveImageField={removeImageField}
        submitLabel="Add Package"
        secondaryLabel="Clear All"
        onSubmit={() => void handleSubmit()}
        onSecondary={clearAll}
        submitting={submitting}
      />
    </AdminScreenWrapper>
  );
}
