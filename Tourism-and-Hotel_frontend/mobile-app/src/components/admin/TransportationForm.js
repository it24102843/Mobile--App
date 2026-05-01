import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { AppSelectField } from '../AppSelectField';
import { AppTextField } from '../AppTextField';
import { TRANSPORTATION_FORM_STATUS_OPTIONS } from '../../services/adminTransportationApi';
import { theme } from '../../theme';

export function TransportationForm({
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
          placeholder="WildHaven Safari Cruiser"
        />

        <AppTextField
          label="Vehicle Type"
          value={values.type}
          onChangeText={(value) => onChange?.('type', value)}
          error={errors.type}
          placeholder="Safari Jeep"
        />

        <AppTextField
          label="Registration Number"
          value={values.registrationNumber}
          onChangeText={(value) => onChange?.('registrationNumber', value)}
          error={errors.registrationNumber}
          placeholder="CAB-1234"
        />

        <AppTextField
          label="Driver Name"
          value={values.driverName}
          onChangeText={(value) => onChange?.('driverName', value)}
          placeholder="Nimal Perera"
        />

        <AppTextField
          label="Driver Contact"
          value={values.driverContact}
          onChangeText={(value) => onChange?.('driverContact', value)}
          placeholder="0771234567"
        />

        <View style={styles.inlineRow}>
          <View style={styles.inlineField}>
            <AppTextField
              label="Seats"
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
          options={TRANSPORTATION_FORM_STATUS_OPTIONS}
          onChange={(value) => onChange?.('status', value)}
          error={errors.status}
        />

        <AppTextField
          label="Description"
          value={values.description}
          onChangeText={(value) => onChange?.('description', value)}
          error={errors.description}
          placeholder="Describe the route suitability, comfort level, and transportation use..."
          multiline
        />

        <View style={styles.imageSection}>
          <View style={styles.imageHeader}>
            <Text style={styles.sectionTitle}>Vehicle Images</Text>
            <AppButton title="Add Image URL" variant="secondary" onPress={onAddImageField} />
          </View>

          {values.imageUrls.map((imageUrl, index) => (
            <View key={`transport-image-${index}`} style={styles.imageFieldRow}>
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
        </View>
      </AppCard>

      <AppCard variant="info" style={styles.infoCard}>
        <Text style={styles.infoText}>
          Required fields must be completed before saving. Transportation availability is driven by
          the selected status, and existing images remain unchanged if you keep the current URLs.
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
