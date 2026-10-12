import api from '@/lib/axios';
import { Capability, CreateRoleInput, Role, UpdateRoleInput } from '@/types';

export const permissionsApi = {
  /**
   * Capacidades liberadas para o usuário autenticado.
   *
   * É o sinal que o front usa para decidir quais cards de configuração exibir.
   * Usuário sem nenhuma capacidade recebe uma lista vazia, não um erro.
   *
   * @returns Array de códigos (ex.: `content.manage`).
   */
  myCapabilities: async () => {
    const { data } = await api.get<string[]>('/api/me/capabilities');
    return data;
  },

  /**
   * Lista todas as funções com as funcionalidades vinculadas.
   */
  listRoles: async () => {
    const { data } = await api.get<Role[]>('/api/role');
    return data;
  },

  /**
   * Cria uma função sem funcionalidades vinculadas.
   */
  createRole: async (payload: CreateRoleInput) => {
    await api.post('/api/role', payload);
  },

  /**
   * Atualiza nome e descrição de uma função.
   *
   * @param publicId - PublicId da função.
   */
  updateRole: async (publicId: string, payload: UpdateRoleInput) => {
    await api.put(`/api/role/${publicId}`, payload);
  },

  /**
   * Exclui uma função que não seja do sistema e não tenha usuários vinculados.
   */
  removeRole: async (publicId: string) => {
    await api.delete(`/api/role/${publicId}`);
  },

  /**
   * Vincula uma funcionalidade à função. Idempotente.
   */
  attachCapability: async (rolePublicId: string, capabilityPublicId: string) => {
    await api.post(`/api/role/${rolePublicId}/capability`, { capabilityPublicId });
  },

  /**
   * Remove o vínculo entre função e funcionalidade. A função Admin não aceita
   * remoção, porque sempre tem acesso total.
   */
  detachCapability: async (rolePublicId: string, capabilityPublicId: string) => {
    await api.delete(`/api/role/${rolePublicId}/capability/${capabilityPublicId}`);
  },

  /**
   * Lista o catálogo de funcionalidades.
   *
   * Somente leitura: o catálogo é definido em código, então não há criação,
   * edição nem exclusão pela API.
   */
  listCapabilities: async () => {
    const { data } = await api.get<Capability[]>('/api/capability');
    return data;
  },
};
