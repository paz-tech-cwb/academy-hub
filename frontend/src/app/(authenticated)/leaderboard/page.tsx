'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';

import Navbar from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { usersApi } from '@/lib/api/users';
import { queryKeys } from '@/lib/query-keys';

const PAGE_SIZE = 10;

/**
 * Cores do pódio por posição global.
 *
 * A posição vem da API e não depende da página, então a segunda página já
 * começa na 11ª posição e nenhuma linha aparece colorida. As demais posições
 * (5+) ficam sem cor.
 */
const PODIUM: Record<number, { row: string; text: string }> = {
  1: { row: 'bg-sky-400/20', text: 'text-cyan-600 dark:text-cyan-300' },
  2: { row: 'bg-yellow-400/20', text: 'text-yellow-600 dark:text-yellow-400' },
  3: { row: 'bg-slate-400/20', text: 'text-slate-600 dark:text-slate-300' },
  4: { row: 'bg-yellow-700/20', text: 'text-orange-700 dark:text-orange-400' },
};

export default function LeaderboardPage() {
  const { isReady } = useRequireAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.leaderboard.list(page, PAGE_SIZE),
    queryFn: () => usersApi.getLeaderboard({ page, pageSize: PAGE_SIZE }),
    enabled: isReady,
    // Mantém a página anterior visível enquanto a próxima carrega.
    placeholderData: keepPreviousData,
  });

  const entries = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalCount = data?.totalCount ?? 0;
  const isEmpty = !isLoading && entries.length === 0;

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="h-16 border-b px-4 flex items-center gap-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-5 w-80" />
          <div className="overflow-hidden rounded-md border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b p-4">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground">
            Ranking dos usuários por XP acumulado. Quem tem mais XP fica no topo.
          </p>
        </header>

        <div className="overflow-hidden rounded-md border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Posição</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead className="w-32 text-right">XP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-6 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : entries.length ? (
                entries.map((entry) => {
                  const medal = PODIUM[entry.position];
                  return (
                    <TableRow key={entry.publicId} className={medal?.row}>
                      <TableCell
                        className={`font-bold ${medal?.text ?? 'text-muted-foreground'}`}
                      >
                        {entry.position}
                      </TableCell>
                      <TableCell className="font-medium truncate">{entry.username}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {entry.experience.toLocaleString('pt-BR')} XP
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    Nenhum usuário no ranking ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              {page} de {Math.max(1, totalPages)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={isLoading || isEmpty || page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={isLoading || isEmpty || page >= totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
