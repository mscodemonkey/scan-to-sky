import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, BarcodeScanningResult } from 'expo-camera';
import { ScanOverlay } from './scan-overlay';
import * as Haptics from 'expo-haptics';

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  enabled?: boolean;
}

export function BarcodeScanner({ onBarcodeScanned, enabled = true }: BarcodeScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const lastScannedRef = useRef<string | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (!enabled || isProcessing) return;

      const barcode = result.data;

      // Prevent duplicate scans
      if (barcode === lastScannedRef.current) return;

      setIsProcessing(true);
      lastScannedRef.current = barcode;

      // Haptic feedback on scan
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      onBarcodeScanned(barcode);

      // Cooldown before allowing next scan
      if (cooldownRef.current) {
        clearTimeout(cooldownRef.current);
      }
      cooldownRef.current = setTimeout(() => {
        setIsProcessing(false);
        lastScannedRef.current = null;
      }, 2000);
    },
    [enabled, isProcessing, onBarcodeScanned]
  );

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
            'code39',
            'code93',
            'codabar',
            'itf14',
          ],
        }}
        onBarcodeScanned={enabled ? handleBarcodeScanned : undefined}
      />
      <ScanOverlay isScanning={isProcessing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
});
