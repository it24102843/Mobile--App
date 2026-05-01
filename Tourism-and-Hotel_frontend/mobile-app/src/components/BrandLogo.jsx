import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { theme } from '../theme';

const logoSizes = {
  sm: {
    badge: 48,
    icon: 20,
    title: 18,
    subtitle: 11,
  },
  md: {
    badge: 62,
    icon: 26,
    title: 24,
    subtitle: 12,
  },
  lg: {
    badge: 84,
    icon: 34,
    title: 34,
    subtitle: 14,
  },
};

export function BrandLogo({ size = 'md', pressable = false, href = '/(tabs)' }) {
  const router = useRouter();
  const currentSize = logoSizes[size];

  const content = (
    <View style={styles.row}>
      <View
        style={[
          styles.badge,
          {
            width: currentSize.badge,
            height: currentSize.badge,
            borderRadius: currentSize.badge / 2,
          },
        ]}>
        <View style={styles.badgeInner}>
          <MaterialCommunityIcons
            name="white-balance-sunny"
            color={theme.colors.accent}
            size={currentSize.icon}
          />
        </View>
      </View>

      <View style={styles.textBlock}>
        <Text style={[styles.title, { fontSize: currentSize.title }]}>WildHaven</Text>
        <Text style={[styles.subtitle, { fontSize: currentSize.subtitle }]}>
          RESORT & SAFARI
        </Text>
      </View>
    </View>
  );

  if (!pressable) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(href)}
      style={({ pressed }) => [pressed ? styles.pressed : null]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pressed: {
    opacity: 0.88,
  },
  badge: {
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primaryMuted,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  badgeInner: {
    width: '78%',
    height: '78%',
    borderRadius: 999,
    backgroundColor: theme.colors.badgeInner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    gap: 3,
  },
  title: {
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: theme.colors.accent,
    fontWeight: '700',
    letterSpacing: 2.6,
  },
});
