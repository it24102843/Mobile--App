import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { RoomGallery } from '../../components/rooms/RoomGallery';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminPackageById } from '../../services/adminPackagesApi';
import { theme } from '../../theme';

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelWrap}>
        <MaterialCommunityIcons name={icon} size={18} color={theme.colors.primary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value || 'Not available'}</Text>
    </View>
  );
}

function BulletList({ items, icon = 'check-circle-outline', accentColor = theme.colors.accent }) {
  return (
    <View style={styles.bulletWrap}>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.bulletRow}>
          <MaterialCommunityIcons name={icon} size={18} color={accentColor} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PackageDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();
  const packageId = typeof params.packageId === 'string' ? params.packageId : '';
  const [state, setState] = useState({
    loading: true,
    error: null,
    item: null,
  });

  useEffect(() => {
    let mounted = true;

    async function loadPackage() {
      if (!token || !packageId) {
        return;
      }

      try {
        const item = await fetchAdminPackageById(token, packageId);

        if (mounted) {
          setState({ loading: false, error: null, item });
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            error: error instanceof Error ? error.message : 'Unable to load this package.',
            item: null,
          });
        }
      }
    }

    void loadPackage();

    return () => {
      mounted = false;
    };
  }, [packageId, token]);

  if (state.loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader title="Package Details" subtitle="Loading package details..." fallbackHref="/admin/packages" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (state.error || !state.item) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ScreenHeader title="Package Details" subtitle="We could not load this package." fallbackHref="/admin/packages" />
          <AppCard variant="danger">
            <Text style={styles.errorText}>{state.error || 'Package details are unavailable.'}</Text>
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const item = state.item;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={item.name} subtitle={item.packageId} fallbackHref="/admin/packages" />

        <RoomGallery images={item.imageGallery} />

        <AppCard style={styles.identityCard}>
          <View style={styles.badgeRow}>
            <StatusBadge label={item.category} variant="accent" />
            <StatusBadge label={item.availabilityLabel} variant={item.availabilityVariant} />
            <StatusBadge label={item.customizationLabel} variant="info" />
          </View>

          <Text style={styles.packageTitle}>{item.name}</Text>
          <Text style={styles.packageBody}>{item.description}</Text>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Package Details</Text>
          <InfoRow icon="calendar-range" label="Duration" value={item.durationLabel} />
          <InfoRow icon="cash-multiple" label="Price" value={item.priceLabel} />
          <InfoRow icon="account-group-outline" label="Group Size" value={item.maxGroupLabel} />
          <InfoRow icon="map-marker-path" label="Meeting Point" value={item.meetingPoint} />
          <InfoRow icon="star-outline" label="Rating" value={`${item.rating} / 5`} />
        </AppCard>

        {item.highlights.length ? (
          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Highlights</Text>
            <BulletList items={item.highlights} />
          </AppCard>
        ) : null}

        {item.includes.length ? (
          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Included Services</Text>
            <BulletList items={item.includes} icon="check-circle-outline" accentColor={theme.colors.primary} />
          </AppCard>
        ) : null}

        {item.excludes.length ? (
          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Excluded Services</Text>
            <BulletList items={item.excludes} icon="close-circle-outline" accentColor={theme.colors.danger} />
          </AppCard>
        ) : null}

        <View style={styles.actionRow}>
          <View style={styles.flexAction}>
            <AppButton title="Back to Packages" variant="secondary" onPress={() => router.push('/admin/packages')} />
          </View>
          <View style={styles.flexAction}>
            <AppButton title="Edit Package" variant="info" onPress={() => router.push(`/admin/packages-edit/${item.packageId}`)} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  identityCard: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  packageTitle: {
    color: '#2E2419',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  packageBody: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  sectionCard: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  sectionTitle: {
    color: '#2E2419',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  infoLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  infoValue: {
    color: theme.colors.text,
    ...theme.typography.bodySmall,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  bulletWrap: {
    gap: theme.spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  bulletText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flexAction: {
    flex: 1,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
