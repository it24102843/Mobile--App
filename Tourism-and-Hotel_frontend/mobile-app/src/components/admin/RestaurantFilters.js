import { StyleSheet, View } from 'react-native';

import { PackageFilters } from './PackageFilters';

export function RestaurantFilters({
  statusFilters,
  activeStatus,
  onChangeStatus,
}) {
  return (
    <View style={styles.wrapper}>
      <PackageFilters
        title="Restaurant Status"
        options={statusFilters}
        activeValue={activeStatus}
        onChange={onChangeStatus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
  },
});
