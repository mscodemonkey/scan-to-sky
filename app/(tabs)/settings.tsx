import { useState, useCallback } from 'react';
import { StyleSheet, View, TextInput, ScrollView, Alert, Pressable } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSkylight } from '@/context/skylight-context';
import { useToast } from '@/context/toast-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { isAuthenticated, user, login, logout, isLoading, lists, selectedList } = useSkylight();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    try {
      await login(email.trim(), password);
      setEmail('');
      setPassword('');
      showToast('Signed in successfully', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Please check your credentials', 'error');
    }
  }, [email, password, login, showToast]);

  const handleLogout = useCallback(async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  }, [logout]);

  const handleChangeList = useCallback(() => {
    router.push('/list-selector');
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Skylight Account
        </ThemedText>

        {isAuthenticated ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f5f5f5' },
            ]}
          >
            <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
            <ThemedText style={styles.loggedInText}>
              You're connected to Skylight. Scanned items can be added to your shopping lists.
            </ThemedText>
            <Button title="Log Out" variant="secondary" onPress={handleLogout} style={styles.logoutButton} />
          </View>
        ) : (
          <View
            style={[
              styles.card,
              { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f5f5f5' },
            ]}
          >
            <ThemedText style={styles.loginDescription}>
              Sign in with your Skylight account to add scanned items to your shopping lists.
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#ffffff',
                  color: Colors[colorScheme].text,
                },
              ]}
              placeholder="Email"
              placeholderTextColor={Colors[colorScheme].icon}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#ffffff',
                  color: Colors[colorScheme].text,
                },
              ]}
              placeholder="Password"
              placeholderTextColor={Colors[colorScheme].icon}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
            <Button
              title={isLoading ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              disabled={isLoading}
            />
          </View>
        )}
      </ThemedView>

      {isAuthenticated && lists.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Default List
          </ThemedText>

          <Pressable
            style={({ pressed }) => [
              styles.listSelector,
              { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f5f5f5' },
              pressed && styles.listSelectorPressed,
            ]}
            onPress={lists.length > 1 ? handleChangeList : undefined}
            disabled={lists.length <= 1}
          >
            <View style={styles.listSelectorContent}>
              {selectedList?.attributes.color && (
                <View
                  style={[
                    styles.colorIndicator,
                    {
                      backgroundColor: selectedList.attributes.color.startsWith('#')
                        ? selectedList.attributes.color
                        : `#${selectedList.attributes.color}`,
                    },
                  ]}
                />
              )}
              <View style={styles.listInfo}>
                <ThemedText style={styles.listName}>
                  {selectedList?.attributes.label || 'No list selected'}
                </ThemedText>
                {lists.length > 1 && (
                  <ThemedText style={styles.listHint}>
                    {lists.length} lists available
                  </ThemedText>
                )}
              </View>
            </View>
            {lists.length > 1 && (
              <IconSymbol name="chevron.right" size={20} color={Colors[colorScheme].icon} />
            )}
          </Pressable>

          <ThemedText style={styles.listDescription}>
            You can change the list for each scanned item.
          </ThemedText>
        </ThemedView>
      )}

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          About
        </ThemedText>
        <View
          style={[
            styles.card,
            { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f5f5f5' },
          ]}
        >
          <ThemedText style={styles.aboutText}>
            Scan-to-Sky lets you scan grocery barcodes and add them directly to your Skylight shopping lists.
          </ThemedText>
          <ThemedText style={styles.version}>Version 1.0.0</ThemedText>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  loginDescription: {
    opacity: 0.7,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
  },
  loggedInText: {
    opacity: 0.7,
  },
  logoutButton: {},
  listSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  listSelectorPressed: {
    opacity: 0.7,
  },
  listSelectorContent: {
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
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '500',
  },
  listHint: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  listDescription: {
    opacity: 0.6,
    fontSize: 14,
    marginTop: 12,
  },
  aboutText: {
    opacity: 0.7,
    lineHeight: 22,
  },
  version: {
    opacity: 0.5,
    fontSize: 14,
  },
});
