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
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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
    
    // Map API response to User interface (id -> _id)
    const mappedUser = {
      _id: userData.id || userData._id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      avatar: userData.avatar,
      role: userData.role,
    };
    
    // Save tokens and user data
    const savePromises = [
      SecureStore.setItemAsync('accessToken', accessToken),
      SecureStore.setItemAsync('user', JSON.stringify(mappedUser)),
    ];
    
    // Only save refreshToken if it exists
    if (refreshToken) {
      savePromises.push(SecureStore.setItemAsync('refreshToken', refreshToken));
    }
    
    await Promise.all(savePromises);
    setToken(accessToken);
    setUser(mappedUser);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* fire and forget */ }
    
    // Delete saved auth data
    const deletePromises = [
      SecureStore.deleteItemAsync('accessToken'),
      SecureStore.deleteItemAsync('user'),
    ];
    
    // Also delete refreshToken if it was saved
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        deletePromises.push(SecureStore.deleteItemAsync('refreshToken'));
      }
    } catch { /* ignore */ }
    
    await Promise.all(deletePromises);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
    SecureStore.setItemAsync('user', JSON.stringify(updated));
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await authApi.changePassword({ currentPassword, newPassword });
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
      changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
