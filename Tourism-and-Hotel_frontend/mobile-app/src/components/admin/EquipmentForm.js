import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { AppTextField } from '../AppTextField';
import { theme } from '../../theme';
import { EQUIPMENT_CATEGORIES } from '../../services/adminEquipmentApi';
import { getDefaultImage, resolveMediaUrl } from '../../utils/media';

function CategorySelector({ value, onChange }) {
  return (
    <View style={styles.categoryWrap}>
      <Text style={styles.fieldLabel}>Equipment Category</Text>
      <View style={styles.categoryRow}>
        {EQUIPMENT_CATEGORIES.map((category) => {
          const active = category === value;
          return (
            <Pressable
              key={category}
              onPress={() => onChange(category)}
              style={[styles.categoryChip, active ? styles.categoryChipActive : null]}>
              <Text style={[styles.categoryChipLabel, active ? styles.categoryChipLabelActive : null]}>
                {category}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function EquipmentForm({
  title,
  subtitle,
  values,
  errors,
  onChange,
  onAddImageField,
  onRemoveImageField,
  submitLabel,
  secondaryLabel,
  onSubmit,
  onSecondary,
  submitting = false,
  disableKey = false,
}) {
  const imageUrls = values.imageUrls?.length ? values.imageUrls : [''];

  return (
    <View style={styles.container}>
      <AppCard style={styles.heroCard}>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>
      </AppCard>

      <AppCard style={styles.formCard}>
        <AppTextField
          label="Equipment Key"
          value={values.key}
          editable={!disableKey}
          onChangeText={(value) => onChange('key', value)}
          error={errors.key}
          autoCapitalize="characters"
        />

        <AppTextField
          label="Equipment Name"
          value={values.name}
          onChangeText={(value) => onChange('name', value)}
          error={errors.name}
        />

        <AppTextField
          label="Price Per Day"
          value={values.dailyRentalprice}
          onChangeText={(value) => onChange('dailyRentalprice', value)}
          error={errors.dailyRentalprice}
          keyboardType="numeric"
        />

        <AppTextField
          label="Initial Stock Count"
          value={values.stockCount}
          onChangeText={(value) => onChange('stockCount', value)}
          error={errors.stockCount}
          keyboardType="numeric"
        />

        <CategorySelector
          value={values.category}
          onChange={(value) => onChange('category', value)}
        />
        {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}

        <AppTextField
          label="Description"
          value={values.description}
          onChangeText={(value) => onChange('description', value)}
          error={errors.description}
          multiline
        />

        <View style={styles.imageSection}>
          <View style={styles.imageSectionHeader}>
            <Text style={styles.fieldLabel}>Product Images</Text>
            <Pressable onPress={onAddImageField} style={styles.addImageButton}>
              <MaterialCommunityIcons name="plus" size={18} color={theme.colors.primary} />
              <Text style={styles.addImageLabel}>Add Image</Text>
            </Pressable>
          </View>

          {imageUrls.map((imageUrl, index) => {
            const resolvedPreview = resolveMediaUrl(imageUrl, getDefaultImage());
            return (
              <View key={`image-${index}`} style={styles.imageFieldWrap}>
                <Image source={{ uri: resolvedPreview }} style={styles.imagePreview} contentFit="cover" />
                <View style={styles.imageFieldCopy}>
                  <AppTextField
                    label={`Image URL ${index + 1}`}
                    value={imageUrl}
                    onChangeText={(value) => onChange('imageUrls', value, index)}
                    error={errors.imageUrls?.[index]}
                    autoCapitalize="none"
                  />
                  {imageUrls.length > 1 ? (
                    <Pressable
                      onPress={() => onRemoveImageField(index)}
                      style={styles.removeImageButton}>
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.danger} />
                      <Text style={styles.removeImageLabel}>Remove</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}

          {typeof errors.image === 'string' ? (
            <Text style={styles.errorText}>{errors.image}</Text>
          ) : null}
        </View>

        <AppCard variant="info" style={styles.infoCard}>
          <Text style={styles.infoTitle}>Availability rule</Text>
          <Text style={styles.infoBody}>
            Required fields must be filled. Equipment becomes available when stock is above 0,
            and out-of-stock items remain visible with an unavailable status.
          </Text>
        </AppCard>

        <View style={styles.buttonRow}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  heroCard: {
    gap: theme.spacing.sm,
  },
  heroTitle: {
    color: '#13233E',
    ...theme.typography.sectionTitle,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  formCard: {
    gap: theme.spacing.lg,
  },
  fieldLabel: {
    color: theme.colors.text,
    ...theme.typography.label,
  },
  categoryWrap: {
    gap: theme.spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryChip: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: '#D8E1EE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipLabel: {
    color: theme.colors.primary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  categoryChipLabelActive: {
    color: '#FFFFFF',
  },
  imageSection: {
    gap: theme.spacing.md,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radii.pill,
    backgroundColor: '#EEF5FF',
  },
  addImageLabel: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  imageFieldWrap: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  imagePreview: {
    width: 82,
    height: 82,
    borderRadius: 18,
    backgroundColor: '#E7EDF6',
  },
  imageFieldCopy: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  removeImageLabel: {
    color: theme.colors.danger,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.bodySmall,
  },
  infoCard: {
    gap: theme.spacing.xs,
  },
  infoTitle: {
    color: theme.colors.infoText,
    ...theme.typography.label,
  },
  infoBody: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  flexButton: {
    flex: 1,
    minWidth: 130,
  },
});
