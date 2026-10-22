'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useContentUnities } from '@/hooks/use-content-unities';
import { unitiesApi } from '@/lib/api/unities';
import { lessonsApi } from '@/lib/api/lessons';
import { queryKeys } from '@/lib/query-keys';
import { getApiErrorMessage } from '@/lib/api/errors';
import { ContentSettingsShell } from '@/components/admin/content-settings-shell';
import { UnityForm } from '@/components/admin/unity-form';
import { LessonsTable } from '@/components/admin/lessons-table';
import { LessonDialog } from '@/components/admin/lesson-dialog';
import { LessonEditorDialog } from '@/components/admin/lesson-editor-dialog';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

const CONTENT_SETTINGS_HREF = '/settings/content';

export default function UnityContentSettingsPage() {
  const params = useParams();
  const unityId = params.unityId as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { has } = useCapabilities();
  const canManageContent = has('content.manage');

  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { unities, isLoading: unitiesLoading } = useContentUnities();

  const unity = unities?.find((item) => item.publicId === unityId) ?? null;

  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: queryKeys.lessons.list(unity?.name ?? ''),
    queryFn: () => lessonsApi.listByUnity(unity!.name),
    enabled: !!unity?.name,
  });

  const lessons = useMemo(
    () => (lessonsData ? [...lessonsData].sort((a, b) => a.sequence - b.sequence) : undefined),
    [lessonsData],
  );

  const openLessonIndex = lessons?.findIndex((lesson) => lesson.publicId === openLessonId) ?? -1;
  const openLesson = openLessonIndex >= 0 ? lessons![openLessonIndex] : null;

  const deleteUnityMutation = useMutation({
    mutationFn: () => unitiesApi.remove(unityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.unities.all });
      toast.success('Unidade excluída.');
      router.push(CONTENT_SETTINGS_HREF);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Falha ao excluir a unidade.'));
    },
  });

  if (!unitiesLoading && !unity) {
    return (
      <ContentSettingsShell title="Unidade não encontrada" description="A unidade pode ter sido excluída.">
        <Button asChild variant="outline">
          <Link href={CONTENT_SETTINGS_HREF}>Voltar para as unidades</Link>
        </Button>
      </ContentSettingsShell>
    );
  }

  return (
    <ContentSettingsShell
      currentPage={unity?.name ?? 'Unidade'}
      title={unity?.name ?? 'Unidade'}
      description="Edite os dados da unidade e organize as aulas. Use a ação de cada aula para editar os dados dela, as questões e as alternativas."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados da unidade</CardTitle>
          </CardHeader>
          <CardContent>
            {unity ? (
              <UnityForm key={unity.publicId} unity={unity} readOnly={!canManageContent} />
            ) : (
              <Skeleton className="h-64 w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-lg">Aulas</CardTitle>
            {canManageContent && unity && (
              <Button size="sm" onClick={() => setLessonDialogOpen(true)}>
                <Plus className="w-4 h-4" /> Nova aula
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {unity ? (
              <LessonsTable
                key={unity.publicId}
                unityName={unity.name}
                lessons={lessons}
                isLoading={lessonsLoading}
                canManage={canManageContent}
                onOpenLesson={(lesson) => setOpenLessonId(lesson.publicId)}
              />
            ) : (
              <Skeleton className="h-40 w-full" />
            )}
          </CardContent>
        </Card>

        {canManageContent && unity && (
          <Card className="ring-destructive/40">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Zona de risco</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Excluir esta unidade</p>
                <p className="text-sm text-muted-foreground">
                  Remove a unidade e todas as aulas, questões, alternativas, respostas e certificados
                  dela. Esta ação não pode ser desfeita.
                </p>
              </div>
              <Button
                variant="destructive"
                className="shrink-0"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="w-4 h-4" /> Excluir unidade
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {unity && lessonDialogOpen && (
        <LessonDialog
          open
          onOpenChange={setLessonDialogOpen}
          unityName={unity.name}
          unityPublicId={unity.publicId}
        />
      )}

      {unity && openLesson && (
        <LessonEditorDialog
          open
          onOpenChange={(open) => {
            if (!open) setOpenLessonId(null);
          }}
          unityName={unity.name}
          lesson={openLesson}
          position={openLessonIndex + 1}
          canManage={canManageContent}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Excluir unidade"
        description={`Excluir "${unity?.name}" também removerá todas as aulas, questões, alternativas, respostas e certificados relacionados. Esta ação não pode ser desfeita.`}
        isLoading={deleteUnityMutation.isPending}
        onConfirm={() => deleteUnityMutation.mutate()}
      />
    </ContentSettingsShell>
  );
}
