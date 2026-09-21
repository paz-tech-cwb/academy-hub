'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { lessonsApi } from '@/lib/api/lessons';
import { adminContentApi } from '@/lib/api/admin-content';
import { queryKeys } from '@/lib/query-keys';
import { getApiErrorMessage } from '@/lib/api/errors';
import { AdminAlternative, AdminQuestion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { QuestionEditorDialog } from '@/components/admin/question-editor-dialog';
import {
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Check,
  X,
} from 'lucide-react';

interface LessonAdminEditorProps {
  unityName: string;
  lessonName: string;
  lessonPublicId: string;
}

interface EditingAltState {
  questionId: string;
  altId: string;
  text: string;
  isCorrect: boolean;
}

export function LessonAdminEditor({
  unityName,
  lessonName,
  lessonPublicId,
}: LessonAdminEditorProps) {
  const queryClient = useQueryClient();

  const { data: lesson, isLoading } = useQuery({
    queryKey: queryKeys.adminLesson.detail(lessonPublicId),
    queryFn: () => lessonsApi.getAdminDetail(lessonPublicId),
  });

  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<AdminQuestion | null>(null);
  const [alternativeToDelete, setAlternativeToDelete] = useState<{
    questionId: string;
    alt: AdminAlternative;
  } | null>(null);
  const [newAltText, setNewAltText] = useState<Record<string, string>>({});
  const [editingAlt, setEditingAlt] = useState<EditingAltState | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminLesson.detail(lessonPublicId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.questionnaire.byLesson(unityName, lessonName) });
    queryClient.invalidateQueries({ queryKey: queryKeys.lessons.detail(unityName, lessonName) });
    queryClient.invalidateQueries({ queryKey: queryKeys.lessons.list(unityName) });
  };

  const deleteQuestionMutation = useMutation({
    mutationFn: (publicId: string) => adminContentApi.deleteQuestion(publicId),
    onSuccess: () => {
      toast.success('Questão excluída!');
      invalidateAll();
      setQuestionToDelete(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Falha ao excluir a questão.'));
    },
  });

  const deleteAlternativeMutation = useMutation({
    mutationFn: (publicId: string) => adminContentApi.deleteAlternative(publicId),
    onSuccess: () => {
      toast.success('Alternativa excluída!');
      invalidateAll();
      setAlternativeToDelete(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Falha ao excluir a alternativa.'));
    },
  });

  const createAlternativeMutation = useMutation({
    mutationFn: (payload: { questionPublicId: string; text: string }) =>
      adminContentApi.createAlternative({ ...payload, isCorrect: false }),
    onSuccess: () => {
      toast.success('Alternativa adicionada!');
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Falha ao adicionar a alternativa.'));
    },
  });

  const updateAlternativeMutation = useMutation({
    mutationFn: (payload: { publicId: string; data: { text: string; isCorrect: boolean } }) =>
      adminContentApi.updateAlternative(payload.publicId, payload.data),
    onSuccess: () => {
      toast.success('Alternativa atualizada!');
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Falha ao atualizar a alternativa.'));
    },
  });

  function handleAddAlternative(questionId: string) {
    const text = newAltText[questionId]?.trim();
    if (!text) {
      toast.error('Informe o texto da alternativa.');
      return;
    }
    createAlternativeMutation.mutate({ questionPublicId: questionId, text });
    setNewAltText((prev) => ({ ...prev, [questionId]: '' }));
  }

  function handleMarkCorrect(alt: AdminAlternative) {
    updateAlternativeMutation.mutate({
      publicId: alt.publicId,
      data: { text: alt.text, isCorrect: true },
    });
  }

  function handleSaveAlt() {
    if (!editingAlt) return;
    const text = editingAlt.text.trim();
    if (!text) {
      toast.error('O texto da alternativa não pode ficar vazio.');
      return;
    }
    updateAlternativeMutation.mutate({
      publicId: editingAlt.altId,
      data: { text, isCorrect: editingAlt.isCorrect },
    });
    setEditingAlt(null);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full max-w-md" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Editor de questionário</h3>
          <p className="text-sm text-muted-foreground">
            Converta uma alternativa em correta usando o radio (uma por questão).
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingQuestion(null);
            setQuestionDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Adicionar questão
        </Button>
      </div>

      {lesson && lesson.questions.length === 0 && (
        <div className="text-center py-16 bg-card rounded-2xl border-2 border-dashed">
          <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h4 className="text-xl font-semibold mb-2">Nenhuma questão</h4>
          <p className="text-muted-foreground mb-6">
            Esta aula ainda não possui questionário. Crie a primeira questão.
          </p>
          <Button
            onClick={() => {
              setEditingQuestion(null);
              setQuestionDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Criar questão
          </Button>
        </div>
      )}

      {lesson?.questions.map((question, qIndex) => {
        const correctAlt = question.alternatives.find((a) => a.isCorrect);
        return (
          <Card key={question.publicId} className="border-2 overflow-hidden">
            <CardHeader className="bg-muted/30 flex-row items-center justify-between gap-4 space-y-0">
              <CardTitle className="text-base flex gap-2 items-start">
                <span className="text-primary opacity-60 shrink-0">{qIndex + 1}.</span>
                <span>{question.statement}</span>
              </CardTitle>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingQuestion(question);
                    setQuestionDialogOpen(true);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                  <span className="sr-only">Editar questão</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => setQuestionToDelete(question)}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="sr-only">Excluir questão</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {question.alternatives.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Esta questão ainda não tem alternativas.
                </p>
              )}

              <RadioGroup
                value={correctAlt?.publicId ?? ''}
                className="space-y-2"
                disabled={updateAlternativeMutation.isPending}
              >
                {question.alternatives.map((alt) => (
                  <div
                    key={alt.publicId}
                    className={`flex items-center gap-3 border rounded-lg p-3 group transition-colors ${
                      alt.isCorrect ? 'border-green-500/40 bg-green-500/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem
                      value={alt.publicId}
                      id={`${question.publicId}-${alt.publicId}`}
                      onClick={() => handleMarkCorrect(alt)}
                      aria-label={`Marcar alternativa como correta`}
                    />
                    {editingAlt?.altId === alt.publicId ? (
                      <>
                        <Input
                          value={editingAlt.text}
                          onChange={(e) => setEditingAlt((prev) => (prev ? { ...prev, text: e.target.value } : prev))}
                          className="flex-1"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={handleSaveAlt}>
                          <Check className="w-4 h-4" />
                          <span className="sr-only">Salvar alternativa</span>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingAlt(null)}>
                          <X className="w-4 h-4" />
                          <span className="sr-only">Cancelar edição</span>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Label
                          htmlFor={`${question.publicId}-${alt.publicId}`}
                          className="flex-1 cursor-pointer font-medium leading-relaxed text-sm"
                        >
                          {alt.text}
                        </Label>
                        {alt.isCorrect && <Badge variant="success">Correta</Badge>}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setEditingAlt({
                              questionId: question.publicId,
                              altId: alt.publicId,
                              text: alt.text,
                              isCorrect: alt.isCorrect,
                            })
                          }
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="sr-only">Editar alternativa</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() =>
                            setAlternativeToDelete({ questionId: question.publicId, alt })
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Excluir alternativa</span>
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </RadioGroup>

              <div className="flex items-center gap-2 pt-1">
                <Input
                  placeholder="Nova alternativa..."
                  value={newAltText[question.publicId] ?? ''}
                  onChange={(e) =>
                    setNewAltText((prev) => ({ ...prev, [question.publicId]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAlternative(question.publicId);
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => handleAddAlternative(question.publicId)}
                  disabled={createAlternativeMutation.isPending}
                >
                  {createAlternativeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {questionDialogOpen && (
        <QuestionEditorDialog
          open
          onOpenChange={setQuestionDialogOpen}
          lessonPublicId={lessonPublicId}
          question={editingQuestion}
          onSaved={invalidateAll}
        />
      )}

      <ConfirmDialog
        open={!!questionToDelete}
        onOpenChange={(open) => {
          if (!open) setQuestionToDelete(null);
        }}
        title="Excluir questão"
        description="Esta questão e todas as suas alternativas e respostas de usuários serão removidas. Esta ação não pode ser desfeita."
        isLoading={deleteQuestionMutation.isPending}
        onConfirm={() => questionToDelete && deleteQuestionMutation.mutate(questionToDelete.publicId)}
      />

      <ConfirmDialog
        open={!!alternativeToDelete}
        onOpenChange={(open) => {
          if (!open) setAlternativeToDelete(null);
        }}
        title="Excluir alternativa"
        description="Esta alternativa e as respostas de usuários vinculadas a ela serão removidas. Esta ação não pode ser desfeita."
        isLoading={deleteAlternativeMutation.isPending}
        onConfirm={() =>
          alternativeToDelete && deleteAlternativeMutation.mutate(alternativeToDelete.alt.publicId)
        }
      />
    </div>
  );
}