import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/api';
import type { User, RegisterPayload } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login:    (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout:   () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Rehydrate session on launch ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('auth_token');
        if (storedToken) {
          setToken(storedToken);
          const { data } = await authApi.me();
          setUser(data.user);
        }
      } catch (_) {
        await SecureStore.deleteItemAsync('auth_token');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    await SecureStore.setItemAsync('auth_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  // ─── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(async (payload: RegisterPayload) => {
    const { data } = await authApi.register(payload);
    await SecureStore.setItemAsync('auth_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('auth_token');
    setToken(null);
    setUser(null);
  }, []);

  // ─── Local user update (after profile edit) ───────────────────────────────
  const updateUser = useCallback((updated: Partial<User>) => {
    setUser((prev) => prev ? { ...prev, ...updated } : prev);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user,
      login, register, logout, updateUser,
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
