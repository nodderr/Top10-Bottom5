'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  AuthUser,
  fetchMe,
  loginRequest,
  logoutRequest,
  registerRequest,
} from '@/lib/auth/client';

interface AuthState {
  user: AuthUser | null;
  loading: boolean; // true on first /me probe
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: {
    email: string;
    password: string;
    handle: string;
    displayName: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser?: AuthUser | null;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<AuthState>({
    user: initialUser ?? null,
    loading: initialUser === undefined,
  });

  const refresh = useCallback(async () => {
    try {
      const user = await fetchMe();
      setState({ user, loading: false });
    } catch {
      setState({ user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    if (initialUser === undefined) {
      void refresh();
    }
  }, [initialUser, refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const user = await loginRequest(email, password);
    setState({ user, loading: false });
    return user;
  }, []);

  const register = useCallback(
    async (input: { email: string; password: string; handle: string; displayName: string }) => {
      const user = await registerRequest(input);
      setState({ user, loading: false });
      return user;
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    setState({ user: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
