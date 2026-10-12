import { UserRole } from '@/types';

export interface DecodedToken {
  username: string;
  publicId: string;
  role: UserRole;
}

/**
 * Decodifica o payload do JWT sem verificar a assinatura (apenas leitura).
 *
 * O token é a única fonte de dados do usuário autenticado: `nickname`
 * (username), `nameid` (publicId) e `role`.
 *
 * @param token - JWT bruto (header.payload.signature).
 * @returns Dados extraídos ou `null` se o token for inválido/expirado.
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const claims: Record<string, unknown> = JSON.parse(
      new TextDecoder().decode(bytes),
    );

    const exp = typeof claims.exp === 'number' ? claims.exp : null;
    if (exp !== null && exp * 1000 <= Date.now()) return null;

    const username = claims.nickname;
    const publicId = claims.nameid;
    if (typeof username !== 'string' || typeof publicId !== 'string') {
      return null;
    }

    const roleClaim =
      claims.role ??
      claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    return { username, publicId, role: parseRole(roleClaim) };
  } catch {
    return null;
  }
}

/**
 * O claim `role` chega como o nome do enum do backend (`"Admin"`), mas a
 * forma numérica também é aceita.
 *
 * Função criada em runtime (id >= 4) não existe no enum e cai em
 * `UserRole.User`. Isso não afeta permissão: o enforcement é no servidor e a
 * UI é liberada por capacidade, não por função.
 */
function parseRole(role: unknown): UserRole {
  const byName: Record<string, UserRole> = {
    User: UserRole.User,
    Admin: UserRole.Admin,
    Professor: UserRole.Professor,
  };

  if (typeof role === 'number') {
    return Object.values(UserRole).includes(role) ? (role as UserRole) : UserRole.User;
  }

  if (typeof role === 'string') {
    if (role in byName) return byName[role];

    const numeric = Number(role);
    if (!Number.isNaN(numeric) && Object.values(UserRole).includes(numeric)) {
      return numeric as UserRole;
    }
  }

  return UserRole.User;
}
