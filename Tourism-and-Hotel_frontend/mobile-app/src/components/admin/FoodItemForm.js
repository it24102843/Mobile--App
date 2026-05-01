import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { AppSelectField } from '../AppSelectField';
import { AppTextField } from '../AppTextField';
import { FOOD_FORM_STATUS_OPTIONS } from '../../services/adminRestaurantApi';
import { theme } from '../../theme';

const CATEGORY_OPTIONS = [
  { label: 'Main Course', value: 'Main Course' },
  { label: 'Breakfast', value: 'Breakfast' },
  { label: 'Lunch', value: 'Lunch' },
  { label: 'Dinner', value: 'Dinner' },
  { label: 'Dessert', value: 'Dessert' },
  { label: 'Beverage', value: 'Beverage' },
  { label: 'Snack', value: 'Snack' },
];

export function FoodItemForm({
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
          label="Food Item Name"
          value={values.name}
          onChangeText={(value) => onChange?.('name', value)}
          error={errors.name}
          placeholder="Jungle Breakfast"
        />

        <AppSelectField
          label="Category"
          value={values.category}
          options={CATEGORY_OPTIONS}
          onChange={(value) => onChange?.('category', value)}
          error={errors.category}
        />

        <View style={styles.inlineRow}>
          <View style={styles.inlineField}>
            <AppTextField
              label="Price"
              value={values.price}
              onChangeText={(value) => onChange?.('price', value)}
              error={errors.price}
              placeholder="2500"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.inlineField}>
            <AppTextField
              label="Preparation Time (mins)"
              value={values.preparationTime}
              onChangeText={(value) => onChange?.('preparationTime', value)}
              error={errors.preparationTime}
              placeholder="20"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <AppSelectField
          label="Availability"
          value={values.status}
          options={FOOD_FORM_STATUS_OPTIONS}
          onChange={(value) => onChange?.('status', value)}
          error={errors.status}
        />

        <AppTextField
          label="Description"
          value={values.description}
          onChangeText={(value) => onChange?.('description', value)}
          error={errors.description}
          placeholder="Describe the dish, flavors, and ingredients..."
          multiline
        />

        <View style={styles.imageSection}>
          <View style={styles.imageHeader}>
            <Text style={styles.sectionTitle}>Food Item Images</Text>
            <AppButton title="Add Image URL" variant="secondary" onPress={onAddImageField} />
          </View>

          {values.imageUrls.map((imageUrl, index) => (
            <View key={`food-image-${index}`} style={styles.imageFieldRow}>
              <View style={styles.imageField}>
                <AppTextField
                  label={`Image URL ${index + 1}`}
                  value={imageUrl}
                  onChangeText={(value) => onChange?.('imageUrls', value, index)}
                  error={errors.imageUrls?.[index]}
                  placeholder="https://example.com/food.jpg"
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
          Price must be a positive number. Availability controls whether the item appears in the
          public restaurant browsing flow.
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
