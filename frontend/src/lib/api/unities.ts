import api from '@/lib/axios';
import { CreateUnityInput, Unity, UnityDetail, UpdateUnityInput } from '@/types';

export const unitiesApi = {
  /**
   * Lista todas as unidades disponíveis para o usuário autenticado.
   *
   * @returns Array de unidades com nome, descrição e capa.
   */
  list: async () => {
    const { data } = await api.get<Unity[]>('/api/unity');
    return data;
  },

  /**
   * Busca os detalhes de uma unidade específica.
   *
   * @param unityName - Nome da unidade já codificado para uso em URL.
   * @returns Detalhes da unidade, incluindo status do certificado.
   */
  getByName: async (unityName: string) => {
    const { data } = await api.get<UnityDetail>(`/api/unity/${unityName}`);
    return data;
  },

  /**
   * Importa uma playlist do YouTube como uma nova unidade.
   *
   * @param playlistUrl - URL bruta da playlist (será codificada internamente).
   * @returns Resposta da API após a importação.
   */
  importPlaylist: async (playlistUrl: string) => {
    const encoded = encodeURIComponent(playlistUrl);
    const { data } = await api.post(`/api/playlist/import/${encoded}`);
    return data;
  },

  /**
   * Cria uma nova unidade (admin).
   */
  create: async (payload: CreateUnityInput) => {
    await api.post('/api/admin/unity', payload);
  },

  /**
   * Atualiza uma unidade (admin).
   *
   * @param publicId - PublicId da unidade.
   */
  update: async (publicId: string, payload: UpdateUnityInput) => {
    await api.put(`/api/admin/unity/${publicId}`, payload);
  },

  /**
   * Remove uma unidade e todos os seus vínculos em cascata (admin).
   */
  remove: async (publicId: string) => {
    await api.delete(`/api/admin/unity/${publicId}`);
  },
};
