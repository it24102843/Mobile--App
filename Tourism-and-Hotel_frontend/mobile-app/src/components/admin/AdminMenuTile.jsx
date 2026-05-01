import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { StatusBadge } from '../StatusBadge';
import { theme } from '../../theme';

export function AdminMenuTile({ icon, title, description, metricLabel, active = false, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        active ? styles.tileActive : null,
        pressed ? styles.pressed : null,
      ]}>
      <View style={[styles.iconWrap, active ? styles.iconWrapActive : null]}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={active ? theme.colors.textOnDark : theme.colors.primary}
        />
      </View>

      <View style={styles.copyBlock}>
        <Text style={[styles.title, active ? styles.titleActive : null]}>{title}</Text>
        <Text style={[styles.description, active ? styles.descriptionActive : null]}>
          {description}
        </Text>
      </View>

      {metricLabel ? (
        <StatusBadge label={metricLabel} variant={active ? 'accent' : 'primary'} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: '#E1E8F0',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadows.subtle,
  },
  tileActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ translateY: 1 }],
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(242,140,40,0.18)',
  },
  copyBlock: {
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  titleActive: {
    color: theme.colors.textOnDark,
  },
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  descriptionActive: {
    color: '#D7E3F3',
  },
});
