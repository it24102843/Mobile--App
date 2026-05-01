import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppSelectField } from '../AppSelectField';
import { AppTextField } from '../AppTextField';
import { FormChipSelector } from './FormChipSelector';
import { ImageUrlListInput } from './ImageUrlListInput';
import { HOTEL_AMENITY_OPTIONS, STAR_RATING_OPTIONS } from '../../services/adminHotelRoomApi';
import { theme } from '../../theme';

function FieldLabel({ children }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function Header({ title, subtitle, iconName, onClose }) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.titleWrap}>
        <View style={styles.titleInner}>
          <MaterialCommunityIcons name={iconName} size={24} color={theme.colors.accent} />
          <Text style={styles.title}>{title}</Text>
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <Pressable onPress={onClose} style={styles.closeButton}>
        <MaterialCommunityIcons name="close" size={22} color="#7B8698" />
      </Pressable>
    </View>
  );
}

function GeneratedBanner({ label, value }) {
  return (
    <View style={styles.generatedBanner}>
      <View style={styles.generatedCopy}>
        <Text style={styles.generatedLabel}>{label}</Text>
        <Text style={styles.generatedValue}>{value}</Text>
      </View>
      <Text style={styles.generatedHint}>Auto-generated</Text>
    </View>
  );
}

export function HotelForm({
  mode = 'add',
  values,
  errors = {},
  submitting = false,
  onChange,
  onToggleAmenity,
  onChangeImage,
  onAddImage,
  onRemoveImage,
  onCancel,
  onSubmit,
}) {
  const isEdit = mode === 'edit';

  return (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <View style={styles.formCard}>
        <Header
          title={isEdit ? 'Edit Hotel' : 'Add New Hotel'}
          subtitle={isEdit ? '' : 'Fill in the details to add a new hotel'}
          iconName={isEdit ? 'pencil' : 'office-building-plus'}
          onClose={onCancel}
        />

        <GeneratedBanner label="HOTEL ID" value={values.hotelId} />

        <View style={styles.fieldGrid}>
          <View style={styles.fieldHalf}>
            <FieldLabel>HOTEL NAME *</FieldLabel>
            <AppTextField
              label=""
              value={values.name}
              onChangeText={(nextValue) => onChange('name', nextValue)}
              placeholder="e.g. Amaya Hills"
              error={errors.name}
            />
          </View>

          <View style={styles.fieldHalf}>
            <FieldLabel>LOCATION *</FieldLabel>
            <AppTextField
              label=""
              value={values.location}
              onChangeText={(nextValue) => onChange('location', nextValue)}
              placeholder="e.g. Kandy, Sri Lanka"
              error={errors.location}
            />
          </View>

          <View style={styles.fieldHalf}>
            <FieldLabel>STAR RATING</FieldLabel>
            <AppSelectField
              label=""
              value={values.starRating}
              options={STAR_RATING_OPTIONS}
              onChange={(nextValue) => onChange('starRating', nextValue)}
              error={errors.starRating}
            />
          </View>

          <View style={styles.fieldHalf}>
            <FieldLabel>CONTACT EMAIL</FieldLabel>
            <AppTextField
              label=""
              value={values.contactEmail}
              onChangeText={(nextValue) => onChange('contactEmail', nextValue)}
              placeholder="info@hotel.com"
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.contactEmail}
            />
          </View>

          <View style={styles.fieldHalf}>
            <FieldLabel>CONTACT PHONE</FieldLabel>
            <AppTextField
              label=""
              value={values.contactPhone}
              onChangeText={(nextValue) => onChange('contactPhone', nextValue)}
              placeholder="+94 11 234 5678"
              keyboardType="phone-pad"
              error={errors.contactPhone}
            />
          </View>

          <View style={[styles.fieldHalf, styles.switchField]}>
            <View style={styles.switchRow}>
              <Switch
                value={values.isActive}
                onValueChange={(nextValue) => onChange('isActive', nextValue)}
                trackColor={{ false: '#D8DEE8', true: '#F7C86A' }}
                thumbColor={values.isActive ? '#FFFFFF' : '#FFFFFF'}
              />
              <Text style={styles.switchLabel}>Hotel is Active & Visible</Text>
            </View>
          </View>
        </View>

        <View style={styles.fullField}>
          <FieldLabel>DESCRIPTION *</FieldLabel>
          <AppTextField
            label=""
            value={values.description}
            onChangeText={(nextValue) => onChange('description', nextValue)}
            placeholder="Describe the hotel..."
            multiline
            error={errors.description}
          />
        </View>

        <FormChipSelector
          label="AMENITIES"
          options={HOTEL_AMENITY_OPTIONS}
          values={values.amenities}
          onToggle={onToggleAmenity}
          error={errors.amenities}
        />

        <ImageUrlListInput
          label="IMAGE URLS"
          values={values.images}
          onChangeItem={onChangeImage}
          onAdd={onAddImage}
          onRemove={onRemoveImage}
          error={errors.images}
        />

        <View style={styles.divider} />

        <View style={styles.footerRow}>
          <Pressable onPress={onCancel} style={({ pressed }) => [styles.cancelButton, pressed ? styles.pressed : null]}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>

          <View style={styles.submitWrap}>
            <AppButton
              title={submitting ? (isEdit ? 'Updating...' : 'Adding...') : isEdit ? 'Update Hotel' : 'Add Hotel'}
              variant={isEdit ? 'info' : 'primary'}
              onPress={onSubmit}
              disabled={submitting}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  formCard: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E8F0',
    padding: 18,
    gap: 18,
    ...theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  titleWrap: {
    flex: 1,
    gap: 6,
  },
  titleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#16253F',
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#6D7A90',
    ...theme.typography.body,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F5F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatedBanner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F4C359',
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  generatedCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  generatedLabel: {
    color: '#AC6A10',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  generatedValue: {
    color: theme.colors.accent,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  generatedHint: {
    color: '#7A8496',
    fontSize: 13,
    lineHeight: 16,
  },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  fieldHalf: {
    width: '47.8%',
    gap: 8,
  },
  switchField: {
    justifyContent: 'flex-end',
  },
  switchRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchLabel: {
    color: '#16253F',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  fieldLabel: {
    color: '#6C7A90',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  fullField: {
    gap: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8EDF4',
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  cancelButton: {
    minWidth: 92,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9E1EC',
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  cancelText: {
    color: '#6F7B8F',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
  submitWrap: {
    minWidth: 132,
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.92,
  },
});
