'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { lessonsApi } from '@/lib/api/lessons';
import { queryKeys } from '@/lib/query-keys';
import { getApiErrorMessage } from '@/lib/api/errors';
import { LessonDetail } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LessonForm } from '@/components/admin/lesson-form';
import { LessonAdminEditor } from '@/components/admin/lesson-admin-editor';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

interface LessonEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unityName: string;
  lesson: LessonDetail;
  /** Posição da aula na unidade, exibida no cabeçalho. */
  position: number;
  /** Sem `content.manage` os dados da aula ficam só para leitura e a exclusão some. */
  canManage: boolean;
}

/**
 * Modal grande de edição de uma aula: dados da aula e exclusão no topo, questões e
 * alternativas logo abaixo.
 */
export function LessonEditorDialog({
  open,
  onOpenChange,
  unityName,
  lesson,
  position,
  canManage,
}: LessonEditorDialogProps) {
  const queryClient = useQueryClient();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => lessonsApi.remove(lesson.publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.list(unityName) });
      toast.success('Aula excluída.');
      setConfirmDeleteOpen(false);
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Falha ao excluir a aula.'));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lesson.title}</DialogTitle>
          <DialogDescription>
            {unityName} · aula {position}
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Dados da aula</h3>
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="w-4 h-4" /> Excluir aula
              </Button>
            )}
          </div>
          <LessonForm
            key={lesson.publicId}
            unityName={unityName}
            lesson={lesson}
            readOnly={!canManage}
          />
        </section>

        <Separator />

        <LessonAdminEditor
          unityName={unityName}
          lessonName={lesson.title}
          lessonPublicId={lesson.publicId}
        />

        <ConfirmDialog
          open={confirmDeleteOpen}
          onOpenChange={setConfirmDeleteOpen}
          title="Excluir aula"
          description={`Excluir "${lesson.title}" também removerá todas as questões, alternativas e respostas relacionadas. Esta ação não pode ser desfeita.`}
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate()}
        />
      </DialogContent>
    </Dialog>
  );
}
