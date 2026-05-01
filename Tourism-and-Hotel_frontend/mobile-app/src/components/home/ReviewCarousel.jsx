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
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppCard } from '../AppCard';
import { theme } from '../../theme';
import { getDefaultImage } from '../../utils/media';

const ReviewSlide = memo(function ReviewSlide({ item, slideWidth, onPressReview }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPressReview?.(item)}
      style={[styles.slideWrapper, { width: slideWidth }]}>
      <AppCard style={styles.card}>
        <View style={styles.header}>
          <Image
            source={{ uri: item.imageUrl || item.profilePicture || getDefaultImage() }}
            style={styles.avatar}
            contentFit="cover"
          />

          <View style={styles.identity}>
            <Text style={styles.name}>{item.name || 'Guest Reviewer'}</Text>
            <Text style={styles.meta}>
              {(item.section || 'Guest Review')} - {(item.dateLabel || 'Recently added')}
            </Text>
          </View>
          <View style={styles.quoteBadge}>
            <MaterialCommunityIcons
              name="format-quote-close"
              size={18}
              color={theme.colors.accent}
            />
          </View>
        </View>

        <View style={styles.ratingRow}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialCommunityIcons
                key={`${item.id}-${star}`}
                name={star <= Math.round(item.rating || 0) ? 'star' : 'star-outline'}
                size={18}
                color={theme.colors.warning}
              />
            ))}
          </View>

          <Text style={styles.ratingLabel}>{Number(item.rating || 0).toFixed(1)} / 5</Text>
        </View>

        <Text style={styles.comment} numberOfLines={5}>
          {item.comment}
        </Text>
      </AppCard>
    </Pressable>
  );
});

export function ReviewCarousel({ reviews, onPressReview }) {
  const { width } = useWindowDimensions();
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slideWidth = width - theme.layout.screenPaddingHorizontal * 2;
  const safeReviews = Array.isArray(reviews) ? reviews : [];

  useEffect(() => {
    if (activeIndex >= safeReviews.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, safeReviews.length]);

  useEffect(() => {
    if (safeReviews.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setActiveIndex((currentIndex) => {
        const nextIndex = currentIndex + 1 >= safeReviews.length ? 0 : currentIndex + 1;

        listRef.current?.scrollTo({
          x: nextIndex * (slideWidth + theme.spacing.md),
          y: 0,
          animated: true,
        });

        return nextIndex;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [safeReviews.length, slideWidth]);

  const handleMomentumEnd = (event) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setActiveIndex(nextIndex);
  };

  const renderItem = ({ item }) => (
    <ReviewSlide item={item} slideWidth={slideWidth} onPressReview={onPressReview} />
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
        {safeReviews.map((item) => (
          <ReviewSlide
            key={item.id}
            item={item}
            slideWidth={slideWidth}
            onPressReview={onPressReview}
          />
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {safeReviews.map((review, index) => (
          <View
            key={review.id}
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
  card: {
    minHeight: 248,
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E3C8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primarySoft,
  },
  identity: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  quoteBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFD1A0',
  },
  name: {
    color: theme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  meta: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingLabel: {
    color: theme.colors.accent,
    ...theme.typography.bodySmall,
    fontWeight: '700',
  },
  comment: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
    minHeight: 94,
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
