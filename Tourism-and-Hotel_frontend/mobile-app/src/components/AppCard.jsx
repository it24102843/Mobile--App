import { StyleSheet, View } from 'react-native';

import { theme } from '../theme';

const cardVariants = theme.components.card.variants;

export function AppCard({
  children,
  style,
  variant = 'default',
  padded = true,
}) {
  const selectedVariant = cardVariants[variant] || cardVariants.default;

  return (
    <View
      style={[
        styles.base,
        padded ? styles.padded : null,
        selectedVariant,
        styles.shadow,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: theme.radii.xl,
  },
  padded: {
    padding: theme.components.card.padding,
  },
  shadow: {
    ...theme.shadows.card,
  },
});
