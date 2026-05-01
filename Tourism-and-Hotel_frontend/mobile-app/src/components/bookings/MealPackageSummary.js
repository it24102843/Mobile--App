import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../theme';

function formatCurrency(value) {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Number(value || 0))}`;
}

function MealRow({ icon, label, amount, emphasized = false }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabelWrap}>
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={emphasized ? theme.colors.accent : theme.colors.primary}
        />
        <Text style={[styles.rowLabel, emphasized ? styles.rowLabelEmphasized : null]}>{label}</Text>
      </View>
      <Text style={[styles.rowAmount, emphasized ? styles.rowAmountEmphasized : null]}>{amount}</Text>
    </View>
  );
}

export function MealPackageSummary({
  mealPackage,
  breakfastSelected: breakfastSelectedProp,
  lunchSelected: lunchSelectedProp,
  price,
}) {
  const breakfastSelected =
    typeof breakfastSelectedProp === 'boolean'
      ? breakfastSelectedProp
      : Boolean(mealPackage?.breakfast);
  const lunchSelected =
    typeof lunchSelectedProp === 'boolean' ? lunchSelectedProp : Boolean(mealPackage?.lunch);
  const totalPrice = Number(price ?? mealPackage?.price ?? 0);

  if (!breakfastSelected && !lunchSelected) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name="silverware-fork-knife"
            size={18}
            color={theme.colors.accent}
          />
        </View>
        <Text style={styles.title}>Meal Package</Text>
      </View>

      <View style={styles.rowsWrap}>
        {breakfastSelected ? (
          <MealRow icon="egg-fried" label="Breakfast" amount={formatCurrency(550)} />
        ) : null}
        {lunchSelected ? (
          <MealRow icon="food" label="Lunch" amount={formatCurrency(650)} />
        ) : null}
        {breakfastSelected && lunchSelected ? (
          <View style={styles.totalDivider}>
            <MealRow
              icon="plus-circle-outline"
              label="Total"
              amount={formatCurrency(totalPrice)}
              emphasized
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#F2D39D',
    backgroundColor: '#FFF8E8',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1D6',
  },
  title: {
    color: theme.colors.warningText,
    ...theme.typography.eyebrow,
    fontWeight: '800',
  },
  rowsWrap: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  rowLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  rowLabel: {
    color: theme.colors.text,
    ...theme.typography.body,
    flexShrink: 1,
  },
  rowLabelEmphasized: {
    fontWeight: '800',
  },
  rowAmount: {
    color: theme.colors.text,
    ...theme.typography.body,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 0,
  },
  rowAmountEmphasized: {
    color: theme.colors.accent,
    fontWeight: '800',
  },
  totalDivider: {
    borderTopWidth: 1,
    borderTopColor: '#EFD8A9',
    paddingTop: theme.spacing.sm,
  },
});
