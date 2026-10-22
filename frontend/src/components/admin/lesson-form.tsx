'use client';

import { useState } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { lessonsApi } from '@/lib/api/lessons';
import { queryKeys } from '@/lib/query-keys';
import { getApiErrorMessage } from '@/lib/api/errors';
import { LessonDetail } from '@/types';
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
import { Textarea } from '@/components/ui/textarea';
import { CharacterCount } from '@/components/character-count';

const DESCRIPTION_MAX_LENGTH = 500;

const lessonSchema = z.object({
  title: z
    .string()
    .min(1, 'Informe o título da aula.')
    .max(100, 'O título deve ter no máximo 100 caracteres.'),
  description: z
    .string()
    .max(DESCRIPTION_MAX_LENGTH, `A descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres.`),
  videoUrl: z
    .string()
    .url('Informe uma URL de vídeo válida.')
    .max(255, 'A URL deve ter no máximo 255 caracteres.')
    .or(z.literal('')),
});

type LessonFormValues = z.infer<typeof lessonSchema>;

interface LessonFormProps {
  unityName: string;
  /** PublicId da unidade — obrigatório no modo criação. */
  unityPublicId?: string;
  /** Quando informada, o formulário edita a aula; caso contrário, cria uma nova. */
  lesson?: LessonDetail | null;
  /** Mostra os dados sem permitir alteração (usuário sem `content.manage`). */
  readOnly?: boolean;
  /** Chamado depois que a aula foi salva. */
  onSaved?: () => void;
  /** Quando informado, exibe o botão "Cancelar". */
  onCancel?: () => void;
}

/**
 * Formulário de título, descrição e URL do vídeo de uma aula. Cria a aula quando nenhuma é
 * informada e atualiza a existente caso contrário.
 */
export function LessonForm({
  unityName,
  unityPublicId,
  lesson,
  readOnly = false,
  onSaved,
  onCancel,
}: LessonFormProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!lesson;

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema) as Resolver<LessonFormValues>,
    defaultValues: {
      title: lesson?.title ?? '',
      description: lesson?.description ?? '',
      videoUrl: lesson?.videoUrl ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: LessonFormValues) => {
      const payload = {
        title: values.title,
        description: values.description || null,
        videoUrl: values.videoUrl || null,
      };
      return isEditing && lesson
        ? lessonsApi.update(lesson.publicId, payload)
        : lessonsApi.create({ ...payload, unityPublicId: unityPublicId! });
    },
    onSuccess: (_, values) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.list(unityName) });
      toast.success(isEditing ? 'Aula atualizada!' : 'Aula criada!');
      setError(null);
      form.reset(values);
      onSaved?.();
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, 'Falha ao salvar a aula.'));
    },
  });

  function onSubmit(values: LessonFormValues) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Como Identificar um Ensino Falso" disabled={readOnly} {...field} />
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
                <Textarea
                  placeholder="Resumo da aula"
                  className="min-h-28 max-h-60 resize-none"
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
        <FormField
          control={form.control}
          name="videoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL do vídeo</FormLabel>
              <FormControl>
                <Input placeholder="https://youtu.be/..." disabled={readOnly} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        {!readOnly && (
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar aula'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
