import { useCallback, useEffect } from 'react';
import { StyleSheet, FlatList, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSkylight } from '@/context/skylight-context';
import { SkylightList } from '@/services/skylight/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function ListSelectorScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { lists, selectedList, selectList, refreshLists } = useSkylight();

  // Refresh lists when screen opens
  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  const handleSelectList = useCallback(
    async (list: SkylightList) => {
      Haptics.selectionAsync();
      await selectList(list);
      router.back();
    },
    [selectList]
  );

  const renderItem = useCallback(
    ({ item }: { item: SkylightList }) => {
      const isSelected = selectedList?.id === item.id;

      return (
        <Pressable
          style={({ pressed }) => [
            styles.listItem,
            { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f5f5f5' },
            pressed && styles.listItemPressed,
          ]}
          onPress={() => handleSelectList(item)}
        >
          <View style={styles.listItemContent}>
            {item.attributes.color && (
              <View
                style={[styles.colorIndicator, { backgroundColor: item.attributes.color.startsWith('#') ? item.attributes.color : `#${item.attributes.color}` }]}
              />
            )}
            <ThemedText style={styles.listName}>{item.attributes.label}</ThemedText>
          </View>
          {isSelected && (
            <IconSymbol name="checkmark" size={20} color={Colors[colorScheme].tint} />
          )}
        </Pressable>
      );
    },
    [colorScheme, selectedList, handleSelectList]
  );

  const keyExtractor = useCallback((item: SkylightList) => item.id, []);

  if (lists.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>No lists found</ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Create a shopping list in Skylight first
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.description}>
        Choose which list to add scanned items to:
      </ThemedText>
      <FlatList
        data={lists}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    padding: 16,
    paddingBottom: 8,
    opacity: 0.7,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  listItemPressed: {
    opacity: 0.7,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  listName: {
    fontSize: 16,
  },
  separator: {
    height: 8,
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
});
