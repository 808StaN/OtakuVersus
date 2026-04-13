import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginApi, me, register as registerApi } from '../../api/auth-api';
import { AuthUser } from '../../types/api';
import { clearStoredToken, getStoredToken, setStoredToken } from '../../utils/token-storage';

type AuthContextType = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; nickname: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await me(token);
        setUser(response.user);
      } catch (_error) {
        clearStoredToken();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, [token]);

  const value = useMemo<AuthContextType>(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login: async (payload) => {
        const response = await loginApi(payload);
        setStoredToken(response.token);
        setToken(response.token);
        setUser(response.user);
      },
      register: async (payload) => {
        const response = await registerApi(payload);
        setStoredToken(response.token);
        setToken(response.token);
        setUser(response.user);
      },
      logout: () => {
        clearStoredToken();
        setToken(null);
        setUser(null);
      }
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
