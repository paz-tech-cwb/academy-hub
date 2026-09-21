/**
 * Factory centralizado de chaves usadas pelo TanStack Query.
 *
 * Centralizar as chaves aqui evita strings espalhadas pelas páginas e
 * mantém os `invalidateQueries` consistentes (mesma chave em todo lugar).
 * Cada função retorna uma tupla `as const` para preservar a inferência
 * de tipo nos hooks `useQuery`/`useMutation`.
 */
export const queryKeys = {
  user: {
    /** Chave do perfil de um usuário específico. */
    profile: (username: string) => ['user', 'profile', username] as const,
  },
  unities: {
    /** Chave da listagem de todas as unidades. */
    all: ['unities'] as const,
    /** Chave do detalhe de uma unidade específica. */
    detail: (name: string) => ['unity', name] as const,
  },
  lessons: {
    /** Chave da lista de aulas de uma unidade. */
    list: (unityName: string) => ['lessons', unityName] as const,
    /** Chave do detalhe de uma aula. */
    detail: (unityName: string, lessonName: string) =>
      ['lesson', unityName, lessonName] as const,
  },
  questionnaire: {
    /** Chave das questões associadas a uma aula. */
    byLesson: (unityName: string, lessonName: string) =>
      ['questions', unityName, lessonName] as const,
  },
  adminLesson: {
    /** Chave da árvore admin de uma aula (questões com alternativas corretas). */
    detail: (publicId: string) => ['admin-lesson', publicId] as const,
  },
  certificates: {
    /** Chave da listagem de certificados do usuário. */
    all: ['certificates'] as const,
  },
};
