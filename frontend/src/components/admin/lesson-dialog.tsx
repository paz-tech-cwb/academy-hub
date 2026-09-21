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

const lessonSchema = z.object({
  title: z
    .string()
    .min(1, 'Informe o título da aula.')
    .max(100, 'O título deve ter no máximo 100 caracteres.'),
  description: z.string().max(5000, 'A descrição deve ter no máximo 5000 caracteres.'),
  sequence: z.coerce.number().min(0, 'A sequência não pode ser negativa.'),
  videoUrl: z
    .string()
    .url('Informe uma URL de vídeo válida.')
    .max(255, 'A URL deve ter no máximo 255 caracteres.')
    .or(z.literal('')),
});

type LessonFormValues = z.infer<typeof lessonSchema>;

interface LessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unityName: string;
  /** PublicId da unidade — obrigatório no modo criação. */
  unityPublicId?: string;
  /** Quando informada, o dialog edita a aula; caso contrário, cria uma nova. */
  lesson?: LessonDetail | null;
}

export function LessonDialog({
  open,
  onOpenChange,
  unityName,
  unityPublicId,
  lesson,
}: LessonDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!lesson;

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema) as Resolver<LessonFormValues>,
    defaultValues: {
      title: lesson?.title ?? '',
      description: lesson?.description ?? '',
      sequence: lesson?.sequence ?? 0,
      videoUrl: lesson?.videoUrl ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: LessonFormValues) => {
      const payload = {
        title: values.title,
        description: values.description || null,
        sequence: values.sequence,
        videoUrl: values.videoUrl || null,
      };
      return isEditing && lesson
        ? lessonsApi.update(lesson.publicId, payload)
        : lessonsApi.create({ ...payload, unityPublicId: unityPublicId! });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.list(unityName) });
      toast.success(isEditing ? 'Aula atualizada!' : 'Aula criada!');
      onOpenChange(false);
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, 'Falha ao salvar a aula.'));
    },
  });

  function onSubmit(values: LessonFormValues) {
    mutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar aula' : 'Nova aula'}</DialogTitle>
          <DialogDescription>
            Preencha os dados da aula desta unidade.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Como Identificar um Ensino Falso" {...field} />
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
                    <Input placeholder="Resumo da aula" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sequence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sequência</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
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
                      <Input placeholder="https://youtu.be/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar aula'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}