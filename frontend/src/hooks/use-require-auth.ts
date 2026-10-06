'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types';

/**
 * Garante que a rota só seja exibida para usuários autenticados.
 *
 * Enquanto `loading` for `true`, o hook não faz nada. Assim que terminar
 * de carregar e não houver `user`, redireciona para `/login`.
 *
 * @returns `user`, `loading` e `isReady` (true quando há user e o loading terminou).
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  return { user, loading, isReady: !loading && !!user };
}

/**
 * Garante que a rota só seja exibida para usuários com a role informada.
 *
 * Sem usuário → redireciona para `/login`.
 * Usuário com role diferente → redireciona para `/`.
 *
 * A role vem do token JWT, então não há estado de carregamento adicional.
 *
 * @param role - Role exigida para acessar a rota.
 * @returns `user`, `loading` e `isReady` (true quando há user com a role correta).
 */
export function useRequireRole(role: UserRole) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== role) {
      router.push('/');
    }
  }, [user, loading, role, router]);

  return {
    user,
    loading,
    isReady: !loading && !!user && user.role === role,
  };
}
