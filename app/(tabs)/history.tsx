import { useCallback, useState } from 'react';
import { StyleSheet, FlatList, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProductCard } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import { historyStorage } from '@/services/storage';
import { useSkylight } from '@/context/skylight-context';
import { useToast } from '@/context/toast-context';
import { ScanHistoryItem } from '@/types/product';

export default function HistoryScreen() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingItemId, setAddingItemId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { isAuthenticated, selectedList, addItemToList, getListItems, lists } = useSkylight();
  const { showToast } = useToast();

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await historyStorage.getHistory<ScanHistoryItem>();
      setHistory(items);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleClearHistory = useCallback(async () => {
    await historyStorage.clearHistory();
    setHistory([]);
  }, []);

  const handleItemPress = useCallback((item: ScanHistoryItem) => {
    // Toggle expansion
    setExpandedId(prev => prev === item.id ? null : item.id);
  }, []);

  const handleAddAgain = useCallback(async (item: ScanHistoryItem) => {
    if (!isAuthenticated) {
      showToast('Please sign in to Skylight first', 'error');
      return;
    }

    if (lists.length === 0) {
      showToast('No lists available', 'error');
      return;
    }

    // Find the list this item was originally added to, or fall back to selected list
    const targetList = item.addedToList
      ? lists.find(l => l.attributes.label === item.addedToList) || selectedList
      : selectedList;

    if (!targetList) {
      showToast('No list selected', 'error');
      return;
    }

    setAddingItemId(item.id);
    try {
      const product = item.product;
      const name = product.name;
      const brand = product.brand?.trim();
      const quantity = product.quantity?.trim();

      // Build item name: "Product Name (Brand) Size" or "Product Name Size"
      let itemName = name;
      const brandAlreadyInName = brand && name.toLowerCase().includes(brand.toLowerCase());
      if (brand && !brandAlreadyInName) {
        itemName = `${itemName} (${brand})`;
      }
      if (quantity) {
        itemName = `${itemName} ${quantity}`;
      }

      // Check if item already exists in the list
      const listItems = await getListItems(targetList.id);
      const existingItem = listItems.find(
        listItem => listItem.attributes.label.toLowerCase() === itemName.toLowerCase()
      );
      if (existingItem) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showToast(`Already in ${targetList.attributes.label}`, 'warning');
        return;
      }

      await addItemToList(itemName, targetList.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`Added to ${targetList.attributes.label}`, 'success');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(err instanceof Error ? err.message : 'Failed to add item', 'error');
    } finally {
      setAddingItemId(null);
    }
  }, [isAuthenticated, selectedList, lists, addItemToList, getListItems, showToast]);

  const renderItem = useCallback(
    ({ item }: { item: ScanHistoryItem }) => (
      <Pressable onPress={() => handleItemPress(item)}>
        <ProductCard
          product={item.product}
          scannedAt={item.scannedAt}
          addedToList={item.addedToList}
          compact
          expanded={expandedId === item.id}
          onAddAgain={isAuthenticated && lists.length > 0 ? () => handleAddAgain(item) : undefined}
          isAdding={addingItemId === item.id}
        />
      </Pressable>
    ),
    [handleItemPress, handleAddAgain, isAuthenticated, lists.length, addingItemId, expandedId]
  );

  const keyExtractor = useCallback((item: ScanHistoryItem) => item.id, []);

  if (history.length === 0 && !isLoading) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>No scans yet</ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Scan a barcode to see your history here
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      {history.length > 0 && (
        <View style={styles.footer}>
          <Button title="Clear History" variant="ghost" onPress={handleClearHistory} />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    opacity: 0.7,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.3)',
  },
});
