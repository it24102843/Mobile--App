import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { HomeSectionState } from '../../components/home/HomeSectionState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PackageCard } from '../../components/packages/PackageCard';
import { fetchPackages } from '../../services/packagesApi';
import { theme } from '../../theme';

const CATEGORY_ORDER = ['All', 'Safari', 'Wildlife', 'Pilgrimage', 'Adventure', 'Cultural', 'Nature', 'Combined'];

export default function PackagesScreen() {
  const router = useRouter();
  const [state, setState] = useState({
    loading: true,
    error: null,
    items: [],
  });
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    let mounted = true;

    async function loadPackages() {
      try {
        const items = await fetchPackages();

        if (mounted) {
          setState({
            loading: false,
            error: null,
            items,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            error,
            items: [],
          });
        }
      }
    }

    loadPackages();

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const dynamicCategories = [...new Set(state.items.map((item) => item.category).filter(Boolean))];
    const ordered = CATEGORY_ORDER.filter((category) => dynamicCategories.includes(category));
    const extras = dynamicCategories.filter((category) => !CATEGORY_ORDER.includes(category));
    return ['All', ...ordered, ...extras];
  }, [state.items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return state.items.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const haystack = [
        item.title,
        item.category,
        item.description,
        item.locationLabel,
      ]
        .join(' ')
        .toLowerCase();
      const matchesSearch = !query || haystack.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search, state.items]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Explore Packages"
          subtitle="Find the right WildHaven journey, then continue into the protected booking flow when you are ready."
          fallbackHref="/(tabs)"
        />

        <AppCard variant="primary" style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>WildHaven Packages</Text>
          <Text style={styles.heroTitle}>Curated journeys built from your live backend packages</Text>
          <Text style={styles.heroSubtitle}>
            Browse real tours, compare categories, and open the same booking flow your uploaded design shows.
          </Text>
        </AppCard>

        <AppCard style={styles.filterCard}>
          <AppTextField
            label="Search Packages"
            placeholder="Search by package name, category, or location"
            value={search}
            onChangeText={setSearch}
          />

          <View style={styles.categoryWrap}>
            {categories.map((category) => {
              const active = category === activeCategory;
              return (
                <Pressable
                  key={category}
                  onPress={() => setActiveCategory(category)}
                  style={[styles.categoryChip, active ? styles.categoryChipActive : null]}>
                  <Text style={[styles.categoryChipText, active ? styles.categoryChipTextActive : null]}>
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </AppCard>

        {state.loading ? <HomeSectionState loading /> : null}

        {!state.loading && state.error ? (
          <AppCard variant="danger">
            <Text style={styles.errorText}>Unable to load packages right now. Please try again.</Text>
          </AppCard>
        ) : null}

        {!state.loading && !state.error && !filteredItems.length ? (
          <HomeSectionState message="No packages match your current search or category." />
        ) : null}

        {!state.loading && !state.error
          ? filteredItems.map((item) => (
              <PackageCard
                key={item.packageId}
                item={item}
                onPress={() => router.push(`/packages/${item.packageId}`)}
              />
            ))
          : null}
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
    gap: theme.spacing.md,
  },
  heroEyebrow: {
    color: '#FFD59D',
    ...theme.typography.eyebrow,
  },
  heroTitle: {
    color: theme.colors.textOnPrimary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#D5E0EF',
    ...theme.typography.body,
  },
  filterCard: {
    gap: theme.spacing.lg,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: '#E7DCC9',
    backgroundColor: '#FFFDF8',
  },
  categoryChipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  categoryChipText: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: theme.colors.textOnPrimary,
  },
  errorText: {
    color: theme.colors.errorText,
    ...theme.typography.body,
  },
});

