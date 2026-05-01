import { StyleSheet, View } from 'react-native';

import { PackageFilters } from './PackageFilters';

export function UserFilters({
  roleOptions,
  statusOptions,
  activeRole,
  activeStatus,
  onChangeRole,
  onChangeStatus,
}) {
  return (
    <View style={styles.wrapper}>
      <PackageFilters
        title="Role"
        options={roleOptions}
        activeValue={activeRole}
        onChange={onChangeRole}
      />
      <PackageFilters
        title="Account Status"
        options={statusOptions}
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
