import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppSelectField } from '../AppSelectField';
import { AppTextField } from '../AppTextField';
import { FormChipSelector } from './FormChipSelector';
import { ImageUrlListInput } from './ImageUrlListInput';
import { ROOM_FACILITY_OPTIONS, ROOM_STATUS_OPTIONS, ROOM_TYPE_OPTIONS } from '../../services/adminHotelRoomApi';
import { theme } from '../../theme';

function FieldLabel({ children }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function Header({ title, iconName, onClose }) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.titleInner}>
        <MaterialCommunityIcons name={iconName} size={24} color={theme.colors.accent} />
        <Text style={styles.title}>{title}</Text>
      </View>

      <Pressable onPress={onClose} style={styles.closeButton}>
        <MaterialCommunityIcons name="close" size={22} color="#7B8698" />
      </Pressable>
    </View>
  );
}

function GeneratedBanner({ value }) {
  return (
    <View style={styles.generatedBanner}>
      <View style={styles.generatedCopy}>
        <Text style={styles.generatedLabel}>ROOM KEY</Text>
        <Text style={styles.generatedValue}>{value}</Text>
      </View>
      <Text style={styles.generatedHint}>Auto-generated</Text>
    </View>
  );
}

export function RoomForm({
  mode = 'add',
  values,
  errors = {},
  hotelOptions = [],
  submitting = false,
  onChange,
  onToggleFacility,
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
          title={isEdit ? 'Edit Room' : 'Add New Room'}
          iconName={isEdit ? 'pencil' : 'bed-king-outline'}
          onClose={onCancel}
        />

        <GeneratedBanner value={values.key} />

        <View style={styles.fieldGrid}>
          <View style={styles.fieldHalf}>
            <FieldLabel>ROOM NUMBER *</FieldLabel>
            <AppTextField
              label=""
              value={values.roomNumber}
              onChangeText={(nextValue) => onChange('roomNumber', nextValue)}
              placeholder="e.g. 101"
              error={errors.roomNumber}
            />
          </View>

          <View style={styles.fieldHalf}>
            <FieldLabel>HOTEL *</FieldLabel>
            <AppSelectField
              label=""
              value={values.hotelName}
              options={hotelOptions}
              placeholder="Select hotel..."
              onChange={(nextValue) => onChange('hotelName', nextValue)}
              error={errors.hotelName}
            />
          </View>

          <View style={styles.fieldHalf}>
            <FieldLabel>ROOM TYPE</FieldLabel>
            <AppSelectField
              label=""
              value={values.roomType}
              options={ROOM_TYPE_OPTIONS}
              onChange={(nextValue) => onChange('roomType', nextValue)}
              error={errors.roomType}
            />
          </View>

          <View style={styles.fieldHalf}>
            <FieldLabel>PRICE PER NIGHT (LKR) *</FieldLabel>
            <AppTextField
              label=""
              value={values.price}
              onChangeText={(nextValue) => onChange('price', nextValue)}
              placeholder="18500"
              keyboardType="numeric"
              error={errors.price}
            />
          </View>

          <View style={styles.fieldHalf}>
            <FieldLabel>MAX CAPACITY (GUESTS)</FieldLabel>
            <AppTextField
              label=""
              value={values.capacity}
              onChangeText={(nextValue) => onChange('capacity', nextValue)}
              placeholder="2"
              keyboardType="numeric"
              error={errors.capacity}
            />
          </View>

          <View style={styles.fieldHalf}>
            <FieldLabel>STATUS</FieldLabel>
            <AppSelectField
              label=""
              value={values.status}
              options={ROOM_STATUS_OPTIONS}
              onChange={(nextValue) => onChange('status', nextValue)}
              error={errors.status}
            />
          </View>
        </View>

        <View style={styles.fullField}>
          <FieldLabel>DESCRIPTION</FieldLabel>
          <AppTextField
            label=""
            value={values.description}
            onChangeText={(nextValue) => onChange('description', nextValue)}
            placeholder="Describe the room..."
            multiline
            error={errors.description}
          />
        </View>

        <FormChipSelector
          label="FACILITIES"
          options={ROOM_FACILITY_OPTIONS}
          values={values.facilities}
          onToggle={onToggleFacility}
          error={errors.facilities}
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
              title={submitting ? (isEdit ? 'Updating...' : 'Adding...') : isEdit ? 'Update Room' : 'Add Room'}
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
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  titleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  title: {
    color: '#16253F',
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '800',
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
