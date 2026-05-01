import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { ChatBubble } from '../../components/inquiries/ChatBubble';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import {
  fetchAdminInquiryById,
  markInquiryReadByAdmin,
  replyToAdminInquiry,
  updateAdminInquiryStatus,
} from '../../services/adminInquiriesApi';
import { theme } from '../../theme';

const STATUS_OPTIONS = [
  { key: 'open', title: 'Mark Open' },
  { key: 'replied', title: 'Mark Replied' },
  { key: 'closed', title: 'Mark Closed' },
];

export default function AdminInquiryChatScreen() {
  const { id } = useLocalSearchParams();
  const inquiryId = typeof id === 'string' ? id : '';
  const { token } = useAuth();
  const [state, setState] = useState({
    loading: true,
    inquiry: null,
    error: null,
  });
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [statusLoading, setStatusLoading] = useState('');

  const loadInquiry = useCallback(async () => {
    if (!token || !inquiryId) {
      return;
    }

    setState((previous) => ({ ...previous, loading: true, error: null }));

    try {
      const inquiry = await fetchAdminInquiryById(token, inquiryId);
      setState({
        loading: false,
        inquiry,
        error: null,
      });
      if (inquiry.unreadForAdmin > 0) {
        await markInquiryReadByAdmin(token, inquiryId);
      }
    } catch (error) {
      setState({
        loading: false,
        inquiry: null,
        error: error instanceof Error ? error.message : 'Unable to load this inquiry.',
      });
    }
  }, [inquiryId, token]);

  useEffect(() => {
    void loadInquiry();
  }, [loadInquiry]);

  const handleReply = async () => {
    if (!replyMessage.trim() || sending) {
      return;
    }

    try {
      setSending(true);
      const response = await replyToAdminInquiry(token, inquiryId, replyMessage.trim());
      setState((previous) => ({
        ...previous,
        inquiry: response.inquiry || previous.inquiry,
      }));
      setReplyMessage('');
    } catch (error) {
      setState((previous) => ({
        ...previous,
        error: error instanceof Error ? error.message : 'Unable to send reply.',
      }));
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!status || statusLoading) {
      return;
    }

    try {
      setStatusLoading(status);
      const response = await updateAdminInquiryStatus(token, inquiryId, status);
      setState((previous) => ({
        ...previous,
        inquiry: response.inquiry || previous.inquiry,
      }));
    } catch (error) {
      setState((previous) => ({
        ...previous,
        error: error instanceof Error ? error.message : 'Unable to update inquiry status.',
      }));
    } finally {
      setStatusLoading('');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Inquiry Thread"
          subtitle={state.inquiry?.subject || 'Reply to this customer inquiry.'}
          fallbackHref="/admin/inquiries"
        />

        {state.loading ? <HomeSectionState loading /> : null}

        {!state.loading && state.error ? (
          <AppCard variant="danger" style={styles.stateCard}>
            <Text style={styles.errorText}>{state.error}</Text>
            <AppButton title="Retry" onPress={() => void loadInquiry()} />
          </AppCard>
        ) : null}

        {!state.loading && state.inquiry ? (
          <>
            <AppCard style={styles.headerCard}>
              <Text style={styles.headerSubject}>{state.inquiry.subject}</Text>
              <Text style={styles.headerMeta}>{state.inquiry.fullName}</Text>
              <Text style={styles.headerMeta}>{state.inquiry.email}</Text>
              {state.inquiry.phone ? <Text style={styles.headerMeta}>{state.inquiry.phone}</Text> : null}
            </AppCard>

            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((option) => (
                <View key={option.key} style={styles.statusButtonWrap}>
                  <AppButton
                    title={statusLoading === option.key ? 'Updating...' : option.title}
                    variant={state.inquiry.status === option.key ? 'primary' : 'secondary'}
                    onPress={() => void handleStatusChange(option.key)}
                    disabled={Boolean(statusLoading)}
                  />
                </View>
              ))}
            </View>

            <View style={styles.chatWrap}>
              {state.inquiry.messages.map((item) => (
                <ChatBubble
                  key={item.id}
                  message={item}
                  isUser={item.senderRole === 'user'}
                />
              ))}
            </View>

            <AppCard style={styles.composerCard}>
              <AppTextField
                label="Admin Reply"
                placeholder="Type your reply to this inquiry"
                value={replyMessage}
                onChangeText={setReplyMessage}
                multiline
              />
              <AppButton
                title={sending ? 'Sending...' : 'Send Reply'}
                onPress={() => void handleReply()}
                disabled={sending || !replyMessage.trim()}
              />
            </AppCard>
          </>
        ) : null}
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
  errorText: {
    color: theme.colors.errorText,
    textAlign: 'center',
    ...theme.typography.body,
  },
  headerCard: {
    gap: theme.spacing.xs,
  },
  headerSubject: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  headerMeta: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statusButtonWrap: {
    flex: 1,
    minWidth: '30%',
  },
  chatWrap: {
    gap: theme.spacing.md,
  },
  composerCard: {
    gap: theme.spacing.md,
  },
});
