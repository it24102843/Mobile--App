import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { fetchGearProductDetails } from '../../api/gearRental';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { RoomGallery } from '../../components/rooms/RoomGallery';
import { useGearCart } from '../../context/GearCartContext';
import { useRequireAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';
import { formatLkr } from '../../utils/gearRental';

const TRUST_BADGES = [
  {
    key: 'secure',
    icon: 'shield-check-outline',
    label: 'Secure Booking',
  },
  {
    key: 'flexible',
    icon: 'calendar-refresh',
    label: 'Flexible Rental',
  },
  {
    key: 'premium',
    icon: 'star-outline',
    label: 'Top Rated Gear',
  },
];

const BOOKING_RULES = [
  {
    key: 'dates',
    icon: 'calendar-range',
    title: 'Valid rental dates',
    body: 'Rental start date must be earlier than rental end date.',
  },
  {
    key: 'stock',
    icon: 'package-variant-closed',
    title: 'Live stock protection',
    body: 'Requested quantity cannot exceed the available stock shown for this item.',
  },
  {
    key: 'pricing',
    icon: 'cash-multiple',
    title: 'Backend total calculation',
    body: 'Booking totals are calculated from daily price, quantity, and rental duration.',
  },
];

export default function GearProductDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const { addItem } = useGearCart();
  const productKey = typeof params.productKey === 'string' ? params.productKey : '';
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState({
    loading: true,
    error: null,
    product: null,
  });

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      try {
        const product = await fetchGearProductDetails(productKey);

        if (mounted) {
          setState({
            loading: false,
            error: null,
            product,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            error,
            product: null,
          });
        }
      }
    }

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [productKey]);

  useEffect(() => {
    if (!state.product) {
      return;
    }

    setQuantity((current) => Math.min(Math.max(current, 1), state.product.stockCount || 1));
  }, [state.product]);

  const gallery = useMemo(() => state.product?.imageGallery || [], [state.product]);

  const handleAddToCart = () => {
    if (!state.product) {
      return;
    }

    if (!requireAuth(`/gear-rental/${productKey}`)) {
      return;
    }

    addItem(state.product, quantity);
    Alert.alert('Added to Cart', `${state.product.name} was added to your rental cart.`);
    router.push('/gear-rental/cart');
  };

  if (state.loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader
            title="Equipment Details"
            subtitle="Loading rental item..."
            fallbackHref="/gear-rental"
          />
          <HomeSectionState loading />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (state.error || !state.product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader
            title="Equipment Details"
            subtitle="We could not load this rental item."
            fallbackHref="/gear-rental"
          />
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load the equipment details right now. Please try again.
            </Text>
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={state.product.name}
          subtitle={state.product.category}
          fallbackHref="/gear-rental"
        />

        <RoomGallery images={gallery} />

        <AppCard style={styles.identityCard}>
          <View style={styles.badgeRow}>
            <StatusBadge label={state.product.category} variant="info" />
            <StatusBadge label={state.product.stockLabel} variant={state.product.stockVariant} />
          </View>

          <Text style={styles.productTitle}>{state.product.name}</Text>
          <Text style={styles.productBody}>{state.product.description}</Text>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          <InfoRow icon="barcode" label="Item Code" value={state.product.key} />
          <InfoRow icon="shape-outline" label="Category" value={state.product.category} />
          <InfoRow
            icon="cash-multiple"
            label="Rental Price"
            value={`${formatLkr(state.product.dailyRentalprice)} / day`}
          />
          <InfoRow
            icon="check-decagram-outline"
            label="Availability Status"
            value={state.product.availabilityLabel}
          />
          <InfoRow
            icon="shield-check-outline"
            label="Rental Access"
            value={state.product.rentableLabel}
          />
          <InfoRow
            icon="package-variant-closed"
            label="Available Units"
            value={`${state.product.stockCount}`}
          />
          <InfoRow
            icon="warehouse"
            label="Pickup Location"
            value={state.product.pickupLocation}
          />
          <InfoRow
            icon="image-multiple-outline"
            label="Gallery Images"
            value={`${state.product.imageCount}`}
          />
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Rental Quantity</Text>

          <View style={styles.quantityRow}>
            <View style={styles.quantityButton}>
              <AppButton
                title="-"
                variant="secondary"
                onPress={() => setQuantity((current) => Math.max(current - 1, 1))}
                disabled={quantity <= 1}
              />
            </View>

            <View style={styles.quantityValueShell}>
              <Text style={styles.quantityValue}>{quantity}</Text>
            </View>

            <View style={styles.quantityButton}>
              <AppButton
                title="+"
                variant="secondary"
                onPress={() =>
                  setQuantity((current) =>
                    Math.min(current + 1, state.product.stockCount || current + 1)
                  )
                }
                disabled={quantity >= state.product.stockCount}
              />
            </View>
          </View>

          <Text style={styles.helperText}>
            Select a quantity within the live stock count before adding this item to the cart.
          </Text>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Booking Rules</Text>
          <View style={styles.rulesWrap}>
            {BOOKING_RULES.map((rule) => (
              <View key={rule.key} style={styles.ruleCard}>
                <MaterialCommunityIcons
                  name={rule.icon}
                  size={20}
                  color={theme.colors.primary}
                />
                <View style={styles.ruleCopy}>
                  <Text style={styles.ruleTitle}>{rule.title}</Text>
                  <Text style={styles.ruleBody}>{rule.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Why Guests Trust This Service</Text>
          <View style={styles.trustWrap}>
            {TRUST_BADGES.map((badge) => (
              <View key={badge.key} style={styles.trustCard}>
                <MaterialCommunityIcons
                  name={badge.icon}
                  size={20}
                  color={theme.colors.accent}
                />
                <Text style={styles.trustLabel}>{badge.label}</Text>
              </View>
            ))}
          </View>
        </AppCard>

        <View style={styles.actionRow}>
          <View style={styles.flexAction}>
            <AppButton
              title="View Cart"
              variant="secondary"
              onPress={() => router.push('/gear-rental/cart')}
            />
          </View>
          <View style={styles.flexAction}>
            <AppButton
              title={state.product.availability ? 'Add to Cart' : 'Out of Stock'}
              onPress={handleAddToCart}
              disabled={!state.product.availability}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelWrap}>
        <MaterialCommunityIcons name={icon} size={18} color={theme.colors.primary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  identityCard: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  productTitle: {
    color: '#2E2419',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
  },
  productBody: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  sectionCard: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  sectionTitle: {
    color: '#2E2419',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  infoLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  infoValue: {
    color: theme.colors.text,
    ...theme.typography.bodySmall,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  quantityButton: {
    width: 64,
  },
  quantityValueShell: {
    flex: 1,
    minHeight: 54,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#E7DBC6',
    backgroundColor: '#FFF9F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    color: '#2E2419',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  helperText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  rulesWrap: {
    gap: theme.spacing.md,
  },
  ruleCard: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#EADFCB',
    borderRadius: theme.radii.lg,
    backgroundColor: '#FFF9F0',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  ruleCopy: {
    flex: 1,
    gap: 2,
  },
  ruleTitle: {
    color: '#2E2419',
    ...theme.typography.body,
    fontWeight: '700',
  },
  ruleBody: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  trustWrap: {
    gap: theme.spacing.md,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#EADFCB',
    borderRadius: theme.radii.lg,
    backgroundColor: '#FFF9F0',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  trustLabel: {
    color: '#2E2419',
    ...theme.typography.body,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flexAction: {
    flex: 1,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
