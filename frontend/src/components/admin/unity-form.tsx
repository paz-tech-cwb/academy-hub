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
import { Textarea } from '@/components/ui/textarea';
import { CharacterCount } from '@/components/character-count';

const DESCRIPTION_MAX_LENGTH = 500;

const unitySchema = z.object({
  name: z
    .string()
    .min(1, 'Informe o nome da unidade.')
    .max(255, 'O nome deve ter no máximo 255 caracteres.'),
  description: z
    .string()
    .max(DESCRIPTION_MAX_LENGTH, `A descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres.`),
});

type UnityFormValues = z.infer<typeof unitySchema>;

/** Falha ao aplicar a capa depois de a unidade já ter sido salva. */
class CoverError extends Error {}

/**
 * Envia para a API a alteração de capa escolhida no formulário.
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

interface UnityFormProps {
  /** Quando informada, o formulário edita a unidade; caso contrário, cria uma nova. */
  unity?: Unity | null;
  /** Mostra os dados sem permitir alteração (usuário sem `content.manage`). */
  readOnly?: boolean;
  /** Chamado depois que a unidade (e a capa, se alterada) foi salva. */
  onSaved?: (publicId: string) => void;
  /** Quando informado, exibe o botão "Cancelar". */
  onCancel?: () => void;
}

/**
 * Formulário de nome, descrição e capa de uma unidade. Cria a unidade quando nenhuma é
 * informada e atualiza a existente caso contrário.
 */
export function UnityForm({ unity, readOnly = false, onSaved, onCancel }: UnityFormProps) {
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

      if (!pendingCover) return publicId;
      try {
        await applyCover(publicId, pendingCover);
      } catch (err) {
        // A unidade já foi salva: atualiza a lista e mantém o formulário para tentar a capa de novo.
        queryClient.invalidateQueries({ queryKey: queryKeys.unities.all });
        const reason = axios.isAxiosError(err)
          ? getApiErrorMessage(err, 'Falha ao salvar a capa.')
          : (err as Error).message;
        throw new CoverError(`A unidade foi salva, mas a capa não: ${reason}`);
      }
      return publicId;
    },
    onSuccess: (publicId, values) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.unities.all });
      toast.success(isEditing ? 'Unidade atualizada!' : 'Unidade criada!');
      setError(null);
      setPendingCover(null);
      form.reset(values);
      onSaved?.(publicId);
    },
    onError: (err) => {
      setError(err instanceof CoverError ? err.message : getApiErrorMessage(err, 'Falha ao salvar a unidade.'));
    },
  });

  function onSubmit(values: UnityFormValues) {
    mutation.mutate(values);
  }

  const disabled = readOnly || mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="@container space-y-4">
        <div className="grid gap-4 @2xl:grid-cols-[minmax(0,1fr)_18rem] @2xl:gap-6">
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Teologias Perigosas" disabled={readOnly} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="flex flex-1 flex-col">
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="O que os alunos aprenderão"
                      className="min-h-28 max-h-60 flex-1 resize-none"
                      maxLength={DESCRIPTION_MAX_LENGTH}
                      disabled={readOnly}
                      {...field}
                    />
                  </FormControl>
                  <CharacterCount length={field.value.length} max={DESCRIPTION_MAX_LENGTH} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Capa</Label>
            <UnityCoverField
              currentCoverUrl={unity?.unityCover}
              value={pendingCover}
              onChange={setPendingCover}
              disabled={disabled}
            />
          </div>
        </div>
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        {!readOnly && (
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar unidade'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
