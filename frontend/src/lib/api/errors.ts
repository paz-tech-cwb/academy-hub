import axios from 'axios';

/**
 * Indica se o erro é uma resposta 404 da API.
 *
 * @param error - Valor lançado pela requisição (tipado como `unknown`).
 * @returns `true` quando a API respondeu 404.
 */
export function isNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

/**
 * Extrai a mensagem de erro de uma resposta da API.
 *
 * Se o erro for um `AxiosError` com payload `{ message }` no body da resposta,
 * retorna essa mensagem. Para payloads de validação (`ValidationProblemDetails`,
 * `{ errors: { Campo: ["mensagem"] } }`), concatena as mensagens. Caso contrário,
 * retorna o `fallback` informado.
 *
 * @param error - Valor lançado em um bloco `catch` (tipado como `unknown`).
 * @param fallback - Mensagem padrão exibida quando não há `message` no erro.
 * @returns Mensagem amigável pronta para ser exibida ao usuário.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    if (data?.message) return data.message;

    const validationMessages = data?.errors ? Object.values(data.errors).flat() : [];
    if (validationMessages.length) return validationMessages.join(' ');
  }
  return fallback;
}
