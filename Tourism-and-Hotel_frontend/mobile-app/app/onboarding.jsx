import { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppCard } from '../src/components/AppCard';
import { BrandLogo } from '../src/components/BrandLogo';
import { AppButton } from '../src/components/AppButton';
import { markOnboardingCompleted } from '../src/utils/onboarding';
import { theme } from '../src/theme';

const slides = [
  {
    id: 'discover',
    title: 'Discover curated stays',
    description:
      'Browse premium rooms and boutique hotel spaces designed for comfort, style, and memorable escapes.',
    icon: 'bed-king-outline',
  },
  {
    id: 'explore',
    title: 'Plan resort and safari moments',
    description:
      'Explore handpicked safari packages, guided experiences, and travel services from one elegant mobile app.',
    icon: 'jeepney',
  },
  {
    id: 'manage',
    title: 'Book with confidence',
    description:
      'Create your account, secure your booking, and manage every trip detail through a smooth authenticated flow.',
    icon: 'shield-check-outline',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const listRef = useRef(null);
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  const completeOnboarding = async () => {
    await markOnboardingCompleted();
    router.replace('/(tabs)');
  };

  const handleMomentumEnd = (event) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(nextIndex);
  };

  const handleNext = async () => {
    if (activeIndex === slides.length - 1) {
      await completeOnboarding();
      return;
    }

    listRef.current?.scrollToIndex({
      index: activeIndex + 1,
      animated: true,
    });
  };

  const renderItem = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <AppCard style={styles.slideCard}>
        <View style={styles.slideIconWrap}>
          <MaterialCommunityIcons name={item.icon} size={40} color={theme.colors.accent} />
        </View>
        <Text style={styles.slideEyebrow}>WildHaven Experience</Text>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </AppCard>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <BrandLogo size="md" />
          <Pressable onPress={completeOnboarding}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={slides}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={renderItem}
          onMomentumScrollEnd={handleMomentumEnd}
        />

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {slides.map((slide, index) => (
              <View
                key={slide.id}
                style={[styles.dot, index === activeIndex && styles.dotActive]}
              />
            ))}
          </View>

          <AppButton
            title={activeIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
            onPress={handleNext}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.md,
  },
  header: {
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipText: {
    color: theme.colors.primary,
    ...theme.typography.label,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
  },
  slideCard: {
    gap: theme.spacing.md,
  },
  slideIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: '#FFD1A0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideEyebrow: {
    color: theme.colors.primary,
    ...theme.typography.eyebrow,
  },
  slideTitle: {
    color: theme.colors.text,
    ...theme.typography.screenTitle,
  },
  slideDescription: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  footer: {
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    gap: theme.spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.primaryMuted,
  },
  dotActive: {
    width: 28,
    backgroundColor: theme.colors.accent,
  },
});
