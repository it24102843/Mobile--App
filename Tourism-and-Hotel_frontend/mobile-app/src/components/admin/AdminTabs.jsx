import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../../theme';

export function AdminTabs({ tabs, activeTab, onChange }) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab;

        return (
          <Pressable
            key={tab.value}
            accessibilityRole="button"
            onPress={() => onChange?.(tab.value)}
            style={({ pressed }) => [
              styles.tabButton,
              isActive ? styles.activeTabButton : null,
              pressed ? styles.pressed : null,
            ]}>
            <Text style={[styles.tabText, isActive ? styles.activeTabText : null]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tabButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  tabText: {
    color: theme.colors.primary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  activeTabText: {
    color: theme.colors.textOnPrimary,
  },
  pressed: {
    opacity: 0.92,
  },
});
