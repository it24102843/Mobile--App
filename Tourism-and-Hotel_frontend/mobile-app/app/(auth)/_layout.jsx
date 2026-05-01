import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../src/context/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated, isHydrated, isAdmin } = useAuth();

  if (!isHydrated) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href={isAdmin ? '/admin' : '/(tabs)'} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
