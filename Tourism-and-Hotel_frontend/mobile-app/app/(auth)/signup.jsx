import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';

import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { AppTextField } from '../../src/components/AppTextField';
import { BrandLogo } from '../../src/components/BrandLogo';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { API_CONNECTION_HINT, IS_LOCALHOST_FALLBACK } from '../../src/config/env';
import { useAuth } from '../../src/context/AuthContext';
import { signupSchema } from '../../src/utils/validators';
import { theme } from '../../src/theme';

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signUp } = useAuth();
  const [submitError, setSubmitError] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      setSubmitError(null);
      const signedInUser = await signUp(values);
      const signedInRole =
        signedInUser?.role && `${signedInUser.role}`.trim().toLowerCase() === 'admin'
          ? 'admin'
          : signedInUser?.isAdmin === true
            ? 'admin'
            : signedInUser?.role
              ? `${signedInUser.role}`.trim().toLowerCase()
              : null;
      const requestedRedirect =
        typeof params.redirect === 'string' && params.redirect ? params.redirect : null;
      const defaultRedirect = signedInRole === 'admin' ? '/admin' : '/(tabs)';
      const finalRedirect =
        requestedRedirect && !(requestedRedirect.startsWith('/admin') && signedInRole !== 'admin')
          ? requestedRedirect
          : defaultRedirect;

      router.replace(
        finalRedirect
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to create your account.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ScreenHeader
            title="Create Account"
            subtitle="Go back whenever you need."
            fallbackHref="/(tabs)"
          />

          <AppCard variant="primary" style={styles.heroCard}>
            <BrandLogo size="md" pressable href="/(tabs)" />
            <Text style={styles.eyebrow}>Join WildHaven</Text>
            <Text style={styles.title}>Create your guest profile</Text>
            <Text style={styles.subtitle}>
              Register once to manage room reservations, safari plans, and upcoming travel
              experiences from your phone.
            </Text>
          </AppCard>

          <AppCard variant={IS_LOCALHOST_FALLBACK ? 'warning' : 'info'} style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>{API_CONNECTION_HINT}</Text>
          </AppCard>

          <AppCard style={styles.formCard}>
            {typeof params.message === 'string' && params.message ? (
              <AppCard variant="warning" style={styles.errorBanner}>
                <Text style={styles.warningBannerText}>{params.message}</Text>
              </AppCard>
            ) : null}

            {submitError ? (
              <AppCard variant="danger" style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{submitError}</Text>
              </AppCard>
            ) : null}

            <Controller
              control={control}
              name="firstName"
              render={({ field: { onBlur, onChange, value } }) => (
                <AppTextField
                  label="First name"
                  placeholder="Nimal"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.firstName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="lastName"
              render={({ field: { onBlur, onChange, value } }) => (
                <AppTextField
                  label="Last name"
                  placeholder="Perera"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.lastName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onBlur, onChange, value } }) => (
                <AppTextField
                  label="Email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="guest@wildhaven.com"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onBlur, onChange, value } }) => (
                <AppTextField
                  label="Phone"
                  keyboardType="phone-pad"
                  placeholder="0771234567"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.phone?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="address"
              render={({ field: { onBlur, onChange, value } }) => (
                <AppTextField
                  label="Address"
                  placeholder="Kataragama, Sri Lanka"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.address?.message}
                  multiline
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onBlur, onChange, value } }) => (
                <AppTextField
                  label="Password"
                  placeholder="Create a password"
                  secureTextEntry
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onBlur, onChange, value } }) => (
                <AppTextField
                  label="Confirm password"
                  placeholder="Repeat your password"
                  secureTextEntry
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <AppButton
              title={isSubmitting ? 'Creating Account...' : 'Create Account'}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already registered?</Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text style={styles.footerLink}>Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  heroCard: {
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  eyebrow: {
    color: '#DDE7F4',
    ...theme.typography.eyebrow,
  },
  title: {
    color: theme.colors.textOnDark,
    ...theme.typography.screenTitle,
  },
  subtitle: {
    color: '#DDE7F4',
    ...theme.typography.body,
  },
  infoBanner: {
    padding: theme.spacing.md,
  },
  infoBannerText: {
    color: theme.colors.text,
    ...theme.typography.bodySmall,
  },
  formCard: {
    gap: 18,
  },
  errorBanner: {
    padding: theme.spacing.md,
  },
  errorBannerText: {
    color: theme.colors.errorText,
    ...theme.typography.bodySmall,
  },
  warningBannerText: {
    color: theme.colors.warningText,
    ...theme.typography.bodySmall,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  footerLink: {
    color: theme.colors.info,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
});
