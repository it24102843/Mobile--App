import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminInquiries, updateAdminInquiry } from '../../services/adminInquiriesApi';
import { theme } from '../../theme';

function InquiryStatCard({ title, value, icon, tone = 'primary' }) {
  const tones = {
    primary: {
      backgroundColor: theme.colors.primarySoft,
      iconColor: theme.colors.primary,
      valueColor: theme.colors.primary,
    },
    success: {
      backgroundColor: theme.colors.successSurface,
      iconColor: theme.colors.successText,
      valueColor: theme.colors.successText,
    },
    warning: {
      backgroundColor: theme.colors.warningSurface,
      iconColor: theme.colors.warningText,
      valueColor: theme.colors.warningText,
    },
  };

  const currentTone = tones[tone] || tones.primary;

  return (
    <AppCard style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: currentTone.backgroundColor }]}>
        <MaterialCommunityIcons name={icon} size={22} color={currentTone.iconColor} />
      </View>
      <Text style={[styles.statValue, { color: currentTone.valueColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </AppCard>
  );
}

function InquiryCard({ inquiry, updating, onToggleResolved }) {
  return (
    <AppCard style={styles.inquiryCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardSubject}>{inquiry.subject}</Text>
          <Text style={styles.cardMeta}>{inquiry.inquiryId}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            inquiry.isResolved ? styles.statusResolved : styles.statusOpen,
          ]}>
          <Text
            style={[
              styles.statusBadgeText,
              inquiry.isResolved ? styles.statusResolvedText : styles.statusOpenText,
            ]}>
            {inquiry.statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.contactRow}>
        <MaterialCommunityIcons name="account-outline" size={18} color={theme.colors.accent} />
        <Text style={styles.contactText}>{inquiry.fullName}</Text>
      </View>

      <View style={styles.contactRow}>
        <MaterialCommunityIcons name="email-outline" size={18} color={theme.colors.accent} />
        <Text style={styles.contactText}>{inquiry.email}</Text>
      </View>

      <View style={styles.contactRow}>
        <MaterialCommunityIcons name="phone-outline" size={18} color={theme.colors.accent} />
        <Text style={styles.contactText}>{inquiry.phone}</Text>
      </View>

      <View style={styles.contactRow}>
        <MaterialCommunityIcons
          name="clock-time-four-outline"
          size={18}
          color={theme.colors.accent}
        />
        <Text style={styles.contactText}>{inquiry.createdLabel}</Text>
      </View>

      <View style={styles.messagePanel}>
        <Text style={styles.messageLabel}>Inquiry Message</Text>
        <Text style={styles.messageText}>{inquiry.message}</Text>
      </View>

      {inquiry.response ? (
        <View style={styles.responsePanel}>
          <Text style={styles.responseLabel}>Admin Response</Text>
          <Text style={styles.responseText}>{inquiry.response}</Text>
        </View>
      ) : null}

      <AppButton
        title={updating ? 'Updating...' : inquiry.isResolved ? 'Reopen Inquiry' : 'Mark Resolved'}
        variant={inquiry.isResolved ? 'secondary' : 'primary'}
        onPress={onToggleResolved}
        disabled={updating}
      />
    </AppCard>
  );
}

