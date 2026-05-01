import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AdminInquiryCard } from '../../components/admin/AdminInquiryCard';
import { AdminInquiryFilters } from '../../components/admin/AdminInquiryFilters';
import { AdminInquiryStats } from '../../components/admin/AdminInquiryStats';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminInquiries } from '../../services/adminInquiriesApi';
import { theme } from '../../theme';

export default function AdminInquiriesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    inquiries: [],
    error: null,
  });

  const loadInquiries = useCallback(
    async (isRefresh = false) => {
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
    },
    [token]
  );

  useEffect(() => {
    void loadInquiries();
  }, [loadInquiries]);

  const summary = useMemo(() => {
    return state.inquiries.reduce(
      (accumulator, inquiry) => {
        accumulator.total += 1;
        const unreadCount = Number(inquiry.unreadForAdmin || 0);
        accumulator.unread += unreadCount > 0 ? 1 : 0;

        if (inquiry.status === 'closed') {
          accumulator.closed += 1;
        } else if (inquiry.status === 'replied') {
          accumulator.replied += 1;
        } else {
          accumulator.open += 1;
        }

        return accumulator;
      },
      { total: 0, open: 0, replied: 0, closed: 0, unread: 0 }
    );
  }, [state.inquiries]);

  const filteredInquiries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return state.inquiries.filter((inquiry) => {
      const matchesQuery =
        !query ||
        inquiry.fullName?.toLowerCase().includes(query) ||
        inquiry.email?.toLowerCase().includes(query) ||
        inquiry.subject?.toLowerCase().includes(query);

      if (!matchesQuery) {
        return false;
      }

      switch (activeFilter) {
        case 'open':
          return inquiry.status === 'open';
        case 'replied':
          return inquiry.status === 'replied';
        case 'closed':
          return inquiry.status === 'closed';
        case 'unread':
          return Number(inquiry.unreadForAdmin || 0) > 0;
        default:
          return true;
      }
    });
  }, [activeFilter, searchQuery, state.inquiries]);

  function renderContent() {
    if (state.loading) {
      return (
        <AppCard style={styles.stateCard}>
          <View style={styles.stateIconWrap}>
            <ActivityIndicator color={theme.colors.accent} />
          </View>
          <Text style={styles.stateTitle}>Loading inquiry threads</Text>
          <Text style={styles.stateText}>
            Pulling customer messages, statuses, and unread replies from the protected admin workspace.
          </Text>
        </AppCard>
      );
    }

    if (state.error) {
      return (
        <AppCard variant="danger" style={styles.stateCard}>
          <View style={[styles.stateIconWrap, styles.errorIconWrap]}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={26}
              color={theme.colors.danger}
            />
          </View>
          <Text style={styles.stateTitle}>Unable to load inquiries</Text>
          <Text style={styles.errorText}>{state.error}</Text>
          <AppButton title="Retry" onPress={() => void loadInquiries()} />
        </AppCard>
      );
    }

    if (!filteredInquiries.length) {
      return (
        <AppCard style={styles.stateCard}>
          <View style={styles.stateIconWrap}>
            <MaterialCommunityIcons
              name="message-search-outline"
              size={26}
              color={theme.colors.primary}
            />
          </View>
          <Text style={styles.stateTitle}>No inquiries found</Text>
          <Text style={styles.stateText}>
            Try changing the filter or search term. New Contact Us messages will appear here automatically.
          </Text>
        </AppCard>
      );
    }

    return filteredInquiries.map((inquiry) => (
      <AdminInquiryCard
        key={inquiry.id}
        inquiry={inquiry}
        onPress={() => router.push(`/admin/inquiries/${inquiry.id}`)}
      />
    ));
  }

  function handleBack() {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    router.replace('/admin');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <AppCard variant="primary" style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.textOnDark} />
            </Pressable>

            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Inquiries</Text>
              <Text style={styles.headerSubtitle}>Manage customer messages and admin replies</Text>
            </View>
          </View>

          <View style={styles.headerBadgeRow}>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{summary.total} Total</Text>
            </View>
            {summary.unread > 0 ? (
              <View style={styles.unreadBadge}>
                <MaterialCommunityIcons
                  name="bell-ring-outline"
                  size={14}
                  color={theme.colors.accentPressed}
                />
                <Text style={styles.unreadBadgeText}>{summary.unread} Unread</Text>
              </View>
            ) : null}
          </View>
        </AppCard>

        <AdminInquiryStats summary={summary} />

        <AdminInquiryFilters
          searchQuery={searchQuery}
          onChangeSearch={setSearchQuery}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
        />

        <AppCard style={styles.toolbarCard}>
          <View style={styles.toolbarCopy}>
            <Text style={styles.toolbarTitle}>Inbox overview</Text>
            <Text style={styles.helperText}>
              Review new inquiries, track unread customer messages, and jump straight into each thread.
            </Text>
          </View>
          <AppButton
            title={state.refreshing ? 'Refreshing...' : 'Refresh'}
            variant="secondary"
            onPress={() => void loadInquiries(true)}
            disabled={state.refreshing}
          />
        </AppCard>

        <View style={styles.listWrap}>{renderContent()}</View>
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
  headerCard: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    gap: theme.spacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  headerCopy: {
    flex: 1,
    gap: theme.spacing.xs,
    paddingTop: 2,
  },
  headerTitle: {
    color: theme.colors.textOnDark,
    ...theme.typography.sectionTitle,
    fontSize: 32,
    lineHeight: 38,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    ...theme.typography.body,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  totalBadge: {
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignSelf: 'flex-start',
  },
  totalBadgeText: {
    color: theme.colors.textOnDark,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  unreadBadge: {
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.accentSoft,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadBadgeText: {
    color: theme.colors.accentPressed,
    ...theme.typography.bodySmall,
    fontWeight: '800',
  },
  toolbarCard: {
    gap: theme.spacing.lg,
  },
  toolbarCopy: {
    gap: theme.spacing.xs,
  },
  toolbarTitle: {
    color: theme.colors.text,
    ...theme.typography.label,
    fontWeight: '800',
  },
  helperText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  listWrap: {
    gap: theme.spacing.md,
  },
  stateCard: {
    gap: theme.spacing.md,
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  stateIconWrap: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconWrap: {
    backgroundColor: theme.colors.dangerSurface,
  },
  stateTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
    textAlign: 'center',
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
