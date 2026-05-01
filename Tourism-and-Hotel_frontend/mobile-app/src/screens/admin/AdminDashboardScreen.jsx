import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppCard } from '../../components/AppCard';
import { AdminDateTimeCard } from '../../components/admin/AdminDateTimeCard';
import { AdminMenuItem } from '../../components/admin/AdminMenuItem';
import { AdminStatCard } from '../../components/admin/AdminStatCard';
import { adminMenu } from '../../config/adminMenu';
import { API_BASE_URL } from '../../config/env';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminDashboardSummary } from '../../services/admin';
import { theme } from '../../theme';

function formatMetricValue(value, metricKey) {
  if (metricKey === 'totalRevenue') {
    return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value) || 0)}`;
  }

  return new Intl.NumberFormat('en-LK').format(Number(value) || 0);
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { signOut, token, user, role, isAdmin } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    console.log('[AdminDashboard] Auth state', {
      hasToken: Boolean(token),
      role,
      isAdmin,
      apiBaseUrl: API_BASE_URL,
    });
    void loadDashboard();
  }, [token, role, isAdmin]);

  async function loadDashboard(isRefresh = false) {
    if (!token) {
      console.warn('[AdminDashboard] Missing token. Dashboard request skipped.');
      setLoading(false);
      setRefreshing(false);
      setError('Admin session missing. Please login again.');
      return;
    }

    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetchAdminDashboardSummary(token);
      console.log('[AdminDashboard] Loaded summary', response?.summary);
      if (response?.debug?.failedEndpoints?.length) {
        console.warn('[AdminDashboard] Partial endpoint failures', response.debug.failedEndpoints);
      }
      setSummary(response.summary);
    } catch (loadError) {
      console.error('[AdminDashboard] Failed to load dashboard', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function performSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  function handleSignOut() {
    Alert.alert('Logout', 'Do you want to sign out from the admin dashboard?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          void performSignOut();
        },
      },
    ]);
  }

  function handleMenuPress(item) {
    if (item?.action === 'logout') {
      handleSignOut();
      return;
    }

    if (item?.route) {
      router.push(item.route);
    }
  }

  const visibleMenuItems = useMemo(
    () => adminMenu.filter((item) => item.key !== 'logout'),
    []
  );
  const stats = useMemo(
    () => [
      {
        key: 'users',
        title: 'Users',
        value: formatMetricValue(summary?.users, 'users'),
        icon: 'account-group-outline',
      },
      {
        key: 'rooms',
        title: 'Rooms',
        value: formatMetricValue(summary?.rooms, 'rooms'),
        icon: 'bed-outline',
      },
      {
        key: 'bookings',
        title: 'Bookings',
        value: formatMetricValue(summary?.totalBookings, 'totalBookings'),
        icon: 'ticket-confirmation-outline',
        accent: true,
      },
      {
        key: 'packages',
        title: 'Packages',
        value: formatMetricValue(summary?.packages, 'packages'),
        icon: 'package-variant-closed',
      },
    ],
    [summary]
  );

  const adminName =
    `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.name || 'WildHaven Admin';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            tintColor={theme.colors.accent}
            refreshing={refreshing}
            onRefresh={() => void loadDashboard(true)}
          />
        }
        showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <View style={styles.profileRow}>
            <View style={styles.profileIcon}>
              <MaterialCommunityIcons
                name="shield-account"
                size={30}
                color={theme.colors.textOnDark}
              />
            </View>

            <View style={styles.profileCopy}>
              <Text style={styles.profileTitle}>Admin</Text>
              <Text style={styles.profileSubtitle}>Tourism & Services</Text>
              <Text style={styles.profileName}>{adminName}</Text>
            </View>
          </View>

          <AdminDateTimeCard now={now} />
        </View>

        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>Overview</Text>
            <Text style={styles.menuHeading}>Dashboard Menu</Text>
            <Text style={styles.menuSubheading}>
              Open the connected admin module you need from one mobile control center.
            </Text>
          </View>

          {loading ? (
            <AppCard style={styles.stateCard}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text style={styles.stateText}>Loading dashboard data...</Text>
            </AppCard>
          ) : null}

          {error ? (
            <AppCard variant="danger" style={styles.stateCard}>
              <Text style={styles.errorTitle}>Dashboard unavailable</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.retryText}>Pull down to refresh or try again later.</Text>
            </AppCard>
          ) : null}

          {!loading && !error ? (
            <View style={styles.statsSection}>
              <View style={styles.statsHeaderRow}>
                <Text style={styles.statsHeading}>Live Summary</Text>
                <Text style={styles.statsCaption}>Synced with backend</Text>
              </View>
              <View style={styles.statsGrid}>
                {stats.map((item) => (
                  <AdminStatCard
                    key={item.key}
                    title={item.title}
                    value={item.value}
                    icon={item.icon}
                    accent={item.accent}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.menuList}>
            {visibleMenuItems.map((item) => (
              <AdminMenuItem
                key={item.key}
                icon={item.icon}
                title={item.title}
                subtitle={item.description}
                metricLabel={
                  !loading && !error && summary && item.metricKey
                    ? formatMetricValue(summary[item.metricKey], item.metricKey)
                    : null
                }
                active={item.key === 'dashboard'}
                onPress={() => handleMenuPress(item)}
              />
            ))}
          </View>

          <View style={styles.logoutSection}>
            <Text style={styles.logoutLabel}>Account</Text>
            <AdminMenuItem
              icon="logout"
              title="Logout"
              subtitle="Securely sign out from the admin workspace"
              destructive
              onPress={handleSignOut}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F3EA',
  },
  contentContainer: {
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.xl,
    backgroundColor: '#F8F3EA',
  },
  topSection: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    gap: theme.spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  profileIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  profileTitle: {
    color: theme.colors.textOnDark,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  profileSubtitle: {
    color: '#E2E8F5',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  profileName: {
    color: '#C7D4E9',
    ...theme.typography.bodySmall,
  },
  menuSection: {
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
  },
  sectionHeader: {
    gap: theme.spacing.xs,
  },
  sectionEyebrow: {
    color: theme.colors.accent,
    ...theme.typography.eyebrow,
  },
  menuHeading: {
    color: theme.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  menuSubheading: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  statsSection: {
    gap: theme.spacing.md,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  statsHeading: {
    color: theme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  statsCaption: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  stateCard: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#FCF9F3',
    borderColor: '#EADFCB',
  },
  stateText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    ...theme.typography.body,
  },
  errorTitle: {
    color: theme.colors.errorText,
    ...theme.typography.sectionTitle,
  },
  errorText: {
    color: theme.colors.errorText,
    textAlign: 'center',
    ...theme.typography.body,
  },
  retryText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    ...theme.typography.bodySmall,
  },
  menuList: {
    gap: theme.spacing.md,
  },
  logoutSection: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
  },
  logoutLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
});
