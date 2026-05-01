import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppCard } from '../AppCard';
import { theme } from '../../theme';

export function HomeSectionState({
  loading = false,
  message,
  icon = 'image-off-outline',
}) {
  if (loading) {
    return (
      <AppCard variant="subtle" style={styles.card}>
        <ActivityIndicator color={theme.colors.accent} size="small" />
        <Text style={styles.message}>Loading content...</Text>
      </AppCard>
    );
  }

  return (
    <AppCard variant="subtle" style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={24} color={theme.colors.primary} />
      </View>
      <Text style={styles.message}>{message}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    ...theme.typography.body,
  },
});
