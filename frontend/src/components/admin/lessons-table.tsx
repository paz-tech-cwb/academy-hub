'use client';

import { useMemo, useState } from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GripVertical, Loader2, Pencil } from 'lucide-react';
import { lessonsApi } from '@/lib/api/lessons';
import { queryKeys } from '@/lib/query-keys';
import { getApiErrorMessage } from '@/lib/api/errors';
import { LessonDetail, ReorderLessonsInput } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const SKELETON_ROWS = 3;
const COLUMN_COUNT = 5;

interface SortableLessonRowProps {
  lesson: LessonDetail;
  position: number;
  isReordering: boolean;
  /** Sem `content.manage` a aula não pode ser reordenada. */
  canManage: boolean;
  onOpen: () => void;
}

function SortableLessonRow({ lesson, position, isReordering, canManage, onOpen }: SortableLessonRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.publicId,
    disabled: isReordering || !canManage,
  });

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? 'relative z-10 bg-card shadow-lg' : undefined}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          {canManage && (
            <button
              type="button"
              className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
              aria-label={`Reordenar ${lesson.title}`}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}
          <span className="font-medium tabular-nums">{position}</span>
        </div>
      </TableCell>
      <TableCell className="font-medium truncate" title={lesson.title}>
        {lesson.title}
      </TableCell>
      <TableCell className="text-muted-foreground truncate" title={lesson.description ?? undefined}>
        {lesson.description || 'Sem descrição'}
      </TableCell>
      <TableCell className="truncate">
        {lesson.videoUrl ? (
          <a
            href={lesson.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
            title={lesson.videoUrl}
          >
            {lesson.videoUrl}
          </a>
        ) : (
          <span className="text-muted-foreground">Sem vídeo</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button size="icon" variant="ghost" className="w-8 h-8" onClick={onOpen}>
          <Pencil className="w-4 h-4" />
          <span className="sr-only">Editar {lesson.title}</span>
        </Button>
      </TableCell>
    </TableRow>
  );
}

interface LessonsTableProps {
  unityName: string;
  /** Aulas da unidade já ordenadas pela sequência salva. */
  lessons: LessonDetail[] | undefined;
  isLoading: boolean;
  canManage: boolean;
  /** Abre a edição da aula na posição exibida. */
  onOpenLesson: (lesson: LessonDetail, position: number) => void;
}

/**
 * Tabela das aulas de uma unidade. Quem gerencia conteúdos pode arrastar as linhas para
 * mudar a ordem, que só é gravada ao clicar em "Salvar alterações".
 */
export function LessonsTable({ unityName, lessons, isLoading, canManage, onOpenLesson }: LessonsTableProps) {
  const queryClient = useQueryClient();

  /**
   * Ordem das aulas ainda não salva, apenas com os publicIds. `null` significa
   * "sem pendência" e a lista do servidor é usada como está.
   */
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);

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
      .filter((lesson): lesson is LessonDetail => !!lesson);
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const reorderMutation = useMutation({
    mutationFn: (payload: ReorderLessonsInput) => lessonsApi.reorder(payload),
    onSuccess: () => {
      setPendingOrder(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.list(unityName) });
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

  return (
    <div className="space-y-3">
      {isOrderDirty && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2">
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
            <Button size="sm" onClick={handleSaveOrder} disabled={reorderMutation.isPending}>
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

      <div className="overflow-hidden rounded-md border">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Sequência</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="w-20 text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: COLUMN_COUNT }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : orderedLessons?.length ? (
                <SortableContext
                  items={orderedLessons.map((lesson) => lesson.publicId)}
                  strategy={verticalListSortingStrategy}
                >
                  {orderedLessons.map((lesson, index) => (
                    <SortableLessonRow
                      key={lesson.publicId}
                      lesson={lesson}
                      position={index + 1}
                      isReordering={reorderMutation.isPending}
                      canManage={canManage}
                      onOpen={() => onOpenLesson(lesson, index + 1)}
                    />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell colSpan={COLUMN_COUNT} className="h-24 text-center text-muted-foreground">
                    {canManage ? 'Nenhuma aula nesta unidade. Crie a primeira.' : 'Nenhuma aula nesta unidade.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>
    </div>
  );
}
