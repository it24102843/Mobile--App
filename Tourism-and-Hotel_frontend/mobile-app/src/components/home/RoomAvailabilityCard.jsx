import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { AppSelectField } from '../AppSelectField';
import { SectionHeader } from '../SectionHeader';
import { GuestCounter } from '../bookings/GuestCounter';
import { DatePickerField } from '../common/DatePickerField';
import { theme } from '../../theme';
import {
  isDateAfter,
  isFutureOrToday,
  isPositiveInteger,
} from '../../utils/validation';

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function getTomorrowIso(days = 1) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function countNights(checkInDate, checkOutDate) {
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 0;
  }

  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

function buildRoomTypeOptions(rooms) {
  const uniqueRoomTypes = Array.from(
    new Set((Array.isArray(rooms) ? rooms : []).map((room) => room?.title).filter(Boolean))
  );

  return [
    { label: 'Any Type', value: '' },
    ...uniqueRoomTypes.map((roomType) => ({
      label: roomType,
      value: roomType,
    })),
  ];
}

export function RoomAvailabilityCard({ rooms = [], onCheckAvailability }) {
  const [checkIn, setCheckIn] = useState(toIsoDate(new Date()));
  const [checkOut, setCheckOut] = useState(getTomorrowIso(1));
  const [guests, setGuests] = useState(1);
  const [roomType, setRoomType] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const roomTypeOptions = useMemo(() => buildRoomTypeOptions(rooms), [rooms]);
  const nights = countNights(checkIn, checkOut);
  const selectedRoomTypeLabel =
    roomTypeOptions.find((option) => option.value === roomType)?.label || 'Any Type';

  const handleSubmit = async () => {
    const nextErrors = {};
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const validRoomTypes = new Set(roomTypeOptions.map((option) => option.value));

    if (!checkIn || Number.isNaN(checkInDate.getTime())) {
      nextErrors.checkIn = 'Use a valid check-in date in YYYY-MM-DD format.';
    } else if (!isFutureOrToday(checkIn)) {
      nextErrors.checkIn = 'Check-in date cannot be in the past.';
    }

    if (!checkOut || Number.isNaN(checkOutDate.getTime())) {
      nextErrors.checkOut = 'Use a valid check-out date in YYYY-MM-DD format.';
    } else if (!nextErrors.checkIn && !isDateAfter(checkIn, checkOut)) {
      nextErrors.checkOut = 'Check-out date must be after check-in.';
    }

    if (!isPositiveInteger(guests)) {
      nextErrors.guests = 'At least one guest is required.';
    }

    if (!validRoomTypes.has(roomType)) {
      nextErrors.roomType = 'Please choose a valid room type.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);
      const normalizedRoomType = roomType.trim();
      const payload = {
        checkIn,
        checkOut,
        guests: String(guests),
        roomType: normalizedRoomType,
      };

      console.log('[RoomAvailability] Submit payload', payload);

      await onCheckAvailability?.(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppCard style={styles.card}>
      <View style={styles.headerWrap}>
        <SectionHeader
          eyebrow="Room Availability"
          title="Check available rooms"
          subtitle="Enter your stay dates, guest count, and room type to open matching room results."
        />
        <View style={styles.helperBanner}>
          <MaterialCommunityIcons
            name="information-outline"
            size={18}
            color={theme.colors.primary}
          />
          <Text style={styles.helperText}>
            Use the date format <Text style={styles.helperTextStrong}>YYYY-MM-DD</Text>. Tap
            <Text style={styles.helperTextStrong}> Check Availability</Text> to open the filtered
            room list.
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.fieldHalf}>
          <DatePickerField
            label="Check-In"
            value={checkIn}
            onChange={setCheckIn}
            placeholder="YYYY-MM-DD"
            minimumDate={toIsoDate(new Date())}
            error={errors.checkIn}
          />
        </View>

        <View style={styles.fieldHalf}>
          <DatePickerField
            label="Check-Out"
            value={checkOut}
            onChange={setCheckOut}
            placeholder="YYYY-MM-DD"
            minimumDate={checkIn || toIsoDate(new Date())}
            error={errors.checkOut}
          />
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.fieldHalf}>
          <View style={styles.guestField}>
            <Text style={styles.inputLabel}>Guests</Text>
            <GuestCounter value={guests} max={10} onChange={setGuests} />
            {errors.guests ? <Text style={styles.fieldError}>{errors.guests}</Text> : null}
          </View>
        </View>

        <View style={styles.fieldHalf}>
          <AppSelectField
            label="Room Type"
            value={roomType}
            options={roomTypeOptions}
            placeholder="Any Type"
            onChange={setRoomType}
            error={errors.roomType}
          />
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <MaterialCommunityIcons name="calendar-range" size={16} color={theme.colors.accent} />
            <Text style={styles.summaryLabel}>Stay</Text>
            <Text style={styles.summaryValue}>
              {checkIn} {'->'} {checkOut}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <MaterialCommunityIcons name="weather-night" size={16} color={theme.colors.accent} />
            <Text style={styles.summaryLabel}>Nights</Text>
            <Text style={styles.summaryValue}>
              {nights > 0 ? `${nights} night${nights > 1 ? 's' : ''}` : 'Select valid dates'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={16}
              color={theme.colors.accent}
            />
            <Text style={styles.summaryLabel}>Guests</Text>
            <Text style={styles.summaryValue}>{guests}</Text>
          </View>

          <View style={styles.summaryRow}>
            <MaterialCommunityIcons name="bed-queen-outline" size={16} color={theme.colors.accent} />
            <Text style={styles.summaryLabel}>Room Type</Text>
            <Text style={styles.summaryValue}>{selectedRoomTypeLabel}</Text>
          </View>
        </View>

        <View style={styles.buttonWrap}>
          <AppButton
            title={submitting ? 'Checking Availability...' : 'Check Availability'}
            onPress={handleSubmit}
            disabled={submitting}
          />
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.lg,
    backgroundColor: '#F7FAFE',
    borderColor: '#D9E5F2',
    borderRadius: 28,
    shadowColor: '#173B6C',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  headerWrap: {
    gap: theme.spacing.sm,
  },
  helperBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    borderRadius: 18,
    backgroundColor: '#EDF4FC',
    borderWidth: 1,
    borderColor: '#C9D7EC',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  helperText: {
    flex: 1,
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  helperTextStrong: {
    fontWeight: '800',
    color: theme.colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  fieldHalf: {
    flex: 1,
    minWidth: '47%',
  },
  guestField: {
    gap: theme.spacing.sm,
  },
  inputLabel: {
    color: theme.colors.primary,
    ...theme.typography.label,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fieldError: {
    color: theme.colors.errorText,
    ...theme.typography.bodySmall,
  },
  footerRow: {
    gap: theme.spacing.md,
  },
  summaryCard: {
    gap: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: '#EEF5FC',
    borderWidth: 1,
    borderColor: '#D7E3F0',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  summaryLabel: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
    minWidth: 68,
  },
  summaryValue: {
    flex: 1,
    color: theme.colors.text,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  buttonWrap: {
    width: '100%',
  },
});
