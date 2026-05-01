import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../theme';

export function ScreenHeader({ title, subtitle, fallbackHref = '/(tabs)' }) {
  const router = useRouter();
  const navigation = useNavigation();

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    router.replace(fallbackHref);
  };

  return (
    <View style={styles.wrapper}>
      <Pressable accessibilityRole="button" onPress={handleBack} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.primary} />
      </Pressable>

      <View style={styles.copyBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle,
  },
  copyBlock: {
    flex: 1,
    gap: theme.spacing.xs,
    paddingTop: 2,
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  subtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
});
