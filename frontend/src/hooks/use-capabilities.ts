'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { permissionsApi } from '@/lib/api/permissions';
import { queryKeys } from '@/lib/query-keys';

/**
 * Carrega as capacidades do usuário autenticado e expõe um helper para
 * consultá-las.
 *
 * Usado para liberar cards e telas de configuração. Enquanto `isLoading` for
 * `true`, `has` devolve `false`: é melhor esconder um card por um instante do
 * que piscar algo que o usuário não pode acessar.
 *
 * @returns `capabilities`, `isLoading` e `has(code)`.
 */
export function useCapabilities() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.permissions.me,
    queryFn: permissionsApi.myCapabilities,
  });

  const has = useCallback((code: string) => (data ?? []).includes(code), [data]);

  return { capabilities: data ?? [], isLoading, has };
}
