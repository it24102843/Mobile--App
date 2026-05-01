import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

function formatDateTime(now) {
  return {
    date: new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(now),
    time: new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(now),
  };
}

export function AdminDateTimeCard({ now }) {
  const { date, time } = formatDateTime(now);

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="calendar-clock" size={24} color={theme.colors.accent} />
      </View>

      <View style={styles.copyWrap}>
        <Text style={styles.label}>Current Date</Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      <View style={styles.timeWrap}>
        <Text style={styles.timeLabel}>Live Time</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    backgroundColor: '#FCF9F3',
    borderWidth: 1,
    borderColor: '#EADFCB',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFF0DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyWrap: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  date: {
    color: '#13233E',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },
  timeWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
  timeLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  time: {
    color: theme.colors.primary,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },
});
