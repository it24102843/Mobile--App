import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { InquiryCard } from '../../components/inquiries/InquiryCard';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { fetchMyInquiries } from '../../services/inquiriesApi';
import { theme } from '../../theme';

export default function MyInquiriesScreen() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const [state, setState] = useState({
    loading: true,
    inquiries: [],
    error: null,
  });

  const loadInquiries = useCallback(async () => {
    if (!token) {
      return;
    }

    setState((previous) => ({ ...previous, loading: true, error: null }));

    try {
      const inquiries = await fetchMyInquiries(token);
      setState({
        loading: false,
        inquiries,
        error: null,
      });
    } catch (error) {
      setState({
        loading: false,
        inquiries: [],
        error: error instanceof Error ? error.message : 'Unable to load your inquiries.',
      });
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadInquiries();
    }
  }, [isAuthenticated, loadInquiries]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        void loadInquiries();
      }
    }, [isAuthenticated, loadInquiries])
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader
            title="My Inquiries"
            subtitle="Sign in to view your inquiry threads with the WildHaven team."
            fallbackHref="/(tabs)/profile"
          />
          <AppCard style={styles.stateCard}>
            <Text style={styles.stateText}>
              Please sign in to track your inquiries and continue chatting with admin.
            </Text>
            <AppButton title="Go to Login" onPress={() => router.push('/(auth)/login')} />
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="My Inquiries"
          subtitle="View your Contact Us conversations and continue chatting with the WildHaven team."
          fallbackHref="/(tabs)/profile"
        />

        <AppButton title="New Inquiry" onPress={() => router.push('/contact-us')} />

        {state.loading ? <HomeSectionState loading /> : null}

        {!state.loading && state.error ? (
          <AppCard variant="danger" style={styles.stateCard}>
            <Text style={styles.errorText}>{state.error}</Text>
            <AppButton title="Retry" onPress={() => void loadInquiries()} />
          </AppCard>
        ) : null}

        {!state.loading && !state.error && !state.inquiries.length ? (
          <HomeSectionState message="No inquiries yet. Messages you send from Contact Us will appear here." />
        ) : null}

        {!state.loading && !state.error
          ? state.inquiries.map((inquiry) => (
              <InquiryCard
                key={inquiry.id}
                inquiry={inquiry}
                onPress={() => router.push(`/inquiries/${inquiry.id}`)}
              />
            ))
          : null}
      </ScrollView>
    </SafeAreaView>
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
    gap: theme.spacing.lg,
  },
  stateCard: {
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  stateText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    ...theme.typography.body,
  },
  errorText: {
    color: theme.colors.errorText,
    textAlign: 'center',
    ...theme.typography.body,
  },
});
