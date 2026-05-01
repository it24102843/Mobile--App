import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

export function GuestCounter({ value, max, onChange }) {
  const numericValue = Number(value) || 1;

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange(Math.max(numericValue - 1, 1))}
        style={styles.actionButton}>
        <MaterialCommunityIcons name="minus" size={22} color="#2E2419" />
      </Pressable>

      <View style={styles.valueShell}>
        <Text style={styles.valueText}>{numericValue}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => onChange(Math.min(numericValue + 1, max || numericValue + 1))}
        style={styles.actionButton}>
        <MaterialCommunityIcons name="plus" size={22} color="#2E2419" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: 54,
    height: 54,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#E7DBC6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueShell: {
    flex: 1,
    minHeight: 54,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#E7DBC6',
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    color: '#2E2419',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
});
