import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth as useAuthContext } from '../context/AuthContext';

export const AUTH_REQUIRED_MESSAGE = 'Please login or sign up to continue';

export function useAuth() {
  return useAuthContext();
}

export function useRequireAuth() {
  const auth = useAuthContext();
  const router = useRouter();

  return (targetPath = '/(tabs)', options = {}) => {
    if (auth.isAuthenticated) {
      return true;
    }

    const message = options.message || AUTH_REQUIRED_MESSAGE;

    if (options.showAlert !== false) {
      Alert.alert('Authentication Required', message);
    }

    router.push({
      pathname: '/(auth)/login',
      params: {
        redirect: targetPath,
        message,
      },
    });

    return false;
  };
}
