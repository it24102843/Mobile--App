import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppCard } from '../../components/AppCard';
import { PackageForm } from '../../components/admin/PackageForm';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { useAuth } from '../../context/AuthContext';
import {
  buildPackagePayload,
  fetchAdminPackageById,
  fetchAdminPackages,
  updateAdminPackage,
  validatePackageForm,
} from '../../services/adminPackagesApi';
import { theme } from '../../theme';

function toFormValues(item) {
  return {
    packageId: item.packageId || '',
    name: item.name || '',
    category: item.category || 'Safari',
    description: item.description || '',
    durationDays: `${item.durationDays || 1}`,
    durationNights: `${item.durationNights || 0}`,
    price: `${item.price || ''}`,
    maxGroupSize: `${item.maxGroupSize || 10}`,
    highlights: item.highlights.join('\n'),
    includes: item.includes.join('\n'),
    excludes: item.excludes.join('\n'),
    meetingPoint: item.meetingPoint || 'Kataragama Town Center',
    availability: item.availability ? 'available' : 'unavailable',
    customizationEnabled: item.customizationEnabled ? 'enabled' : 'disabled',
    imageUrls: item.imageGallery.length ? item.imageGallery : [item.imageUrl],
    rating: `${item.rating || 0}`,
  };
}

export default function EditPackageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();
  const packageId = typeof params.packageId === 'string' ? params.packageId : '';

  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [existingPackages, setExistingPackages] = useState([]);

  useEffect(() => {
    void loadPackage();
  }, [packageId, token]);

  async function loadPackage() {
    if (!token || !packageId) {
      return;
    }

    try {
      setLoading(true);
      setLoadingError(null);

      const [item, allPackages] = await Promise.all([
        fetchAdminPackageById(token, packageId),
        fetchAdminPackages(token),
      ]);

      setValues(toFormValues(item));
      setExistingPackages(allPackages);
    } catch (error) {
      setLoadingError(
        error instanceof Error ? error.message : 'Unable to load this package.'
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
      'Update package?',
      'Save these changes to the live package catalog?',
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

    const validation = validatePackageForm(values, existingPackages, {
      currentPackageId: packageId,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildPackagePayload(values, {
        lockPackageId: true,
        existingPackageId: packageId,
      });

      const response = await updateAdminPackage(token, packageId, payload);
      Alert.alert(
        'Package updated',
        response?.message || 'The package was updated successfully.',
        [
          {
            text: 'Back to List',
            onPress: () => router.replace('/admin/packages'),
          },
        ]
      );
    } catch (submitError) {
      Alert.alert(
        'Unable to update package',
        submitError instanceof Error ? submitError.message : 'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminScreenWrapper
      title="Update Package"
      subtitle="Adjust pricing, availability, and package content for this offer.">
      {loading ? <AlertText text="Loading package details..." /> : null}

      {!loading && loadingError ? <AlertText text={loadingError} danger /> : null}

      {!loading && !loadingError && values ? (
        <PackageForm
          title="Update Package"
          subtitle="The package ID is locked. If you keep the current image URLs, the existing package visuals remain unchanged."
          values={values}
          errors={errors}
          onChange={updateField}
          onAddImageField={addImageField}
          onRemoveImageField={removeImageField}
          submitLabel="Update Package"
          secondaryLabel="Cancel"
          onSubmit={confirmSave}
          onSecondary={handleCancel}
          submitting={submitting}
          disablePackageId
          submitVariant="info"
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
