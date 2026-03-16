import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { authApi, userApi } from "../services/api";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role?: string;
  gender?: "male" | "female" | "other" | null;
  address?: string;
  dateOfBirth?: string;
}

const normalizeGender = (value: unknown): User["gender"] => {
  if (value === "male" || value === "female" || value === "other") return value;
  return null;
};

const extractUserPayload = (payload: any) =>
  payload?.data ?? payload?.user ?? payload;

const mapUser = (raw: any): User => ({
  _id: raw?.id || raw?._id || "",
  name: raw?.name || raw?.fullname || "",
  email: raw?.email || "",
  phone: raw?.phone,
  avatar: raw?.avatar,
  role: raw?.role,
  gender: normalizeGender(raw?.gender),
  address: typeof raw?.address === "string" ? raw.address : "",
  dateOfBirth: typeof raw?.dateOfBirth === "string" ? raw.dateOfBirth : "",
});

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateUser: (user: User) => void;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrateUser = useCallback(async (baseUser: User) => {
    if (!baseUser._id) return baseUser;

    try {
      const { data } = await userApi.getById(baseUser._id);
      return {
        ...baseUser,
        ...mapUser(extractUserPayload(data)),
      };
    } catch {
      return baseUser;
    }
  }, []);

  useEffect(() => {
    const restore = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          SecureStore.getItemAsync("accessToken"),
          SecureStore.getItemAsync("user"),
        ]);
        if (savedToken) setToken(savedToken);
        if (savedUser) {
          const restoredUser = mapUser(JSON.parse(savedUser));
          setUser(restoredUser);

          if (savedToken) {
            const hydratedUser = await hydrateUser(restoredUser);
            setUser(hydratedUser);
            await SecureStore.setItemAsync(
              "user",
              JSON.stringify(hydratedUser),
            );
          }
        }
      } catch {
        // ignore restore errors
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, [hydrateUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await authApi.login(email, password);
      const { accessToken, refreshToken, user: userData } = data;
      const mappedUser = mapUser(userData);

      await SecureStore.setItemAsync("accessToken", accessToken);

      if (refreshToken) {
        await SecureStore.setItemAsync("refreshToken", refreshToken);
      }

      const hydratedUser = await hydrateUser(mappedUser);
      await SecureStore.setItemAsync("user", JSON.stringify(hydratedUser));

      setToken(accessToken);
      setUser(hydratedUser);
    },
    [hydrateUser],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* fire and forget */
    }

    // Delete saved auth data
    const deletePromises = [
      SecureStore.deleteItemAsync("accessToken"),
      SecureStore.deleteItemAsync("user"),
    ];

    // Also delete refreshToken if it was saved
    try {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (refreshToken) {
        deletePromises.push(SecureStore.deleteItemAsync("refreshToken"));
      }
    } catch {
      /* ignore */
    }

    await Promise.all(deletePromises);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
    SecureStore.setItemAsync("user", JSON.stringify(updated));
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      await authApi.changePassword({ currentPassword, newPassword });
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
        updateUser,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
