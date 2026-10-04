'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import Navbar from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireRole } from '@/hooks/use-require-auth';
import { unitiesApi } from '@/lib/api/unities';
import { lessonsApi } from '@/lib/api/lessons';
import { queryKeys } from '@/lib/query-keys';
import { getApiErrorMessage } from '@/lib/api/errors';
import { Lesson, ReorderLessonsInput, Unity, UserRole } from '@/types';
import { UnityDialog } from '@/components/admin/unity-dialog';
import { LessonDialog } from '@/components/admin/lesson-dialog';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { LessonAdminEditor } from '@/components/admin/lesson-admin-editor';

interface SortableLessonRowProps {
  lesson: Lesson;
  position: number;
  isSelected: boolean;
  isReordering: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableLessonRow({
  lesson,
  position,
  isSelected,
  isReordering,
  onSelect,
  onEdit,
  onDelete,
}: SortableLessonRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.publicId,
    disabled: isReordering,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex items-center gap-1 rounded-lg border p-2 ${
        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
      } ${isDragging ? 'z-10 shadow-lg' : ''}`}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={`Reordenar ${lesson.title}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <button type="button" onClick={onSelect} className="flex-1 min-w-0 text-left">
        <span className="block font-medium text-sm truncate">{lesson.title}</span>
        <span className="block text-xs text-muted-foreground">Aula {position}</span>
      </button>

      <Button
        size="icon"
        variant="ghost"
        className="w-8 h-8 shrink-0"
        onClick={onEdit}
      >
        <Pencil className="w-4 h-4" />
        <span className="sr-only">Editar {lesson.title}</span>
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="w-8 h-8 shrink-0 text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="w-4 h-4" />
        <span className="sr-only">Excluir {lesson.title}</span>
      </Button>
    </div>
  );
}

