import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { AppSelectField } from '../AppSelectField';
import { AppTextField } from '../AppTextField';
import { PACKAGE_CATEGORIES } from '../../services/adminPackagesApi';
import { theme } from '../../theme';

const CATEGORY_OPTIONS = PACKAGE_CATEGORIES.map((category) => ({
  label: category,
  value: category,
}));

const AVAILABILITY_OPTIONS = [
  { label: 'Available', value: 'available' },
  { label: 'Unavailable', value: 'unavailable' },
];

const CUSTOMIZATION_OPTIONS = [
  { label: 'Enabled', value: 'enabled' },
  { label: 'Disabled', value: 'disabled' },
];

export function PackageForm({
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
  disablePackageId = false,
  submitVariant = 'primary',
}) {
  return (
    <View style={styles.wrapper}>
      <AppCard style={styles.heroCard}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </AppCard>

      <AppCard style={styles.formCard}>
        <AppTextField
          label="Package ID"
          value={values.packageId}
          onChangeText={(value) => onChange?.('packageId', value)}
          editable={!disablePackageId}
          error={errors.packageId}
          placeholder="PKG-001"
        />

        <AppTextField
          label="Package Name"
          value={values.name}
          onChangeText={(value) => onChange?.('name', value)}
          error={errors.name}
          placeholder="Wild Safari Escape"
        />

        <AppSelectField
          label="Category"
          value={values.category}
          options={CATEGORY_OPTIONS}
          onChange={(value) => onChange?.('category', value)}
          error={errors.category}
        />

        <AppTextField
          label="Description"
          value={values.description}
          onChangeText={(value) => onChange?.('description', value)}
          error={errors.description}
          placeholder="Describe the package experience..."
          multiline
        />

        <View style={styles.inlineRow}>
          <View style={styles.inlineField}>
            <AppTextField
              label="Duration Days"
              value={values.durationDays}
              onChangeText={(value) => onChange?.('durationDays', value)}
              error={errors.durationDays}
              placeholder="2"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.inlineField}>
            <AppTextField
              label="Duration Nights"
              value={values.durationNights}
              onChangeText={(value) => onChange?.('durationNights', value)}
              error={errors.durationNights}
              placeholder="1"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.inlineRow}>
          <View style={styles.inlineField}>
            <AppTextField
              label="Price"
              value={values.price}
              onChangeText={(value) => onChange?.('price', value)}
              error={errors.price}
              placeholder="45000"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.inlineField}>
            <AppTextField
              label="Max Guests"
              value={values.maxGroupSize}
              onChangeText={(value) => onChange?.('maxGroupSize', value)}
              error={errors.maxGroupSize}
              placeholder="6"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.inlineRow}>
          <View style={styles.inlineField}>
            <AppSelectField
              label="Availability"
              value={values.availability}
              options={AVAILABILITY_OPTIONS}
              onChange={(value) => onChange?.('availability', value)}
            />
          </View>
          <View style={styles.inlineField}>
            <AppSelectField
              label="Customization"
              value={values.customizationEnabled}
              options={CUSTOMIZATION_OPTIONS}
              onChange={(value) => onChange?.('customizationEnabled', value)}
            />
          </View>
        </View>

        <AppTextField
          label="Meeting Point"
          value={values.meetingPoint}
          onChangeText={(value) => onChange?.('meetingPoint', value)}
          error={errors.meetingPoint}
          placeholder="Kataragama Town Center"
        />

        <AppTextField
          label="Highlights"
          value={values.highlights}
          onChangeText={(value) => onChange?.('highlights', value)}
          placeholder="One per line or comma separated"
          multiline
        />

        <AppTextField
          label="Includes"
          value={values.includes}
          onChangeText={(value) => onChange?.('includes', value)}
          placeholder="One per line or comma separated"
          multiline
        />

        <AppTextField
          label="Excludes"
          value={values.excludes}
          onChangeText={(value) => onChange?.('excludes', value)}
          placeholder="One per line or comma separated"
          multiline
        />

        <AppTextField
          label="Rating"
          value={values.rating}
          onChangeText={(value) => onChange?.('rating', value)}
          error={errors.rating}
          placeholder="4.5"
          keyboardType="decimal-pad"
        />

        <View style={styles.imageSection}>
          <View style={styles.imageHeader}>
            <Text style={styles.sectionTitle}>Package Images</Text>
            <AppButton title="Add Image URL" variant="secondary" onPress={onAddImageField} />
          </View>

          {values.imageUrls.map((imageUrl, index) => (
            <View key={`package-image-${index}`} style={styles.imageFieldRow}>
              <View style={styles.imageField}>
                <AppTextField
                  label={`Image URL ${index + 1}`}
                  value={imageUrl}
                  onChangeText={(value) => onChange?.('imageUrls', value, index)}
                  error={errors.imageUrls?.[index]}
                  placeholder="https://example.com/package-image.jpg"
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
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.info} />
          <Text style={styles.infoText}>
            Required fields must be completed before saving. Availability controls whether clients
            can browse and book this package from the live mobile app.
          </Text>
        </View>
      </AppCard>

      <View style={styles.actionRow}>
        <View style={styles.flexButton}>
          <AppButton
            title={submitting ? 'Saving...' : submitLabel}
            variant={submitVariant}
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
  imageSection: {
    gap: theme.spacing.md,
  },
  imageHeader: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: '#13233E',
    ...theme.typography.label,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
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
