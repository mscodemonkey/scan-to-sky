import { StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Product } from '@/types/product';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ProductCardProps {
  product: Product;
  scannedAt?: string;
  addedToList?: string;
  compact?: boolean;
  expanded?: boolean;
  onAddAgain?: () => void;
  isAdding?: boolean;
}

export function ProductCard({
  product,
  scannedAt,
  addedToList,
  compact,
  expanded = true,
  onAddAgain,
  isAdding,
}: ProductCardProps) {
  const colorScheme = useColorScheme();

  // Image sizes: collapsed = same as button height (36), expanded compact = same, full = 100
  const compactImageSize = 36;
  const fullImageSize = 100;
  const imageSize = compact ? compactImageSize : fullImageSize;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderImage = () => {
    if (product.imageUrl) {
      return (
        <Image
          source={{ uri: product.imageUrl }}
          style={[styles.image, { width: imageSize, height: imageSize }]}
          contentFit="cover"
        />
      );
    }
    return (
      <View
        style={[
          styles.imagePlaceholder,
          { width: imageSize, height: imageSize },
          { backgroundColor: colorScheme === 'dark' ? '#333' : '#ddd' },
        ]}
      >
        <IconSymbol
          name="photo"
          size={imageSize * 0.4}
          color={colorScheme === 'dark' ? '#666' : '#999'}
        />
      </View>
    );
  };

  const renderAddButton = () => {
    if (!onAddAgain) return null;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          { backgroundColor: colorScheme === 'dark' ? '#333' : '#e0e0e0' },
          pressed && styles.addButtonPressed,
        ]}
        onPress={(e) => {
          e.stopPropagation();
          onAddAgain();
        }}
        disabled={isAdding}
      >
        {isAdding ? (
          <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#fff' : '#333'} />
        ) : (
          <ThemedText style={styles.addButtonText}>Add</ThemedText>
        )}
      </Pressable>
    );
  };

  // Collapsed view for history - image, name (no wrap), and Add button
  if (compact && !expanded) {
    return (
      <ThemedView
        style={[
          styles.containerCollapsed,
          { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f5f5f5' },
        ]}
      >
        {renderImage()}
        <ThemedText style={styles.nameCollapsed} numberOfLines={1}>
          {product.name}
        </ThemedText>
        {renderAddButton()}
      </ThemedView>
    );
  }

  // Expanded view
  return (
    <ThemedView
      style={[
        styles.container,
        compact && styles.containerCompact,
        { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f5f5f5' },
      ]}
    >
      {/* Left column: image */}
      <View style={styles.imageColumn}>
        {renderImage()}
      </View>

      {/* Right column: content */}
      <View style={styles.content}>
        {/* Header row with name and Add button */}
        <View style={styles.header}>
          <ThemedText
            type={compact ? undefined : 'subtitle'}
            style={compact ? styles.nameCompact : styles.name}
            numberOfLines={compact ? 2 : 3}
          >
            {product.name}
          </ThemedText>
          {renderAddButton()}
        </View>

        {/* Details */}
        {product.brand && (
          <ThemedText style={styles.brand} numberOfLines={1}>
            {product.brand}
          </ThemedText>
        )}
        {product.quantity && (
          <ThemedText style={styles.quantity}>{product.quantity}</ThemedText>
        )}
        {scannedAt && (
          <ThemedText style={styles.scannedAt}>Last added {formatDate(scannedAt)}</ThemedText>
        )}
        {addedToList && (
          <ThemedText style={styles.addedToList}>{addedToList} list</ThemedText>
        )}
        {!compact && (
          <ThemedText style={styles.barcode}>{product.barcode}</ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  containerCompact: {
    padding: 12,
    gap: 10,
  },
  containerCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  imageColumn: {
    alignSelf: 'flex-start',
  },
  image: {
    borderRadius: 8,
  },
  imagePlaceholder: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  name: {
    flex: 1,
  },
  nameCompact: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    paddingTop: 6,
  },
  nameCollapsed: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    marginTop: -1,
  },
  addButton: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  brand: {
    opacity: 0.7,
    fontSize: 13,
  },
  quantity: {
    opacity: 0.6,
    fontSize: 13,
  },
  scannedAt: {
    opacity: 0.5,
    fontSize: 12,
  },
  addedToList: {
    opacity: 0.6,
    fontSize: 12,
    color: '#34c759',
  },
  barcode: {
    opacity: 0.4,
    fontSize: 12,
    marginTop: 8,
    fontFamily: 'monospace',
  },
});
