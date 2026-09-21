'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unitiesApi } from '@/lib/api/unities';
import { queryKeys } from '@/lib/query-keys';
import { getApiErrorMessage } from '@/lib/api/errors';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Navbar from '@/components/layout/navbar';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { UserRole, Unity } from '@/types';
import { UnityDialog } from '@/components/admin/unity-dialog';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { toast } from 'sonner';

export default function HomePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.profile?.role === UserRole.Admin;

  const [unityDialogOpen, setUnityDialogOpen] = useState(false);
  const [editingUnity, setEditingUnity] = useState<Unity | null>(null);
  const [unityToDelete, setUnityToDelete] = useState<Unity | null>(null);

  const { data: unities, isLoading } = useQuery({
    queryKey: queryKeys.unities.all,
    queryFn: unitiesApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (publicId: string) => unitiesApi.remove(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.unities.all });
      toast.success('Unidade excluída.');
      setUnityToDelete(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Falha ao excluir a unidade.'));
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-8">
          {isLoading ? (
            <>
              <Skeleton className="h-9 w-72 mb-2" />
              <Skeleton className="h-5 w-56" />
            </>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Treinamentos Disponíveis</h1>
                <p className="text-muted-foreground">Escolha uma unidade para começar a aprender.</p>
              </div>
              {isAdmin && (
                <Button
                  onClick={() => {
                    setEditingUnity(null);
                    setUnityDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Nova Unidade
                </Button>
              )}
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} variant="interactive" className="group">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </CardHeader>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}

          {unities?.map((unity) => (
            <Card key={unity.publicId} variant="interactive" className="group">
              <div className="h-48 bg-muted relative">
                {unity.unityCover ? (
                  <Image
                    src={unity.unityCover}
                    alt={unity.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-secondary/20">
                    <BookOpen className="w-12 h-12 text-primary/40" />
                  </div>
                )}
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="w-8 h-8"
                      onClick={() => {
                        setEditingUnity(unity);
                        setUnityDialogOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="sr-only">Editar unidade</span>
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="w-8 h-8"
                      onClick={() => setUnityToDelete(unity)}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Excluir unidade</span>
                    </Button>
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle>{unity.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {unity.description || 'Nenhuma descrição disponível.'}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-between items-center gap-4">
                <Button asChild className="w-full group-hover:bg-primary transition-colors">
                  <Link href={`/unity/${encodeURIComponent(unity.name)}`}>
                    Ver Aulas
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {unities?.length === 0 && (
          <div className="text-center py-20 bg-card rounded-lg border-2 border-dashed">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma unidade encontrada</h2>
            <p className="text-muted-foreground">Novos conteúdos serão adicionados em breve.</p>
          </div>
        )}
      </main>

      {unityDialogOpen && <UnityDialog open onOpenChange={setUnityDialogOpen} unity={editingUnity} />}

      <ConfirmDialog
        open={!!unityToDelete}
        onOpenChange={(open) => {
          if (!open) setUnityToDelete(null);
        }}
        title="Excluir unidade"
        description={`Excluir "${unityToDelete?.name}" também removerá todas as aulas, questões, alternativas, respostas e certificados relacionados. Esta ação não pode ser desfeita.`}
        isLoading={deleteMutation.isPending}
        onConfirm={() => unityToDelete && deleteMutation.mutate(unityToDelete.publicId)}
      />
    </div>
  );
}
