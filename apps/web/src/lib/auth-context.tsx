'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserDTO, StudentProfileDTO } from '@campusface/shared';
import { apiClient } from './api';

interface AuthUser extends UserDTO {
  student?: StudentProfileDTO | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const data = await apiClient<{ user: AuthUser }>('/auth/me');
      setUser(data.user);
    } catch (err) {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('campusface_auth_token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = (token: string, userData: AuthUser) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('campusface_auth_token', token);
    }
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('campusface_auth_token');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
