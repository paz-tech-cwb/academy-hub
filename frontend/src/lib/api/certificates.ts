import api from '@/lib/axios';
import { CertificateResponse } from '@/types';

export const certificatesApi = {
  /**
   * Lista todos os certificados emitidos para o usuário autenticado.
   *
   * @returns Array de certificados com nome da unidade e data de emissão.
   */
  list: async () => {
    const { data } = await api.get<CertificateResponse[]>('/api/certificate');
    return data;
  },

  /**
   * Solicita a emissão de um certificado para a unidade informada.
   *
   * Só deve ser chamado quando o usuário concluiu todas as aulas e
   * questionários da unidade. A API valida a elegibilidade.
   *
   * @param unityName - Nome da unidade já codificado para uso em URL.
   * @returns Resposta da API após a emissão.
   */
  issue: async (unityName: string) => {
    const { data } = await api.post(
      `/api/certificate/issue?unityName=${unityName}`,
    );
    return data;
  },
};
