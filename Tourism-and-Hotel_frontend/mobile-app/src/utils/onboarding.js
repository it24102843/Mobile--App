import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'wildhaven.onboarding.completed';

export async function getOnboardingCompleted() {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
}

export async function markOnboardingCompleted() {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}
