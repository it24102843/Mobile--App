import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { AppTextField } from '../AppTextField';
import { GuestCounter } from '../bookings/GuestCounter';
import { PaymentMethodCard } from '../bookings/PaymentMethodCard';
import { DatePickerField } from '../common/DatePickerField';
import { theme } from '../../theme';

const PAYMENT_OPTIONS = [
  {
    value: 'online',
    title: 'Online Payment',
    subtitle: 'Instant confirmation',
    description: 'Use the online payment option when the backend flow is enabled.',
  },
  {
    value: 'bank_deposit',
    title: 'Bank Transfer',
    subtitle: 'Manual verification',
    description: 'Reserve now and share your transfer details with the WildHaven team.',
  },
];

const STEPS = [
  { key: 'trip', number: '1', label: 'Trip Details' },
  { key: 'vehicle', number: '2', label: 'Vehicle' },
  { key: 'addons', number: '3', label: 'Add-ons' },
  { key: 'confirm', number: '4', label: 'Confirm' },
];
const BREAKFAST_PRICE = 550;
const LUNCH_PRICE = 650;

function formatCurrency(value) {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value || 0))}`;
}

function formatDate(value) {
  if (!value) {
    return 'Choose your date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function StepPill({ number, label, active, completed }) {
  return (
    <View
      style={[
        styles.stepPill,
        active ? styles.stepPillActive : null,
        completed ? styles.stepPillCompleted : null,
      ]}>
      <View
        style={[
          styles.stepNumberWrap,
          active ? styles.stepNumberWrapActive : null,
          completed ? styles.stepNumberWrapCompleted : null,
        ]}>
        <Text
          style={[
            styles.stepNumber,
            active ? styles.stepNumberActive : null,
            completed ? styles.stepNumberCompleted : null,
          ]}>
          {number}
        </Text>
      </View>
      <Text
        style={[
          styles.stepLabel,
          active ? styles.stepLabelActive : null,
          completed ? styles.stepLabelCompleted : null,
        ]}>
        {label}
      </Text>
    </View>
  );
}

function SummaryRow({ icon, label, value, emphasized = false }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryLabelWrap}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={emphasized ? theme.colors.accent : theme.colors.primary}
        />
        <Text style={[styles.summaryLabel, emphasized ? styles.summaryLabelEmphasized : null]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.summaryValue, emphasized ? styles.summaryValueEmphasized : null]}>
        {value}
      </Text>
    </View>
  );
}

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function AddOnCard({ addon, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.addOnCard, selected ? styles.addOnCardSelected : null]}>
      <View style={styles.addOnTopRow}>
        <View style={styles.addOnIconWrap}>
          <MaterialCommunityIcons
            name="gift-outline"
            size={24}
            color={selected ? theme.colors.accent : theme.colors.primary}
          />
        </View>
        <View style={[styles.addOnRadio, selected ? styles.addOnRadioSelected : null]}>
          {selected ? (
            <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
          ) : null}
        </View>
      </View>

      <Text style={styles.addOnCategory}>{addon.category}</Text>
      <Text style={styles.addOnTitle}>{addon.title}</Text>
      <Text style={styles.addOnDescription}>{addon.description}</Text>
      <Text style={styles.addOnPrice}>+{addon.priceLabel}</Text>
    </Pressable>
  );
}

function MealOptionRow({ label, price, selected, onPress }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress} style={styles.mealOptionRow}>
      <View style={[styles.mealOptionCheck, selected ? styles.mealOptionCheckSelected : null]}>
        {selected ? <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" /> : null}
      </View>
      <Text style={styles.mealOptionLabel}>{label}</Text>
      <Text style={styles.mealOptionPrice}>{formatCurrency(price)}</Text>
    </Pressable>
  );
}

function MealPackageCard({ addon, breakfastSelected, lunchSelected, total, onToggleBreakfast, onToggleLunch }) {
  const selected = breakfastSelected || lunchSelected;
  const selectionLabel = breakfastSelected && lunchSelected
    ? 'Breakfast & lunch selected.'
    : breakfastSelected
      ? 'Breakfast selected.'
      : lunchSelected
        ? 'Lunch selected.'
        : 'Choose breakfast, lunch, or both.';

  return (
    <View style={[styles.addOnCard, selected ? styles.addOnCardSelected : null]}>
      <View style={styles.addOnTopRow}>
        <View style={styles.addOnIconWrap}>
          <MaterialCommunityIcons
            name="silverware-fork-knife"
            size={24}
            color={selected ? theme.colors.accent : theme.colors.primary}
          />
        </View>
        <View style={[styles.addOnRadio, selected ? styles.addOnRadioSelected : null]}>
          {selected ? <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" /> : null}
        </View>
      </View>

      <Text style={styles.addOnCategory}>{addon?.category || 'Meal'}</Text>
      <Text style={styles.addOnTitle}>{addon?.title || 'Meal Package'}</Text>
      <Text style={styles.addOnDescription}>{selectionLabel}</Text>

      <View style={styles.mealOptionsWrap}>
        <MealOptionRow
          label="Breakfast"
          price={BREAKFAST_PRICE}
          selected={breakfastSelected}
          onPress={onToggleBreakfast}
        />
        <MealOptionRow
          label="Lunch"
          price={LUNCH_PRICE}
          selected={lunchSelected}
          onPress={onToggleLunch}
        />
      </View>

      <Text style={styles.mealComboText}>
        {selected
          ? `Meal total: ${formatCurrency(total)}`
          : 'No meal option selected yet.'}
      </Text>
      <Text style={styles.addOnPrice}>+{formatCurrency(total)}</Text>
    </View>
  );
}

function AddOnSummaryItem({ icon, title, subtitle, amount, highlighted = false }) {
  return (
    <View style={styles.addOnSummaryItem}>
      <View style={styles.addOnSummaryIconBox}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={highlighted ? theme.colors.accent : theme.colors.primary}
        />
      </View>
      <View style={styles.addOnSummaryTextBox}>
        <Text numberOfLines={1} style={styles.addOnSummaryItemTitle}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={2} style={styles.addOnSummaryItemSubtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {amount ? (
        <Text numberOfLines={1} style={styles.addOnSummaryAmount}>
          {amount}
        </Text>
      ) : null}
    </View>
  );
}

function AddOnSummaryCard({
  mealPackageSummary,
  mealPackageTotal,
  selectedAddOns,
  addOnTotal,
  runningTotal,
}) {
  const hasMealPackage = mealPackageSummary.length > 0;
  const hasRegularAddOns = selectedAddOns.length > 0;
  const hasSelections = hasMealPackage || hasRegularAddOns;
  const mealSubtitle = hasMealPackage ? mealPackageSummary.join(' + ') : '';

  return (
    <AppCard variant="warning" style={styles.addOnSummaryCard}>
      <Text style={styles.summaryTitle}>Add-on Summary</Text>

      <View style={styles.addOnSummarySection}>
        <Text style={styles.addOnSummaryLabel}>Selected Add-ons</Text>

        {hasSelections ? (
          <View style={styles.addOnSummaryList}>
            {hasMealPackage ? (
              <AddOnSummaryItem
                icon="silverware-fork-knife"
                title="Meal Package"
                subtitle={mealSubtitle}
                amount={formatCurrency(mealPackageTotal)}
                highlighted
              />
            ) : null}

            {selectedAddOns.map((item) => (
              <AddOnSummaryItem
                key={item.addonId}
                icon="map-marker-account-outline"
                title={item.title}
                subtitle={item.description}
                amount={item.priceLabel}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.addOnSummaryEmpty}>None selected</Text>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.addOnTotalsWrap}>
        <SummaryRow icon="plus-circle-outline" label="Add-on Total" value={formatCurrency(addOnTotal)} />
        <SummaryRow
          icon="wallet-outline"
          label="Running Total"
          value={formatCurrency(runningTotal)}
          emphasized
        />
      </View>
    </AppCard>
  );
}

function EmptyOptionalState({ icon, title, message }) {
  return (
    <AppCard variant="subtle" style={styles.emptyState}>
      <MaterialCommunityIcons name={icon} size={28} color={theme.colors.textSubtle} />
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateText}>{message}</Text>
    </AppCard>
  );
}

export function PackageBookingForm({
  pkg,
  vehicles,
  addOns,
  mealAddOn,
  values,
  errors,
  currentStep,
  totalPrice,
  selectedVehicle,
  vehicleTotal,
  selectedAddOns,
  mealPackageSummary,
  mealPackageTotal,
  addOnTotal,
  submitting,
  customerName,
  customerEmail,
  onChange,
  onGuestChange,
  onToggleAddOn,
  onToggleMealOption,
  onNextStep,
  onPreviousStep,
  onSubmit,
}) {
  const pricePerGuest = Number(pkg?.price || 0);
  const guestCount = Number(values.guests || 1);
  const packageBaseTotal = pricePerGuest * guestCount;
  const durationDays = Math.max(Number(pkg?.duration?.days || 1), 1);
  const todayDate = formatDateString(new Date());

  return (
    <AppCard style={styles.wrapper}>
      <View style={styles.stepRow}>
        {STEPS.map((step, index) => (
          <StepPill
            key={step.key}
            number={step.number}
            label={step.label}
            active={currentStep === index}
            completed={currentStep > index}
          />
        ))}
      </View>

      <View style={styles.heroBlock}>
        <Image source={{ uri: pkg.imageUrl }} style={styles.heroImage} contentFit="cover" />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>{pkg.category}</Text>
          <Text style={styles.heroTitle}>{pkg.title}</Text>
          <Text style={styles.heroMeta}>
            {pkg.durationLabel} - {pkg.maxGuestsLabel} - {pkg.locationLabel}
          </Text>
          <Text style={styles.heroPrice}>{pkg.priceLabel}</Text>
        </View>
      </View>

      {currentStep === 0 ? (
        <>
          <SectionHeader
            eyebrow="Step 1"
            title="Trip details"
            subtitle="Choose the tour date, guest count, and traveler contact details for this package."
          />

          <AppCard variant="subtle" style={styles.customerCard}>
            <Text style={styles.customerEyebrow}>Lead Traveler</Text>
            <Text style={styles.customerName}>{customerName || 'WildHaven Guest'}</Text>
            <Text style={styles.customerEmail}>
              {customerEmail || 'Your account email will be used for confirmation.'}
            </Text>
          </AppCard>

          <View style={styles.fieldGrid}>
            <DatePickerField
              label="Tour Date"
              value={values.tourDate}
              onChange={(value) => onChange('tourDate', value)}
              minimumDate={todayDate}
              placeholder="YYYY-MM-DD"
              error={errors.tourDate}
            />

            <View style={styles.counterField}>
              <Text style={styles.counterLabel}>Guest Count</Text>
              <GuestCounter value={values.guests} max={pkg.maxGroupSize || 20} onChange={onGuestChange} />
              {errors.guests ? <Text style={styles.errorText}>{errors.guests}</Text> : null}
              {pkg.maxGroupSize ? (
                <Text style={styles.helperText}>Package capacity: up to {pkg.maxGroupSize} guests</Text>
              ) : null}
            </View>

            <AppTextField
              label="Contact Number"
              placeholder="+94 77 123 4567"
              keyboardType="phone-pad"
              value={values.contactNumber}
              onChangeText={(value) => onChange('contactNumber', value)}
              error={errors.contactNumber}
            />

            <AppTextField
              label="Special Request"
              placeholder="Pickup notes, dietary preferences, or timing requests"
              value={values.specialRequests}
              onChangeText={(value) => onChange('specialRequests', value)}
              multiline
            />
          </View>

          <AppCard variant="warning" style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Trip summary</Text>
            <SummaryRow icon="calendar-range" label="Tour Date" value={formatDate(values.tourDate)} />
            <SummaryRow icon="account-group-outline" label="Guests" value={`${guestCount}`} />
            <SummaryRow icon="cash-multiple" label="Package Total" value={formatCurrency(packageBaseTotal)} />
          </AppCard>

          <AppButton title="Continue to Vehicle" onPress={onNextStep} />
        </>
      ) : null}

      {currentStep === 1 ? (
        <>
          <SectionHeader
            eyebrow="Step 2"
            title="Choose your package vehicle"
            subtitle="Select the package vehicle that best matches your trip. The vehicle upgrade is added to your booking total."
          />

          {vehicles?.length ? (
            <View style={styles.vehicleGrid}>
              {vehicles.map((vehicle) => {
                const isSelected = values.selectedVehicleId === vehicle.vehicleId;

                return (
                  <Pressable
                    key={vehicle.vehicleId}
                    accessibilityRole="button"
                    onPress={() => onChange('selectedVehicleId', vehicle.vehicleId)}
                    style={[
                      styles.vehicleCard,
                      isSelected ? styles.vehicleCardSelected : null,
                    ]}>
                    <Image source={{ uri: vehicle.imageUrl }} style={styles.vehicleImage} contentFit="cover" />
                    <View style={styles.vehicleBody}>
                      <View style={styles.vehicleHeaderRow}>
                        <View style={styles.vehicleHeaderCopy}>
                          <Text style={styles.vehicleTitle}>{vehicle.title}</Text>
                          <Text style={styles.vehicleSubtitle}>
                            {vehicle.typeLabel} - {vehicle.capacityLabel}
                          </Text>
                        </View>
                        {isSelected ? (
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={24}
                            color={theme.colors.success}
                          />
                        ) : null}
                      </View>

                      {vehicle.features?.length ? (
                        <View style={styles.featureWrap}>
                          {vehicle.features.map((feature) => (
                            <View key={`${vehicle.vehicleId}-${feature}`} style={styles.featureChip}>
                              <Text style={styles.featureText}>{feature}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      <Text style={styles.vehiclePrice}>+{vehicle.pricePerDayLabel}</Text>
                      <Text style={styles.vehiclePerDay}>
                        {durationDays} day(s) matched to this package itinerary
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <EmptyOptionalState
              icon="car-outline"
              title="No package vehicles listed"
              message="This package does not have a dedicated vehicle assignment yet, so you can continue without selecting one."
            />
          )}

          {errors.selectedVehicle ? <Text style={styles.errorText}>{errors.selectedVehicle}</Text> : null}

          <AppCard variant="warning" style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Vehicle summary</Text>
            <SummaryRow
              icon="car-outline"
              label="Selected Vehicle"
              value={selectedVehicle ? selectedVehicle.title : 'Choose a package vehicle'}
            />
            <SummaryRow
              icon="cash-plus"
              label="Vehicle Total"
              value={selectedVehicle ? formatCurrency(vehicleTotal) : 'LKR 0'}
            />
            <SummaryRow
              icon="wallet-outline"
              label="Running Total"
              value={formatCurrency(packageBaseTotal + vehicleTotal)}
              emphasized
            />
          </AppCard>

          <AppButton title="Back to Trip Details" variant="secondary" onPress={onPreviousStep} />
          <AppButton title="Continue to Add-ons" onPress={onNextStep} />
        </>
      ) : null}

      {currentStep === 2 ? (
        <>
          <SectionHeader
            eyebrow="Step 3"
            title="Optional add-ons"
            subtitle="Add extra WildHaven services to personalize the package before final confirmation."
          />

          {mealAddOn || addOns?.length ? (
            <View style={styles.addOnGrid}>
              {mealAddOn ? (
                <MealPackageCard
                  addon={mealAddOn}
                  breakfastSelected={Boolean(values.mealPackage?.breakfast)}
                  lunchSelected={Boolean(values.mealPackage?.lunch)}
                  total={mealPackageTotal}
                  onToggleBreakfast={() => onToggleMealOption('breakfast')}
                  onToggleLunch={() => onToggleMealOption('lunch')}
                />
              ) : null}
              {addOns.map((addon) => (
                <AddOnCard
                  key={addon.addonId}
                  addon={addon}
                  selected={values.selectedAddOnIds.includes(addon.addonId)}
                  onPress={() => onToggleAddOn(addon.addonId)}
                />
              ))}
            </View>
          ) : (
            <EmptyOptionalState
              icon="gift-outline"
              title="No add-ons available"
              message="There are no optional package add-ons in the live backend yet, so you can continue to confirmation."
            />
          )}

          <AddOnSummaryCard
            mealPackageSummary={mealPackageSummary}
            mealPackageTotal={mealPackageTotal}
            selectedAddOns={selectedAddOns}
            addOnTotal={addOnTotal}
            runningTotal={packageBaseTotal + vehicleTotal + addOnTotal}
          />

          <AppButton title="Back to Vehicle" variant="secondary" onPress={onPreviousStep} />
          <AppButton title="Continue to Confirm" onPress={onNextStep} />
        </>
      ) : null}

      {currentStep === 3 ? (
        <>
          <SectionHeader
            eyebrow="Step 4"
            title="Confirm your booking"
            subtitle="Review the package, vehicle, extras, and payment method before placing the booking."
          />

          <View style={styles.paymentWrap}>
            {PAYMENT_OPTIONS.map((option) => (
              <PaymentMethodCard
                key={option.value}
                value={option.value}
                title={option.title}
                subtitle={option.subtitle}
                description={option.description}
                selected={values.paymentMethod === option.value}
                onPress={() => onChange('paymentMethod', option.value)}
              />
            ))}
          </View>
          {errors.paymentMethod ? <Text style={styles.errorText}>{errors.paymentMethod}</Text> : null}

          <AppCard variant="warning" style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking confirmation</Text>
            <SummaryRow icon="briefcase-outline" label="Package" value={pkg.title} />
            <SummaryRow icon="calendar-range" label="Tour Date" value={formatDate(values.tourDate)} />
            <SummaryRow icon="account-group-outline" label="Guests" value={`${guestCount}`} />
            <SummaryRow icon="phone-outline" label="Contact" value={values.contactNumber || 'Not provided'} />
            <SummaryRow
              icon="car-outline"
              label="Package Vehicle"
              value={selectedVehicle ? selectedVehicle.title : 'No vehicle selected'}
            />
            <SummaryRow
              icon="gift-outline"
              label="Add-ons"
              value={
                mealPackageSummary.length || selectedAddOns.length
                  ? [
                      ...(mealPackageSummary.length
                        ? [`Meal Package: ${mealPackageSummary.join(', ')} — ${formatCurrency(mealPackageTotal)}`]
                        : []),
                      ...selectedAddOns.map((item) => `${item.title} — ${item.priceLabel}`)
                    ].join(', ')
                  : 'No add-ons selected'
              }
            />
            <SummaryRow
              icon="credit-card-outline"
              label="Payment Method"
              value={
                PAYMENT_OPTIONS.find((option) => option.value === values.paymentMethod)?.title || 'Choose one'
              }
            />
            <View style={styles.divider} />
            <SummaryRow icon="cash-multiple" label="Package Total" value={formatCurrency(packageBaseTotal)} />
            <SummaryRow icon="car-estate" label="Vehicle Total" value={formatCurrency(vehicleTotal)} />
            <SummaryRow icon="plus-circle-outline" label="Add-on Total" value={formatCurrency(addOnTotal)} />
            <SummaryRow
              icon="wallet-outline"
              label="Total Amount"
              value={formatCurrency(totalPrice)}
              emphasized
            />
          </AppCard>

          {errors.submit ? (
            <AppCard variant="danger" style={styles.submitErrorCard}>
              <Text style={styles.errorText}>{errors.submit}</Text>
            </AppCard>
          ) : null}

          <AppButton title="Back to Add-ons" variant="secondary" onPress={onPreviousStep} />
          <AppButton
            title={submitting ? 'Booking Package...' : 'Book Package'}
            onPress={onSubmit}
            disabled={submitting}
          />
        </>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.xl,
  },
  stepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: '#E1D8CA',
    backgroundColor: '#FFFDF8',
  },
  stepPillActive: {
    borderColor: theme.colors.accent,
    backgroundColor: '#FFF3E3',
  },
  stepPillCompleted: {
    borderColor: '#D5EAD9',
    backgroundColor: '#F3FBF5',
  },
  stepNumberWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberWrapActive: {
    backgroundColor: theme.colors.accent,
  },
  stepNumberWrapCompleted: {
    backgroundColor: theme.colors.success,
  },
  stepNumber: {
    color: theme.colors.primary,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepNumberCompleted: {
    color: '#FFFFFF',
  },
  stepLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  stepLabelActive: {
    color: '#8B571A',
  },
  stepLabelCompleted: {
    color: theme.colors.successText,
  },
  heroBlock: {
    minHeight: 244,
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.primary,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: '#E9EEF6',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 36, 63, 0.44)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  heroEyebrow: {
    color: '#FFD39E',
    ...theme.typography.eyebrow,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.88)',
    ...theme.typography.bodySmall,
  },
  heroPrice: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  sectionHeader: {
    gap: theme.spacing.xs,
  },
  sectionEyebrow: {
    color: theme.colors.accent,
    ...theme.typography.eyebrow,
  },
  sectionTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  sectionSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  customerCard: {
    gap: theme.spacing.sm,
  },
  customerEyebrow: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  customerName: {
    color: theme.colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  customerEmail: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  fieldGrid: {
    gap: theme.spacing.lg,
  },
  counterField: {
    gap: theme.spacing.sm,
  },
  counterLabel: {
    color: theme.colors.text,
    ...theme.typography.label,
  },
  helperText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  vehicleGrid: {
    gap: theme.spacing.lg,
  },
  vehicleCard: {
    borderRadius: theme.radii.xl,
    borderWidth: 1.5,
    borderColor: '#E6DAC7',
    backgroundColor: '#FFFDF8',
    overflow: 'hidden',
  },
  vehicleCardSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: '#FFF7EE',
  },
  vehicleImage: {
    width: '100%',
    height: 170,
    backgroundColor: '#E9EEF6',
  },
  vehicleBody: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  vehicleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  vehicleHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  vehicleTitle: {
    color: theme.colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  vehicleSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  featureWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  featureChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
    backgroundColor: '#FFF2D9',
  },
  featureText: {
    color: '#A66A19',
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  vehiclePrice: {
    color: theme.colors.accent,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  vehiclePerDay: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
  },
  addOnGrid: {
    gap: theme.spacing.lg,
  },
  addOnCard: {
    borderRadius: theme.radii.xl,
    borderWidth: 1.5,
    borderColor: '#E6DAC7',
    backgroundColor: '#FFFDF8',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  addOnCardSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: '#FFF7EE',
  },
  addOnTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addOnIconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F1E7',
  },
  addOnRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E6DAC7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOnRadioSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent,
  },
  addOnCategory: {
    color: theme.colors.accent,
    ...theme.typography.eyebrow,
    letterSpacing: 1.3,
  },
  addOnTitle: {
    color: theme.colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  addOnDescription: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  mealOptionsWrap: {
    gap: theme.spacing.sm,
  },
  mealOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  mealOptionCheck: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#E6DAC7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealOptionCheckSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent,
  },
  mealOptionLabel: {
    flex: 1,
    color: theme.colors.text,
    ...theme.typography.body,
    fontWeight: '700',
  },
  mealOptionPrice: {
    color: theme.colors.accent,
    ...theme.typography.body,
    fontWeight: '800',
  },
  mealComboText: {
    color: theme.colors.warningText,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  addOnPrice: {
    color: theme.colors.primary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  paymentWrap: {
    gap: theme.spacing.md,
  },
  addOnSummaryCard: {
    gap: theme.spacing.md,
  },
  addOnSummarySection: {
    gap: theme.spacing.sm,
  },
  addOnSummaryLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
    fontWeight: '700',
  },
  addOnSummaryList: {
    gap: theme.spacing.md,
  },
  addOnSummaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    width: '100%',
  },
  addOnSummaryIconBox: {
    width: 32,
    alignItems: 'center',
    paddingTop: 2,
  },
  addOnSummaryTextBox: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  addOnSummaryItemTitle: {
    color: theme.colors.text,
    ...theme.typography.body,
    fontWeight: '800',
    flexShrink: 1,
  },
  addOnSummaryItemSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    flexShrink: 1,
  },
  addOnSummaryAmount: {
    color: theme.colors.primary,
    ...theme.typography.body,
    fontWeight: '800',
    textAlign: 'right',
    flexShrink: 0,
    paddingLeft: theme.spacing.sm,
  },
  addOnSummaryEmpty: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  addOnTotalsWrap: {
    gap: theme.spacing.sm,
  },
  summaryCard: {
    gap: theme.spacing.md,
  },
  summaryTitle: {
    color: theme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  summaryLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  summaryLabelEmphasized: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  summaryValue: {
    color: theme.colors.text,
    ...theme.typography.body,
    fontWeight: '800',
    textAlign: 'right',
    flexShrink: 1,
  },
  summaryValueEmphasized: {
    color: theme.colors.primary,
    fontSize: 17,
    lineHeight: 23,
  },
  divider: {
    height: 1,
    backgroundColor: '#E6D7BA',
  },
  emptyState: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  emptyStateTitle: {
    color: theme.colors.text,
    ...theme.typography.label,
    textAlign: 'center',
  },
  emptyStateText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    textAlign: 'center',
  },
  submitErrorCard: {
    gap: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.bodySmall,
  },
});
