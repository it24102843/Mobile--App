import { StyleSheet, View } from 'react-native';

import { PackageFilters } from './PackageFilters';

export function PackageBookingFilters({ filters, activeFilter, onChange }) {
  return (
    <View style={styles.wrapper}>
      <PackageFilters
        title="Status"
        options={filters}
        activeValue={activeFilter}
        onChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
});
