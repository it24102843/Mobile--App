import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppCard } from '../src/components/AppCard';
import { BrandLogo } from '../src/components/BrandLogo';
import { useAuth } from '../src/context/AuthContext';
import { getOnboardingCompleted } from '../src/utils/onboarding';
import { theme } from '../src/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, isAdmin } = useAuth();
  const [showForMinimumTime, setShowForMinimumTime] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowForMinimumTime(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadOnboardingState() {
      const completed = await getOnboardingCompleted();
      if (mounted) {
        setHasOnboarded(completed);
      }
    }

    loadOnboardingState();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!showForMinimumTime || hasOnboarded === null || !isHydrated) {
      return;
    }

    if (!hasOnboarded) {
      router.replace('/onboarding');
      return;
    }

    if (isAuthenticated && isAdmin) {
      router.replace('/admin');
      return;
    }

    if (isAuthenticated) {
      router.replace('/(tabs)');
      return;
    }

    router.replace('/(tabs)');
  }, [hasOnboarded, isAdmin, isAuthenticated, isHydrated, router, showForMinimumTime]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AppCard variant="primary" style={styles.heroCard}>
          <Text style={styles.eyebrow}>WildHaven Mobile</Text>
          <BrandLogo size="lg" />
          <Text style={styles.heroTitle}>Stay, safari, dine, and book with ease.</Text>
          <Text style={styles.heroSubtitle}>
            A polished mobile experience shaped around the same visual language as your
            web app.
          </Text>
        </AppCard>

        <View style={styles.logoWrap}>
          <View style={styles.copyBlock}>
            <Text style={styles.title}>Smart travel management in one place</Text>
            <Text style={styles.subtitle}>
              Boutique stays, safari adventures, and seamless booking flows with clear
              status colors and branded actions.
            </Text>
          </View>
        </View>

        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.colors.accent} size="small" />
          <Text style={styles.loadingText}>Preparing your resort experience...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    paddingVertical: theme.spacing.xxxl,
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
  },
  heroCard: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    gap: theme.spacing.md,
  },
  eyebrow: {
    color: theme.colors.primaryMuted,
    ...theme.typography.eyebrow,
  },
  heroTitle: {
    color: theme.colors.textOnDark,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#DDE7F4',
    ...theme.typography.body,
  },
  logoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  copyBlock: {
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.heroTitle,
    letterSpacing: 0.3,
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    letterSpacing: 0.2,
  },
});
