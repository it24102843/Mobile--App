import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '../theme';

const buttonVariants = theme.components.button.variants;

export function AppButton({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
}) {
  const selectedVariant = buttonVariants[variant] || buttonVariants.primary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: selectedVariant.backgroundColor,
          borderColor: selectedVariant.borderColor,
        },
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}>
      <Text style={[styles.text, { color: selectedVariant.textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: theme.components.button.minHeight,
    borderRadius: theme.components.button.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: theme.components.button.paddingHorizontal,
    ...theme.shadows.subtle,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ translateY: 1 }],
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});
