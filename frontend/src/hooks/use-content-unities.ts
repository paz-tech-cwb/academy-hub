'use client';

import { useQuery } from '@tanstack/react-query';
import { useCapabilities } from '@/hooks/use-capabilities';
import { unitiesApi } from '@/lib/api/unities';
import { queryKeys } from '@/lib/query-keys';

/**
 * Carrega as unidades exibidas na configuração de conteúdos.
 *
 * Quem visualiza (`content.read`) ou gerencia (`content.manage`) conteúdos recebe também as
 * unidades inativas; os demais recebem só as ativas. A busca espera as capacidades carregarem
 * para não mostrar a lista errada por um instante.
 *
 * @returns `unities` e `isLoading`, que fica `true` também enquanto as capacidades carregam.
 */
export function useContentUnities() {
  const { has, isLoading: capabilitiesLoading } = useCapabilities();
  const canListInactiveUnities = has('content.manage') || has('content.read');

  const { data, isLoading } = useQuery({
    queryKey: canListInactiveUnities ? queryKeys.unities.management : queryKeys.unities.all,
    queryFn: canListInactiveUnities ? unitiesApi.listForManagement : unitiesApi.list,
    enabled: !capabilitiesLoading,
  });

  return { unities: data, isLoading: capabilitiesLoading || isLoading };
}
