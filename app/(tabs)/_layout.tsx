import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSkylight } from '@/context/skylight-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useSkylight();

  // Disable scan/history tabs if not logged in (but allow access while loading)
  const tabsDisabled = !isAuthenticated && !isLoading;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scan',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="barcode.viewfinder"
              color={tabsDisabled ? Colors[colorScheme ?? 'light'].icon : color}
            />
          ),
          href: tabsDisabled ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="clock.arrow.circlepath"
              color={tabsDisabled ? Colors[colorScheme ?? 'light'].icon : color}
            />
          ),
          href: tabsDisabled ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
