'use client';

import { useState, useEffect } from 'react';
import { UserSession } from '@/types/database.types';
import { authService } from '../services/authService';

const SESSION_STORAGE_KEY = 'huit_internship_user_session';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) setCurrentUser(JSON.parse(saved) as UserSession);
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSession = (session: UserSession | null) => {
    setCurrentUser(session);
    if (session) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const login = async (
    type: 'sinhvien' | 'doanhnghiep' | 'giangvien',
    identifier: string,
    password?: string,
  ): Promise<UserSession> => {
    const session = await authService.login(type, identifier, password);
    saveSession(session);
    return session;
  };

  const logout = async () => {
    await authService.logout();
    saveSession(null);
  };

  return { currentUser, setCurrentUser: saveSession, login, logout, isLoading };
}
