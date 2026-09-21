'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { unitiesApi } from '@/lib/api/unities';
import { queryKeys } from '@/lib/query-keys';
import { getApiErrorMessage } from '@/lib/api/errors';
import { Unity } from '@/types';
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

const unitySchema = z.object({
  name: z
    .string()
    .min(1, 'Informe o nome da unidade.')
    .max(255, 'O nome deve ter no máximo 255 caracteres.'),
  description: z.string().max(5000, 'A descrição deve ter no máximo 5000 caracteres.'),
});

type UnityFormValues = z.infer<typeof unitySchema>;

interface UnityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando informada, o dialog edita a unidade; caso contrário, cria uma nova. */
  unity?: Unity | null;
}

export function UnityDialog({ open, onOpenChange, unity }: UnityDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!unity;

  const form = useForm<UnityFormValues>({
    resolver: zodResolver(unitySchema),
    defaultValues: {
      name: unity?.name ?? '',
      description: unity?.description ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: UnityFormValues) => {
      const payload = {
        name: values.name,
        description: values.description || null,
      };
      return isEditing
        ? unitiesApi.update(unity!.publicId, payload)
        : unitiesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.unities.all });
      toast.success(isEditing ? 'Unidade atualizada!' : 'Unidade criada!');
      onOpenChange(false);
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, 'Falha ao salvar a unidade.'));
    },
  });

  function onSubmit(values: UnityFormValues) {
    mutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
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