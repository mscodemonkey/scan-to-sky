import { useEffect, useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, View, ActivityIndicator, ScrollView, TextInput, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useProductLookup } from '@/hooks/use-product-lookup';
import { useSkylight } from '@/context/skylight-context';
import { useToast } from '@/context/toast-context';
import { historyStorage, productOverrideStorage } from '@/services/storage';
import { ScanHistoryItem } from '@/types/product';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProductResultScreen() {
  const { barcode } = useLocalSearchParams<{ barcode: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const { product, isLoading, error, notFound, lookup } = useProductLookup();
  const { isAuthenticated, selectedList, addItemToList, lists, selectList, getListItems } = useSkylight();
  const { showToast } = useToast();
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedBrand, setEditedBrand] = useState('');
  const [hasLocalOverride, setHasLocalOverride] = useState(false);
  const [, forceUpdate] = useState(0);

  // Force re-render when returning from list selector to reflect any list changes
  useFocusEffect(
    useCallback(() => {
      forceUpdate(n => n + 1);
    }, [])
  );

  // Load product and check for local override
  useEffect(() => {
    async function loadProduct() {
      if (!barcode) return;

      // Check for local override first
      const override = await productOverrideStorage.getOverride(barcode);
      if (override && (override.name || override.brand)) {
        setHasLocalOverride(true);
        if (override.name) setEditedName(override.name);
        if (override.brand) setEditedBrand(override.brand);
      }

      // If this product was previously added to a specific list, select it
      if (override?.lastListId && lists.length > 0) {
        const productList = lists.find(l => l.id === override.lastListId);
        if (productList) {
          selectList(productList);
        }
      }

      // Then lookup the product
      const result = await lookup(barcode);

      // If no override, use the looked-up values
      if (result) {
        if (!override?.name) setEditedName(result.name);
        if (!override?.brand) setEditedBrand(result.brand || '');
      }
    }

    loadProduct();
  }, [barcode, lookup, lists, selectList]);


  // Save override when name changes
  const handleNameBlur = useCallback(async () => {
    if (!barcode || !editedName.trim()) return;

    // Only save if different from original
    if (product && editedName.trim() !== product.name) {
      await productOverrideStorage.setOverride(barcode, { name: editedName.trim() });
      setHasLocalOverride(true);
    }
  }, [barcode, editedName, product]);

  // Save override when brand changes
  const handleBrandBlur = useCallback(async () => {
    if (!barcode) return;

    // Only save if different from original
    if (product && editedBrand.trim() !== (product.brand || '')) {
      await productOverrideStorage.setOverride(barcode, { brand: editedBrand.trim() });
      setHasLocalOverride(true);
    }
  }, [barcode, editedBrand, product]);

  const handleAddToList = useCallback(async () => {
    if (!product || !editedName.trim()) return;

    if (!isAuthenticated) {
      showToast('Please sign in to Skylight in Settings first', 'error');
      router.push('/(tabs)/settings');
      return;
    }

    if (!selectedList && lists.length > 0) {
      router.push('/list-selector');
      return;
    }

    if (lists.length === 0) {
      showToast('No shopping lists found in Skylight', 'error');
      return;
    }

    // Save overrides if edited
    if (barcode) {
      const overrides: { name?: string; brand?: string } = {};
      if (editedName.trim() !== product.name) overrides.name = editedName.trim();
      if (editedBrand.trim() !== (product.brand || '')) overrides.brand = editedBrand.trim();
      if (Object.keys(overrides).length > 0) {
        await productOverrideStorage.setOverride(barcode, overrides);
      }
    }

    setIsAddingToList(true);
    try {
      const name = editedName.trim();
      const brand = editedBrand.trim();
      const quantity = product.quantity?.trim();

      // Build item name: "Product Name (Brand) Size" or "Product Name Size"
      let itemName = name;

      // Only append brand if it's not already in the product name
      const brandAlreadyInName = brand && name.toLowerCase().includes(brand.toLowerCase());
      if (brand && !brandAlreadyInName) {
        itemName = `${itemName} (${brand})`;
      }

      // Append quantity/size if available
      if (quantity) {
        itemName = `${itemName} ${quantity}`;
      }

      // Check if item already exists in the list
      if (!selectedList) {
        showToast('No list selected', 'error');
        return;
      }
      const listItems = await getListItems(selectedList.id);
      const existingItem = listItems.find(
        item => item.attributes.label.toLowerCase() === itemName.toLowerCase()
      );
      if (existingItem) {
        setIsAddingToList(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showToast(`Already in ${selectedList.attributes.label}`, 'warning');
        return;
      }

      await addItemToList(itemName);

      // Remember this list for this product
      if (selectedList && barcode) {
        await productOverrideStorage.setOverride(barcode, { lastListId: selectedList.id });
      }

      // Update history with the list it was added to
      const listName = selectedList?.attributes.label || 'your list';
      const historyItem: ScanHistoryItem = {
        id: `${product.barcode}-${Date.now()}`,
        product: {
          ...product,
          name: editedName.trim(),
          brand: editedBrand.trim() || undefined,
        },
        scannedAt: new Date().toISOString(),
        addedToList: listName,
      };
      await historyStorage.addToHistory(historyItem);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`Added to ${listName}`, 'success');
      router.back();
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(err instanceof Error ? err.message : 'Failed to add item', 'error');
    } finally {
      setIsAddingToList(false);
    }
  }, [product, editedName, editedBrand, isAuthenticated, selectedList, lists, addItemToList, getListItems, barcode, showToast]);

  const handleScanAgain = useCallback(() => {
    router.back();
  }, []);

  if (isLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        <ThemedText style={styles.loadingText}>Looking up product...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <Button title="Try Again" onPress={() => barcode && lookup(barcode)} style={styles.retryButton} />
        <Button title="Scan Again" variant="secondary" onPress={handleScanAgain} />
      </ThemedView>
    );
  }

  if (!product) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>No barcode provided</ThemedText>
        <Button title="Go Back" onPress={handleScanAgain} style={styles.retryButton} />
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {notFound && !hasLocalOverride && (
        <View style={styles.notFoundBanner}>
          <ThemedText style={styles.notFoundText}>
            Product not found in database. Enter a name below.
          </ThemedText>
        </View>
      )}

      {hasLocalOverride && (
        <View style={styles.overrideBanner}>
          <ThemedText style={styles.overrideText}>
            Using your saved name for this product.
          </ThemedText>
        </View>
      )}

      {/* Product Image */}
      <View style={styles.imageContainer}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.productImage}
            contentFit="contain"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colorScheme === 'dark' ? '#333' : '#ddd' }]}>
            <ThemedText style={styles.placeholderText}>No Image</ThemedText>
          </View>
        )}
      </View>

      {/* Editable Name */}
      <View style={styles.fieldSection}>
        <ThemedText style={styles.label}>Product Name</ThemedText>
        <TextInput
          style={[
            styles.fieldInput,
            {
              backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f5f5f5',
              color: Colors[colorScheme].text,
            },
          ]}
          value={editedName}
          onChangeText={setEditedName}
          onBlur={handleNameBlur}
          placeholder="Enter product name"
          placeholderTextColor={Colors[colorScheme].icon}
          autoCorrect={false}
        />
      </View>

      {/* Editable Brand */}
      <View style={styles.fieldSection}>
        <ThemedText style={styles.label}>Brand (optional)</ThemedText>
        <TextInput
          style={[
            styles.fieldInput,
            styles.brandInput,
            {
              backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f5f5f5',
              color: Colors[colorScheme].text,
            },
          ]}
          value={editedBrand}
          onChangeText={setEditedBrand}
          onBlur={handleBrandBlur}
          placeholder="Enter brand"
          placeholderTextColor={Colors[colorScheme].icon}
          autoCorrect={false}
        />
      </View>

      {/* Size/Quantity */}
      {product.quantity && (
        <View style={styles.quantityContainer}>
          <ThemedText style={styles.quantityLabel}>Size:</ThemedText>
          <ThemedText style={styles.quantityValue}>{product.quantity}</ThemedText>
        </View>
      )}

      {/* Barcode */}
      <ThemedText style={styles.barcode}>{product.barcode}</ThemedText>

      <View style={styles.actions}>
        <Button
          title={isAddingToList ? 'Adding...' : 'Add to List'}
          onPress={handleAddToList}
          disabled={isAddingToList || !editedName.trim()}
        />
        <Button title="Scan Another" variant="secondary" onPress={handleScanAgain} />
      </View>

      {selectedList && lists.length > 0 && (
        <Pressable
          style={({ pressed }) => [
            styles.listSelector,
            { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f5f5f5' },
            pressed && styles.listSelectorPressed,
          ]}
          onPress={() => lists.length > 1 && router.push('/list-selector')}
          disabled={lists.length <= 1}
        >
          <View style={styles.listSelectorContent}>
            <ThemedText style={styles.listLabel}>Add to:</ThemedText>
            <ThemedText style={styles.listName}>{selectedList.attributes.label}</ThemedText>
          </View>
          {lists.length > 1 && (
            <IconSymbol name="chevron.right" size={16} color={Colors[colorScheme].icon} />
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    minWidth: 120,
  },
  notFoundBanner: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    padding: 12,
    borderRadius: 8,
  },
  notFoundText: {
    color: '#ff9500',
    textAlign: 'center',
    fontSize: 14,
  },
  overrideBanner: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    padding: 12,
    borderRadius: 8,
  },
  overrideText: {
    color: '#34c759',
    textAlign: 'center',
    fontSize: 14,
  },
  imageContainer: {
    alignItems: 'center',
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    opacity: 0.5,
  },
  fieldSection: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    opacity: 0.6,
    marginLeft: 4,
  },
  fieldInput: {
    fontSize: 16,
    padding: 14,
    borderRadius: 10,
  },
  brandInput: {
    fontSize: 15,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 4,
  },
  quantityLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  barcode: {
    opacity: 0.4,
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  listSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
  },
  listSelectorPressed: {
    opacity: 0.7,
  },
  listSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listLabel: {
    opacity: 0.6,
    fontSize: 14,
  },
  listName: {
    fontSize: 14,
    fontWeight: '500',
  },
});
