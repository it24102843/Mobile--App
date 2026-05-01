import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../AppButton';
import { theme } from '../../theme';

function formatSummaryValue(value) {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (typeof value === 'number') {
    return `LKR ${new Intl.NumberFormat('en-LK').format(value)}`;
  }

  return String(value);
}

export function BookingSuccessModal({
  visible,
  bookingId,
  serviceType,
  totalAmount,
  date,
  onViewBookings,
  onClose,
  title = 'Booking Confirmed',
  message = 'Your reservation has been successfully completed.',
}) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.5)).current;

  const summaryRows = useMemo(
    () =>
      [
        serviceType ? { label: 'Service', value: serviceType } : null,
        date ? { label: 'Date', value: date } : null,
        totalAmount !== undefined && totalAmount !== null && totalAmount !== ''
          ? { label: 'Total', value: formatSummaryValue(totalAmount) }
          : null,
      ].filter(Boolean),
    [date, serviceType, totalAmount]
  );

  useEffect(() => {
    if (!visible) {
      overlayOpacity.setValue(0);
      cardScale.setValue(0.92);
      cardOpacity.setValue(0);
      iconScale.setValue(0.5);
      return;
    }

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 75,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.spring(iconScale, {
      toValue: 1,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [cardOpacity, cardScale, iconScale, overlayOpacity, visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Animated.View
          style={[
            styles.modalCard,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSubtle} />
          </Pressable>

          <Animated.View style={[styles.iconShell, { transform: [{ scale: iconScale }] }]}>
            <MaterialCommunityIcons name="check-circle" size={58} color={theme.colors.success} />
          </Animated.View>

          <Text style={styles.eyebrow}>Success</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {bookingId ? (
            <View style={styles.bookingIdBox}>
              <Text style={styles.bookingIdLabel}>Booking ID</Text>
              <Text style={styles.bookingIdValue}>{bookingId}</Text>
            </View>
          ) : null}

          {summaryRows.length ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              {summaryRows.map((row) => (
                <View key={row.label} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{row.label}</Text>
                  <Text style={styles.summaryValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.actions}>
            <AppButton title="View My Bookings" onPress={onViewBookings} />
            <AppButton title="Close" variant="secondary" onPress={onClose} />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 17, 33, 0.54)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 430,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: 30,
    paddingBottom: theme.spacing.xxl,
    alignItems: 'center',
    ...theme.shadows.card,
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F8FC',
  },
  iconShell: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.successSurface,
    borderWidth: 1,
    borderColor: '#CFEFE0',
    marginBottom: theme.spacing.lg,
  },
  eyebrow: {
    color: theme.colors.accent,
    ...theme.typography.eyebrow,
    textAlign: 'center',
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.screenTitle,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  message: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    maxWidth: 290,
  },
  bookingIdBox: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F2D39D',
    backgroundColor: '#FFF7E7',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.xl,
  },
  bookingIdLabel: {
    color: theme.colors.warningText,
    ...theme.typography.eyebrow,
    textAlign: 'center',
  },
  bookingIdValue: {
    color: theme.colors.accent,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    marginTop: theme.spacing.xl,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DCE6F3',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  summaryTitle: {
    color: theme.colors.primary,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  summaryLabel: {
    color: theme.colors.textSubtle,
    ...theme.typography.bodySmall,
    flex: 1,
  },
  summaryValue: {
    color: theme.colors.text,
    ...theme.typography.bodySmall,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  actions: {
    width: '100%',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
});
