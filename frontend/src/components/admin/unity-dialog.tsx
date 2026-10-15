'use client';

import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { unitiesApi } from '@/lib/api/unities';
import { queryKeys } from '@/lib/query-keys';
import { getApiErrorMessage } from '@/lib/api/errors';
import { cropImageToBlob } from '@/lib/crop-image';
import { PendingCover, Unity } from '@/types';
import { UnityCoverField } from '@/components/admin/unity-cover-field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const unitySchema = z.object({
  name: z
    .string()
    .min(1, 'Informe o nome da unidade.')
    .max(255, 'O nome deve ter no máximo 255 caracteres.'),
  description: z.string().max(5000, 'A descrição deve ter no máximo 5000 caracteres.'),
});

type UnityFormValues = z.infer<typeof unitySchema>;

/** Falha ao aplicar a capa depois de a unidade já ter sido salva. */
class CoverError extends Error {}

/**
 * Envia para a API a alteração de capa escolhida no modal.
 *
 * @param publicId - PublicId da unidade (já criada ou atualizada).
 * @param cover - Alteração pendente: arquivo recortado, URL com recorte ou remoção.
 */
async function applyCover(publicId: string, cover: PendingCover) {
  if (cover.kind === 'remove') {
    await unitiesApi.removeCover(publicId);
  } else if (cover.kind === 'url') {
    await unitiesApi.setCoverFromUrl(publicId, cover.url, cover.crop);
  } else {
    const { blob, fileName } = await cropImageToBlob(cover.src, cover.crop, cover.mimeType);
    await unitiesApi.uploadCover(publicId, blob, fileName);
  }
}

interface UnityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando informada, o dialog edita a unidade; caso contrário, cria uma nova. */
  unity?: Unity | null;
}

export function UnityDialog({ open, onOpenChange, unity }: UnityDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pendingCover, setPendingCover] = useState<PendingCover | null>(null);
  const [savedPublicId, setSavedPublicId] = useState<string | null>(unity?.publicId ?? null);
  const isEditing = !!unity;

  const form = useForm<UnityFormValues>({
    resolver: zodResolver(unitySchema),
    defaultValues: {
      name: unity?.name ?? '',
      description: unity?.description ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: UnityFormValues) => {
      const payload = {
        name: values.name,
        description: values.description || null,
      };

      let publicId = savedPublicId;
      if (publicId) {
        await unitiesApi.update(publicId, payload);
      } else {
        publicId = (await unitiesApi.create(payload)).publicId;
        setSavedPublicId(publicId);
      }

      if (!pendingCover) return;
      try {
        await applyCover(publicId, pendingCover);
      } catch (err) {
        // A unidade já foi salva: atualiza a lista e mantém o modal aberto para tentar a capa de novo.
        queryClient.invalidateQueries({ queryKey: queryKeys.unities.all });
        const reason = axios.isAxiosError(err)
          ? getApiErrorMessage(err, 'Falha ao salvar a capa.')
          : (err as Error).message;
        throw new CoverError(`A unidade foi salva, mas a capa não: ${reason}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.unities.all });
      toast.success(isEditing ? 'Unidade atualizada!' : 'Unidade criada!');
      onOpenChange(false);
    },
    onError: (err) => {
      setError(err instanceof CoverError ? err.message : getApiErrorMessage(err, 'Falha ao salvar a unidade.'));
    },
  });

  function onSubmit(values: UnityFormValues) {
    mutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar unidade' : 'Nova unidade'}</DialogTitle>
          <DialogDescription>
            Preencha os dados da unidade de treinamento.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Teologias Perigosas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="O que os alunos aprenderão" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <Label>Capa</Label>
              <UnityCoverField
                currentCoverUrl={unity?.unityCover}
                value={pendingCover}
                onChange={setPendingCover}
                disabled={mutation.isPending}
              />
            </div>
            {error &&<p className="text-sm font-medium text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar unidade'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}