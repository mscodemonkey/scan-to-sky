import { Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Use a consistent accent color that works in both light and dark modes
  const accentColor = '#0a7ea4';

  const getBackgroundColor = () => {
    if (disabled) return colors.icon;
    switch (variant) {
      case 'primary':
        return accentColor;
      case 'secondary':
        return colorScheme === 'dark' ? '#333' : '#e0e0e0';
      case 'ghost':
        return 'transparent';
      default:
        return accentColor;
    }
  };

  const getTextColor = () => {
    if (variant === 'ghost') return accentColor;
    if (variant === 'secondary') return colors.text;
    return '#fff';
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: getBackgroundColor() },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <ThemedText style={[styles.text, { color: getTextColor() }]}>{title}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
