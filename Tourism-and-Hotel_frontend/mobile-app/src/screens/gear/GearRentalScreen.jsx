import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { fetchGearProducts } from '../../api/gearRental';
import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { BrandLogo } from '../../components/BrandLogo';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { GearCartButton } from '../../components/gear/GearCartButton';
import { GearProductCard } from '../../components/gear/GearProductCard';
import { useGearCart } from '../../context/GearCartContext';
import { useRequireAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';

function getUniqueCategories(items) {
  return new Set(items.map((item) => item.category).filter(Boolean)).size;
}

export default function GearRentalScreen() {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const { addItem, totalItems } = useGearCart();
  const [search, setSearch] = useState('');
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: [],
  });

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        const data = await fetchGearProducts();

        if (mounted) {
          setState({
            loading: false,
            error: null,
            data,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            error,
            data: [],
          });
        }
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return state.data;
    }

    return state.data.filter((item) => {
      const haystack = [
        item.name,
        item.category,
        item.description,
        item.pickupLocation,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [search, state.data]);

  const handleAddToCart = (product) => {
    if (!requireAuth(`/gear-rental/${product.key}`)) {
      return;
    }

    addItem(product, 1);
    Alert.alert('Added to Cart', `${product.name} was added to your rental cart.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Gear Rental / Storage"
          subtitle="Browse real equipment stock, pricing, and pickup details from your backend."
          fallbackHref="/(tabs)"
        />

        <AppCard variant="primary" style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <BrandLogo size="sm" pressable href="/(tabs)" />
            <GearCartButton count={totalItems} onPress={() => router.push('/gear-rental/cart')} />
          </View>

          <Text style={styles.heroTitle}>Premium Safari Gear Rental</Text>
          <Text style={styles.heroSubtitle}>
            WildHaven storage and equipment rental is now mobile-ready with real stock visibility, protected checkout, and booking summary flow.
          </Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <MaterialCommunityIcons name="package-variant-closed" size={18} color={theme.colors.accent} />
              <Text style={styles.heroStatText}>{state.data.length} items</Text>
            </View>
            <View style={styles.heroStat}>
              <MaterialCommunityIcons name="shape-outline" size={18} color={theme.colors.accent} />
              <Text style={styles.heroStatText}>{getUniqueCategories(state.data)} categories</Text>
            </View>
          </View>
        </AppCard>

        <AppCard style={styles.searchCard}>
          <AppTextField
            label="Search equipment"
            value={search}
            onChangeText={setSearch}
            placeholder="Search by gear name, category, or pickup location"
          />
        </AppCard>

        {state.loading ? <HomeSectionState loading /> : null}

        {!state.loading && state.error ? (
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load rental products right now. Please check your backend connection and API URL.
            </Text>
          </AppCard>
        ) : null}

        {!state.loading && !filteredProducts.length ? (
          <HomeSectionState message="No rentable gear matched your search right now." />
        ) : null}

        {!state.loading &&
          filteredProducts.map((product) => (
            <GearProductCard
              key={product.key}
              product={product}
              onPress={() => router.push(`/gear-rental/${product.key}`)}
              onAddToCart={() => handleAddToCart(product)}
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
    gap: theme.spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  heroTitle: {
    color: theme.colors.textOnDark,
    ...theme.typography.screenTitle,
  },
  heroSubtitle: {
    color: '#DDE7F4',
    ...theme.typography.body,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: theme.radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroStatText: {
    color: theme.colors.textOnDark,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  searchCard: {
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});
