import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { apiService, AuthUser } from '@/services/apiService';
import { storageService } from '@/services/storageService';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { user: currentUser } = await apiService.me();
        const { backup } = await apiService.loadBackup();
        if (backup) await storageService.importAll(backup);
        if (!cancelled) setUser(currentUser);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: async (email, password) => {
      const { user: loggedUser } = await apiService.login(email, password);
      const { backup } = await apiService.loadBackup();
      if (backup) await storageService.importAll(backup);
      setUser(loggedUser);
    },
    logout: async () => {
      await apiService.logout();
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
