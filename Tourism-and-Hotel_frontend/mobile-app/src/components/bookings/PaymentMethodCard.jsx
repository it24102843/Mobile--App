import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

const methodIcons = {
  bank_deposit: 'bank',
  online: 'credit-card-outline',
  checkout: 'office-building-marker-outline',
};

export function PaymentMethodCard({
  value,
  title,
  subtitle,
  description,
  selected,
  onPress,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.card, selected ? styles.cardSelected : null]}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons
          name={methodIcons[value] || 'wallet-outline'}
          size={26}
          color={selected ? theme.colors.accent : theme.colors.primary}
        />
      </View>

      <View style={styles.copyBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={[styles.radio, selected ? styles.radioSelected : null]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: theme.radii.xl,
    borderWidth: 1.5,
    borderColor: '#E8DAC3',
    backgroundColor: '#FFFDF8',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
    minHeight: 220,
  },
  cardSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: '#FFF6EA',
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F1E7',
  },
  copyBlock: {
    gap: 8,
  },
  title: {
    color: '#2E2419',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
    fontWeight: '600',
  },
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  radio: {
    alignSelf: 'flex-end',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E8DAC3',
    backgroundColor: '#FFFFFF',
    marginTop: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
});
