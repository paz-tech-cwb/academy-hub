'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminContentApi } from '@/lib/api/admin-content';
import { getApiErrorMessage } from '@/lib/api/errors';
import { AdminQuestion } from '@/types';
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

const questionSchema = z.object({
  statement: z
    .string()
    .min(1, 'Informe o enunciado da questão.')
    .max(5000, 'O enunciado deve ter no máximo 5000 caracteres.'),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

interface QuestionEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** PublicId da aula — obrigatório no modo criação. */
  lessonPublicId?: string;
  /** Quando informada, o dialog edita a questão; caso contrário, cria uma nova. */
  question?: AdminQuestion | null;
  /** Chamado após salvar com sucesso (usado para invalidar queries). */
  onSaved?: () => void;
}

export function QuestionEditorDialog({
  open,
  onOpenChange,
  lessonPublicId,
  question,
  onSaved,
}: QuestionEditorDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!question;

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      statement: question?.statement ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: QuestionFormValues) =>
      isEditing && question
        ? adminContentApi.updateQuestion(question.publicId, { statement: values.statement })
        : adminContentApi.createQuestion({ lessonPublicId: lessonPublicId!, statement: values.statement }),
    onSuccess: () => {
      toast.success(isEditing ? 'Questão atualizada!' : 'Questão criada!');
      onSaved?.();
      onOpenChange(false);
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, 'Falha ao salvar a questão.'));
    },
  });

  function onSubmit(values: QuestionFormValues) {
    mutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar questão' : 'Nova questão'}</DialogTitle>
          <DialogDescription>
            As alternativas podem ser adicionadas depois, no editor da aula.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="statement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enunciado</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o enunciado da questão" {...field} />
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
                {mutation.isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar questão'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}