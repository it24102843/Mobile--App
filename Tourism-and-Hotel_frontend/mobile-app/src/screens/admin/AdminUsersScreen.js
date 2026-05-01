import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { AdminScreenWrapper } from '../../components/admin/AdminScreenWrapper';
import { UserAdminCard } from '../../components/admin/UserAdminCard';
import { UserFilters } from '../../components/admin/UserFilters';
import { UserForm } from '../../components/admin/UserForm';
import { useAuth } from '../../context/AuthContext';
import {
  deleteAdminUser,
  EDITABLE_USER_ROLES,
  fetchAdminUsers,
  updateAdminUser,
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
  toggleAdminUserBlock,
} from '../../services/adminUsersApi';
import { theme } from '../../theme';

const INITIAL_FORM_VALUES = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  profilePicture: '',
  role: 'customer',
};

function normalizeString(value) {
  return `${value ?? ''}`.trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(`${value ?? ''}`.trim());
}

function isValidPhone(value) {
  return /^\+?[0-9\-() ]{7,20}$/.test(`${value ?? ''}`.trim());
}

function isValidImageUrl(value) {
  const normalized = `${value ?? ''}`.trim();

  if (!normalized) {
    return true;
  }

  return /^https?:\/\//i.test(normalized);
}

function buildFormValues(user) {
  if (!user) {
    return INITIAL_FORM_VALUES;
  }

  return {
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    profilePicture: user.profilePicture || '',
    role: user.role || 'customer',
  };
}

