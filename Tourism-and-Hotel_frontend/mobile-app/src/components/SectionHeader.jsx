import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../theme';

export function SectionHeader({ eyebrow, title, subtitle, actionLabel, onActionPress }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.titleBlock}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <Pressable onPress={onActionPress} disabled={!onActionPress}>
          {({ pressed }) => (
            <View style={[styles.actionChip, pressed ? styles.actionPressed : null]}>
              <Text style={styles.action}>{actionLabel}</Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={16}
                color={theme.colors.primary}
              />
            </View>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: theme.spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: theme.colors.accent,
    ...theme.typography.eyebrow,
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  action: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  actionChip: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionPressed: {
    opacity: 0.86,
  },
});
