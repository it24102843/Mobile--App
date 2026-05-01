import { memo, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { StatusBadge } from '../StatusBadge';
import { theme } from '../../theme';
import { HomeSectionState } from './HomeSectionState';

const HeroSlide = memo(function HeroSlide({ item, slideWidth, onPressSlide }) {
  const imageSource = item.imageSource || (item.imageUrl ? { uri: item.imageUrl } : null);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPressSlide(item)}
      style={[styles.slideWrapper, { width: slideWidth }]}>
      <AppCard padded={false} style={styles.slideCard}>
        {imageSource ? (
          <Image source={imageSource} style={styles.slideImage} contentFit="cover" />
        ) : null}
        <View style={styles.imageOverlay} />
        <View style={styles.slideContent}>
          <StatusBadge label={item.eyebrow} variant="accent" />
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          <View style={styles.slideFooter}>
            <Text style={styles.slideHint}>Swipe to discover more curated experiences</Text>
            <View style={styles.ctaWrap}>
              <AppButton title={item.ctaLabel} onPress={() => onPressSlide(item)} />
            </View>
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
});

export function HeroCarousel({ slides, loading, onPressSlide }) {
  const { width } = useWindowDimensions();
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slideWidth = width - theme.layout.screenPaddingHorizontal * 2;

  useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setActiveIndex((currentIndex) => {
        const nextIndex = currentIndex + 1 >= slides.length ? 0 : currentIndex + 1;

        listRef.current?.scrollTo({
          x: nextIndex * (slideWidth + theme.spacing.md),
          y: 0,
          animated: true,
        });

        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [slideWidth, slides.length]);

  if (loading) {
    return <HomeSectionState loading />;
  }

  if (!slides.length) {
    return (
      <HomeSectionState
        message="Hero content will appear here once your backend media is available."
        icon="image-multiple-outline"
      />
    );
  }

  const handleMomentumEnd = (event) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setActiveIndex(nextIndex);
  };

  const renderItem = ({ item }) => (
    <HeroSlide item={item} slideWidth={slideWidth} onPressSlide={onPressSlide} />
  );

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={listRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}>
        {slides.map((item) => (
          <HeroSlide
            key={item.id}
            item={item}
            slideWidth={slideWidth}
            onPressSlide={onPressSlide}
          />
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {slides.map((slide, index) => (
          <View
            key={slide.id}
            style={[styles.dot, index === activeIndex ? styles.dotActive : null]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.md,
  },
  slideWrapper: {
    marginRight: theme.spacing.md,
  },
  slideCard: {
    minHeight: 338,
    overflow: 'hidden',
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
    borderRadius: 30,
    shadowColor: '#061325',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  slideImage: {
    ...StyleSheet.absoluteFillObject,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 31, 56, 0.52)',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    padding: theme.spacing.xxl,
  },
  slideTitle: {
    color: theme.colors.textOnDark,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
  },
  slideSubtitle: {
    color: '#EEF3FB',
    ...theme.typography.body,
  },
  slideFooter: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
  },
  slideHint: {
    color: 'rgba(255,255,255,0.78)',
    ...theme.typography.bodySmall,
  },
  ctaWrap: {
    marginTop: theme.spacing.xs,
    maxWidth: 188,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: theme.radii.pill,
    backgroundColor: '#D9C8AA',
  },
  dotActive: {
    width: 28,
    backgroundColor: theme.colors.accent,
  },
});
