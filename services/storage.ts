import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SECURE_KEYS = {
  AUTH_TOKEN: 'skylight_auth_token',
  USER_ID: 'skylight_user_id',
  FRAME_ID: 'skylight_frame_id',
  USER_EMAIL: 'skylight_user_email',
} as const;

const STORAGE_KEYS = {
  SCAN_HISTORY: 'scan_history',
  SELECTED_LIST_ID: 'selected_list_id',
  PRODUCT_OVERRIDES: 'product_overrides',
} as const;

// Secure storage for sensitive data (auth tokens)
export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },

  async delete(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

// Regular storage for non-sensitive data
export const storage = {
  async set<T>(key: string, value: T): Promise<void> {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  },

  async get<T>(key: string): Promise<T | null> {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue ? (JSON.parse(jsonValue) as T) : null;
  },

  async delete(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};

// Auth-specific helpers
export const authStorage = {
  async saveSession(token: string, userId: string, frameId: string, email: string): Promise<void> {
    await Promise.all([
      secureStorage.set(SECURE_KEYS.AUTH_TOKEN, token),
      secureStorage.set(SECURE_KEYS.USER_ID, userId),
      secureStorage.set(SECURE_KEYS.FRAME_ID, frameId),
      secureStorage.set(SECURE_KEYS.USER_EMAIL, email),
    ]);
  },

  async getSession(): Promise<{ token: string; userId: string; frameId: string; email: string } | null> {
    const [token, userId, frameId, email] = await Promise.all([
      secureStorage.get(SECURE_KEYS.AUTH_TOKEN),
      secureStorage.get(SECURE_KEYS.USER_ID),
      secureStorage.get(SECURE_KEYS.FRAME_ID),
      secureStorage.get(SECURE_KEYS.USER_EMAIL),
    ]);

    if (!token || !userId || !frameId || !email) {
      return null;
    }

    return { token, userId, frameId, email };
  },

  async clearSession(): Promise<void> {
    await Promise.all([
      secureStorage.delete(SECURE_KEYS.AUTH_TOKEN),
      secureStorage.delete(SECURE_KEYS.USER_ID),
      secureStorage.delete(SECURE_KEYS.FRAME_ID),
      secureStorage.delete(SECURE_KEYS.USER_EMAIL),
    ]);
  },
};

// History helpers
export const historyStorage = {
  async getHistory<T>(): Promise<T[]> {
    const history = await storage.get<T[]>(STORAGE_KEYS.SCAN_HISTORY);
    return history ?? [];
  },

  async addToHistory<T extends { id: string; product: { barcode: string } }>(item: T): Promise<void> {
    const history = await this.getHistory<T>();
    // Keep only one entry per barcode (the most recent)
    const updated = [item, ...history.filter(h => h.product.barcode !== item.product.barcode)].slice(0, 100);
    await storage.set(STORAGE_KEYS.SCAN_HISTORY, updated);
  },

  async clearHistory(): Promise<void> {
    await storage.delete(STORAGE_KEYS.SCAN_HISTORY);
  },
};

// List selection helpers
export const listStorage = {
  async getSelectedListId(): Promise<string | null> {
    return storage.get<string>(STORAGE_KEYS.SELECTED_LIST_ID);
  },

  async setSelectedListId(listId: string): Promise<void> {
    await storage.set(STORAGE_KEYS.SELECTED_LIST_ID, listId);
  },
};

// Product override helpers
export interface ProductOverride {
  name?: string;
  brand?: string;
  lastListId?: string;
  updatedAt: string;
}

export const productOverrideStorage = {
  async getOverride(barcode: string): Promise<ProductOverride | null> {
    const overrides = await storage.get<Record<string, ProductOverride>>(STORAGE_KEYS.PRODUCT_OVERRIDES);
    return overrides?.[barcode] || null;
  },

  async setOverride(barcode: string, override: { name?: string; brand?: string; lastListId?: string }): Promise<void> {
    const overrides = await storage.get<Record<string, ProductOverride>>(STORAGE_KEYS.PRODUCT_OVERRIDES) || {};
    const existing = overrides[barcode] || {};
    overrides[barcode] = {
      ...existing,
      ...override,
      updatedAt: new Date().toISOString(),
    };
    await storage.set(STORAGE_KEYS.PRODUCT_OVERRIDES, overrides);
  },

  async clearOverride(barcode: string): Promise<void> {
    const overrides = await storage.get<Record<string, ProductOverride>>(STORAGE_KEYS.PRODUCT_OVERRIDES) || {};
    delete overrides[barcode];
    await storage.set(STORAGE_KEYS.PRODUCT_OVERRIDES, overrides);
  },
};
