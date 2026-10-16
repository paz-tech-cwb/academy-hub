import api from '@/lib/axios';
import {
  CoverCrop,
  LoginResponse,
  MyProfile,
  PaginatedLeaderboard,
  PaginatedUsers,
  UpdateMyProfileInput,
  UpdateUserInput,
  UserProfile,
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
  rolePublicId?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ListLeaderboardParams {
  page?: number;
  pageSize?: number;
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
   * Lista usuários paginados com filtros opcionais (admin).
   *
   * @param params - Página, tamanho e filtros de username/status/função.
   * @returns Lista paginada de usuários.
   */
  listUsers: async (params: ListUsersParams = {}) => {
    const { data } = await api.get<PaginatedUsers>('/api/user', {
      params,
    });
    return data;
  },

  /**
   * Busca o perfil público de um usuário. Não exige autenticação.
   *
   * @param username - Username do usuário, como aparece na URL.
   * @returns O perfil, ou `null` quando o usuário não existe (a API responde 204).
   */
  getProfile: async (username: string) => {
    const { data, status } = await api.get<UserProfile>(
      `/api/user/${encodeURIComponent(username)}`,
    );
    return status === 204 ? null : data;
  },

  /**
   * Busca os dados editáveis do próprio perfil, incluindo o e-mail.
   *
   * @returns Foto, "sobre mim", Instagram e e-mail do usuário autenticado.
   */
  getMyProfile: async () => {
    const { data } = await api.get<MyProfile>('/api/me/profile');
    return data;
  },

  /**
   * Substitui o "sobre mim", o Instagram e o e-mail do próprio usuário. Valores nulos limpam o campo.
   *
   * @param payload - Os três campos, sempre enviados juntos.
   */
  updateMyProfile: async (payload: UpdateMyProfileInput) => {
    await api.put('/api/me/profile', payload);
  },

  /**
   * Envia a foto de perfil já recortada em quadrado.
   *
   * @param image - Imagem recortada.
   * @param fileName - Nome do arquivo enviado no multipart.
   * @returns A nova URL pública da foto.
   */
  uploadProfilePic: async (image: Blob, fileName: string) => {
    const form = new FormData();
    form.append('file', image, fileName);
    const { data } = await api.put<{ profilePicUrl: string }>('/api/me/profile-pic', form);
    return data;
  },

  /**
   * Define a foto de perfil a partir de uma imagem da internet. A API baixa, recorta na área
   * informada e grava no bucket.
   *
   * @param url - URL pública da imagem.
   * @param crop - Área de recorte quadrada em pixels da imagem original.
   * @returns A nova URL pública da foto.
   */
  setProfilePicFromUrl: async (url: string, crop: CoverCrop) => {
    const { data } = await api.put<{ profilePicUrl: string }>('/api/me/profile-pic/url', {
      url,
      cropX: crop.x,
      cropY: crop.y,
      cropWidth: crop.width,
      cropHeight: crop.height,
    });
    return data;
  },

  /** Remove a foto de perfil do próprio usuário. */
  removeProfilePic: async () => {
    await api.delete('/api/me/profile-pic');
  },

  /**
   * Busca o ranking global de usuários por XP.
   *
   * @param params - Página e tamanho da página.
   * @returns Lista paginada com a posição global de cada usuário.
   */
  getLeaderboard: async (params: ListLeaderboardParams = {}) => {
    const { data } = await api.get<PaginatedLeaderboard>('/api/user/leaderboard', {
      params,
    });
    return data;
  },

  /**
   * Atualiza status e/ou função de um usuário (admin).
   *
   * @param publicId - PublicId do usuário.
   * @param payload - Campos a atualizar.
   */
  updateUser: async (publicId: string, payload: UpdateUserInput) => {
    await api.put(`/api/user/${publicId}`, payload);
  },

  /**
   * Troca a senha do próprio usuário autenticado.
   *
   * Disponível para qualquer usuário logado, sem exigir funcionalidade. A API
   * exige a senha atual; quando ela está errada a resposta é 400 com
   * `message`, e não 401, então o interceptor não desloga ninguém.
   *
   * @param payload - Senha atual e nova senha em texto plano.
   */
  changeOwnPassword: async (payload: ChangePasswordInput) => {
    await api.put('/api/me/password', payload);
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
