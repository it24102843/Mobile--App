import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { AppSelectField } from '../AppSelectField';
import { AppTextField } from '../AppTextField';
import { RESTAURANT_FORM_STATUS_OPTIONS } from '../../services/adminRestaurantApi';
import { theme } from '../../theme';

export function MenuForm({
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
    <AppCard style={styles.formCard}>
      <AppTextField
        label="Menu Name"
        value={values.name}
        onChangeText={(value) => onChange?.('name', value)}
        error={errors.name}
        placeholder="Breakfast"
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
        placeholder="Describe the menu theme and service period..."
        multiline
      />

      <View style={styles.imageSection}>
        <View style={styles.imageHeader}>
          <Text style={styles.sectionTitle}>Menu Images</Text>
          <AppButton title="Add Image URL" variant="secondary" onPress={onAddImageField} />
        </View>

        {values.imageUrls.map((imageUrl, index) => (
          <View key={`menu-image-${index}`} style={styles.imageFieldRow}>
            <View style={styles.imageField}>
              <AppTextField
                label={`Image URL ${index + 1}`}
                value={imageUrl}
                onChangeText={(value) => onChange?.('imageUrls', value, index)}
                error={errors.imageUrls?.[index]}
                placeholder="https://example.com/menu.jpg"
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
    </AppCard>
  );
}

const styles = StyleSheet.create({
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
