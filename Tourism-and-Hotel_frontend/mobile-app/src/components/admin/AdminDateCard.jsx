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
      hour12: true,
    }).format(now),
  };
}

export function AdminDateCard({ now }) {
  const { date, time } = formatDateTime(now);

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="calendar-clock" size={22} color={theme.colors.accent} />
      </View>
      <View style={styles.copyBlock}>
        <Text style={styles.label}>Today</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <Text style={styles.time}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: theme.radii.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(242,140,40,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBlock: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: '#D9E1F3',
    ...theme.typography.bodySmall,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  date: {
    color: theme.colors.textOnDark,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  time: {
    color: theme.colors.textOnDark,
    fontSize: 16,
    fontWeight: '700',
  },
});
