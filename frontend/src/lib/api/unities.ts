import api from '@/lib/axios';
import { CoverCrop, CreateUnityInput, Unity, UnityDetail, UpdateUnityInput } from '@/types';

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
   *
   * @returns A unidade criada, com o `publicId` gerado.
   */
  create: async (payload: CreateUnityInput) => {
    const { data } = await api.post<Unity>('/api/unity', payload);
    return data;
  },

  /**
   * Atualiza uma unidade (admin).
   *
   * @param publicId - PublicId da unidade.
   */
  update: async (publicId: string, payload: UpdateUnityInput) => {
    await api.put(`/api/unity/${publicId}`, payload);
  },

  /**
   * Remove uma unidade e todos os seus vínculos em cascata (admin).
   */
  remove: async (publicId: string) => {
    await api.delete(`/api/unity/${publicId}`);
  },

  /**
   * Envia a capa da unidade já recortada em 16:9 (PNG, JPG ou WebP de até 2 MB).
   *
   * @param publicId - PublicId da unidade.
   * @param image - Imagem recortada.
   * @param fileName - Nome do arquivo enviado no multipart.
   * @returns A nova URL pública da capa.
   */
  uploadCover: async (publicId: string, image: Blob, fileName: string) => {
    const form = new FormData();
    form.append('file', image, fileName);
    const { data } = await api.put<{ coverUrl: string }>(`/api/unity/${publicId}/cover`, form);
    return data;
  },

  /**
   * Define a capa a partir de uma imagem da internet. A API baixa, recorta na área
   * informada e grava no bucket.
   *
   * @param publicId - PublicId da unidade.
   * @param url - URL pública da imagem.
   * @param crop - Área de recorte em pixels da imagem original.
   * @returns A nova URL pública da capa.
   */
  setCoverFromUrl: async (publicId: string, url: string, crop: CoverCrop) => {
    const { data } = await api.put<{ coverUrl: string }>(`/api/unity/${publicId}/cover/url`, {
      url,
      cropX: crop.x,
      cropY: crop.y,
      cropWidth: crop.width,
      cropHeight: crop.height,
    });
    return data;
  },

  /**
   * Remove a capa da unidade.
   *
   * @param publicId - PublicId da unidade.
   */
  removeCover: async (publicId: string) => {
    await api.delete(`/api/unity/${publicId}/cover`);
  },
};
