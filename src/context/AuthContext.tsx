// MediCore - Prototype authentication.
//
// PROTOTYPE ONLY: credentials are hardcoded below and checked in the browser.
// Replace with real auth (e.g. Supabase Auth) before any real use.

import React, { createContext, useContext, useState, useCallback } from 'react';
import { UserRole } from '../config/roles';

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
}

interface HardcodedAccount extends AuthUser {
  password: string;
}

export const DEMO_ACCOUNTS: HardcodedAccount[] = [
  {
    name: 'Priya K.',
    email: 'pharmacist@medicore.in',
    password: 'pharma123',
    role: 'pharmacist'
  },
  {
    name: 'Arjun Mehta',
    email: 'customer@medicore.in',
    password: 'customer123',
    role: 'customer'
  }
];

const SESSION_KEY = 'medicore_session_email';

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string, role: UserRole) => LoginResult;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toAuthUser = ({ name, email, role }: HardcodedAccount): AuthUser => ({ name, email, role });

const restoreSession = (): AuthUser | null => {
  try {
    const email = localStorage.getItem(SESSION_KEY);
    const account = DEMO_ACCOUNTS.find(a => a.email === email);
    return account ? toAuthUser(account) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(restoreSession);

  const login = useCallback((email: string, password: string, role: UserRole): LoginResult => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return { success: false, error: 'Enter your email and password.' };
    }

    const account = DEMO_ACCOUNTS.find(
      a => a.email === normalizedEmail && a.password === password && a.role === role
    );

    if (!account) {
      return {
        success: false,
        error: 'Email, password and role do not match an account. Check them and try again.'
      };
    }

    try {
      localStorage.setItem(SESSION_KEY, account.email);
    } catch {
      /* storage unavailable: session just won't survive a refresh */
    }
    setUser(toAuthUser(account));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
