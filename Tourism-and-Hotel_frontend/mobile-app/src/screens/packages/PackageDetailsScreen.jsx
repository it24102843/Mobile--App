import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useRequireAuth } from '../../hooks/useAuth';
import { fetchPackageById } from '../../services/packagesApi';
import { theme } from '../../theme';

function MetaPill({ icon, label }) {
  return (
    <View style={styles.metaPill}>
      <MaterialCommunityIcons name={icon} size={16} color={theme.colors.primary} />
      <Text style={styles.metaPillText}>{label}</Text>
    </View>
  );
}

function DetailSection({ title, items, icon = 'check-circle-outline', color = theme.colors.accent }) {
  if (!items?.length) {
    return null;
  }

  return (
    <AppCard style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.bulletWrap}>
        {items.map((item, index) => (
          <View key={`${title}-${index}`} style={styles.bulletRow}>
            <MaterialCommunityIcons name={icon} size={18} color={color} />
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </View>
    </AppCard>
  );
}

export default function PackageDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const packageId = typeof params.packageId === 'string' ? params.packageId : '';
  const [state, setState] = useState({
    loading: true,
    error: null,
    pkg: null,
  });

  useEffect(() => {
    let mounted = true;

    async function loadPackage() {
      try {
        const pkg = await fetchPackageById(packageId);

        if (mounted) {
          setState({
            loading: false,
            error: null,
            pkg,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            error,
            pkg: null,
          });
        }
      }
    }

    loadPackage();

    return () => {
      mounted = false;
    };
  }, [packageId]);

  const handleBookPackage = () => {
    const targetPath = `/packages/${packageId}/book`;

    if (!requireAuth(targetPath, { message: 'Please login or sign up to book this package' })) {
      return;
    }

    router.push(targetPath);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Package Details"
          subtitle="Review the live backend package information before continuing into booking."
          fallbackHref="/packages"
        />

        {state.loading ? <HomeSectionState loading /> : null}

        {!state.loading && state.error ? (
          <AppCard variant="danger">
            <Text style={styles.errorText}>Unable to load this package right now. Please try again.</Text>
          </AppCard>
        ) : null}

        {!state.loading && state.pkg ? (
          <>
            <AppCard padded={false} style={styles.heroCard}>
              <Image source={{ uri: state.pkg.imageUrl }} style={styles.heroImage} contentFit="cover" />
              <View style={styles.heroOverlay}>
                <View style={styles.badgeRow}>
                  <StatusBadge label={state.pkg.category} variant="accent" />
                  <StatusBadge
                    label={state.pkg.availabilityLabel}
                    variant={state.pkg.availability ? 'primary' : 'warning'}
                  />
                </View>
                <Text style={styles.heroTitle}>{state.pkg.title}</Text>
                <Text style={styles.heroSubtitle}>{state.pkg.description}</Text>
              </View>
            </AppCard>

            <View style={styles.metaWrap}>
              <MetaPill icon="calendar-range" label={state.pkg.durationLabel} />
              <MetaPill icon="account-group-outline" label={state.pkg.maxGuestsLabel} />
              <MetaPill icon="map-marker-outline" label={state.pkg.locationLabel} />
            </View>

            <AppCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>About This Package</Text>
              <Text style={styles.bodyText}>{state.pkg.description}</Text>
            </AppCard>

            <DetailSection title="Highlights" items={state.pkg.highlights} />
            <DetailSection title="Included" items={state.pkg.includes} color={theme.colors.primary} />
            <DetailSection
              title="Not Included"
              items={state.pkg.excludes}
              icon="close-circle-outline"
              color={theme.colors.danger}
            />

            <AppCard variant="warning" style={styles.pricingCard}>
              <Text style={styles.pricingEyebrow}>Package Pricing</Text>
              <Text style={styles.pricingTitle}>{state.pkg.priceOnlyLabel}</Text>
              <Text style={styles.pricingSubtitle}>per traveler - real backend pricing</Text>
              <Text style={styles.bodyText}>
                {state.pkg.customizationEnabled
                  ? 'This package supports customization during booking and confirmation.'
                  : 'This package follows a fixed itinerary from the backend package setup.'}
              </Text>

              <View style={styles.actionRow}>
                <View style={styles.flexAction}>
                  <AppButton title="Browse More" variant="secondary" onPress={() => router.push('/packages')} />
                </View>
                <View style={styles.flexAction}>
                  <AppButton
                    title={state.pkg.availability ? 'Customize & Book' : 'Currently Unavailable'}
                    disabled={!state.pkg.availability}
                    onPress={handleBookPackage}
                  />
                </View>
              </View>
            </AppCard>
          </>
        ) : null}
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
    paddingVertical: theme.layout.screenPaddingVertical,
    gap: theme.spacing.xl,
  },
  heroCard: {
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 320,
    backgroundColor: '#E9EEF6',
  },
  heroOverlay: {
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  heroTitle: {
    color: theme.colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: '#E3D9C8',
    backgroundColor: '#FFFDF8',
  },
  metaPillText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  sectionCard: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  bodyText: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  bulletWrap: {
    gap: theme.spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  bulletText: {
    flex: 1,
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  pricingCard: {
    gap: theme.spacing.md,
  },
  pricingEyebrow: {
    color: '#A66A19',
    ...theme.typography.eyebrow,
  },
  pricingTitle: {
    color: theme.colors.text,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
  },
  pricingSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
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
