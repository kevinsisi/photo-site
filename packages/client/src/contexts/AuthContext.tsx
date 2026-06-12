import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export interface AuthState {
  loggedIn: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/me', {
      credentials: 'include',
      signal: AbortSignal.timeout(10_000),
    })
      .then((res) => {
        setLoggedIn(res.status === 200);
      })
      .catch(() => {
        setLoggedIn(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = (data as { error?: string; message?: string }).error ?? (data as { message?: string }).message;
      throw new Error(msg ?? `登入失敗 (${res.status})`);
    }
    setLoggedIn(true);
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
      signal: AbortSignal.timeout(10_000),
    }).catch(() => {
      // best-effort logout
    });
    setLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ loggedIn, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
