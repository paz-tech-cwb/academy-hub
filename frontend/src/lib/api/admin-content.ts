import api from '@/lib/axios';
import {
  CreateAlternativeInput,
  CreateQuestionInput,
  UpdateAlternativeInput,
  UpdateQuestionInput,
} from '@/types';

export const adminContentApi = {
  /**
   * Cria uma questão dentro de uma aula (admin).
   */
  createQuestion: async (payload: CreateQuestionInput) => {
    await api.post('/api/admin/question', payload);
  },

  /**
   * Atualiza o enunciado de uma questão (admin).
   */
  updateQuestion: async (publicId: string, payload: UpdateQuestionInput) => {
    await api.put(`/api/admin/question/${publicId}`, payload);
  },

  /**
   * Remove uma questão e seus vínculos em cascata (admin).
   */
  deleteQuestion: async (publicId: string) => {
    await api.delete(`/api/admin/question/${publicId}`);
  },

  /**
   * Cria uma alternativa. Se `isCorrect` for true, desmarca as demais da questão (admin).
   */
  createAlternative: async (payload: CreateAlternativeInput) => {
    await api.post('/api/admin/alternative', payload);
  },

  /**
   * Atualiza texto/corretude de uma alternativa (admin).
   */
  updateAlternative: async (publicId: string, payload: UpdateAlternativeInput) => {
    await api.put(`/api/admin/alternative/${publicId}`, payload);
  },

  /**
   * Remove uma alternativa e as respostas vinculadas (admin).
   */
  deleteAlternative: async (publicId: string) => {
    await api.delete(`/api/admin/alternative/${publicId}`);
  },
};