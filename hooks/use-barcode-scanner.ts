import { useState, useEffect, useCallback } from 'react';
import { Camera } from 'expo-camera';
import { Linking } from 'react-native';

type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface UseBarcodeScanner {
  hasPermission: PermissionStatus;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
  openSettings: () => Promise<void>;
}

export function useBarcodeScanner(): UseBarcodeScanner {
  const [hasPermission, setHasPermission] = useState<PermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { status } = await Camera.getCameraPermissionsAsync();
      setHasPermission(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined');
    } catch {
      setHasPermission('denied');
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted' ? 'granted' : 'denied');
    } catch {
      setHasPermission('denied');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openSettings = useCallback(async () => {
    await Linking.openSettings();
  }, []);

  return {
    hasPermission,
    isLoading,
    requestPermission,
    openSettings,
  };
}
