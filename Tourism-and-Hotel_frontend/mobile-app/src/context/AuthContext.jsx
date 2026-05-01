import { createContext, useContext, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';

import { getCurrentUser, loginUser, registerUser } from '../api/auth';
import { API_BASE_URL } from '../config/env';
import { clearSession, getStoredSession, saveSession } from '../utils/storage';

const AuthContext = createContext(undefined);

function resolveRole(user) {
  const normalizedRole = user?.role ? `${user.role}`.trim().toLowerCase() : null;

  if (normalizedRole === 'admin' || user?.isAdmin === true) {
    return 'admin';
  }

  if (normalizedRole) {
    return normalizedRole;
  }

  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const storedSession = await getStoredSession();

        if (!storedSession?.token) {
          if (mounted) {
            setIsHydrated(true);
          }
          return;
        }

        if (mounted && storedSession.user) {
          setToken(storedSession.token);
          setUser(storedSession.user);
        }

        const currentUser = await getCurrentUser(storedSession.token);

        if (mounted) {
          setToken(storedSession.token);
          setUser(currentUser);
          await saveSession({ token: storedSession.token, user: currentUser });
          setIsHydrated(true);
        }
      } catch {
        await clearSession();
        if (mounted) {
          setToken(null);
          setUser(null);
          setIsHydrated(true);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (values) => {
    try {
      const response = await loginUser({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      console.log('[Auth] Login response', {
        hasToken: Boolean(response?.token),
        role: response?.user?.role,
        isAdmin: response?.user?.isAdmin,
        email: response?.user?.email,
      });
      await saveSession({ token: response.token, user: response.user });
      setToken(response.token);
      setUser(response.user);
      return response.user;
    } catch (error) {
      if (isAxiosError(error)) {
        if (!error.response) {
          throw new Error(
            `Unable to reach the backend at ${API_BASE_URL}. If you are using a physical phone, do not use localhost.`
          );
        }

        throw new Error(
          error.response?.data?.error ||
            error.response?.data?.message ||
            'Unable to sign in. Please check your credentials and API URL.'
        );
      }

      throw error;
    }
  };

  const signUp = async (values) => {
    try {
      await registerUser({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        address: values.address.trim(),
        password: values.password,
      });

      return await signIn({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
    } catch (error) {
      if (isAxiosError(error)) {
        if (!error.response) {
          throw new Error(
            `Unable to reach the backend at ${API_BASE_URL}. If you are using a physical phone, do not use localhost.`
          );
        }

        throw new Error(
          error.response?.data?.error ||
            error.response?.data?.message ||
            'Unable to create your account. Please verify your details and API URL.'
        );
      }

      throw error;
    }
  };

  const signOut = async () => {
    await clearSession();
    setToken(null);
    setUser(null);
  };

  const role = resolveRole(user);

  const value = {
    user,
    token,
    role,
    isAdmin: role === 'admin',
    isAuthenticated: Boolean(token && user),
    isHydrated,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
