import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isOnboarded: boolean;
  completeOnboarding: (userData: Partial<User>) => Promise<void>;
  updateUser: (updated: Partial<User>) => Promise<void>;
  resetUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_STORAGE_KEY = 'coach_hoo_user_data';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Rehydrate local user data on launch ───────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const storedUser = await SecureStore.getItemAsync(USER_STORAGE_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to load user data:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ─── Complete Onboarding ──────────────────────────────────────────────────
  const completeOnboarding = useCallback(async (userData: Partial<User>) => {
    const newUser: User = {
      id: Math.random().toString(36).substring(7),
      email: '', // Not used in account-less mode
      created_at: new Date().toISOString(),
      ...userData,
    } as User;

    await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  // ─── Update User Profile ───────────────────────────────────────────────────
  const updateUser = useCallback(async (updated: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // ─── Reset User (e.g., for fresh start) ───────────────────────────────────
  const resetUser = useCallback(async () => {
    await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isOnboarded: !!user,
      completeOnboarding,
      updateUser,
      resetUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

