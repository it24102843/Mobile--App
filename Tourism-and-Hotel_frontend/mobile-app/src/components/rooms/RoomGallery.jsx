import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { theme } from '../../theme';

export function RoomGallery({ images = [] }) {
  const gallery = useMemo(() => (images.length ? images : []), [images]);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!gallery.length) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <Image
        source={gallery[activeIndex]}
        style={styles.heroImage}
        contentFit="cover"
        transition={250}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnailRow}>
        {gallery.map((image, index) => (
          <Pressable
            key={`${image}-${index}`}
            onPress={() => setActiveIndex(index)}
            style={[
              styles.thumbnailShell,
              activeIndex === index ? styles.thumbnailShellActive : null,
            ]}>
            <Image source={image} style={styles.thumbnailImage} contentFit="cover" />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.md,
  },
  heroImage: {
    width: '100%',
    height: 280,
    borderRadius: 28,
    backgroundColor: theme.colors.primarySoft,
  },
  thumbnailRow: {
    gap: theme.spacing.md,
    paddingRight: theme.spacing.sm,
  },
  thumbnailShell: {
    borderRadius: theme.radii.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailShellActive: {
    borderColor: theme.colors.accent,
  },
  thumbnailImage: {
    width: 110,
    height: 86,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primarySoft,
  },
});
