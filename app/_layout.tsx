import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SkylightProvider } from '@/context/skylight-context';
import { ToastProvider } from '@/context/toast-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  const CloseButton = () => (
    <Pressable onPress={() => router.back()} hitSlop={12} style={layoutStyles.closeButton}>
      <IconSymbol name="xmark" size={18} color={Colors[colorScheme].text} weight="semibold" />
    </Pressable>
  );

  return (
    <SkylightProvider>
      <ToastProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="product-result"
              options={{
                presentation: 'modal',
                title: 'Product',
                headerShown: true,
                headerRight: () => <CloseButton />,
              }}
            />
            <Stack.Screen
              name="list-selector"
              options={{
                presentation: 'modal',
                title: 'Select List',
                headerShown: true,
              }}
            />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ToastProvider>
    </SkylightProvider>
  );
}

const layoutStyles = StyleSheet.create({
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
