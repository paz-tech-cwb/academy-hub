import api from '@/lib/axios';
import {
  AdminLesson,
  CreateLessonInput,
  Lesson,
  LessonDetail,
  UpdateLessonInput,
} from '@/types';

export const lessonsApi = {
  /**
   * Lista as aulas de uma unidade.
   *
   * @param unityName - Nome da unidade já codificado para uso em URL.
   * @returns Array de aulas com título e flag de conclusão.
   */
  listByUnity: async (unityName: string) => {
    const { data } = await api.get<Lesson[]>(
      `/api/lesson/list/${unityName}`,
    );
    return data;
  },

  /**
   * Busca os detalhes de uma aula específica.
   *
   * @param unityName - Nome da unidade já codificado para uso em URL.
   * @param lessonName - Nome da aula já codificado para uso em URL.
   * @returns Detalhes da aula (título, descrição, vídeo e status).
   */
  getByName: async (unityName: string, lessonName: string) => {
    const { data } = await api.get<LessonDetail>(
      `/api/lesson/${unityName}/${lessonName}`,
    );
    return data;
  },

  /**
   * Cria uma nova aula dentro de uma unidade (admin).
   */
  create: async (payload: CreateLessonInput) => {
    await api.post('/api/admin/lesson', payload);
  },

  /**
   * Atualiza uma aula (admin).
   */
  update: async (publicId: string, payload: UpdateLessonInput) => {
    await api.put(`/api/admin/lesson/${publicId}`, payload);
  },

  /**
   * Remove uma aula e seus vínculos em cascata (admin).
   */
  remove: async (publicId: string) => {
    await api.delete(`/api/admin/lesson/${publicId}`);
  },

  /**
   * Busca a árvore completa da aula para o editor admin (questões +
   * alternativas com `isCorrect`). Requer role de admin.
   */
  getAdminDetail: async (publicId: string) => {
    const { data } = await api.get<AdminLesson>(`/api/admin/lesson/${publicId}`);
    return data;
  },
};
