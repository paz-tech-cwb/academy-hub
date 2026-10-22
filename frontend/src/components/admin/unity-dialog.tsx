'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UnityForm } from '@/components/admin/unity-form';

interface UnityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado com o publicId da unidade logo depois de criada. */
  onCreated: (publicId: string) => void;
}

/**
 * Modal de criação de unidade.
 */
export function UnityDialog({ open, onOpenChange, onCreated }: UnityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova unidade</DialogTitle>
          <DialogDescription>
            Preencha os dados da unidade de treinamento.
          </DialogDescription>
        </DialogHeader>
        <UnityForm onSaved={onCreated} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
