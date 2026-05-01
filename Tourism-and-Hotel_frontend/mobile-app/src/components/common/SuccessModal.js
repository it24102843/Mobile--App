import { useEffect, useRef } from 'react';
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

export function SuccessModal({
  visible,
  title,
  message,
  bookingId,
  onPrimaryPress,
  onSecondaryPress,
  onClose,
  identifierLabel = 'Booking ID',
  primaryLabel = 'View My Bookings',
  secondaryLabel = 'Go Home',
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.94);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fadeAnim, scaleAnim, visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons
              name="close"
              size={22}
              color={theme.colors.textSubtle}
            />
          </Pressable>

          <View style={styles.iconShell}>
            <MaterialCommunityIcons
              name="check-circle"
              size={54}
              color={theme.colors.success}
            />
          </View>

          <Text style={styles.eyebrow}>Success</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {bookingId ? (
            <View style={styles.identifierBox}>
              <Text style={styles.identifierLabel}>{identifierLabel}</Text>
              <Text style={styles.identifierValue}>{bookingId}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <AppButton title={primaryLabel} onPress={onPrimaryPress} />
            {onSecondaryPress ? (
              <AppButton
                title={secondaryLabel}
                variant="secondary"
                onPress={onSecondaryPress}
              />
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 18, 32, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.card,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F8FC',
  },
  iconShell: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.successSurface,
    marginTop: theme.spacing.md,
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
    maxWidth: 280,
  },
  identifierBox: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F2D39D',
    backgroundColor: '#FFF6E4',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.xl,
  },
  identifierLabel: {
    color: theme.colors.warningText,
    ...theme.typography.eyebrow,
    textAlign: 'center',
  },
  identifierValue: {
    color: theme.colors.accent,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
});
