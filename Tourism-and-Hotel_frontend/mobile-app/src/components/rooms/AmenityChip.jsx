import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

export function AmenityChip({ label, icon, enabled }) {
  return (
    <View style={[styles.chip, enabled ? styles.chipEnabled : styles.chipDisabled]}>
      <View style={styles.leftWrap}>
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={enabled ? theme.colors.accent : '#CFC7BA'}
        />
        <Text style={[styles.label, enabled ? styles.labelEnabled : styles.labelDisabled]}>
          {label}
        </Text>
      </View>

      <MaterialCommunityIcons
        name={enabled ? 'check' : 'close'}
        size={16}
        color={enabled ? theme.colors.accent : '#D6CEC2'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minWidth: '47%',
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  chipEnabled: {
    backgroundColor: '#FFF8EE',
    borderColor: '#F4D8A8',
  },
  chipDisabled: {
    backgroundColor: '#FFFCF7',
    borderColor: '#EEE4D2',
  },
  leftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  label: {
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  labelEnabled: {
    color: theme.colors.accent,
  },
  labelDisabled: {
    color: '#CEC4B6',
  },
});
