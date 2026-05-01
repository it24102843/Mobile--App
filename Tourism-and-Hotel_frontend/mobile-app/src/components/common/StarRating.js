import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

export function StarRating({ rating = 0, size = 18, color = theme.colors.accent, max = 5 }) {
  const safeRating = Math.max(0, Math.min(Number(rating) || 0, max));

  return (
    <View style={styles.row}>
      {Array.from({ length: max }, (_, index) => {
        const starIndex = index + 1;
        const filled = safeRating >= starIndex;
        const halfFilled = !filled && safeRating >= starIndex - 0.5;

        return (
          <MaterialCommunityIcons
            key={`star-${starIndex}`}
            name={filled ? 'star' : halfFilled ? 'star-half-full' : 'star-outline'}
            size={size}
            color={color}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
