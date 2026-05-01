import { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme';

export function AdminGuard({ children }) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isHydrated } = useAuth();
  const hasShownUnauthorizedAlert = useRef(false);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || isAdmin || hasShownUnauthorizedAlert.current) {
      return;
    }

    hasShownUnauthorizedAlert.current = true;

    Alert.alert('Admin access only', 'Only registered admins can access this dashboard.', [
      {
        text: 'OK',
        onPress: () => {
          router.replace('/(tabs)');
        },
      },
    ]);
  }, [isAdmin, isAuthenticated, isHydrated, router]);

  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.loaderText}>Preparing admin workspace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <Redirect
        href={{
          pathname: '/(auth)/login',
          params: {
            redirect: '/admin',
            message: 'Please login with an admin account to continue.',
          },
        }}
      />
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.loaderText}>Checking administrator access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  loaderText: {
    color: theme.colors.textOnDark,
    ...theme.typography.body,
  },
});
