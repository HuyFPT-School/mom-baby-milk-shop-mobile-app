import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          SecureStore.getItemAsync('accessToken'),
          SecureStore.getItemAsync('user'),
        ]);
        if (savedToken) setToken(savedToken);
        if (savedUser) setUser(JSON.parse(savedUser));
      } catch {
        // ignore restore errors
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    const { accessToken, refreshToken, user: userData } = data;
    await Promise.all([
      SecureStore.setItemAsync('accessToken', accessToken),
      SecureStore.setItemAsync('refreshToken', refreshToken),
      SecureStore.setItemAsync('user', JSON.stringify(userData)),
    ]);
    setToken(accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* fire and forget */ }
    await Promise.all([
      SecureStore.deleteItemAsync('accessToken'),
      SecureStore.deleteItemAsync('refreshToken'),
      SecureStore.deleteItemAsync('user'),
    ]);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
    SecureStore.setItemAsync('user', JSON.stringify(updated));
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      isAuthenticated: !!token,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
