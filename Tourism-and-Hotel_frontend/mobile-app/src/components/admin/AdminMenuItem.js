import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

export function AdminMenuItem({
  icon,
  title,
  subtitle,
  metricLabel,
  active = false,
  destructive = false,
  onPress,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        active ? styles.itemActive : null,
        destructive ? styles.itemDestructive : null,
        pressed ? styles.pressed : null,
      ]}>
      <View style={styles.leftWrap}>
        <View
          style={[
            styles.iconWrap,
            active ? styles.iconWrapActive : null,
            destructive ? styles.iconWrapDestructive : null,
          ]}>
          <MaterialCommunityIcons
            name={icon}
            size={22}
            color={
              active ? theme.colors.textOnDark : destructive ? theme.colors.errorText : theme.colors.accent
            }
          />
        </View>

        <View style={styles.copyWrap}>
          <Text
            style={[
              styles.title,
              active ? styles.titleActive : null,
              destructive ? styles.titleDestructive : null,
            ]}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                active ? styles.subtitleActive : null,
                destructive ? styles.subtitleDestructive : null,
              ]}
              numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rightWrap}>
        {metricLabel ? (
          <View
            style={[
              styles.metricPill,
              active ? styles.metricPillActive : null,
              destructive ? styles.metricPillDestructive : null,
            ]}>
            <Text
              style={[
                styles.metricText,
                active ? styles.metricTextActive : null,
                destructive ? styles.metricTextDestructive : null,
              ]}>
              {metricLabel}
            </Text>
          </View>
        ) : null}

        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={
            active ? theme.colors.textOnDark : destructive ? theme.colors.errorText : '#7A8CA8'
          }
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    minHeight: 68,
    borderRadius: 22,
    backgroundColor: '#FCF9F3',
    borderWidth: 1,
    borderColor: '#EADFCB',
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  itemActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  itemDestructive: {
    borderColor: '#F4C9C9',
    backgroundColor: '#FFF7F7',
  },
  pressed: {
    opacity: 0.94,
  },
  leftWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  copyWrap: {
    flex: 1,
    gap: 2,
    paddingTop: 1,
  },
  rightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFF0DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  iconWrapDestructive: {
    backgroundColor: '#FCE4E4',
  },
  title: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  titleActive: {
    color: theme.colors.textOnDark,
  },
  titleDestructive: {
    color: theme.colors.errorText,
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  subtitleActive: {
    color: 'rgba(255,255,255,0.84)',
  },
  subtitleDestructive: {
    color: '#A96363',
  },
  metricPill: {
    borderRadius: theme.radii.pill,
    backgroundColor: '#EEF3FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metricPillActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  metricPillDestructive: {
    backgroundColor: '#FCEAEA',
  },
  metricText: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  metricTextActive: {
    color: theme.colors.textOnDark,
  },
  metricTextDestructive: {
    color: theme.colors.errorText,
  },
});