function validateForm(values) {
  const errors = {};

  if (!values.firstName.trim()) {
    errors.firstName = 'First name is required.';
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(values.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!values.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!isValidPhone(values.phone)) {
    errors.phone = 'Please enter a valid phone number.';
  }

  if (!values.address.trim()) {
    errors.address = 'Address is required.';
  }

  if (!['admin', 'customer'].includes(values.role)) {
    errors.role = 'Select a valid role.';
  }

  if (!isValidImageUrl(values.profilePicture)) {
    errors.profilePicture = 'Image URL must start with http:// or https://';
  }

  return errors;
}

function StatCard({ label, value, icon, tone = 'primary' }) {
  const toneStyles = {
    primary: {
      iconBg: theme.colors.primarySoft,
      iconColor: theme.colors.primary,
      valueColor: theme.colors.primary,
    },
    success: {
      iconBg: theme.colors.successSurface,
      iconColor: theme.colors.successText,
      valueColor: theme.colors.successText,
    },
    warning: {
      iconBg: theme.colors.warningSurface,
      iconColor: theme.colors.warningText,
      valueColor: theme.colors.warningText,
    },
  };

  const currentTone = toneStyles[tone] || toneStyles.primary;

  return (
    <AppCard style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: currentTone.iconBg }]}>
        <MaterialCommunityIcons name={icon} size={22} color={currentTone.iconColor} />
      </View>
      <Text style={[styles.statValue, { color: currentTone.valueColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </AppCard>
  );
}

export default function AdminUsersScreen() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRole, setActiveRole] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
  const [formErrors, setFormErrors] = useState({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  useEffect(() => {
    void loadUsers();
  }, [token]);

  async function loadUsers(isRefresh = false) {
    if (!token) {
      return;
    }

    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetchAdminUsers(token);
      setUsers(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const normalizedQuery = normalizeString(searchQuery);

    return users.filter((user) => {
      const matchesSearch =
        !normalizedQuery ||
        [user.name, user.email, user.phone, user.roleLabel, user.userId].some((value) =>
          normalizeString(value).includes(normalizedQuery)
        );

      if (!matchesSearch) {
        return false;
      }

      if (activeRole !== 'all' && user.role !== activeRole) {
        return false;
      }

      if (activeStatus !== 'all' && user.statusLabel !== activeStatus) {
        return false;
      }

      return true;
    });
  }, [activeRole, activeStatus, searchQuery, users]);

  const summary = useMemo(() => {
    return users.reduce(
      (accumulator, user) => {
        accumulator.total += 1;
        if (user.role === 'admin') {
          accumulator.admins += 1;
        }
        if (!user.isBlocked) {
          accumulator.active += 1;
        }
        if (user.isBlocked) {
          accumulator.blocked += 1;
        }
        return accumulator;
      },
      { total: 0, admins: 0, active: 0, blocked: 0 }
    );
  }, [users]);

  function openEditModal(user) {
    setEditingUser(user);
    setFormValues(buildFormValues(user));
    setFormErrors({});
    setEditModalVisible(true);
  }

  function closeEditModal() {
    if (submittingEdit) {
      return;
    }

    setEditModalVisible(false);
    setEditingUser(null);
    setFormValues(INITIAL_FORM_VALUES);
    setFormErrors({});
  }

  function handleFormChange(field, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    setFormErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  async function handleSubmitEdit() {
    if (!editingUser) {
      return;
    }

    const validationErrors = validateForm(formValues);
    if (Object.keys(validationErrors).length) {
      setFormErrors(validationErrors);
      return;
    }

    try {
      setSubmittingEdit(true);
      const response = await updateAdminUser(token, editingUser.id, {
        firstName: formValues.firstName.trim(),
        lastName: formValues.lastName.trim(),
        email: formValues.email.trim().toLowerCase(),
        phone: formValues.phone.trim(),
        address: formValues.address.trim(),
        role: formValues.role,
        profilePicture: formValues.profilePicture.trim(),
      });

      Alert.alert(
        'User updated',
        response?.message ||
          (editingUser.email === currentUser?.email
            ? 'Your account was updated. Some profile changes may appear fully after your next login.'
            : 'The user account was updated successfully.')
      );
      closeEditModal();
      await loadUsers(true);
    } catch (submitError) {
      Alert.alert(
        'Update failed',
        submitError instanceof Error ? submitError.message : 'Unable to update this user.'
      );
    } finally {
      setSubmittingEdit(false);
    }
  }

  function confirmToggleBlock(user) {
    const actionLabel = user.isBlocked ? 'enable' : 'disable';

    Alert.alert(
      `${user.isBlocked ? 'Enable' : 'Disable'} user?`,
      `Do you want to ${actionLabel} access for ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: user.isBlocked ? 'Enable' : 'Disable',
          onPress: () => void handleToggleBlock(user),
        },
      ]
    );
  }

  async function handleToggleBlock(user) {
    try {
      setTogglingUserId(user.id);
      const response = await toggleAdminUserBlock(token, user.id);
      Alert.alert('User updated', response?.message || 'The user status was updated.');
      await loadUsers(true);
    } catch (toggleError) {
      Alert.alert(
        'Status update failed',
        toggleError instanceof Error
          ? toggleError.message
          : 'Unable to update the user status right now.'
      );
    } finally {
      setTogglingUserId(null);
    }
  }

  function confirmDelete(user) {
    Alert.alert('Delete user?', `Delete ${user.name} (${user.email}) from the system?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void handleDelete(user),
      },
    ]);
  }

  async function handleDelete(user) {
    try {
      setDeletingUserId(user.id);
      const response = await deleteAdminUser(token, user.id);
      Alert.alert('User deleted', response?.message || 'The user account was deleted.');
      await loadUsers(true);
    } catch (deleteError) {
      Alert.alert(
        'Delete failed',
        deleteError instanceof Error ? deleteError.message : 'Unable to delete this user.'
      );
    } finally {
      setDeletingUserId(null);
    }
  }

  function renderContent() {
    if (loading) {
      return (
        <AppCard style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.stateText}>Loading users from the backend...</Text>
        </AppCard>
      );
    }

    if (error) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Retry" onPress={() => void loadUsers()} />
        </AppCard>
      );
    }

    if (!filteredUsers.length) {
      return (
        <AppCard style={styles.stateCard}>
          <Text style={styles.stateTitle}>No users found</Text>
          <Text style={styles.stateText}>
            Try a different search term or filter to find matching user accounts.
          </Text>
        </AppCard>
      );
    }

    return filteredUsers.map((user) => (
      <UserAdminCard
        key={user.id}
        user={user}
        onEdit={() => openEditModal(user)}
        onToggleBlock={() => confirmToggleBlock(user)}
        onDelete={() => confirmDelete(user)}
        toggling={togglingUserId === user.id}
        deleting={deletingUserId === user.id}
        isCurrentUser={currentUser?.userId === user.id || currentUser?.email === user.email}
      />
    ));
  }

  return (
    <AdminScreenWrapper
      title="User Management"
      subtitle={`Monitor users and account access - ${summary.total} user(s)`}>
      <View style={styles.statsRow}>
        <StatCard label="Total Users" value={summary.total} icon="account-group-outline" />
        <StatCard label="Admins" value={summary.admins} icon="shield-account" tone="warning" />
        <StatCard label="Active" value={summary.active} icon="account-check-outline" tone="success" />
        <StatCard label="Blocked" value={summary.blocked} icon="account-off-outline" tone="warning" />
      </View>

      <AppCard style={styles.toolbarCard}>
        <View style={styles.toolbarHeader}>
          <View style={styles.totalBadge}>
            <MaterialCommunityIcons name="account-group-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.totalBadgeText}>{summary.total} Total Users</Text>
          </View>

          <View style={styles.refreshWrap}>
            <AppButton
              title={refreshing ? 'Refreshing...' : 'Refresh'}
              variant="secondary"
              onPress={() => void loadUsers(true)}
              disabled={refreshing}
            />
          </View>
        </View>

        <Text style={styles.helperText}>
          The current backend supports live user listing, edit, block/unblock, and delete.
          Admin-side user creation is not exposed yet, so this screen stays aligned to the real API.
        </Text>

        <AppTextField
          label="Search"
          placeholder="Search by name, email, phone, role, or user ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <UserFilters
          roleOptions={USER_ROLE_OPTIONS}
          statusOptions={USER_STATUS_OPTIONS}
          activeRole={activeRole}
          activeStatus={activeStatus}
          onChangeRole={setActiveRole}
          onChangeStatus={setActiveStatus}
        />
      </AppCard>

      <View style={styles.listWrap}>{renderContent()}</View>

      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={closeEditModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeEditModal} />

          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalCopy}>
                <Text style={styles.modalTitle}>Edit User</Text>
                <Text style={styles.modalSubtitle}>
                  Update account details and role for {editingUser?.name || 'this user'}.
                </Text>
              </View>

              <Pressable onPress={closeEditModal} style={styles.modalCloseButton}>
                <MaterialCommunityIcons name="close" size={22} color={theme.colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <UserForm
                values={formValues}
                errors={formErrors}
                roleOptions={EDITABLE_USER_ROLES}
                onChange={handleFormChange}
              />

              <View style={styles.modalActionRow}>
                <Pressable onPress={closeEditModal} style={({ pressed }) => [styles.modalGhostButton, pressed ? styles.pressed : null]}>
                  <Text style={styles.modalGhostButtonText}>Cancel</Text>
                </Pressable>

                <View style={styles.modalPrimaryWrap}>
                  <AppButton
                    title={submittingEdit ? 'Saving...' : 'Save Changes'}
                    variant="info"
                    onPress={() => void handleSubmitEdit()}
                    disabled={submittingEdit}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AdminScreenWrapper>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 145,
    gap: theme.spacing.sm,
  },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  statLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  toolbarCard: {
    gap: theme.spacing.lg,
  },
  toolbarHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.primaryMuted,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  totalBadgeText: {
    color: theme.colors.primary,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  refreshWrap: {
    minWidth: 140,
  },
  helperText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  listWrap: {
    gap: theme.spacing.lg,
  },
  stateCard: {
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  stateTitle: {
    color: '#13233E',
    ...theme.typography.sectionTitle,
  },
  stateText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    ...theme.typography.body,
  },
  errorText: {
    color: theme.colors.errorText,
    textAlign: 'center',
    ...theme.typography.body,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 18, 36, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    maxHeight: '90%',
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 54,
    height: 5,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.borderStrong,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  modalCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  modalTitle: {
    color: '#13233E',
    ...theme.typography.sectionTitle,
  },
  modalSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalContent: {
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalGhostButton: {
    flex: 1,
    minHeight: theme.components.button.minHeight,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  modalGhostButtonText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  modalPrimaryWrap: {
    flex: 1.4,
  },
  pressed: {
    opacity: 0.9,
  },
});
