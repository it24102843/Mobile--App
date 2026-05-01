import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AdminInquiryCard } from '../../components/admin/AdminInquiryCard';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminInquiries } from '../../services/adminInquiriesApi';
import { theme } from '../../theme';

function InquiryStatCard({ title, value }) {
  return (
    <AppCard style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </AppCard>
  );
}

export default function AdminInquiriesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    inquiries: [],
    error: null,
  });

  const loadInquiries = useCallback(async (isRefresh = false) => {
    if (!token) {
      return;
    }

    setState((previous) => ({
      ...previous,
      loading: isRefresh ? previous.loading : true,
      refreshing: isRefresh,
      error: null,
    }));

    try {
      const inquiries = await fetchAdminInquiries(token);
      setState({
        loading: false,
        refreshing: false,
        inquiries,
        error: null,
      });
    } catch (error) {
      setState({
        loading: false,
        refreshing: false,
        inquiries: [],
        error: error instanceof Error ? error.message : 'Unable to load inquiries.',
      });
    }
  }, [token]);

  useEffect(() => {
    void loadInquiries();
  }, [loadInquiries]);

  const summary = useMemo(() => {
    return state.inquiries.reduce(
      (accumulator, inquiry) => {
        accumulator.total += 1;
        accumulator.unread += Number(inquiry.unreadForAdmin || 0) > 0 ? 1 : 0;
        if (inquiry.status === 'closed') {
          accumulator.closed += 1;
        } else {
          accumulator.open += 1;
        }
        return accumulator;
      },
      { total: 0, open: 0, closed: 0, unread: 0 }
    );
  }, [state.inquiries]);

  function renderContent() {
    if (state.loading) {
      return (
        <AppCard style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText}>Loading inquiry threads...</Text>
        </AppCard>
      );
    }

    if (state.error) {
      return (
        <AppCard variant="danger" style={styles.stateCard}>
          <Text style={styles.errorText}>{state.error}</Text>
          <AppButton title="Retry" onPress={() => void loadInquiries()} />
        </AppCard>
      );
    }

    if (!state.inquiries.length) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.stateTitle}>No inquiries yet</Text>
          <Text style={styles.stateText}>
            Messages from the Contact Us page will appear here for the admin team.
          </Text>
        </AppCard>
      );
    }

    return state.inquiries.map((inquiry) => (
      <AdminInquiryCard
        key={inquiry.id}
        inquiry={inquiry}
        onPress={() => router.push(`/admin/inquiries/${inquiry.id}`)}
      />
    ));
  }

  return (
    <AdminScreenWrapper
      title="Inquiries"
      subtitle={`Track customer inquiry threads and reply from the admin workspace - ${summary.total} total`}>
      <View style={styles.statsRow}>
        <InquiryStatCard title="Total" value={summary.total} />
        <InquiryStatCard title="Open" value={summary.open} />
        <InquiryStatCard title="Unread" value={summary.unread} />
      </View>

      <AppCard style={styles.toolbarCard}>
        <Text style={styles.helperText}>
          New Contact Us messages now open a full inquiry thread. Tap an inquiry to reply, update status, and track unread messages.
        </Text>
        <AppButton
          title={state.refreshing ? 'Refreshing...' : 'Refresh'}
          variant="secondary"
          onPress={() => void loadInquiries(true)}
          disabled={state.refreshing}
        />
      </AppCard>

      <View style={styles.listWrap}>{renderContent()}</View>
    </AdminScreenWrapper>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 110,
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  statLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  toolbarCard: {
    gap: theme.spacing.md,
  },
  helperText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  listWrap: {
    gap: theme.spacing.lg,
  },
  stateCard: {
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  stateTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
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
