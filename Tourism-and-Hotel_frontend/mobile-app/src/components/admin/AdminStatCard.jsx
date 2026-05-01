import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

export function AdminStatCard({ title, value, icon, accent = false }) {
  return (
    <View style={[styles.card, accent ? styles.cardAccent : null]}>
      <View style={[styles.iconWrap, accent ? styles.iconWrapAccent : null]}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={accent ? theme.colors.textOnDark : theme.colors.accent}
        />
      </View>
      <Text style={[styles.title, accent ? styles.titleAccent : null]}>{title}</Text>
      <Text style={[styles.value, accent ? styles.valueAccent : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FCF9F3',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EADFCB',
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  cardAccent: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.2,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFF0DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapAccent: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  title: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  titleAccent: {
    color: 'rgba(255,255,255,0.84)',
  },
  value: {
    color: theme.colors.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
  },
  valueAccent: {
    color: theme.colors.textOnDark,
  },
});
