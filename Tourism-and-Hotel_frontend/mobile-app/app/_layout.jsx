import { ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AuthProvider } from '../src/context/AuthContext';
import { GearCartProvider } from '../src/context/GearCartContext';
import { navigationTheme, theme } from '../src/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <GearCartProvider>
            <ThemeProvider value={navigationTheme}>
              <AppShell />
            </ThemeProvider>
          </GearCartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const pathname = usePathname();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  const shouldHideTabBar =
    segments.length === 0 ||
    segments[0] === 'admin' ||
    segments[0] === 'onboarding' ||
    segments[0] === '(auth)';

  const shouldShowTabBar = !shouldHideTabBar;
  const isProfileActive =
    pathname === '/profile' ||
    pathname === '/my-bookings' ||
    pathname.startsWith('/bookings') ||
    pathname.startsWith('/inquiries');
  const isHomeActive = !isProfileActive && shouldShowTabBar;
  const bottomInset = Math.max(insets.bottom, 8);

  const handleHomePress = () => {
    router.replace('/(tabs)');
  };

  const handleProfilePress = () => {
    router.push('/(tabs)/profile');
  };

  return (
    <View style={styles.appShell}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
            paddingBottom: shouldShowTabBar ? 108 : 0,
          },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin" />
      </Stack>

      {shouldShowTabBar ? (
        <View style={[styles.tabBarWrap, { paddingBottom: bottomInset + 6 }]}>
          <View style={[styles.tabBarShell, { minHeight: 76 }]}>
            <View style={[styles.sideSection, styles.sideSectionLeft]}>
              <Pressable
                onPress={handleHomePress}
                style={styles.tabButton}
                accessibilityRole="button"
                accessibilityState={isHomeActive ? { selected: true } : {}}
                accessibilityLabel="Home">
                <MaterialCommunityIcons
                  name="home-variant-outline"
                  color={isHomeActive ? theme.colors.accent : '#D7E3F3'}
                  size={26}
                />
                <Text style={[styles.tabLabel, isHomeActive ? styles.tabLabelActive : null]}>
                  Home
                </Text>
              </Pressable>
            </View>

            <View style={styles.centerSection}>
              <View style={styles.centerSpacer} />
            </View>

            <View style={[styles.sideSection, styles.sideSectionRight]}>
              <Pressable
                onPress={handleProfilePress}
                style={styles.tabButton}
                accessibilityRole="button"
                accessibilityState={isProfileActive ? { selected: true } : {}}
                accessibilityLabel="Profile">
                <MaterialCommunityIcons
                  name="account-circle-outline"
                  color={isProfileActive ? theme.colors.accent : '#D7E3F3'}
                  size={26}
                />
                <Text style={[styles.tabLabel, isProfileActive ? styles.tabLabelActive : null]}>
                  Profile
                </Text>
              </Pressable>
            </View>
          </View>

          <View pointerEvents="none" style={styles.floatingCenterWrap}>
            <View style={styles.floatingCenterOuter}>
              <View style={styles.floatingCenterInner}>
                <MaterialCommunityIcons
                  name="circle-outline"
                  size={20}
                  color="#D7E3F3"
                />
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  tabBarShell: {
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    ...theme.shadows.card,
  },
  sideSection: {
    flex: 1,
    minHeight: 54,
    justifyContent: 'center',
  },
  sideSectionLeft: {
    alignItems: 'flex-start',
  },
  sideSectionRight: {
    alignItems: 'flex-end',
  },
  centerSection: {
    width: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSpacer: {
    width: 48,
    height: 48,
  },
  tabButton: {
    minWidth: 76,
    minHeight: 52,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    color: '#D7E3F3',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: theme.colors.accent,
  },
  floatingCenterWrap: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingCenterOuter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#F8F3EA',
    ...theme.shadows.card,
  },
  floatingCenterInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
