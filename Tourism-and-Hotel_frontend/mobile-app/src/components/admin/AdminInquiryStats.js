import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppCard } from '../AppCard';
import { theme } from '../../theme';

function InquiryStatTile({ title, value, icon, accentColor, surfaceColor }) {
  return (
    <AppCard style={styles.statCard} padded={false}>
      <View style={[styles.iconWrap, { backgroundColor: surfaceColor }]}>
        <MaterialCommunityIcons name={icon} size={20} color={accentColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </AppCard>
  );
}

export function AdminInquiryStats({ summary }) {
  const items = [
    {
      key: 'total',
      title: 'Total Inquiries',
      value: summary.total,
      icon: 'message-text-outline',
      accentColor: theme.colors.primary,
      surfaceColor: theme.colors.primarySoft,
    },
    {
      key: 'open',
      title: 'Open',
      value: summary.open,
      icon: 'email-open-outline',
      accentColor: theme.colors.warningText,
      surfaceColor: theme.colors.warningSurface,
    },
    {
      key: 'replied',
      title: 'Replied',
      value: summary.replied,
      icon: 'reply-outline',
      accentColor: theme.colors.successText,
      surfaceColor: theme.colors.successSurface,
    },
    {
      key: 'unread',
      title: 'Unread',
      value: summary.unread,
      icon: 'bell-badge-outline',
      accentColor: theme.colors.accent,
      surfaceColor: theme.colors.accentSoft,
    },
  ];

  return (
    <View style={styles.grid}>
      {items.map(({ key, ...item }) => (
        <InquiryStatTile key={key} {...item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 145,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
  },
  statTitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '600',
  },
});
