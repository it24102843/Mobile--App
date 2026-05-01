import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { getAdminMenuItem } from '../../config/adminMenu';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminDashboardSummary } from '../../services/admin';
import { theme } from '../../theme';

function formatMetricValue(value, metricKey) {
  if (metricKey === 'totalRevenue') {
    return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value) || 0)}`;
  }

  return new Intl.NumberFormat('en-LK').format(Number(value) || 0);
}

export default function AdminModuleScreen({ moduleKey }) {
  const { token } = useAuth();
  const menuItem = getAdminMenuItem(moduleKey);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    void loadSummary();
  }, [token, moduleKey]);

  async function loadSummary() {
    if (!token) {
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const response = await fetchAdminDashboardSummary(token);
      setSummary(response.summary);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load this module.');
    } finally {
      setLoading(false);
    }
  }

  if (!menuItem) {
    return null;
  }

  return (
    <AdminScreenWrapper title={menuItem.title} subtitle={menuItem.description}>
      <AppCard style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Module Status</Text>
        <Text style={styles.description}>
          The mobile admin shell for {menuItem.title.toLowerCase()} is now connected and
          protected. This screen is ready for the next CRUD, moderation, or approval
          workflow implementation.
        </Text>
      </AppCard>

      <AppCard style={styles.metricCard}>
        <Text style={styles.sectionTitle}>Current Snapshot</Text>

        {loading ? (
          <View style={styles.stateRow}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.stateText}>Loading live module count...</Text>
          </View>
        ) : null}

        {!loading && error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!loading && !error ? (
          <View style={styles.metricWrap}>
            <Text style={styles.metricValue}>
              {formatMetricValue(summary?.[menuItem.metricKey], menuItem.metricKey)}
            </Text>
            <Text style={styles.metricLabel}>Current records or value for this module</Text>
          </View>
        ) : null}

        <AppButton title="Refresh" onPress={() => void loadSummary()} />
      </AppCard>
    </AdminScreenWrapper>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    gap: theme.spacing.md,
  },
  metricCard: {
    gap: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  stateText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  metricWrap: {
    gap: theme.spacing.xs,
  },
  metricValue: {
    color: theme.colors.primary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  metricLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
