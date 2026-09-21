import api from '@/lib/axios';
import { AnswerVerifyRequest, Question, VerifyAnswersResponse } from '@/types';

export const questionnaireApi = {
  /**
   * Busca as questões do questionário associado a uma aula.
   *
   * @param unityName - Nome da unidade já codificado para uso em URL.
   * @param lessonName - Nome da aula já codificado para uso em URL.
   * @returns Lista de questões com seus enunciados e alternativas.
   */
  getByLesson: async (unityName: string, lessonName: string) => {
    const { data } = await api.get<Question[]>(
      `/api/questionnaire/${unityName}/${lessonName}`,
    );
    return data;
  },

  /**
   * Verifica as respostas enviadas pelo usuário e calcula o resultado.
   *
   * @param payload - Lição, unidade e respostas selecionadas.
   * @returns Resultado por questão, XP ganho e flags de conclusão.
   */
  verifyAnswers: async (payload: AnswerVerifyRequest) => {
    const { data } = await api.post<VerifyAnswersResponse>(
      '/api/questionnaire/verify-answers',
      payload,
    );
    return data;
  },
};
