import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppTextField } from '../AppTextField';
import { theme } from '../../theme';

export function ImageUrlListInput({
  label = 'Image URLs',
  values = [''],
  error,
  onChangeItem,
  onAdd,
  onRemove,
}) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.rows}>
        {values.map((value, index) => (
          <View key={`image-url-${index}`} style={styles.row}>
            <View style={styles.inputWrap}>
              <AppTextField
                label=""
                value={value}
                onChangeText={(nextValue) => onChangeItem?.(index, nextValue)}
                placeholder="https://..."
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            {values.length > 1 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => onRemove?.(index)}
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed ? styles.pressed : null,
                ]}>
                <MaterialCommunityIcons name="close" size={18} color="#7A8496" />
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.addButtonWrap}>
        <Pressable
          accessibilityRole="button"
          onPress={onAdd}
          style={({ pressed }) => [styles.addButton, pressed ? styles.pressed : null]}>
          <Text style={styles.addButtonText}>+ Add Image URL</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.md,
  },
  label: {
    color: '#6C7A90',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  rows: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  inputWrap: {
    flex: 1,
  },
  removeButton: {
    width: 42,
    height: 42,
    marginTop: 1,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: '#D9E1EC',
    backgroundColor: '#F6F8FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonWrap: {
    alignItems: 'flex-start',
  },
  addButton: {
    minHeight: 40,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: '#D8DEE8',
    backgroundColor: '#F8FAFD',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#667489',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  error: {
    color: theme.colors.errorText,
    ...theme.typography.bodySmall,
  },
  pressed: {
    opacity: 0.9,
  },
});
