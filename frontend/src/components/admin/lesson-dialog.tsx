'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LessonForm } from '@/components/admin/lesson-form';

interface LessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unityName: string;
  unityPublicId: string;
}

/**
 * Modal de criação de aula. A aula é criada no fim da ordem da unidade.
 */
export function LessonDialog({ open, onOpenChange, unityName, unityPublicId }: LessonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova aula</DialogTitle>
          <DialogDescription>
            Preencha os dados da aula desta unidade.
          </DialogDescription>
        </DialogHeader>
        <LessonForm
          unityName={unityName}
          unityPublicId={unityPublicId}
          onSaved={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
