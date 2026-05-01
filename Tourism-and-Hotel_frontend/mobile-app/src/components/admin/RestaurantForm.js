import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { AppSelectField } from '../AppSelectField';
import { AppTextField } from '../AppTextField';
import { RESTAURANT_FORM_STATUS_OPTIONS } from '../../services/adminRestaurantApi';
import { theme } from '../../theme';

export function RestaurantForm({
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
          label="Restaurant Name"
          value={values.name}
          onChangeText={(value) => onChange?.('name', value)}
          error={errors.name}
          placeholder="WildHaven Dining"
        />

        <AppTextField
          label="Address"
          value={values.address}
          onChangeText={(value) => onChange?.('address', value)}
          error={errors.address}
          placeholder="Yala, Sri Lanka"
        />

        <AppTextField
          label="Phone"
          value={values.phone}
          onChangeText={(value) => onChange?.('phone', value)}
          error={errors.phone}
          placeholder="0771234567"
        />

        <AppTextField
          label="Opening Hours"
          value={values.openingHours}
          onChangeText={(value) => onChange?.('openingHours', value)}
          placeholder="6:00 AM - 10:00 PM"
        />

        <AppSelectField
          label="Status"
          value={values.status}
          options={RESTAURANT_FORM_STATUS_OPTIONS}
          onChange={(value) => onChange?.('status', value)}
          error={errors.status}
        />

        <AppTextField
          label="Description"
          value={values.description}
          onChangeText={(value) => onChange?.('description', value)}
          error={errors.description}
          placeholder="Describe the restaurant concept, cuisine, and dining experience..."
          multiline
        />

        <View style={styles.imageSection}>
          <View style={styles.imageHeader}>
            <Text style={styles.sectionTitle}>Restaurant Images</Text>
            <AppButton title="Add Image URL" variant="secondary" onPress={onAddImageField} />
          </View>

          {values.imageUrls.map((imageUrl, index) => (
            <View key={`restaurant-image-${index}`} style={styles.imageFieldRow}>
              <View style={styles.imageField}>
                <AppTextField
                  label={`Image URL ${index + 1}`}
                  value={imageUrl}
                  onChangeText={(value) => onChange?.('imageUrls', value, index)}
                  error={errors.imageUrls?.[index]}
                  placeholder="https://example.com/restaurant.jpg"
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
        </View>
      </AppCard>

      <AppCard variant="info" style={styles.infoCard}>
        <Text style={styles.infoText}>
          Required fields must be completed before saving. Restaurant visibility in the client app
          is controlled by the selected active status.
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
});
