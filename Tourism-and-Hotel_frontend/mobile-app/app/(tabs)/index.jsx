import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { AppButton } from '../../src/components/AppButton';
import { AppCard } from '../../src/components/AppCard';
import { BrandLogo } from '../../src/components/BrandLogo';
import { FeatureShowcaseCard } from '../../src/components/FeatureShowcaseCard';
import { SectionHeader } from '../../src/components/SectionHeader';
import { ServiceCard } from '../../src/components/ServiceCard';
import { HeroCarousel } from '../../src/components/home/HeroCarousel';
import { HomeSectionState } from '../../src/components/home/HomeSectionState';
import { QuickBookingCard } from '../../src/components/home/QuickBookingCard';
import { RoomAvailabilityCard } from '../../src/components/home/RoomAvailabilityCard';
import { ReviewCarousel } from '../../src/components/home/ReviewCarousel';
import { services } from '../../src/config/services';
import { useAuth, useRequireAuth } from '../../src/hooks/useAuth';
import { useHomeData } from '../../src/hooks/useHomeData';
import { theme } from '../../src/theme';

const HOME_BACKGROUND = '#F8F3EA';

function chunkServices(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

const serviceRows = chunkServices(services, 2);

export default function LandingScreen() {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const { user, isAuthenticated } = useAuth();
  const { sections, heroSlides, reloadHomeData, reloadReviews } = useHomeData();
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef(null);
  const roomAvailabilityY = useRef(0);

  useFocusEffect(
    useCallback(() => {
      reloadReviews();
    }, [reloadReviews])
  );

  const headerChips = useMemo(
    () => [
      {
        key: 'auth',
        icon: isAuthenticated ? 'shield-check-outline' : 'compass-outline',
        label: isAuthenticated ? 'Bookings enabled' : 'Guest browsing',
      },
      {
        key: 'hotels',
        icon: 'office-building-outline',
        label: `${sections.hotels.data.length} hotels`,
      },
      {
        key: 'rooms',
        icon: 'bed-king-outline',
        label: `${sections.rooms.data.length} stays`,
      },
      {
        key: 'packages',
        icon: 'map-search-outline',
        label: `${sections.packages.data.length} packages`,
      },
      {
        key: 'reviews',
        icon: 'star-outline',
        label: `${sections.reviews.data.length} reviews`,
      },
    ],
    [
      isAuthenticated,
      sections.hotels.data.length,
      sections.packages.data.length,
      sections.reviews.data.length,
      sections.rooms.data.length,
    ]
  );

  const refreshHome = async () => {
    try {
      setRefreshing(true);
      await reloadHomeData();
    } finally {
      setRefreshing(false);
    }
  };

  const normalizePreviewRoute = (route) => {
    if (!route) {
      return '/(tabs)';
    }

    if (route.startsWith('/packages/')) {
      return '/packages';
    }

    if (route.startsWith('/vehicles/')) {
      return '/vehicles';
    }

    if (route.startsWith('/gear-rental/')) {
      return '/gear-rental';
    }

    return route;
  };

  const handleNavigation = (route, options = {}) => {
    const normalizedRoute = normalizePreviewRoute(route);

    if (options.protectedRoute && !requireAuth(normalizedRoute)) {
      return;
    }

    router.push(normalizedRoute);
  };

  const handleRoomAvailabilityCheck = ({ checkIn, checkOut, guests, roomType }) => {
    const normalizedRoomType = `${roomType ?? ''}`.trim();
    const nextParams = {
      checkIn,
      checkOut,
      guests: String(Number.parseInt(guests, 10) || 1),
      roomType: normalizedRoomType,
    };

    console.log('[Home] Room availability params', nextParams);

    router.push({
      pathname: '/rooms',
      params: nextParams,
    });
  };

  const scrollToRoomAvailability = () => {
    scrollViewRef.current?.scrollTo({
      y: Math.max(roomAvailabilityY.current - theme.spacing.lg, 0),
      animated: true,
    });
  };

  const renderPreviewSection = ({
    eyebrow,
    title,
    subtitle,
    actionLabel,
    actionRoute,
    section,
    emptyMessage,
    routeFallback,
  }) => (
    <View style={styles.sectionBlock}>
      <AppCard variant="subtle" style={styles.sectionPanel}>
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          actionLabel={actionLabel}
          onActionPress={() => handleNavigation(actionRoute || routeFallback)}
        />

        {section.loading ? <HomeSectionState loading /> : null}

        {!section.loading && section.error && !section.data.length ? (
          <HomeSectionState
            message="We couldn't load this section right now. Pull down to refresh and try again."
            icon="cloud-alert-outline"
          />
        ) : null}

        {!section.loading && !section.error && !section.data.length ? (
          <HomeSectionState message={emptyMessage} />
        ) : null}

        {!section.loading && section.data.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}>
            {section.data.slice(0, 6).map((item) => (
              <FeatureShowcaseCard
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                description={item.description}
                price={item.priceLabel}
                badge={item.badgeLabel}
                icon="image-outline"
                imageUrl={item.imageUrl}
                metaLabel={item.metaLabel}
                accent={item.badgeVariant || 'primary'}
                onPress={() => handleNavigation(item.route || routeFallback)}
              />
            ))}
          </ScrollView>
        ) : null}
      </AppCard>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            tintColor={theme.colors.accent}
            refreshing={refreshing}
            onRefresh={() => void refreshHome()}
          />
        }
        showsVerticalScrollIndicator={false}>
        <View style={styles.topShell}>
          <View style={styles.headerHeroCard}>
            <View style={styles.headerRow}>
              <View style={styles.brandBlock}>
                <BrandLogo size="sm" pressable href="/(tabs)" />
              </View>

              <View style={styles.headerActionCluster}>
                <Pressable
                  onPress={() => handleNavigation('/(tabs)/profile')}
                  style={styles.heroIconButton}>
                  <MaterialCommunityIcons
                    name="cog-outline"
                    size={22}
                    color={theme.colors.textOnDark}
                  />
                </Pressable>
                <Pressable
                  onPress={() => handleNavigation('/(tabs)/profile')}
                  style={styles.heroIconButton}>
                  <MaterialCommunityIcons
                    name="account-circle-outline"
                    size={22}
                    color={theme.colors.textOnDark}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.headerGreetingBlock}>
              <Text style={styles.headerEyebrow}>WILDHAVEN RESORT & SAFARI</Text>
              <Text style={styles.headerTitle}>
                Hello {user?.firstName ?? 'John'}
              </Text>
              <Text style={styles.headerSubtitle}>
                Book rooms, safaris, gear, food and travel experiences in one place.
              </Text>
            </View>
          </View>

          <View style={styles.headerChipRow}>
            {headerChips.map((chip) => (
              <View key={chip.key} style={styles.headerChip}>
                <MaterialCommunityIcons
                  name={chip.icon}
                  size={16}
                  color={theme.colors.accent}
                />
                <Text style={styles.headerChipText}>{chip.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.headerActionRow}>
            <View style={styles.headerActionButton}>
              <AppButton title="View Rooms" onPress={() => handleNavigation('/rooms')} />
            </View>
            <View style={styles.headerActionButton}>
              <AppButton
                title="My Bookings"
                variant="secondary"
                onPress={() =>
                  handleNavigation('/my-bookings', {
                    protectedRoute: true,
                  })
                }
              />
            </View>
          </View>

          <HeroCarousel
            slides={heroSlides}
            loading={false}
            onPressSlide={(slide) => handleNavigation(slide.route)}
          />
        </View>

        <View style={styles.quickBookingWrap}>
          <QuickBookingCard onPressSearch={scrollToRoomAvailability} />
        </View>

        <View style={styles.sectionBlock}>
          <AppCard variant="subtle" style={styles.sectionPanel}>
            <SectionHeader
              eyebrow="Main Services"
              title="Explore every WildHaven service"
              subtitle="Browse the same connected rooms, stays, safari, dining, and booking modules available across your platform."
              actionLabel="Browse"
            />

            <View style={styles.servicesGrid}>
              {serviceRows.map((row, rowIndex) => (
                <View key={`services-row-${rowIndex}`} style={styles.servicesRow}>
                  {row.map((service) => (
                    <ServiceCard
                      key={service.id}
                      title={service.title}
                      description={service.description}
                      icon={service.icon}
                      accent={service.accent}
                      onPress={() =>
                        handleNavigation(service.route, {
                          protectedRoute: service.id === 'my-bookings',
                        })
                      }
                    />
                  ))}
                  {row.length === 1 ? <View style={styles.serviceSpacer} /> : null}
                </View>
              ))}
            </View>
          </AppCard>
        </View>

        {renderPreviewSection({
          eyebrow: 'Featured Hotels',
          title: 'Signature WildHaven stays',
          subtitle: 'Real hotel data with location details, resort imagery, and backend-driven content.',
          actionLabel: 'Explore hotels',
          actionRoute: '/hotels',
          section: sections.hotels,
          emptyMessage: 'No hotel data is available right now.',
          routeFallback: '/hotels',
        })}

        <View
          style={styles.sectionBlock}
          onLayout={(event) => {
            roomAvailabilityY.current = event.nativeEvent.layout.y;
          }}>
          <RoomAvailabilityCard
            rooms={sections.rooms.data}
            onCheckAvailability={handleRoomAvailabilityCheck}
          />
        </View>

        {renderPreviewSection({
          eyebrow: 'Hotels & Rooms',
          title: 'Popular room stays',
          subtitle: 'Powered by real room records from your backend, with room images and pricing.',
          actionLabel: 'View rooms',
          actionRoute: '/rooms',
          section: sections.rooms,
          emptyMessage: 'No room data is available right now.',
          routeFallback: '/rooms',
        })}

        {renderPreviewSection({
          eyebrow: 'Safari Packages',
          title: 'Curated safari packages',
          subtitle: 'Live package content from the backend with imagery, pricing, and trip details.',
          actionLabel: 'View packages',
          actionRoute: '/packages',
          section: sections.packages,
          emptyMessage: 'No safari packages are available right now.',
          routeFallback: '/packages',
        })}

        {renderPreviewSection({
          eyebrow: 'Safari Vehicles',
          title: 'Ride into the wild',
          subtitle: 'Real safari vehicle data with visuals, seating, and daily pricing.',
          actionLabel: 'View vehicles',
          actionRoute: '/vehicles',
          section: sections.vehicles,
          emptyMessage: 'No safari vehicles are available right now.',
          routeFallback: '/vehicles',
        })}

        {renderPreviewSection({
          eyebrow: 'Equipment Rental',
          title: 'Gear ready for adventure',
          subtitle: 'Image-rich rentable product data from the existing backend product module.',
          actionLabel: 'View gear',
          actionRoute: '/gear-rental',
          section: sections.gear,
          emptyMessage: 'No rentable equipment is available right now.',
          routeFallback: '/gear-rental',
        })}

        {renderPreviewSection({
          eyebrow: 'Restaurant Favorites',
          title: 'Signature dining selections',
          subtitle: 'Restaurant food items and dining experiences pulled from the backend with real images and prices.',
          actionLabel: 'Restaurants',
          actionRoute: '/restaurants',
          section: sections.restaurantFoods,
          emptyMessage: 'No restaurant food items are available right now.',
          routeFallback: '/restaurants',
        })}

        <View style={styles.sectionBlock}>
          <AppCard variant="subtle" style={styles.sectionPanel}>
            <SectionHeader
              eyebrow="Customer Reviews"
              title="Guest voices and impressions"
              subtitle="Approved public reviews from your backend review module."
              actionLabel="See reviews"
              onActionPress={() => handleNavigation('/reviews')}
            />

            {sections.reviews.loading ? <HomeSectionState loading /> : null}

            {!sections.reviews.loading && !sections.reviews.data.length ? (
              <HomeSectionState message="No approved reviews are available yet." />
            ) : null}

            {!sections.reviews.loading && sections.reviews.data.length ? (
              <ReviewCarousel
                reviews={sections.reviews.data.slice(0, 8)}
                onPressReview={(review) => handleNavigation(`/reviews/${review.id}`)}
              />
            ) : null}
          </AppCard>
        </View>

        <AppCard variant="info" style={styles.promoBanner}>
          <View style={styles.promoIconWrap}>
            <MaterialCommunityIcons
              name="ticket-percent-outline"
              size={28}
              color={theme.colors.info}
            />
          </View>

          <Text style={styles.promoEyebrow}>WildHaven Promotion</Text>
          <Text style={styles.promoTitle}>Create your perfect resort-and-safari plan</Text>
          <Text style={styles.promoText}>
            Build a premium client-ready booking experience with rooms, vehicles,
            packages, gear rental, and contact services all connected through the same
            mobile flow.
          </Text>

          <AppButton
            title="Plan My Experience"
            variant="info"
            onPress={() => handleNavigation('/packages')}
          />
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: HOME_BACKGROUND,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.xl,
  },
  topShell: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    gap: theme.spacing.xl,
  },
  headerHeroCard: {
    borderRadius: theme.radii.xl,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  brandBlock: {
    flexShrink: 0,
  },
  headerEyebrow: {
    color: '#E7C37B',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  headerGreetingBlock: {
    gap: theme.spacing.sm,
  },
  headerTitle: {
    color: theme.colors.textOnDark,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#D7E3F3',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    maxWidth: '100%',
  },
  headerActionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  heroIconButton: {
    width: 46,
    height: 46,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  headerActionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  headerActionButton: {
    flex: 1,
  },
  headerChip: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  headerChipText: {
    color: theme.colors.textOnDark,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  sectionBlock: {
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    gap: theme.spacing.lg,
  },
  sectionPanel: {
    gap: theme.spacing.lg,
    backgroundColor: '#FCF9F3',
    borderColor: '#EADFCB',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  quickBookingWrap: {
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    marginTop: -32,
  },
  servicesGrid: {
    gap: theme.spacing.md,
  },
  servicesRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  serviceSpacer: {
    flex: 1,
  },
  horizontalList: {
    paddingRight: theme.spacing.md,
  },
  promoBanner: {
    marginHorizontal: theme.layout.screenPaddingHorizontal,
    gap: theme.spacing.md,
  },
  promoIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.infoBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoEyebrow: {
    color: theme.colors.info,
    ...theme.typography.eyebrow,
  },
  promoTitle: {
    color: theme.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  promoText: {
    color: theme.colors.infoText,
    ...theme.typography.body,
  },
});
