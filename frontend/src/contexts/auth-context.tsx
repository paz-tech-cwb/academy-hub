'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { decodeToken } from '@/lib/jwt';
import { UserRole } from '@/types';

const TOKEN_KEY = 'academy-hub-token';

export interface AuthUser {
  username: string;
  publicId: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratação síncrona do estado a partir do localStorage externo
        setUser(decoded);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (token: string) => {
    const decoded = decodeToken(token);
    if (!decoded) {
      throw new Error('Token de acesso inválido');
    }

    localStorage.setItem(TOKEN_KEY, token);
    setUser(decoded);

    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
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
