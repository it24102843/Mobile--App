import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { SectionHeader } from '../SectionHeader';
import { theme } from '../../theme';

const bookingFields = [
  {
    id: 'dates',
    label: 'Dates',
    value: 'Choose dates',
    icon: 'calendar-range',
  },
  {
    id: 'guests',
    label: 'Guests',
    value: 'Guests & rooms',
    icon: 'account-group-outline',
  },
  {
    id: 'experience',
    label: 'Experience',
    value: 'Stay, safari, dining',
    icon: 'compass-outline',
  },
];

export function QuickBookingCard({ onPressSearch }) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.headingWrap}>
        <SectionHeader
          eyebrow="Quick Search"
          title="Plan your WildHaven escape"
          subtitle="A cleaner mobile shortcut for stays, safari adventures, and travel discovery."
        />
        <Text style={styles.helperCopy}>
          Start with availability, then continue into the module that fits your trip.
        </Text>
      </View>

      <View style={styles.fieldGrid}>
        {bookingFields.map((field) => (
          <View
            key={field.id}
            style={[
              styles.fieldCard,
              field.id === 'experience' ? styles.fieldCardWide : null,
            ]}>
            <View style={styles.fieldIconWrap}>
              <MaterialCommunityIcons name={field.icon} size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <Text style={styles.fieldValue}>{field.value}</Text>
          </View>
        ))}
      </View>

      <AppButton title="Search Availability" onPress={onPressSearch} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.lg,
    backgroundColor: '#FFFDF9',
    borderColor: '#EADFCB',
    borderRadius: 26,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  headingWrap: {
    gap: theme.spacing.sm,
  },
  helperCopy: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  fieldCard: {
    width: '48%',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    minHeight: 118,
  },
  fieldCardWide: {
    width: '100%',
  },
  fieldIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  fieldValue: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
});
