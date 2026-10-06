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

function parseRole(role: unknown): UserRole {
  if (typeof role === 'number') return role === UserRole.Admin ? UserRole.Admin : UserRole.User;
  if (typeof role === 'string') {
    if (role === UserRole.Admin.toString() || role === 'Admin') return UserRole.Admin;
    if (role === UserRole.User.toString() || role === 'User') return UserRole.User;
  }
  return UserRole.User;
}
