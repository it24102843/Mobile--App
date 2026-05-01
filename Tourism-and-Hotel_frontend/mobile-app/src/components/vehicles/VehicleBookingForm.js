import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { AppTextField } from '../AppTextField';
import { GuestCounter } from '../bookings/GuestCounter';
import { PaymentMethodCard } from '../bookings/PaymentMethodCard';
import { DatePickerField } from '../common/DatePickerField';
import { StatusBadge } from '../StatusBadge';
import { theme } from '../../theme';
import {
  calculateVehicleBookingTotals,
  VEHICLE_PAYMENT_OPTIONS,
} from '../../services/vehicleBookingsApi';

function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function SummaryRow({ label, value, emphasize = false }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, emphasize ? styles.summaryLabelStrong : null]}>
        {label}
      </Text>
      <Text style={[styles.summaryValue, emphasize ? styles.summaryValueStrong : null]}>
        {value}
      </Text>
    </View>
  );
}

function TrustBadge({ icon, label }) {
  return (
    <View style={styles.trustBadge}>
      <MaterialCommunityIcons name={icon} size={18} color={theme.colors.primary} />
      <Text style={styles.trustLabel}>{label}</Text>
    </View>
  );
}

export function VehicleBookingForm({
  vehicle,
  values,
  errors,
  submitting,
  onChange,
  onPassengersChange,
  onCancel,
  onSubmit,
}) {
  const { totalDays, totalPrice } = calculateVehicleBookingTotals(
    values.startDate,
    values.endDate,
    vehicle.pricePerDay
  );
  const todayDate = formatDateString(new Date());

  const selectedPaymentMethod =
    VEHICLE_PAYMENT_OPTIONS.find((option) => option.value === values.paymentMethod)?.title ||
    'Select a payment method';

  return (
    <View style={styles.wrapper}>
      <AppCard padded={false} style={styles.heroCard}>
        <Image source={{ uri: vehicle.imageUrl }} style={styles.heroImage} contentFit="cover" />
        <View style={styles.heroContent}>
          <View style={styles.badgeRow}>
            <StatusBadge
              label={vehicle.availabilityLabel}
              variant={vehicle.availability ? 'primary' : 'warning'}
            />
            <StatusBadge label={vehicle.capacityLabel} variant="info" />
          </View>

          <Text style={styles.heroTitle}>{vehicle.title}</Text>
          <Text style={styles.heroSubtitle}>
            {vehicle.typeLabel} - {vehicle.registrationNumber}
          </Text>
          <Text style={styles.heroPrice}>{vehicle.pricePerDayLabel}</Text>
        </View>
      </AppCard>

      <AppCard style={styles.formCard}>
        <Text style={styles.eyebrow}>Book Your Vehicle</Text>
        <Text style={styles.heading}>Complete the form to reserve your safari adventure</Text>
        <Text style={styles.subheading}>
          Match the live WildHaven safari flow with traveler details, dates, payment method, and final confirmation.
        </Text>

        <AppTextField
          label="Full Name"
          placeholder="Your full name"
          value={values.customerName}
          onChangeText={(value) => onChange('customerName', value)}
          error={errors.customerName}
        />

        <AppTextField
          label="Email"
          placeholder="guest@wildhaven.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={values.customerEmail}
          onChangeText={(value) => onChange('customerEmail', value)}
          error={errors.customerEmail}
        />

        <AppTextField
          label="Phone Number"
          placeholder="+94 77 123 4567"
          keyboardType="phone-pad"
          value={values.customerPhone}
          onChangeText={(value) => onChange('customerPhone', value)}
          error={errors.customerPhone}
        />

        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <DatePickerField
              label="Start Date"
              value={values.startDate}
              onChange={(value) => onChange('startDate', value)}
              minimumDate={todayDate}
              placeholder="YYYY-MM-DD"
              error={errors.startDate}
            />
          </View>
          <View style={styles.dateField}>
            <DatePickerField
              label="End Date"
              value={values.endDate}
              onChange={(value) => onChange('endDate', value)}
              minimumDate={values.startDate || todayDate}
              placeholder="YYYY-MM-DD"
              error={errors.endDate}
            />
          </View>
        </View>

        <View style={styles.counterBlock}>
          <Text style={styles.counterLabel}>Number of Passengers</Text>
          <GuestCounter
            value={Number(values.passengers || 1)}
            max={vehicle.capacity || 20}
            onChange={onPassengersChange}
          />
          {errors.passengers ? <Text style={styles.errorText}>{errors.passengers}</Text> : null}
          <Text style={styles.helperText}>Maximum {vehicle.capacity || 20} passengers</Text>
        </View>

        <AppTextField
          label="Special Requests"
          placeholder="Pickup notes, timing requests, or safari preferences"
          multiline
          value={values.specialRequests}
          onChangeText={(value) => onChange('specialRequests', value)}
        />

        <View style={styles.paymentWrap}>
          <Text style={styles.paymentTitle}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            {VEHICLE_PAYMENT_OPTIONS.map((option) => (
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
        </View>

        <AppCard variant="warning" style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <SummaryRow label="Daily Rate" value={vehicle.pricePerDayLabel} />
          <SummaryRow label="Number of Days" value={`${totalDays || 0} day(s)`} />
          <SummaryRow label="Passengers" value={`${Number(values.passengers || 1)}`} />
          <SummaryRow label="Payment Method" value={selectedPaymentMethod} />
          <SummaryRow
            label="Total Amount"
            value={`LKR ${new Intl.NumberFormat('en-LK').format(totalPrice || 0)}`}
            emphasize
          />
        </AppCard>

        <View style={styles.trustRow}>
          <TrustBadge icon="shield-check-outline" label="Secure Booking" />
          <TrustBadge icon="cash-refund" label="Free Cancellation" />
          <TrustBadge icon="check-decagram-outline" label="Instant Confirmation" />
          <TrustBadge icon="cash-remove" label="No Booking Fees" />
        </View>

        {errors.submit ? (
          <AppCard variant="danger" style={styles.submitErrorCard}>
            <Text style={styles.errorText}>{errors.submit}</Text>
          </AppCard>
        ) : null}

        <View style={styles.actionRow}>
          <View style={styles.flexAction}>
            <AppButton title="Cancel" variant="secondary" onPress={onCancel} />
          </View>
          <View style={styles.flexAction}>
            <AppButton
              title={submitting ? 'Confirming Booking...' : 'Confirm Booking'}
              onPress={onSubmit}
              disabled={submitting}
            />
          </View>
        </View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.xl,
  },
  heroCard: {
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#E9EEF6',
  },
  heroContent: {
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  heroTitle: {
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  heroPrice: {
    color: theme.colors.accent,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  formCard: {
    gap: theme.spacing.xl,
  },
  eyebrow: {
    color: theme.colors.accent,
    ...theme.typography.eyebrow,
  },
  heading: {
    color: theme.colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  subheading: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  dateRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  dateField: {
    flex: 1,
  },
  counterBlock: {
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
  paymentWrap: {
    gap: theme.spacing.md,
  },
  paymentTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  paymentOptions: {
    gap: theme.spacing.md,
  },
  summaryCard: {
    gap: theme.spacing.md,
  },
  summaryTitle: {
    color: theme.colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
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
  summaryLabelStrong: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  summaryValue: {
    color: theme.colors.text,
    ...theme.typography.body,
    fontWeight: '700',
    textAlign: 'right',
  },
  summaryValueStrong: {
    color: theme.colors.primary,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radii.pill,
    backgroundColor: '#F7F1E7',
  },
  trustLabel: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  submitErrorCard: {
    gap: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.bodySmall,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flexAction: {
    flex: 1,
  },
});
