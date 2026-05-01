import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { BrandLogo } from '../../src/components/BrandLogo';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Do you want to end your WildHaven session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <BrandLogo size="md" pressable href="/(tabs)" />

        {!isAuthenticated ? (
          <AppCard style={styles.profileCard}>
            <Text style={styles.sectionTitle}>Guest Mode</Text>
            <Text style={styles.infoText}>
              You can browse rooms, packages, vehicles, equipment, restaurants, and reviews
              without signing in. Login is only required when you want to book, rent, order,
              or manage your bookings.
            </Text>
            <AppButton title="Login or Sign Up" onPress={() => router.push('/(auth)/login')} />
          </AppCard>
        ) : null}

        {isAuthenticated ? (
        <AppCard style={styles.profileCard}>
          <Text style={styles.sectionTitle}>Guest Profile</Text>
          <ProfileRow label="Name" value={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Not available'} />
          <ProfileRow label="Email" value={user?.email ?? 'Not available'} />
          <ProfileRow label="Phone" value={user?.phone ?? 'Not available'} />
          <ProfileRow label="Role" value={user?.role ?? 'customer'} />
          <AppButton title="My Inquiries" variant="secondary" onPress={() => router.push('/inquiries')} />
        </AppCard>
        ) : null}

        {isAuthenticated && isAdmin ? (
          <AppCard variant="warning" style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Administrator Access</Text>
            <Text style={styles.infoTextDark}>
              Your account has admin privileges. Open the admin dashboard to manage users,
              bookings, rooms, equipment, and customer-facing services.
            </Text>
            <AppButton title="Open Admin Dashboard" onPress={() => router.push('/admin')} />
          </AppCard>
        ) : null}

        <AppCard variant="info" style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Milestone Status</Text>
          <Text style={styles.infoText}>
            Authentication, onboarding persistence, premium landing UI, and root navigation
            flow are now connected for the first mobile milestone.
          </Text>
        </AppCard>

        {isAuthenticated ? (
          <AppButton title="Sign Out" variant="danger" onPress={handleSignOut} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: 18,
  },
  profileCard: {
    gap: 14,
  },
  infoCard: {
    gap: 10,
  },
  sectionTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  row: {
    gap: 4,
  },
  rowLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  rowValue: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  infoText: {
    color: theme.colors.infoText,
    ...theme.typography.body,
  },
  infoTextDark: {
    color: theme.colors.warningText,
    ...theme.typography.body,
  },
});
