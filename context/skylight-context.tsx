import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { login as loginApi, getFrameId, AuthenticatedUser } from '@/services/skylight/auth';
import { getLists, addListItem, getListWithItems, SkylightList, SkylightListItem } from '@/services/skylight/api';
import { authStorage, listStorage } from '@/services/storage';

// Simplified user type for storage/display (we don't need all AuthenticatedUser fields)
interface StoredUser {
  id: string;
  email: string;
}

interface SkylightContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: StoredUser | null;
  lists: SkylightList[];
  selectedList: SkylightList | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshLists: () => Promise<void>;
  selectList: (list: SkylightList) => Promise<void>;
  addItemToList: (label: string, listId?: string) => Promise<void>;
  getListItems: (listId: string) => Promise<SkylightListItem[]>;
}

const SkylightContext = createContext<SkylightContextValue | null>(null);

interface SkylightProviderProps {
  children: ReactNode;
}

export function SkylightProvider({ children }: SkylightProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [lists, setLists] = useState<SkylightList[]>([]);
  const [selectedList, setSelectedList] = useState<SkylightList | null>(null);
  const [session, setSession] = useState<{ authToken: string; frameId: string } | null>(null);

  // Load saved session on mount
  useEffect(() => {
    loadSavedSession();
  }, []);

  const loadSavedSession = async () => {
    try {
      const savedSession = await authStorage.getSession();
      if (savedSession) {
        // savedSession has: token (authToken), frameId, userId, email
        setSession({ authToken: savedSession.token, frameId: savedSession.frameId });
        setUser({ id: savedSession.userId, email: savedSession.email });
        setIsAuthenticated(true);

        // Load lists
        try {
          const userLists = await getLists(savedSession.frameId, savedSession.token);
          setLists(userLists);

          // Restore selected list
          const selectedListId = await listStorage.getSelectedListId();
          if (selectedListId) {
            const list = userLists.find(l => l.id === selectedListId);
            if (list) {
              setSelectedList(list);
            }
          }
        } catch (error) {
          console.error('Failed to load lists:', error);
        }
      }
    } catch {
      // Session expired or invalid, clear it
      await authStorage.clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // First, authenticate
      const loginResult = await loginApi(email, password);
      const { user: authUser, authToken } = loginResult;

      // Then, get the frame ID
      let frameId: string;
      try {
        frameId = await getFrameId(authToken, authUser.id);
      } catch (frameError) {
        console.error('Failed to get frame ID:', frameError);
        throw new Error('Login succeeded but could not find your Skylight frame. Please try again.');
      }

      // Save session
      await authStorage.saveSession(authToken, authUser.id, frameId, authUser.email);

      setSession({ authToken, frameId });
      setUser({ id: authUser.id, email: authUser.email });
      setIsAuthenticated(true);

      // Load lists after login
      try {
        console.log('Fetching lists with frameId:', frameId);
        const userLists = await getLists(frameId, authToken);
        console.log('Lists loaded:', userLists.length);
        setLists(userLists);

        // Auto-select first shopping list or first list
        const shoppingList = userLists.find(l => l.attributes.kind === 'shopping');
        const defaultList = shoppingList || userLists[0];
        if (defaultList) {
          setSelectedList(defaultList);
          await listStorage.setSelectedListId(defaultList.id);
        }
      } catch (listError) {
        console.error('Failed to load lists after login:', listError);
        // Show error to user via Alert
        const errorMessage = listError instanceof Error ? listError.message : 'Unknown error';
        throw new Error(`Login succeeded but failed to load lists: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authStorage.clearSession();
    setSession(null);
    setUser(null);
    setIsAuthenticated(false);
    setLists([]);
    setSelectedList(null);
  }, []);

  const refreshLists = useCallback(async () => {
    if (!session) return;

    try {
      const userLists = await getLists(session.frameId, session.authToken);
      setLists(userLists);

      // Update selected list reference if it still exists
      if (selectedList) {
        const updatedList = userLists.find(l => l.id === selectedList.id);
        setSelectedList(updatedList || null);
      }
    } catch (error) {
      console.error('Failed to refresh lists:', error);
    }
  }, [session, selectedList]);

  const selectList = useCallback(async (list: SkylightList) => {
    setSelectedList(list);
    await listStorage.setSelectedListId(list.id);
  }, []);

  const addItemToListFn = useCallback(
    async (label: string, listId?: string) => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      const targetListId = listId || selectedList?.id;
      if (!targetListId) {
        throw new Error('No list selected');
      }

      await addListItem(session.frameId, targetListId, label, session.authToken);
    },
    [session, selectedList]
  );

  const getListItemsFn = useCallback(
    async (listId: string): Promise<SkylightListItem[]> => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { items } = await getListWithItems(session.frameId, listId, session.authToken);
      return items;
    },
    [session]
  );

  const value: SkylightContextValue = {
    isAuthenticated,
    isLoading,
    user,
    lists,
    selectedList,
    login,
    logout,
    refreshLists,
    selectList,
    addItemToList: addItemToListFn,
    getListItems: getListItemsFn,
  };

  return <SkylightContext.Provider value={value}>{children}</SkylightContext.Provider>;
}

export function useSkylight(): SkylightContextValue {
  const context = useContext(SkylightContext);
  if (!context) {
    throw new Error('useSkylight must be used within a SkylightProvider');
  }
  return context;
}
