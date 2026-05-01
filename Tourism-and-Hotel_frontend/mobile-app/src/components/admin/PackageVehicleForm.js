import { StyleSheet, Switch, Text, View } from 'react-native';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { AppSelectField } from '../AppSelectField';
import { AppTextField } from '../AppTextField';
import {
  PACKAGE_VEHICLE_FORM_STATUS_OPTIONS,
  PACKAGE_VEHICLE_TYPES,
} from '../../services/adminPackageVehiclesApi';
import { theme } from '../../theme';

const TYPE_OPTIONS = PACKAGE_VEHICLE_TYPES.map((type) => ({
  label: type,
  value: type,
}));

function FeatureToggle({ label, value, onValueChange }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

export function PackageVehicleForm({
  title,
  subtitle,
  values,
  errors = {},
  onChange,
  onAddImageField,
  onRemoveImageField,
  submitLabel,
  secondaryLabel,
  onSubmit,
  onSecondary,
  submitting = false,
}) {
  return (
    <View style={styles.wrapper}>
      <AppCard style={styles.heroCard}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </AppCard>

      <AppCard style={styles.formCard}>
        <AppTextField
          label="Vehicle Name"
          value={values.name}
          onChangeText={(value) => onChange?.('name', value)}
          error={errors.name}
          placeholder="WildHaven Safari Jeep"
        />

        <AppTextField
          label="Driver Name"
          value={values.driverName}
          onChangeText={(value) => onChange?.('driverName', value)}
          error={errors.driverName}
          placeholder="Nimal Perera"
        />

        <AppTextField
          label="Driver Phone"
          value={values.driverPhone}
          onChangeText={(value) => onChange?.('driverPhone', value)}
          placeholder="0771234567"
        />

        <AppSelectField
          label="Vehicle Type"
          value={values.type}
          options={TYPE_OPTIONS}
          onChange={(value) => onChange?.('type', value)}
          error={errors.type}
        />

        <AppTextField
          label="Registration Number"
          value={values.registrationNumber}
          onChangeText={(value) => onChange?.('registrationNumber', value)}
          error={errors.registrationNumber}
          placeholder="CAB-1234"
        />

        <View style={styles.inlineRow}>
          <View style={styles.inlineField}>
            <AppTextField
              label="Capacity"
              value={values.capacity}
              onChangeText={(value) => onChange?.('capacity', value)}
              error={errors.capacity}
              placeholder="6"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.inlineField}>
            <AppTextField
              label="Price Per Day"
              value={values.pricePerDay}
              onChangeText={(value) => onChange?.('pricePerDay', value)}
              error={errors.pricePerDay}
              placeholder="18000"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <AppSelectField
          label="Status"
          value={values.status}
          options={PACKAGE_VEHICLE_FORM_STATUS_OPTIONS}
          onChange={(value) => onChange?.('status', value)}
          error={errors.status}
        />

        <AppTextField
          label="Description"
          value={values.description}
          onChangeText={(value) => onChange?.('description', value)}
          placeholder="Describe the vehicle, comfort, route suitability, and package use..."
          multiline
        />

        <AppTextField
          label="Assigned Package IDs"
          value={values.assignedPackages}
          onChangeText={(value) => onChange?.('assignedPackages', value)}
          placeholder="PKG-001, PKG-002"
          multiline
        />

        <View style={styles.featuresCard}>
          <Text style={styles.sectionTitle}>Features</Text>
          <FeatureToggle
            label="Air Conditioning"
            value={values.ac}
            onValueChange={(value) => onChange?.('ac', value)}
          />
          <FeatureToggle
            label="Open Roof"
            value={values.openRoof}
            onValueChange={(value) => onChange?.('openRoof', value)}
          />
          <FeatureToggle
            label="Four Wheel Drive"
            value={values.fourWheelDrive}
            onValueChange={(value) => onChange?.('fourWheelDrive', value)}
          />
          <FeatureToggle
            label="WiFi"
            value={values.wifi}
            onValueChange={(value) => onChange?.('wifi', value)}
          />
          <FeatureToggle
            label="First Aid Kit"
            value={values.firstAidKit}
            onValueChange={(value) => onChange?.('firstAidKit', value)}
          />
          <FeatureToggle
            label="Cooler Box"
            value={values.coolerBox}
            onValueChange={(value) => onChange?.('coolerBox', value)}
          />
        </View>

        <View style={styles.imageSection}>
          <View style={styles.imageHeader}>
            <Text style={styles.sectionTitle}>Vehicle Images</Text>
            <AppButton title="Add Image URL" variant="secondary" onPress={onAddImageField} />
          </View>

          {values.imageUrls.map((imageUrl, index) => (
            <View key={`package-vehicle-image-${index}`} style={styles.imageFieldRow}>
              <View style={styles.imageField}>
                <AppTextField
                  label={`Image URL ${index + 1}`}
                  value={imageUrl}
                  onChangeText={(value) => onChange?.('imageUrls', value, index)}
                  error={errors.imageUrls?.[index]}
                  placeholder="https://example.com/vehicle.jpg"
                />
              </View>
              {values.imageUrls.length > 1 ? (
                <View style={styles.removeButtonWrap}>
                  <AppButton
                    title="Remove"
                    variant="danger"
                    onPress={() => onRemoveImageField?.(index)}
                  />
                </View>
              ) : null}
            </View>
          ))}

          {errors.image ? <Text style={styles.errorText}>{errors.image}</Text> : null}
        </View>
      </AppCard>

      <AppCard variant="info" style={styles.infoCard}>
        <Text style={styles.infoText}>
          Required fields must be completed before saving. Vehicle status controls whether this
          package vehicle is available to assign and book in the live system.
        </Text>
      </AppCard>

      <View style={styles.actionRow}>
        <View style={styles.flexButton}>
          <AppButton
            title={submitting ? 'Saving...' : submitLabel}
            onPress={onSubmit}
            disabled={submitting}
          />
        </View>
        <View style={styles.flexButton}>
          <AppButton
            title={secondaryLabel}
            variant="secondary"
            onPress={onSecondary}
            disabled={submitting}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.lg,
  },
  heroCard: {
    gap: theme.spacing.sm,
  },
  title: {
    color: '#13233E',
    ...theme.typography.sectionTitle,
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  formCard: {
    gap: theme.spacing.lg,
  },
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  inlineField: {
    flex: 1,
    minWidth: 140,
  },
  featuresCard: {
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    backgroundColor: '#F8FAFD',
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    color: '#13233E',
    ...theme.typography.label,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  featureLabel: {
    flex: 1,
    color: theme.colors.text,
    ...theme.typography.body,
  },
  imageSection: {
    gap: theme.spacing.md,
  },
  imageHeader: {
    gap: theme.spacing.sm,
  },
  imageFieldRow: {
    gap: theme.spacing.sm,
  },
  imageField: {
    flex: 1,
  },
  removeButtonWrap: {
    alignSelf: 'flex-start',
  },
  infoCard: {
    gap: theme.spacing.sm,
  },
  infoText: {
    color: theme.colors.infoText,
    ...theme.typography.bodySmall,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  flexButton: {
    flex: 1,
    minWidth: 140,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.bodySmall,
  },
});
