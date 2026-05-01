import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { theme } from '../../theme';

export function AdminHeader({ user }) {
  const router = useRouter();
  const fullName =
    `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'WildHaven Admin';

  return (
    <View style={styles.wrapper}>
      <View style={styles.copyBlock}>
        <Text style={styles.eyebrow}>Admin Control Center</Text>
        <Text style={styles.title}>WildHaven Dashboard</Text>
        <Text style={styles.subtitle}>
          Welcome back, {fullName}. Monitor bookings, inventory, and customer activity in
          one place.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/admin/users')}
        style={({ pressed }) => [styles.adminBadge, pressed ? styles.pressed : null]}>
        <MaterialCommunityIcons name="shield-account" size={28} color={theme.colors.textOnDark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.lg,
  },
  copyBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: '#D9E1F3',
    ...theme.typography.eyebrow,
  },
  title: {
    color: theme.colors.textOnDark,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  subtitle: {
    color: '#D7E3F3',
    ...theme.typography.body,
  },
  adminBadge: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.26,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  pressed: {
    opacity: 0.92,
  },
});
