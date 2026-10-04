import api from '@/lib/axios';
import {
  LoginResponse,
  PaginatedUsers,
  UpdateUserInput,
  UserProfile,
  UserRole,
} from '@/types';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface ListUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: boolean;
  role?: UserRole;
}

export const usersApi = {
  /**
   * Autentica o usuário na API.
   *
   * @param credentials - `username` e `password` informados no formulário.
   * @returns Dados de autenticação (`accessToken`, `isLogged`, `message`) e o `username`.
   */
  login: async (credentials: AuthCredentials) => {
    const { data } = await api.post<LoginResponse & { username: string }>(
      '/api/user/login',
      credentials,
    );
    return data;
  },

  /**
   * Cria um novo usuário na API.
   *
   * @param credentials - `username` e `password` para a nova conta.
   * @returns Mensagem de sucesso retornada pela API.
   */
  register: async (credentials: AuthCredentials) => {
    const { data } = await api.post<string>('/api/user/register', credentials);
    return data;
  },

  /**
   * Busca o perfil completo de um usuário.
   *
   * @param username - Nome de usuário a consultar.
   * @returns Perfil com nível, XP, foto e role.
   */
  getProfile: async (username: string) => {
    const { data } = await api.get<UserProfile>(`/api/user/${username}`);
    return data;
  },

  /**
   * Lista usuários paginados com filtros opcionais (admin).
   *
   * @param params - Página, tamanho e filtros de username/status/role.
   * @returns Lista paginada de usuários.
   */
  listUsers: async (params: ListUsersParams = {}) => {
    const { data } = await api.get<PaginatedUsers>('/api/user', {
      params,
    });
    return data;
  },

  /**
   * Atualiza status e/ou role de um usuário (admin).
   *
   * @param publicId - PublicId do usuário.
   * @param payload - Campos a atualizar.
   */
  updateUser: async (publicId: string, payload: UpdateUserInput) => {
    await api.put(`/api/user/${publicId}`, payload);
  },

  /**
   * Redefine a senha de um usuário (admin).
   *
   * @param publicId - PublicId do usuário.
   * @param newPassword - Nova senha em texto plano.
   */
  resetUserPassword: async (publicId: string, newPassword: string) => {
    await api.put(`/api/user/${publicId}/password`, { newPassword });
  },
};
