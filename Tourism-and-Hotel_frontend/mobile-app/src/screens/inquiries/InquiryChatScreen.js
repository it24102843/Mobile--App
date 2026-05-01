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
  fetchMyInquiryById,
  markInquiryReadByUser,
  sendInquiryMessage,
} from '../../services/inquiriesApi';
import { theme } from '../../theme';

export default function InquiryChatScreen() {
  const { id } = useLocalSearchParams();
  const inquiryId = typeof id === 'string' ? id : '';
  const { token } = useAuth();
  const [state, setState] = useState({
    loading: true,
    inquiry: null,
    error: null,
  });
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const loadInquiry = useCallback(async () => {
    if (!token || !inquiryId) {
      return;
    }

    setState((previous) => ({ ...previous, loading: true, error: null }));

    try {
      const inquiry = await fetchMyInquiryById(token, inquiryId);
      setState({
        loading: false,
        inquiry,
        error: null,
      });
      if (inquiry.unreadForUser > 0) {
        await markInquiryReadByUser(token, inquiryId);
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

  const handleSend = async () => {
    if (!message.trim() || sending) {
      return;
    }

    try {
      setSending(true);
      const response = await sendInquiryMessage(token, inquiryId, message.trim());
      setState((previous) => ({
        ...previous,
        inquiry: response.inquiry || previous.inquiry,
      }));
      setMessage('');
    } catch (error) {
      setState((previous) => ({
        ...previous,
        error: error instanceof Error ? error.message : 'Unable to send your message.',
      }));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Inquiry Chat"
          subtitle={state.inquiry?.subject || 'Continue the conversation with WildHaven support.'}
          fallbackHref="/inquiries"
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
              <Text style={styles.headerMeta}>{state.inquiry.inquiryId}</Text>
              <Text style={styles.headerMeta}>Status: {state.inquiry.statusLabel}</Text>
            </AppCard>

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
                label="Reply"
                placeholder="Type your message to the WildHaven team"
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <AppButton
                title={sending ? 'Sending...' : 'Send Message'}
                onPress={() => void handleSend()}
                disabled={sending || !message.trim()}
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
  chatWrap: {
    gap: theme.spacing.md,
  },
  composerCard: {
    gap: theme.spacing.md,
  },
});
