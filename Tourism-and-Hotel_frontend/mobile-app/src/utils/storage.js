import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'wildhaven.auth.token';
const AUTH_USER_KEY = 'wildhaven.auth.user';

export async function saveAuthToken(token) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function getAuthToken() {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function clearAuthToken() {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function saveAuthUser(user) {
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export async function getAuthUser() {
  const rawUser = await AsyncStorage.getItem(AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export async function clearAuthUser() {
  await AsyncStorage.removeItem(AUTH_USER_KEY);
}

export async function saveSession({ token, user }) {
  await Promise.all([saveAuthToken(token), saveAuthUser(user)]);
}

export async function getStoredSession() {
  const [token, user] = await Promise.all([getAuthToken(), getAuthUser()]);

  if (!token) {
    return null;
  }

  return {
    token,
    user,
  };
}

export async function clearSession() {
  await Promise.all([clearAuthToken(), clearAuthUser()]);
}
