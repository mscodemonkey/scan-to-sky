import { useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useState } from 'react';

import { BarcodeScanner } from '@/components/scanner/barcode-scanner';
import { PermissionPrompt } from '@/components/scanner/permission-prompt';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ScanScreen() {
  const colorScheme = useColorScheme();
  const { hasPermission, isLoading, requestPermission, openSettings } = useBarcodeScanner();
  const [scannerEnabled, setScannerEnabled] = useState(true);

  // Re-enable scanner when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setScannerEnabled(true);
      return () => setScannerEnabled(false);
    }, [])
  );

  const handleBarcodeScanned = useCallback((barcode: string) => {
    setScannerEnabled(false);
    router.push({
      pathname: '/product-result',
      params: { barcode },
    });
  }, []);

  const handleRequestPermission = useCallback(() => {
    if (hasPermission === 'denied') {
      openSettings();
    } else {
      requestPermission();
    }
  }, [hasPermission, requestPermission, openSettings]);

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </ThemedView>
    );
  }

  if (hasPermission !== 'granted') {
    return (
      <PermissionPrompt
        onRequestPermission={handleRequestPermission}
        permissionDenied={hasPermission === 'denied'}
      />
    );
  }

  return (
    <View style={styles.container}>
      <BarcodeScanner onBarcodeScanned={handleBarcodeScanned} enabled={scannerEnabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
