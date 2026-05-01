import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppCard } from './AppCard';
import { theme } from '../theme';

const accentStyles = {
  primary: {
    backgroundColor: theme.colors.primarySoft,
    iconColor: theme.colors.primary,
    borderColor: theme.colors.primaryMuted,
  },
  accent: {
    backgroundColor: theme.colors.accentSoft,
    iconColor: theme.colors.accent,
    borderColor: '#FFD1A0',
  },
  warning: {
    backgroundColor: theme.colors.warningSurface,
    iconColor: theme.colors.warning,
    borderColor: '#F1D47A',
  },
  info: {
    backgroundColor: theme.colors.infoSurface,
    iconColor: theme.colors.info,
    borderColor: theme.colors.infoBorder,
  },
};

export function ServiceCard({
  title,
  description,
  icon,
  accent = 'primary',
  onPress,
  style,
}) {
  const currentAccent = accentStyles[accent] || accentStyles.primary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed ? styles.pressed : null, style]}>
      <AppCard style={styles.card}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: currentAccent.backgroundColor,
              borderColor: currentAccent.borderColor,
            },
          ]}>
          <MaterialCommunityIcons name={icon} size={24} color={currentAccent.iconColor} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.footer}>
          <View style={styles.linkPill}>
            <Text style={styles.linkText}>Open service</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={16}
              color={theme.colors.primary}
            />
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  pressed: {
    opacity: 0.96,
    transform: [{ translateY: 2 }],
  },
  card: {
    flex: 1,
    minHeight: 212,
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#EADFCB',
    borderRadius: 24,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: theme.colors.text,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
  },
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing.xs,
  },
  linkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.primaryMuted,
  },
  linkText: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
});
