import api from '@/lib/axios';
import { LoginResponse, UserProfile } from '@/types';

export interface AuthCredentials {
  username: string;
  password: string;
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
};
