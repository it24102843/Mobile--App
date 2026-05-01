import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { GearCartItemCard } from '../../components/gear/GearCartItemCard';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { useGearCart } from '../../context/GearCartContext';
import { useAuth, useRequireAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';
import { formatLkr } from '../../utils/gearRental';

export default function GearCartScreen() {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const { isAuthenticated } = useAuth();
  const {
    items,
    isHydrated,
    updateQuantity,
    removeItem,
    totalItems,
    oneDayTotal,
  } = useGearCart();

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth('/gear-rental/cart', { showAlert: false });
    }
  }, [isAuthenticated, requireAuth]);

  if (!isAuthenticated) {
    return null;
  }

  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader title="Rental Cart" subtitle="Loading your selected gear..." fallbackHref="/gear-rental" />
          <HomeSectionState loading />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Rental Cart"
          subtitle="Review your selected storage and equipment items before choosing rental dates."
          fallbackHref="/gear-rental"
        />

        {!items.length ? (
          <AppCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Your rental cart is empty</Text>
            <Text style={styles.emptyBody}>
              Add equipment from the listing or details page to start a booking.
            </Text>
            <AppButton title="Browse Equipment" onPress={() => router.replace('/gear-rental')} />
          </AppCard>
        ) : null}

        {items.map((item) => (
          <GearCartItemCard
            key={item.key}
            item={item}
            quantity={item.quantity}
            onDecrease={() => updateQuantity(item.key, item.quantity - 1)}
            onIncrease={() => updateQuantity(item.key, item.quantity + 1)}
            onRemove={() => removeItem(item.key)}
            subtotalLabel={formatLkr(item.quantity * item.dailyRentalprice)}
          />
        ))}

        {items.length ? (
          <AppCard style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Cart Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Selected Units</Text>
              <Text style={styles.summaryValue}>{totalItems}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>One-Day Total</Text>
              <Text style={styles.summaryValue}>{formatLkr(oneDayTotal)}</Text>
            </View>
            <View style={styles.actionStack}>
              <AppButton title="Proceed to Rental Dates" onPress={() => router.push('/gear-rental/checkout')} />
              <AppButton title="Continue Browsing" variant="secondary" onPress={() => router.push('/gear-rental')} />
            </View>
          </AppCard>
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
  emptyCard: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  emptyTitle: {
    color: '#2E2419',
    ...theme.typography.sectionTitle,
  },
  emptyBody: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  summaryCard: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  summaryTitle: {
    color: '#2E2419',
    ...theme.typography.sectionTitle,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  summaryValue: {
    color: theme.colors.accent,
    ...theme.typography.body,
    fontWeight: '800',
  },
  actionStack: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
});