export default function ContentSettingsPage() {
  const { isReady } = useRequireRole(UserRole.Admin);
  const queryClient = useQueryClient();

  const [unitySelection, setUnitySelection] = useState<string | null>(null);
  const [lessonSelection, setLessonSelection] = useState<string | null>(null);

  const [unityDialogOpen, setUnityDialogOpen] = useState(false);
  const [editingUnity, setEditingUnity] = useState<Unity | null>(null);
  const [unityToDelete, setUnityToDelete] = useState<Unity | null>(null);

  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);

  /**
   * Ordem das aulas ainda não salva, apenas com os publicIds. `null` significa
   * "sem pendência" e a lista do servidor é usada como está.
   */
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);

  const { data: unities, isLoading: unitiesLoading } = useQuery({
    queryKey: queryKeys.unities.all,
    queryFn: unitiesApi.list,
  });

  /**
   * A seleção é derivada da lista: enquanto o admin não escolher (ou o item
   * escolhido for removido), o primeiro item da lista fica ativo.
   */
  const selectedUnityId =
    unitySelection && unities?.some((unity) => unity.publicId === unitySelection)
      ? unitySelection
      : (unities?.[0]?.publicId ?? null);

  const selectedUnity = useMemo(
    () => unities?.find((unity) => unity.publicId === selectedUnityId) ?? null,
    [unities, selectedUnityId],
  );

  const lessonsQueryKey = queryKeys.lessons.list(selectedUnity?.name ?? '');

  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: lessonsQueryKey,
    queryFn: () => lessonsApi.listByUnity(selectedUnity!.name),
    enabled: !!selectedUnity?.name,
  });

  const lessons = useMemo(
    () =>
      lessonsData ? [...lessonsData].sort((a, b) => a.sequence - b.sequence) : undefined,
    [lessonsData],
  );

  /**
   * Lista exibida: a ordem pendente quando existe, na ordem do servidor caso
   * contrário. Aulas criadas/excluídas enquanto há pendência entram no fim.
   */
  const orderedLessons = useMemo(() => {
    if (!lessons) return undefined;
    if (!pendingOrder) return lessons;

    const byPublicId = new Map(lessons.map((lesson) => [lesson.publicId, lesson]));
    const pending = pendingOrder
      .map((publicId) => byPublicId.get(publicId))
      .filter((lesson): lesson is Lesson => !!lesson);
    const added = lessons.filter((lesson) => !pendingOrder.includes(lesson.publicId));

    return [...pending, ...added];
  }, [lessons, pendingOrder]);

  const isOrderDirty = useMemo(() => {
    if (!orderedLessons || !lessons) return false;
    return (
      orderedLessons.map((lesson) => lesson.publicId).join() !==
      lessons.map((lesson) => lesson.publicId).join()
    );
  }, [orderedLessons, lessons]);

  const selectedLessonId =
    lessonSelection && lessons?.some((lesson) => lesson.publicId === lessonSelection)
      ? lessonSelection
      : (lessons?.[0]?.publicId ?? null);

  const selectedLesson = useMemo(
    () => lessons?.find((lesson) => lesson.publicId === selectedLessonId) ?? null,
    [lessons, selectedLessonId],
  );

  const { data: editingLessonDetail } = useQuery({
    queryKey: queryKeys.lessons.detail(selectedUnity?.name ?? '', editingLesson?.title ?? ''),
    queryFn: () => lessonsApi.getByName(selectedUnity!.name, editingLesson!.title),
    enabled: !!selectedUnity?.name && !!editingLesson,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const reorderMutation = useMutation({
    mutationFn: (payload: ReorderLessonsInput) => lessonsApi.reorder(payload),
    onSuccess: () => {
      setPendingOrder(null);
      queryClient.invalidateQueries({ queryKey: lessonsQueryKey });
      toast.success('Ordem das aulas salva.');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Falha ao salvar a nova ordem.'));
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !orderedLessons) return;

    const oldIndex = orderedLessons.findIndex((lesson) => lesson.publicId === active.id);
    const newIndex = orderedLessons.findIndex((lesson) => lesson.publicId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    setPendingOrder(arrayMove(orderedLessons, oldIndex, newIndex).map((lesson) => lesson.publicId));
  }

  function handleSaveOrder() {
    if (!orderedLessons) return;

    reorderMutation.mutate({
      lessons: orderedLessons.map((lesson, index) => ({
        publicId: lesson.publicId,
        sequence: index + 1,
      })),
    });
  }

  const deleteUnityMutation = useMutation({
    mutationFn: (publicId: string) => unitiesApi.remove(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.unities.all });
      toast.success('Unidade excluída.');
      setUnityToDelete(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Falha ao excluir a unidade.'));
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (publicId: string) => lessonsApi.remove(publicId),
    onSuccess: () => {
      if (selectedUnity) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.lessons.list(selectedUnity.name),
        });
      }
      toast.success('Aula excluída.');
      setLessonToDelete(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Falha ao excluir a aula.'));
    },
  });

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="h-16 border-b px-4 flex items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <div className="ml-auto flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full border-2 border-primary/20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-9 w-72 mb-2" />
          <Skeleton className="h-5 w-96" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
              <Skeleton className="h-64 w-full rounded-xl bg-card ring-1 ring-foreground/10" />
              <Skeleton className="h-48 w-full rounded-xl bg-card ring-1 ring-foreground/10" />
            </div>
            <div className="lg:col-span-8">
              <Skeleton className="h-96 w-full rounded-xl bg-card ring-1 ring-foreground/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-8">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Configurações
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Configuração de conteúdos</h1>
          <p className="text-muted-foreground">
            Crie e organize unidades, aulas, questões e alternativas. Nesta tela não é possível
            assistir às aulas nem responder questionários.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 w-full space-y-6">
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-lg">Unidades</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingUnity(null);
                    setUnityDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" /> Nova
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {unitiesLoading &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}

                {!unitiesLoading && unities?.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma unidade cadastrada. Crie a primeira.
                  </p>
                )}

                {unities?.map((unity) => {
                  const isSelected = unity.publicId === selectedUnityId;
                  return (
                    <div
                      key={unity.publicId}
                      className={`flex items-center gap-1 rounded-lg border p-2 transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setUnitySelection(unity.publicId)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <span className="block font-medium text-sm truncate">{unity.name}</span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {unity.description || 'Sem descrição'}
                        </span>
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 shrink-0"
                        onClick={() => {
                          setEditingUnity(unity);
                          setUnityDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="sr-only">Editar {unity.name}</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 shrink-0 text-destructive"
                        onClick={() => setUnityToDelete(unity)}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Excluir {unity.name}</span>
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {selectedUnity && (
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                  <div className="min-w-0">
                    <CardTitle className="text-lg">Aulas</CardTitle>
                    <p className="text-xs text-muted-foreground truncate">{selectedUnity.name}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingLesson(null);
                      setLessonDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" /> Nova
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isOrderDirty && (
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2">
                      <p className="text-sm text-muted-foreground">
                        A ordem das aulas foi alterada e ainda não foi salva.
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPendingOrder(null)}
                          disabled={reorderMutation.isPending}
                        >
                          Descartar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveOrder}
                          disabled={reorderMutation.isPending}
                        >
                          {reorderMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                            </>
                          ) : (
                            'Salvar alterações'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {lessonsLoading &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}

                  {!lessonsLoading && lessons?.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma aula nesta unidade. Crie a primeira.
                    </p>
                  )}

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={orderedLessons?.map((lesson) => lesson.publicId) ?? []}
                      strategy={verticalListSortingStrategy}
                    >
                      {orderedLessons?.map((lesson, index) => (
                        <SortableLessonRow
                          key={lesson.publicId}
                          lesson={lesson}
                          position={index + 1}
                          isSelected={lesson.publicId === selectedLessonId}
                          isReordering={reorderMutation.isPending}
                          onSelect={() => setLessonSelection(lesson.publicId)}
                          onEdit={() => {
                            setEditingLesson(lesson);
                            setLessonDialogOpen(true);
                          }}
                          onDelete={() => setLessonToDelete(lesson)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-8 w-full">
            {selectedUnity && selectedLesson ? (
              <>
                <div className="mb-4">
                  <h2 className="text-xl font-bold">{selectedLesson.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedUnity.name} · aula{' '}
                    {(orderedLessons?.findIndex(
                      (lesson) => lesson.publicId === selectedLesson.publicId,
                    ) ?? 0) + 1}
                  </p>
                </div>
                <LessonAdminEditor
                  key={selectedLesson.publicId}
                  unityName={selectedUnity.name}
                  lessonName={selectedLesson.title}
                  lessonPublicId={selectedLesson.publicId}
                />
              </>
            ) : (
              <div className="text-center py-20 bg-card rounded-2xl border-2 border-dashed">
                {lessonsLoading ? (
                  <Loader2 className="w-12 h-12 mx-auto text-muted-foreground/30 animate-spin mb-4" />
                ) : selectedUnity ? (
                  <>
                    <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma aula criada</h3>
                    <p className="text-muted-foreground mb-6">
                      Crie a primeira aula de {selectedUnity.name} para gerenciar as questões e
                      alternativas.
                    </p>
                    <Button
                      onClick={() => {
                        setEditingLesson(null);
                        setLessonDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Criar aula
                    </Button>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma unidade cadastrada</h3>
                    <p className="text-muted-foreground mb-6">
                      Crie a primeira unidade para começar a configurar as aulas.
                    </p>
                    <Button
                      onClick={() => {
                        setEditingUnity(null);
                        setUnityDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Criar unidade
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {unityDialogOpen && (
        <UnityDialog open onOpenChange={setUnityDialogOpen} unity={editingUnity} />
      )}

      {lessonDialogOpen && selectedUnity && !editingLesson && (
        <LessonDialog
          open
          onOpenChange={setLessonDialogOpen}
          unityName={selectedUnity.name}
          unityPublicId={selectedUnity.publicId}
        />
      )}

      {lessonDialogOpen && selectedUnity && editingLesson && editingLessonDetail && (
        <LessonDialog
          open
          onOpenChange={setLessonDialogOpen}
          unityName={selectedUnity.name}
          unityPublicId={selectedUnity.publicId}
          lesson={editingLessonDetail}
        />
      )}

      <ConfirmDialog
        open={!!unityToDelete}
        onOpenChange={(open) => {
          if (!open) setUnityToDelete(null);
        }}
        title="Excluir unidade"
        description={`Excluir "${unityToDelete?.name}" também removerá todas as aulas, questões, alternativas, respostas e certificados relacionados. Esta ação não pode ser desfeita.`}
        isLoading={deleteUnityMutation.isPending}
        onConfirm={() => unityToDelete && deleteUnityMutation.mutate(unityToDelete.publicId)}
      />

      <ConfirmDialog
        open={!!lessonToDelete}
        onOpenChange={(open) => {
          if (!open) setLessonToDelete(null);
        }}
        title="Excluir aula"
        description={`Excluir "${lessonToDelete?.title}" também removerá todas as questões, alternativas e respostas relacionadas. Esta ação não pode ser desfeita.`}
        isLoading={deleteLessonMutation.isPending}
        onConfirm={() => lessonToDelete && deleteLessonMutation.mutate(lessonToDelete.publicId)}
      />
    </div>
  );
}