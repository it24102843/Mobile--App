import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';

const badgeStyles = {
  primary: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primaryMuted,
    textColor: theme.colors.primary,
  },
  accent: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: '#FFD1A0',
    textColor: theme.colors.accent,
  },
  warning: {
    backgroundColor: theme.colors.warningSurface,
    borderColor: '#F1D47A',
    textColor: theme.colors.warningText,
  },
  info: {
    backgroundColor: theme.colors.infoSurface,
    borderColor: theme.colors.infoBorder,
    textColor: theme.colors.infoText,
  },
  danger: {
    backgroundColor: theme.colors.dangerSurface,
    borderColor: theme.colors.dangerBorder,
    textColor: theme.colors.dangerText,
  },
};

export function StatusBadge({ label, variant = 'primary' }) {
  const currentStyle = badgeStyles[variant] || badgeStyles.primary;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: currentStyle.backgroundColor,
          borderColor: currentStyle.borderColor,
        },
      ]}>
      <Text style={[styles.text, { color: currentStyle.textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
});
