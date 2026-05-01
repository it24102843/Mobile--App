import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTextField } from '../AppTextField';
import { theme } from '../../theme';

export function UserForm({
  values,
  errors,
  roleOptions,
  onChange,
}) {
  return (
    <View style={styles.form}>
      <View style={styles.grid}>
        <View style={styles.gridColumn}>
          <AppTextField
            label="First Name"
            placeholder="Enter first name"
            value={values.firstName}
            onChangeText={(value) => onChange('firstName', value)}
            error={errors.firstName}
          />
        </View>
        <View style={styles.gridColumn}>
          <AppTextField
            label="Last Name"
            placeholder="Enter last name"
            value={values.lastName}
            onChangeText={(value) => onChange('lastName', value)}
            error={errors.lastName}
          />
        </View>
      </View>

      <AppTextField
        label="Email"
        placeholder="Enter email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={values.email}
        onChangeText={(value) => onChange('email', value)}
        error={errors.email}
      />

      <AppTextField
        label="Phone"
        placeholder="Enter phone number"
        keyboardType="phone-pad"
        value={values.phone}
        onChangeText={(value) => onChange('phone', value)}
        error={errors.phone}
      />

      <AppTextField
        label="Address"
        placeholder="Enter address"
        multiline
        value={values.address}
        onChangeText={(value) => onChange('address', value)}
        error={errors.address}
      />

      <AppTextField
        label="Profile Image URL"
        placeholder="https://example.com/profile.jpg"
        autoCapitalize="none"
        value={values.profilePicture}
        onChangeText={(value) => onChange('profilePicture', value)}
        error={errors.profilePicture}
      />

      <View style={styles.roleSection}>
        <Text style={styles.sectionLabel}>Role</Text>
        <View style={styles.chipWrap}>
          {roleOptions.map((option) => {
            const isActive = values.role === option.value;

            return (
              <Pressable
                key={option.value}
                style={[styles.chip, isActive ? styles.chipActive : null]}
                onPress={() => onChange('role', option.value)}>
                <Text style={[styles.chipText, isActive ? styles.chipTextActive : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {errors.role ? <Text style={styles.errorText}>{errors.role}</Text> : null}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Admin edit notes</Text>
        <Text style={styles.infoText}>
          Roles are controlled by the database. Use Admin only for verified staff accounts.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: theme.spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  gridColumn: {
    flex: 1,
    minWidth: 140,
  },
  roleSection: {
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    color: theme.colors.text,
    ...theme.typography.label,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  chipText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  chipTextActive: {
    color: theme.colors.accent,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.bodySmall,
  },
  infoBox: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.infoBorder,
    backgroundColor: theme.colors.infoSurface,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  infoTitle: {
    color: theme.colors.infoText,
    ...theme.typography.label,
  },
  infoText: {
    color: theme.colors.infoText,
    ...theme.typography.bodySmall,
  },
});
