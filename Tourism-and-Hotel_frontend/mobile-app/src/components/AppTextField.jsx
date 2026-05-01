import { StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '../theme';

export function AppTextField({ label, error, multiline, style, ...props }) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.colors.textSubtle}
        style={[
          styles.input,
          multiline ? styles.multilineInput : null,
          error ? styles.inputError : null,
          style,
        ]}
        multiline={multiline}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.text,
    ...theme.typography.label,
  },
  input: {
    minHeight: 54,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
    paddingHorizontal: 16,
    fontSize: 15,
    ...theme.shadows.subtle,
  },
  multilineInput: {
    minHeight: 110,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: theme.colors.errorBorder,
  },
  error: {
    color: theme.colors.errorText,
    ...theme.typography.bodySmall,
  },
});
