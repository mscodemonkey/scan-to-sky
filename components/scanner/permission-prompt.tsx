import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

interface PermissionPromptProps {
  onRequestPermission: () => void;
  permissionDenied?: boolean;
}

export function PermissionPrompt({ onRequestPermission, permissionDenied }: PermissionPromptProps) {
  const iconColor = useThemeColor({}, 'text');

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <IconSymbol name="camera.fill" size={64} color={iconColor} style={styles.icon} />
        <ThemedText type="title" style={styles.title}>
          Camera Access Required
        </ThemedText>
        <ThemedText style={styles.description}>
          {permissionDenied
            ? 'Camera access was denied. Please enable it in your device settings to scan barcodes.'
            : 'To scan barcodes, this app needs access to your camera.'}
        </ThemedText>
        <Button
          title={permissionDenied ? 'Open Settings' : 'Grant Access'}
          onPress={onRequestPermission}
          style={styles.button}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    marginBottom: 24,
    opacity: 0.6,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  button: {
    minWidth: 160,
  },
});