export default function AdminInquiriesScreen() {
  const { token } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updatingInquiryId, setUpdatingInquiryId] = useState(null);

  useEffect(() => {
    void loadInquiries();
  }, [token]);

  async function loadInquiries(isRefresh = false) {
    if (!token) {
      return;
    }

    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetchAdminInquiries(token);
      setInquiries(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load inquiries.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const summary = useMemo(() => {
    return inquiries.reduce(
      (accumulator, inquiry) => {
        accumulator.total += 1;
        if (inquiry.isResolved) {
          accumulator.resolved += 1;
        } else {
          accumulator.open += 1;
        }
        return accumulator;
      },
      { total: 0, open: 0, resolved: 0 }
    );
  }, [inquiries]);

  function confirmToggleResolved(inquiry) {
    const nextResolved = !inquiry.isResolved;

    Alert.alert(
      nextResolved ? 'Mark as resolved?' : 'Reopen inquiry?',
      `${nextResolved ? 'Resolve' : 'Reopen'} ${inquiry.inquiryId} from ${inquiry.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextResolved ? 'Resolve' : 'Reopen',
          onPress: () => void handleToggleResolved(inquiry),
        },
      ]
    );
  }

  async function handleToggleResolved(inquiry) {
    try {
      setUpdatingInquiryId(inquiry.id);
      const nextResolved = !inquiry.isResolved;
      const response = await updateAdminInquiry(token, inquiry.id, {
        isResolved: nextResolved,
        response: inquiry.response || '',
      });

      Alert.alert(
        'Inquiry updated',
        response?.message || 'The inquiry status was updated successfully.'
      );
      await loadInquiries(true);
    } catch (updateError) {
      Alert.alert(
        'Update failed',
        updateError instanceof Error
          ? updateError.message
          : 'Unable to update this inquiry right now.'
      );
    } finally {
      setUpdatingInquiryId(null);
    }
  }

  function renderContent() {
    if (loading) {
      return (
        <AppCard style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText}>Loading contact inquiries...</Text>
        </AppCard>
      );
    }

    if (error) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Retry" onPress={() => void loadInquiries()} />
        </AppCard>
      );
    }

    if (!inquiries.length) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.stateTitle}>No inquiries yet</Text>
          <Text style={styles.stateText}>
            Contact messages submitted from the mobile app will appear here for the admin team.
          </Text>
        </AppCard>
      );
    }

    return inquiries.map((inquiry) => (
      <InquiryCard
        key={inquiry.id}
        inquiry={inquiry}
        updating={updatingInquiryId === inquiry.id}
        onToggleResolved={() => confirmToggleResolved(inquiry)}
      />
    ));
  }

  return (
    <AdminScreenWrapper
      title="Inquiries"
      subtitle={`Review real contact messages from users - ${summary.total} inquiry(s)`}>
      <View style={styles.statsRow}>
        <InquiryStatCard title="Total Inquiries" value={summary.total} icon="message-alert-outline" />
        <InquiryStatCard title="Open" value={summary.open} icon="alert-circle-outline" tone="warning" />
        <InquiryStatCard
          title="Resolved"
          value={summary.resolved}
          icon="check-circle-outline"
          tone="success"
        />
      </View>

      <AppCard style={styles.toolbarCard}>
        <View style={styles.toolbarHeader}>
          <View style={styles.totalBadge}>
            <MaterialCommunityIcons
              name="message-alert-outline"
              size={18}
              color={theme.colors.primary}
            />
            <Text style={styles.totalBadgeText}>{summary.total} Total Inquiries</Text>
          </View>

          <View style={styles.refreshWrap}>
            <AppButton
              title={refreshing ? 'Refreshing...' : 'Refresh'}
              variant="secondary"
              onPress={() => void loadInquiries(true)}
              disabled={refreshing}
            />
          </View>
        </View>

        <Text style={styles.helperText}>
          Messages sent from the Contact Us page are now linked into this admin panel and can be tracked here.
        </Text>
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
    minWidth: 145,
    gap: theme.spacing.sm,
  },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  statLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  toolbarCard: {
    gap: theme.spacing.lg,
  },
  toolbarHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.primaryMuted,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  totalBadgeText: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  refreshWrap: {
    minWidth: 140,
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
  inquiryCard: {
    gap: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  cardTitleWrap: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  cardSubject: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  cardMeta: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
  },
  statusOpen: {
    backgroundColor: theme.colors.warningSurface,
    borderColor: '#F8D58C',
  },
  statusResolved: {
    backgroundColor: theme.colors.successSurface,
    borderColor: '#B9E7CC',
  },
  statusBadgeText: {
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  statusOpenText: {
    color: theme.colors.warningText,
  },
  statusResolvedText: {
    color: theme.colors.successText,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  contactText: {
    flex: 1,
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  messagePanel: {
    backgroundColor: '#FCF9F3',
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#EADFCB',
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  messageLabel: {
    color: theme.colors.text,
    ...theme.typography.label,
  },
  messageText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  responsePanel: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.primaryMuted,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  responseLabel: {
    color: theme.colors.primary,
    ...theme.typography.label,
  },
  responseText: {
    color: theme.colors.text,
    ...theme.typography.bodySmall,
  },
});
