import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../theme';

export function ChatBubble({ message, isUser }) {
  return (
    <View style={[styles.wrap, isUser ? styles.wrapUser : styles.wrapAdmin]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAdmin]}>
        <Text style={[styles.sender, isUser ? styles.senderUser : styles.senderAdmin]}>
          {isUser ? 'You' : 'Admin'}
        </Text>
        <Text style={[styles.message, isUser ? styles.messageUser : styles.messageAdmin]}>
          {message.message}
        </Text>
        <Text style={[styles.time, isUser ? styles.timeUser : styles.timeAdmin]}>
          {message.createdLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  wrapUser: {
    alignItems: 'flex-end',
  },
  wrapAdmin: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '84%',
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: 6,
  },
  bubbleUser: {
    backgroundColor: theme.colors.primary,
    borderTopRightRadius: 8,
  },
  bubbleAdmin: {
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#F2D39D',
    borderTopLeftRadius: 8,
  },
  sender: {
    ...theme.typography.eyebrow,
  },
  senderUser: {
    color: '#D7E3F3',
  },
  senderAdmin: {
    color: theme.colors.accent,
  },
  message: {
    ...theme.typography.body,
  },
  messageUser: {
    color: theme.colors.textOnDark,
  },
  messageAdmin: {
    color: theme.colors.text,
  },
  time: {
    ...theme.typography.bodySmall,
  },
  timeUser: {
    color: '#D7E3F3',
  },
  timeAdmin: {
    color: theme.colors.textMuted,
  },
});
