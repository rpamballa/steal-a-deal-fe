import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  api,
  clearAuthSession,
  getRefreshToken,
  setAuthSession,
  type AuthResponse,
  type CurrentUser,
  type RegisterRequest,
} from '../api';

type AuthStatus = 'loading' | 'authed' | 'guest';

type AuthContextValue = {
  user: CurrentUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<CurrentUser>;
  register: (payload: RegisterRequest) => Promise<CurrentUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(auth: AuthResponse): CurrentUser {
  return {
    userId: auth.userId,
    displayName: auth.displayName,
    email: auth.email,
    role: auth.role,
    dealerId: auth.dealerId,
  };
}

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setStatus('guest');
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const auth = await api.login({email, password});
    setAuthSession({token: auth.token, refreshToken: auth.refreshToken});
    const next = toUser(auth);
    setUser(next);
    setStatus('authed');
    return next;
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    const auth = await api.registerAccount(payload);
    setAuthSession({token: auth.token, refreshToken: auth.refreshToken});
    const next = toUser(auth);
    setUser(next);
    setStatus('authed');
    return next;
  }, []);

  // Bootstrap: tokens are in-memory only, so a hard refresh starts as a
  // guest. If a refresh token somehow exists (same session), recover the
  // session via refresh -> /api/auth/me.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getRefreshToken()) {
        setStatus('guest');
        return;
      }
      try {
        const me = await api.getCurrentUser();
        if (!cancelled) {
          setUser(me);
          setStatus('authed');
        }
      } catch {
        if (!cancelled) {
          clearAuthSession();
          setStatus('guest');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // The API layer signals forced logout (failed/absent refresh on 401).
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setStatus('guest');
    };
    window.addEventListener('stealadeal:unauthorized', onUnauthorized);
    return () =>
      window.removeEventListener('stealadeal:unauthorized', onUnauthorized);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({user, status, login, register, logout}),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
