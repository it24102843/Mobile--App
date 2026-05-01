import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { fetchRestaurantFoodItemById } from '../../src/api/restaurants';
import { AppButton } from '../../src/components/AppButton';
import { AppCard } from '../../src/components/AppCard';
import { AppSelectField } from '../../src/components/AppSelectField';
import { AppTextField } from '../../src/components/AppTextField';
import { BrandLogo } from '../../src/components/BrandLogo';
import { BookingSuccessModal } from '../../src/components/common/BookingSuccessModal';
import { HomeSectionState } from '../../src/components/home/HomeSectionState';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useAuth, useRequireAuth } from '../../src/hooks/useAuth';
import {
  createFoodOrder,
  FULFILLMENT_METHOD_OPTIONS,
} from '../../src/services/foodOrdersApi';
import { theme } from '../../src/theme';
import { getDefaultImage, resolveMediaCollection } from '../../src/utils/media';
import {
  isPositiveInteger,
  isPositiveNumber,
  isValidEmail,
  isValidPhone,
  normalizeInput,
} from '../../src/utils/validation';

function formatCurrency(value) {
  if (typeof value !== 'number') {
    return 'LKR 0';
  }

  return `LKR ${new Intl.NumberFormat('en-LK').format(value)}`;
}

export default function FoodOrderScreen() {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const { isAuthenticated, token, user } = useAuth();
  const params = useLocalSearchParams();
  const [foodItem, setFoodItem] = useState(null);
  const [state, setState] = useState({
    loading: true,
    error: null,
  });
  const [quantity, setQuantity] = useState('1');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState('Pickup');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successState, setSuccessState] = useState({
    visible: false,
    orderId: '',
    orderDate: '',
  });

  const foodItemId = typeof params.foodItemId === 'string' ? params.foodItemId : '';
  const menuName = typeof params.menuName === 'string' ? params.menuName : 'Menu';
  const restaurantName =
    typeof params.restaurantName === 'string' ? params.restaurantName : 'Restaurant';

  useEffect(() => {
    setFullName(`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim());
    setEmail(user?.email || '');
    setPhoneNumber(user?.phone || '');
  }, [user]);

  useEffect(() => {
    setErrors((current) => {
      if (!current.submit) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors.submit;
      return nextErrors;
    });
  }, [fullName, email, phoneNumber, quantity, fulfillmentMethod, notes]);

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth(
        `/restaurants/order?foodItemId=${foodItemId}&menuName=${encodeURIComponent(menuName)}&restaurantName=${encodeURIComponent(restaurantName)}`,
        {
          showAlert: false,
          message: 'Please login or sign up to order food',
        }
      );
      return;
    }

    let mounted = true;

    async function loadFoodItem() {
      try {
        const data = await fetchRestaurantFoodItemById(foodItemId);

        if (mounted) {
          setFoodItem(data);
          setState({
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            error,
          });
        }
      }
    }

    loadFoodItem();

    return () => {
      mounted = false;
    };
  }, [foodItemId, isAuthenticated, menuName, restaurantName, requireAuth]);

  const total = useMemo(() => {
    const count = Math.max(Number(quantity) || 1, 1);
    return count * (foodItem?.price || 0);
  }, [foodItem?.price, quantity]);
  const quantityNumber = Math.max(Number(quantity) || 1, 1);

  if (!isAuthenticated) {
    return null;
  }

  function validateForm() {
    const nextErrors = {};
    const parsedQuantity = Number(quantity);
    const trimmedName = normalizeInput(fullName);
    const trimmedEmail = normalizeInput(email);
    const trimmedPhone = normalizeInput(phoneNumber);

    if (!trimmedName) {
      nextErrors.fullName = 'Full name is required.';
    }

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!trimmedPhone) {
      nextErrors.phoneNumber = 'Phone number is required.';
    } else if (!isValidPhone(trimmedPhone)) {
      nextErrors.phoneNumber = 'Enter a valid contact number.';
    }

    if (!isPositiveInteger(parsedQuantity)) {
      nextErrors.quantity = 'Quantity must be at least 1.';
    }

    if (!FULFILLMENT_METHOD_OPTIONS.some((option) => option.value === fulfillmentMethod)) {
      nextErrors.fulfillmentMethod = 'Choose pickup or delivery.';
    }

    if (!isPositiveNumber(total)) {
      nextErrors.submit = 'Order total must be greater than 0.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!foodItem || !token) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      const order = await createFoodOrder(token, {
        restaurantId: typeof params.restaurantId === 'string' ? params.restaurantId : foodItem.restaurantId,
        menuId: typeof params.menuId === 'string' ? params.menuId : foodItem.menuId,
        foodItemId,
        customerName: normalizeInput(fullName),
        customerEmail: normalizeInput(email),
        customerPhone: normalizeInput(phoneNumber),
        quantity: Number(quantity),
        fulfillmentMethod,
        specialNote: normalizeInput(notes),
      });

      setSuccessState({
        visible: true,
        orderId: order?.orderId || order?.id || '',
        orderDate: order?.orderDate || new Date().toISOString().slice(0, 10),
      });
    } catch (error) {
      setErrors((current) => ({
        ...current,
        submit:
          error instanceof Error
            ? error.message
            : 'Unable to place this food order right now.',
      }));
    } finally {
      setSubmitting(false);
    }
  }

  function adjustQuantity(nextValue) {
    const safeValue = Math.max(Number(nextValue) || 1, 1);
    setQuantity(String(safeValue));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Food Order"
          subtitle="Review your selected item and continue through the protected food ordering flow."
          fallbackHref="/restaurants"
        />

        <AppCard variant="primary" style={styles.heroCard}>
          <BrandLogo size="sm" pressable href="/(tabs)" />
          <Text style={styles.heroTitle}>Restaurant Checkout</Text>
          <Text style={styles.heroSubtitle}>
            {restaurantName} - {menuName}
          </Text>
        </AppCard>

        {state.loading ? <HomeSectionState loading /> : null}

        {!state.loading && state.error ? (
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load this food item right now. Please check the restaurant backend
              connection.
            </Text>
          </AppCard>
        ) : null}

        {!state.loading && !state.error && !foodItem ? (
          <HomeSectionState message="This food item could not be found." />
        ) : null}

        {!state.loading && foodItem ? (
          <>
            <AppCard style={styles.previewCard}>
              <Image
                source={{
                  uri: resolveMediaCollection(foodItem.image, getDefaultImage()),
                }}
                style={styles.previewImage}
                contentFit="cover"
              />

              <View style={styles.previewCopy}>
                <Text style={styles.previewEyebrow}>{restaurantName}</Text>
                <Text style={styles.previewTitle}>{foodItem.name}</Text>
                <View style={styles.previewMetaRow}>
                  <View style={styles.previewMetaChip}>
                    <MaterialCommunityIcons name="silverware-fork-knife" size={14} color={theme.colors.accent} />
                    <Text style={styles.previewMetaChipText}>{foodItem.category || 'Food Item'}</Text>
                  </View>
                  <View style={styles.previewMetaChip}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.accent} />
                    <Text style={styles.previewMetaChipText}>
                      {foodItem.preparationTime
                        ? `${foodItem.preparationTime} min prep`
                        : 'Freshly prepared'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.previewDescription}>{foodItem.description}</Text>
                <Text style={styles.previewPrice}>{formatCurrency(foodItem.price)}</Text>
              </View>
            </AppCard>

            <AppCard variant="info" style={styles.infoCard}>
              <Text style={styles.infoTitle}>Live Ordering Enabled</Text>
              <Text style={styles.infoText}>
                Food orders placed here now save to the backend, appear in your My
                Bookings page, and are visible in the admin food-orders panel.
              </Text>
            </AppCard>

            <AppCard style={styles.formCard}>
              <View style={styles.sectionHeaderWrap}>
                <Text style={styles.sectionEyebrow}>Order Contact</Text>
                <Text style={styles.sectionTitle}>Guest details</Text>
              </View>

              <AppTextField
                label="Customer"
                value={fullName}
                onChangeText={setFullName}
                error={errors.fullName}
                placeholder="Your full name"
              />

              <AppTextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                placeholder="you@example.com"
              />

              <AppTextField
                label="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                error={errors.phoneNumber}
                placeholder="+94 77 123 4567"
              />

              <View style={styles.divider} />

              <View style={styles.sectionHeaderWrap}>
                <Text style={styles.sectionEyebrow}>Order Setup</Text>
                <Text style={styles.sectionTitle}>Quantity & fulfilment</Text>
              </View>

              <View style={styles.quantityPanel}>
                <Text style={styles.quantityLabel}>Quantity</Text>
                <View style={styles.quantityCounter}>
                  <Pressable onPress={() => adjustQuantity(quantityNumber - 1)} style={styles.quantityActionShell}>
                    <Text style={styles.quantityActionText}>-</Text>
                  </Pressable>
                  <View style={styles.quantityValueShell}>
                    <Text style={styles.quantityValueText}>{quantityNumber}</Text>
                  </View>
                  <Pressable onPress={() => adjustQuantity(quantityNumber + 1)} style={styles.quantityActionShell}>
                    <Text style={styles.quantityActionText}>+</Text>
                  </Pressable>
                </View>
                {errors.quantity ? <Text style={styles.fieldError}>{errors.quantity}</Text> : null}
              </View>

              <AppSelectField
                label="Pickup / Delivery"
                value={fulfillmentMethod}
                options={FULFILLMENT_METHOD_OPTIONS}
                onChange={setFulfillmentMethod}
                error={errors.fulfillmentMethod}
              />

              <AppTextField
                label="Special Notes"
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional food notes"
                multiline
              />

              <View style={styles.totalShell}>
                <View>
                  <Text style={styles.totalLabel}>Estimated food total</Text>
                  <Text style={styles.totalMeta}>
                    {formatCurrency(foodItem.price)} x {quantityNumber} item{quantityNumber === 1 ? '' : 's'}
                  </Text>
                </View>
                <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
              </View>

              <AppButton
                title={submitting ? 'Placing Order...' : 'Proceed With Order'}
                onPress={handleSubmit}
                disabled={submitting || foodItem.availability === false}
              />

              {errors.submit ? <Text style={styles.fieldError}>{errors.submit}</Text> : null}
            </AppCard>
          </>
        ) : null}
      </ScrollView>

      <BookingSuccessModal
        visible={successState.visible}
        bookingId={successState.orderId}
        serviceType={`${restaurantName} • Food Order`}
        totalAmount={total}
        date={successState.orderDate}
        title="Booking Confirmed"
        message="Your reservation has been successfully completed."
        onClose={() => setSuccessState((current) => ({ ...current, visible: false }))}
        onViewBookings={() => {
          setSuccessState((current) => ({ ...current, visible: false }));
          router.replace('/my-bookings?refresh=1');
        }}
      />
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
  heroCard: {
    gap: theme.spacing.sm,
  },
  heroTitle: {
    color: theme.colors.textOnDark,
    ...theme.typography.screenTitle,
  },
  heroSubtitle: {
    color: '#DDE7F4',
    ...theme.typography.body,
  },
  previewCard: {
    gap: theme.spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primarySoft,
  },
  previewCopy: {
    gap: theme.spacing.sm,
  },
  previewEyebrow: {
    color: theme.colors.accent,
    ...theme.typography.eyebrow,
  },
  previewTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  previewMetaRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  previewMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  previewMetaChipText: {
    color: theme.colors.warningText,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  previewDescription: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  previewPrice: {
    color: theme.colors.primary,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  infoCard: {
    gap: theme.spacing.xs,
  },
  infoTitle: {
    color: theme.colors.info,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
  infoText: {
    color: theme.colors.infoText,
    ...theme.typography.body,
  },
  formCard: {
    gap: theme.spacing.md,
  },
  sectionHeaderWrap: {
    gap: 4,
  },
  sectionEyebrow: {
    color: theme.colors.textSubtle,
    ...theme.typography.eyebrow,
  },
  sectionTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: theme.spacing.xs,
  },
  quantityPanel: {
    gap: theme.spacing.sm,
  },
  quantityLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.label,
  },
  quantityCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  quantityActionShell: {
    width: 54,
    height: 54,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityActionText: {
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
  },
  quantityValueShell: {
    flex: 1,
    minHeight: 54,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValueText: {
    color: theme.colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  fieldError: {
    color: theme.colors.errorText,
    ...theme.typography.bodySmall,
  },
  totalShell: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: '#F2D39D',
    backgroundColor: '#FFF6E4',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  totalLabel: {
    color: theme.colors.warningText,
    ...theme.typography.eyebrow,
  },
  totalMeta: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    marginTop: 4,
  },
  totalValue: {
    color: theme.colors.warningText,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
