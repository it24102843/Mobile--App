import { StyleSheet, View } from 'react-native';

import { PackageFilters } from './PackageFilters';

export function PackageVehicleFilters({
  typeFilters,
  statusFilters,
  activeType,
  activeStatus,
  onChangeType,
  onChangeStatus,
}) {
  return (
    <View style={styles.wrapper}>
      <PackageFilters
        title="Vehicle Type"
        options={typeFilters}
        activeValue={activeType}
        onChange={onChangeType}
      />
      <PackageFilters
        title="Vehicle Status"
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
