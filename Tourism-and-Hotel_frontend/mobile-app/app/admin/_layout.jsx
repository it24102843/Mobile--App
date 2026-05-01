import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, usePathname, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminGuard } from '../../src/components/auth/AdminGuard';
import { adminMenu } from '../../src/config/adminMenu';
import { theme } from '../../src/theme';

const ADMIN_NAV_LABELS = {
  dashboard: 'Dashboard',
  'equipment-orders': 'Orders',
  'hotel-rooms': 'Rooms',
  'room-bookings': 'Bookings',
  'storage-equipment': 'Storage',
  packages: 'Packages',
  transportation: 'Transport',
  payments: 'Payments',
  restaurant: 'Food',
  'food-orders': 'Orders',
  reviews: 'Reviews',
  inquiries: 'Inquiries',
  'package-vehicles': 'Vehicles',
  'package-bookings': 'Pkg Bookings',
  users: 'Users',
};

export default function AdminLayout() {
  return (
    <AdminGuard>
      <AdminShell />
    </AdminGuard>
  );
}

function AdminShell() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const navItems = adminMenu.filter((item) => item.route && item.key !== 'logout');
  const bottomInset = Math.max(insets.bottom, 8);

  const resolveActiveKey = () => {
    if (pathname === '/admin') {
      return 'dashboard';
    }

    if (pathname.startsWith('/admin/hotel-rooms') || pathname.startsWith('/admin/hotels-') || pathname.startsWith('/admin/rooms-')) {
      return 'hotel-rooms';
    }

    if (pathname.startsWith('/admin/storage-equipment')) {
      return 'storage-equipment';
    }

    if (pathname.startsWith('/admin/package-vehicles')) {
      return 'package-vehicles';
    }

    if (pathname.startsWith('/admin/package-bookings')) {
      return 'package-bookings';
    }

    if (pathname.startsWith('/admin/packages')) {
      return 'packages';
    }

    if (pathname.startsWith('/admin/transportation')) {
      return 'transportation';
    }

    if (
      pathname.startsWith('/admin/restaurant') ||
      pathname.startsWith('/admin/food-item') ||
      pathname.startsWith('/admin/food-orders')
    ) {
      return pathname.startsWith('/admin/food-orders') ? 'food-orders' : 'restaurant';
    }

    if (pathname.startsWith('/admin/equipment-orders')) {
      return 'equipment-orders';
    }

    if (pathname.startsWith('/admin/room-bookings')) {
      return 'room-bookings';
    }

    if (pathname.startsWith('/admin/payments')) {
      return 'payments';
    }

    if (pathname.startsWith('/admin/reviews')) {
      return 'reviews';
    }

    if (pathname.startsWith('/admin/users')) {
      return 'users';
    }

    if (pathname.startsWith('/admin/inquiries')) {
      return 'inquiries';
    }

    return null;
  };

  const activeKey = resolveActiveKey();
  const activeTitle =
    ADMIN_NAV_LABELS[activeKey] ||
    navItems.find((item) => item.key === activeKey)?.title ||
    'Dashboard';

  return (
    <View style={styles.shell}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
            paddingBottom: 108,
          },
        }}
      />

      <View style={[styles.navWrap, { paddingBottom: bottomInset + 10 }]}>
        <View style={styles.navShell}>
          <View style={styles.navHeaderRow}>
            <Text style={styles.navEyebrow}>Admin Tools</Text>
            <Text style={styles.navContextText}>{activeTitle}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navScrollContent}
          >
            {navItems.map((item) => {
              const active = item.key === activeKey;

              return (
                <Pressable
                  key={item.key}
                  onPress={() => router.push(item.route)}
                  style={[styles.navChip, active ? styles.navChipActive : null]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={16}
                    color={active ? '#102A49' : '#F4F8FF'}
                  />
                  <Text style={[styles.navChipLabel, active ? styles.navChipLabelActive : null]}>
                    {ADMIN_NAV_LABELS[item.key] || item.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  navWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
  },
  navShell: {
    borderRadius: 30,
    backgroundColor: '#15365E',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...theme.shadows.card,
  },
  navHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  navEyebrow: {
    color: '#D8E6F7',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  navContextText: {
    color: 'rgba(244,248,255,0.82)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  navScrollContent: {
    gap: 8,
    paddingLeft: 2,
    paddingRight: 10,
  },
  navChip: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  navChipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
    shadowColor: '#F1A53A',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  navChipLabel: {
    color: '#F4F8FF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  navChipLabelActive: {
    color: '#102A49',
  },
});
