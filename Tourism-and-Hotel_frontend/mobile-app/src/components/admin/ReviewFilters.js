import { StyleSheet, View } from 'react-native';

import { PackageFilters } from './PackageFilters';

export function ReviewFilters({
  statusFilters,
  ratingFilters,
  activeStatus,
  activeRating,
  onChangeStatus,
  onChangeRating,
}) {
  return (
    <View style={styles.wrapper}>
      <PackageFilters
        title="Review Status"
        options={statusFilters}
        activeValue={activeStatus}
        onChange={onChangeStatus}
      />
      <PackageFilters
        title="Rating"
        options={ratingFilters}
        activeValue={activeRating}
        onChange={onChangeRating}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
  },
});
