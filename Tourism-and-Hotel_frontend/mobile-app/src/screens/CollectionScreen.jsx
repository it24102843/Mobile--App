import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '../components/AppCard';
import { BrandLogo } from '../components/BrandLogo';
import { CatalogItemCard } from '../components/CatalogItemCard';
import { HomeSectionState } from '../components/home/HomeSectionState';
import { ScreenHeader } from '../components/ScreenHeader';
import { theme } from '../theme';

export function CollectionScreen({
  title,
  subtitle,
  fetcher,
  actionLabel,
  emptyMessage,
  onActionPress,
}) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: [],
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await fetcher();

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

    load();

    return () => {
      mounted = false;
    };
  }, [fetcher]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={title} subtitle={subtitle} />

        <AppCard variant="primary" style={styles.heroCard}>
          <BrandLogo size="sm" pressable href="/(tabs)" />
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroSubtitle}>{subtitle}</Text>
        </AppCard>

        {state.loading ? <HomeSectionState loading /> : null}

        {!state.loading && state.error ? (
          <AppCard variant="danger">
            <Text style={styles.errorText}>
              Unable to load this section right now. Please check your backend connection.
            </Text>
          </AppCard>
        ) : null}

        {!state.loading && !state.data.length ? (
          <HomeSectionState message={emptyMessage} />
        ) : null}

        {!state.loading &&
          state.data.map((item) => (
            <CatalogItemCard
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              description={item.description}
              imageUrl={item.imageUrl}
              priceLabel={item.priceLabel}
              badgeLabel={item.badgeLabel}
              badgeVariant={item.badgeVariant}
              metaLabel={item.metaLabel}
              actionLabel={actionLabel}
              onActionPress={() => onActionPress(item)}
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
