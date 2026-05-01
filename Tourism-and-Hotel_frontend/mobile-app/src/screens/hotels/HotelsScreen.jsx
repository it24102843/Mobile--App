import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { fetchHotelsList } from '../../api/roomHotels';
import { AppCard } from '../../components/AppCard';
import { BrandLogo } from '../../components/BrandLogo';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { HotelCard } from '../../components/hotels/HotelCard';
import { theme } from '../../theme';

export default function HotelsScreen() {
  const router = useRouter();
  const [state, setState] = useState({
    loading: true,
    data: [],
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function loadHotels() {
      try {
        const hotels = await fetchHotelsList();

        if (mounted) {
          setState({
            loading: false,
            data: hotels,
            error: null,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            data: [],
            error,
          });
        }
      }
    }

    loadHotels();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Hotels"
          subtitle="Explore resort properties in the same premium style as your web room and hotel experience."
          fallbackHref="/(tabs)"
        />

        <AppCard variant="primary" style={styles.heroCard}>
          <BrandLogo size="sm" pressable href="/(tabs)" />
          <Text style={styles.heroTitle}>Discover Signature Stays</Text>
          <Text style={styles.heroSubtitle}>
            Browse real hotel data from your backend and open each property to view available rooms.
          </Text>
        </AppCard>

        {state.loading ? <HomeSectionState loading /> : null}

        {!state.loading && state.error ? (
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load hotels right now. Please check your backend connection and try again.
            </Text>
          </AppCard>
        ) : null}

        {!state.loading && !state.data.length ? (
          <HomeSectionState message="No hotels are available right now." />
        ) : null}

        {!state.loading &&
          state.data.map((hotel) => (
            <HotelCard
              key={hotel.id}
              title={hotel.title}
              location={hotel.subtitle}
              description={hotel.description}
              imageUrl={hotel.imageUrl}
              ratingLabel={hotel.ratingLabel}
              onPress={() => router.push(`/hotels/${hotel.id}`)}
            />
          ))}
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
  heroCard: {
    gap: theme.spacing.sm,
  },
  heroTitle: {
    color: theme.colors.textOnDark,
    ...theme.typography.screenTitle,
  },
  heroSubtitle: {
    color: '#DDE7F4',
    ...theme.typography.body,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
