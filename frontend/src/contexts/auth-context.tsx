'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api/users';
import { UserProfile } from '@/types';

export interface AuthUser {
  username: string;
  profile: UserProfile | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string, username: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserProfile = async (username: string) => {
    try {
      const profile = await usersApi.getProfile(username);
      setUser({ username, profile });
    } catch {
      setUser({ username, profile: null });
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('academy-hub-token');
    const username = localStorage.getItem('academy-hub-username');

    if (token && username) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratação síncrona do estado a partir do localStorage externo
      setUser({ username, profile: null });
      fetchUserProfile(username).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (token: string, username: string) => {
    localStorage.setItem('academy-hub-token', token);
    localStorage.setItem('academy-hub-username', username);

    setUser({ username, profile: null });
    fetchUserProfile(username).catch(() => {});

    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('academy-hub-token');
    localStorage.removeItem('academy-hub-username');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
