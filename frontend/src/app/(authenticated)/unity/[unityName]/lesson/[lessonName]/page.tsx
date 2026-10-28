'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect, useEffectEvent, useReducer, useRef, useState } from 'react';
import { lessonsApi } from '@/lib/api/lessons';
import { questionnaireApi } from '@/lib/api/questionnaire';
import { queryKeys } from '@/lib/query-keys';
import { isNotFoundError } from '@/lib/api/errors';
import {
  celebrateLessonCompletion,
  celebrateUnityCompletion,
  playAnswerFeedback,
  prefersReducedMotion,
} from '@/lib/quiz-feedback';
import { Lesson, Question, VerifyAnswersResponse } from '@/types';
import Navbar from '@/components/layout/navbar';
import { ContentNotFound } from '@/components/content-not-found';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, PlayCircle, ClipboardList, Send, Loader2, AlertCircle, XCircle, Trophy, Zap, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const XP_COUNT_DURATION_MS = 900;

interface QuizState {
  selectedAnswers: Record<string, string>;
  allAnswersStatus: Record<string, boolean>;
  verifiedAnswers: Record<string, string>;
  verifyResult: VerifyAnswersResponse | null;
  /** XP que a aula valia antes do último envio, para mostrar quanto foi perdido nele. */
  pointsBeforeAttempt: number | null;
  attempt: number;
}

type QuizAction =
  | { type: 'select'; questionId: string; alternativeId: string }
  | { type: 'apply-result'; result: VerifyAnswersResponse; pointsBefore: number | null };

const initialQuizState: QuizState = {
  selectedAnswers: {},
  allAnswersStatus: {},
  verifiedAnswers: {},
  verifyResult: null,
  pointsBeforeAttempt: null,
  attempt: 0,
};

/**
 * Reducer do questionário.
 *
 * Concentra as três transições do quiz num só lugar para manter a sequência
 * "responder → enviar → marcar correto" coerente. Respostas já marcadas como
 * corretas (`allAnswersStatus[id] === true`) ficam imutáveis: novas seleções
 * são ignoradas e elas não voltam a ser enviadas para verificação.
 */
function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'select': {
      if (state.allAnswersStatus[action.questionId]) return state;
      return {
        ...state,
        selectedAnswers: {
          ...state.selectedAnswers,
          [action.questionId]: action.alternativeId,
        },
      };
    }
    case 'apply-result': {
      const allAnswersStatus = { ...state.allAnswersStatus };
      const verifiedAnswers = { ...state.verifiedAnswers };
      action.result.answers.forEach((a) => {
        allAnswersStatus[a.publicQuestionId] = a.isCorrect;
        verifiedAnswers[a.publicQuestionId] = a.publicAlternativeId;
      });
      return {
        ...state,
        verifyResult: action.result,
        pointsBeforeAttempt: action.pointsBefore,
        allAnswersStatus,
        verifiedAnswers,
        attempt: state.attempt + 1,
      };
    }
  }
}

/**
 * Decide se todas as questões da lição já estão corretamente respondidas.
 *
 * A API só sinaliza conclusão da unidade inteira (`wasAllQuestionsCorrectlyAnswered`),
 * então a conclusão da lição é derivada localmente: a lição está completa quando
 * cada questão exibida tem `allAnswersStatus[id] === true`.
 */
function isLessonComplete(
  questions: Question[] | undefined,
  allAnswersStatus: Record<string, boolean>,
): boolean {
  if (!questions || questions.length === 0) return false;
  return questions.every((q) => allAnswersStatus[q.publicId]);
}

/**
 * Monta o estado do questionário a partir das últimas respostas que a API
 * devolve junto com as questões.
 *
 * Serve de base para o estado local: assim, ao recarregar a página, as
 * questões já respondidas voltam com a alternativa marcada e com a indicação
 * de certo/errado, e as corretas continuam travadas.
 */
function getPersistedQuizState(
  questions: Question[] | undefined,
): Pick<QuizState, 'selectedAnswers' | 'allAnswersStatus' | 'verifiedAnswers'> {
  const selectedAnswers: Record<string, string> = {};
  const allAnswersStatus: Record<string, boolean> = {};

  questions?.forEach((q) => {
    if (q.lastSelectedAlternativeId === null || q.lastAnswerIsCorrect === null) return;
    selectedAnswers[q.publicId] = q.lastSelectedAlternativeId;
    allAnswersStatus[q.publicId] = q.lastAnswerIsCorrect;
  });

  return { selectedAnswers, allAnswersStatus, verifiedAnswers: { ...selectedAnswers } };
}

/**
 * Monta o aviso de quais perguntas ainda estão sem resposta.
 *
 * @param questionNumbers - Números das perguntas sem resposta, na ordem em que aparecem.
 * @returns Texto como "Falta responder a pergunta 2." ou "Faltam 2 perguntas: 1 e 3.".
 */
function describeUnansweredQuestions(questionNumbers: number[]): string {
  if (questionNumbers.length === 1) return `Falta responder a pergunta ${questionNumbers[0]}.`;
  const list = new Intl.ListFormat('pt-BR', { type: 'conjunction' }).format(questionNumbers.map(String));
  return `Faltam ${questionNumbers.length} perguntas: ${list}.`;
}

/**
 * Exibe o XP ganho contando de zero até o valor final.
 * Com animações reduzidas, mostra o valor final direto.
 *
 * @param value - Quantidade de XP a exibir.
 */
function XpCounter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;

    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / XP_COUNT_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      element.textContent = String(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span ref={ref} className="tabular-nums">{value}</span>;
}

interface LessonXpPanelProps {
  currentPoints: number;
  maxPoints: number;
  pointsLostPerWrongAnswer: number;
  minPoints: number;
  completed: boolean;
  /** XP perdido no último envio; aparece ao lado do valor enquanto a aula não foi concluída. */
  lastLoss: number;
  attempt: number;
}

/**
 * Mostra, antes e durante o questionário, quanto XP a aula vale e como os erros reduzem esse valor.
 * Depois da conclusão, mostra o XP que o usuário ganhou na aula.
 */
function LessonXpPanel({
  currentPoints,
  maxPoints,
  pointsLostPerWrongAnswer,
  minPoints,
  completed,
  lastLoss,
  attempt,
}: LessonXpPanelProps) {
  const lostPoints = maxPoints - currentPoints;
  const fillPercentage = Math.round((currentPoints / maxPoints) * 100);

  const title = completed
    ? `Você ganhou ${currentPoints} XP nesta aula`
    : lostPoints > 0
      ? `Esta aula vale agora ${currentPoints} XP`
      : `Esta aula vale ${currentPoints} XP`;

  const description = completed
    ? 'Os pontos já foram somados ao seu perfil.'
    : currentPoints <= minPoints
      ? `O prêmio chegou ao mínimo de ${minPoints} XP: novos erros não tiram mais pontos.`
      : lostPoints > 0
        ? `Você perdeu ${lostPoints} XP com respostas erradas. Cada novo erro tira mais ${pointsLostPerWrongAnswer} XP, até o mínimo de ${minPoints} XP.`
        : `Acerte todas as questões para ganhar os ${maxPoints} XP. Cada resposta errada tira ${pointsLostPerWrongAnswer} XP do prêmio, até o mínimo de ${minPoints} XP.`;

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 ${completed ? 'border-success/30 bg-success/5' : 'border-primary/20 bg-primary/5'}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${completed ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary'}`}
        >
          <Zap className="size-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-xl font-bold tracking-tight">{title}</span>
            {!completed && lastLoss > 0 && (
              <span
                key={attempt}
                className="text-sm font-semibold text-destructive tabular-nums animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out motion-reduce:slide-in-from-bottom-0"
              >
                −{lastLoss} XP
              </span>
            )}
          </p>
          <p className="mt-1 text-base text-muted-foreground text-pretty">{description}</p>
          <div
            className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted"
            role="meter"
            aria-label="XP que a aula vale"
            aria-valuemin={0}
            aria-valuemax={maxPoints}
            aria-valuenow={currentPoints}
            aria-valuetext={`${currentPoints} de ${maxPoints} XP`}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none ${completed ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground tabular-nums">
            {currentPoints} de {maxPoints} XP
          </p>
        </div>
      </div>
    </div>
  );
}

interface LessonNavigationProps {
  unityPath: string;
  nextLesson: Lesson | undefined;
}

/**
 * Leva o usuário para a próxima aula da unidade ou de volta para a unidade.
 * Sem próxima aula, voltar para a unidade passa a ser a ação principal.
 */
function LessonNavigation({ unityPath, nextLesson }: LessonNavigationProps) {
  return (
    <div className="space-y-3">
      {nextLesson && (
        <p className="text-center text-sm text-muted-foreground">
          A seguir: <span className="font-medium text-foreground">{nextLesson.title}</span>
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button asChild size="lg" variant={nextLesson ? 'outline' : 'default'}>
          <Link href={unityPath}>Voltar para a unidade</Link>
        </Button>
        {nextLesson && (
          <Button asChild size="lg">
            <Link href={`${unityPath}/lesson/${encodeURIComponent(nextLesson.title)}`}>
              Próxima aula <ArrowRight />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function LessonPage() {
  const params = useParams();
  const unityNameParam = params.unityName as string;
  const lessonNameParam = params.lessonName as string;

  const unityName = unityNameParam;
  const lessonName = lessonNameParam;

  const unityNameDisplay = decodeURIComponent(unityNameParam);
  const lessonNameDisplay = decodeURIComponent(lessonNameParam);

  const queryClient = useQueryClient();
  const [quiz, dispatch] = useReducer(quizReducer, initialQuizState);
  const [highlightUnanswered, setHighlightUnanswered] = useState(false);
  const { verifyResult } = quiz;

  const {
    data: lesson,
    isLoading: lessonLoading,
    error: lessonError,
  } = useQuery({
    queryKey: queryKeys.lessons.detail(unityName, lessonName),
    queryFn: () => lessonsApi.getByName(unityName, lessonName),
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: queryKeys.questionnaire.byLesson(unityName, lessonName),
    queryFn: () => questionnaireApi.getByLesson(unityName, lessonName),
  });

  const { data: unityLessons } = useQuery({
    queryKey: queryKeys.lessons.list(unityName),
    queryFn: () => lessonsApi.listByUnity(unityName),
  });

  // O que foi selecionado/verificado nesta visita prevalece sobre o que veio da API.
  const persisted = getPersistedQuizState(questions);
  const selectedAnswers = { ...persisted.selectedAnswers, ...quiz.selectedAnswers };
  const allAnswersStatus = { ...persisted.allAnswersStatus, ...quiz.allAnswersStatus };
  const verifiedAnswers = { ...persisted.verifiedAnswers, ...quiz.verifiedAnswers };

  const currentPoints = verifyResult?.currentPointsWeight ?? lesson?.currentPointsWeight;
  const lastLoss =
    verifyResult && quiz.pointsBeforeAttempt !== null
      ? Math.max(quiz.pointsBeforeAttempt - verifyResult.currentPointsWeight, 0)
      : 0;

  const currentLessonIndex = unityLessons?.findIndex((l) => l.publicId === lesson?.publicId) ?? -1;
  const nextLesson = currentLessonIndex >= 0 ? unityLessons?.[currentLessonIndex + 1] : undefined;
  const unityPath = `/unity/${unityNameParam}`;

  const questionCardRefs = useRef(new Map<string, HTMLDivElement>());
  const resultCardRef = useRef<HTMLDivElement>(null);

  const verifyMutation = useMutation({
    mutationFn: () => {
      const answers = Object.entries(selectedAnswers)
        .filter(([qId]) => !allAnswersStatus[qId])
        .map(([qId, aId]) => ({
          publicQuestionId: qId,
          publicAlternativeId: aId,
        }));

      return questionnaireApi.verifyAnswers({
        publicLessonId: lesson?.publicId,
        unityName,
        answers,
      });
    },
    onSuccess: (data) => {
      dispatch({ type: 'apply-result', result: data, pointsBefore: currentPoints ?? null });

      const nextStatus = { ...allAnswersStatus };
      data.answers.forEach((a) => {
        nextStatus[a.publicQuestionId] = a.isCorrect;
      });

      if (isLessonComplete(questions, nextStatus)) {
        queryClient.invalidateQueries({ queryKey: queryKeys.lessons.detail(unityName, lessonName) });
        queryClient.invalidateQueries({ queryKey: queryKeys.lessons.list(unityName) });
        queryClient.invalidateQueries({ queryKey: queryKeys.unities.detail(unityName) });
      }
    },
  });

  const acceptsAnswers = lesson?.acceptsAnswers !== false;

  const handleAnswerSelect = (questionId: string, alternativeId: string) => {
    if (!acceptsAnswers || allAnswersStatus[questionId]) return;
    dispatch({ type: 'select', questionId, alternativeId });
  };

  const getYouTubeId = (url: string | null) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeId(lesson?.videoUrl || null);
  const lessonComplete = isLessonComplete(questions, allAnswersStatus);

  const unansweredQuestionIds =
    questions
      ?.filter((q) => !allAnswersStatus[q.publicId] && !selectedAnswers[q.publicId])
      .map((q) => q.publicId) ?? [];
  const unansweredQuestionNumbers =
    questions?.flatMap((q, index) => (unansweredQuestionIds.includes(q.publicId) ? [index + 1] : [])) ?? [];

  const handleSubmit = () => {
    if (unansweredQuestionIds.length === 0) {
      verifyMutation.mutate();
      return;
    }

    setHighlightUnanswered(true);
    const firstUnansweredCard = questionCardRefs.current.get(unansweredQuestionIds[0]);
    firstUnansweredCard?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'center',
    });
    firstUnansweredCard?.querySelector<HTMLElement>('[role="radio"]')?.focus({ preventScroll: true });
  };

  const playVerifyFeedback = useEffectEvent((result: VerifyAnswersResponse) => {
    playAnswerFeedback(result.answers, questionCardRefs.current);
    const resultCard = resultCardRef.current;
    if (!resultCard || !lessonComplete) return;
    if (result.wasUnityCorrectlyAnswered) celebrateUnityCompletion(resultCard);
    else celebrateLessonCompletion(resultCard);
  });

  useEffect(() => {
    if (verifyResult) playVerifyFeedback(verifyResult);
  }, [verifyResult]);

  if (isNotFoundError(lessonError)) return <ContentNotFound title="Aula não encontrada" />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-6">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href={`/unity/${unityNameParam}`} />}>
                  {unityNameDisplay}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{lessonNameDisplay}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight">{lessonNameDisplay}</h1>
            {lessonLoading && !lesson ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <Badge
                key={String(lesson?.concluded)}
                variant={lesson?.concluded ? 'success' : 'secondary'}
                className={`px-4 py-1 ${verifyResult && lesson?.concluded ? 'animate-in zoom-in-75 fade-in-0 duration-500 ease-out motion-reduce:zoom-in-100' : ''}`}
              >
                {lesson?.concluded ? 'Concluída' : 'Em andamento'}
              </Badge>
            )}
          </div>
        </header>

        <div className="space-y-8">
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-border">
            {lessonLoading && !lesson ? (
              <Skeleton className="w-full h-full rounded-none" />
            ) : videoId ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                title={lesson?.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                <PlayCircle className="w-16 h-16 opacity-20" />
                <p>Vídeo não disponível para esta aula.</p>
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sobre esta aula</CardTitle>
            </CardHeader>
            <CardContent>
              {lessonLoading && !lesson ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <p className="max-w-prose text-base text-muted-foreground leading-relaxed text-pretty whitespace-pre-wrap">
                  {lesson?.description || 'Nenhuma descrição detalhada disponível.'}
                </p>
              )}
            </CardContent>
          </Card>

          <section className="space-y-6">
            <div className="flex items-center gap-3 border-t pt-8">
              <ClipboardList className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Questionário</h2>
            </div>
          {questionsLoading && !questions ? (
            <div className="max-w-3xl mx-auto space-y-8 pb-12">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="bg-muted/30">
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton key={j} className="h-14 w-full rounded-lg" />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : questions && questions.length > 0 ? (
            <div className="max-w-3xl mx-auto space-y-8 pb-12">
              {acceptsAnswers &&
                currentPoints !== undefined &&
                lesson?.maxPointsWeight !== undefined &&
                lesson.pointsLostPerWrongAnswer !== undefined &&
                lesson.minPointsWeight !== undefined && (
                  <LessonXpPanel
                    currentPoints={currentPoints}
                    maxPoints={lesson.maxPointsWeight}
                    pointsLostPerWrongAnswer={lesson.pointsLostPerWrongAnswer}
                    minPoints={lesson.minPointsWeight}
                    completed={lessonComplete}
                    lastLoss={lastLoss}
                    attempt={quiz.attempt}
                  />
                )}
              {questions.map((question, qIndex) => {
                const isCorrect = allAnswersStatus[question.publicId];
                const isWrong = allAnswersStatus[question.publicId] === false;
                const wasJustVerified = verifyResult?.answers.some((a) => a.publicQuestionId === question.publicId);
                const verifiedAlternativeId = verifiedAnswers[question.publicId];
                const canAnswer = !isCorrect && acceptsAnswers;
                const isMissingAnswer = highlightUnanswered && unansweredQuestionIds.includes(question.publicId);

                return (
                  <Card
                    key={question.publicId}
                    ref={(element: HTMLDivElement | null) => {
                      if (element) questionCardRefs.current.set(question.publicId, element);
                      else questionCardRefs.current.delete(question.publicId);
                    }}
                    className={`overflow-hidden transition-shadow duration-300 ${isWrong ? 'ring-2 ring-destructive/50' : isCorrect ? 'ring-2 ring-success/50' : isMissingAnswer ? 'ring-2 ring-primary/60' : ''}`}
                  >
                    <CardHeader className="bg-muted/30">
                      <CardTitle className="text-lg flex gap-3">
                        <span className="text-primary tabular-nums">{qIndex + 1}.</span>
                        <span id={`question-${question.publicId}`} className="flex-1">{question.statement}</span>
                        {(isCorrect || isWrong) && (
                          <span
                            key={`${question.publicId}-${quiz.attempt}`}
                            className={wasJustVerified ?'animate-in zoom-in-50 fade-in-0 duration-300 ease-out motion-reduce:zoom-in-100' : ''}
                          >
                            {isCorrect ? (
                              <CheckCircle2 className="w-6 h-6 text-success" role="img" aria-label="Resposta correta" />
                            ) : (
                              <XCircle className="w-6 h-6 text-destructive" role="img" aria-label="Resposta incorreta" />
                            )}
                          </span>
                        )}
                      </CardTitle>
                      {isMissingAnswer && (
                        <p className="text-sm font-medium text-primary animate-in fade-in-0 duration-300">
                          Escolha uma alternativa para enviar.
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="p-6">
                      <RadioGroup
                        onValueChange={(val) => handleAnswerSelect(question.publicId, val)}
                        value={selectedAnswers[question.publicId] || ''}
                        aria-labelledby={`question-${question.publicId}`}
                        className="space-y-3"
                        disabled={isCorrect || !acceptsAnswers}
                      >
                        {question.alternatives.map((alt) => (
                          <div
                            key={alt.publicId}
                            className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-[color,background-color,border-color,transform,opacity] duration-150 ease-out ${canAnswer ? 'active:scale-[0.99]' : ''} ${isWrong && verifiedAlternativeId === alt.publicId ? 'border-destructive/60 bg-destructive/5' : selectedAnswers[question.publicId] === alt.publicId ? (isCorrect ? 'border-success bg-success/5' : 'border-primary bg-primary/5') : ''} ${isCorrect ? 'opacity-80' : ''}`}
                            onClick={() => handleAnswerSelect(question.publicId, alt.publicId)}
                          >
                            <RadioGroupItem value={alt.publicId} id={alt.publicId} />
                            <Label htmlFor={alt.publicId} className="flex-1 cursor-pointer text-base font-medium leading-relaxed">
                              {alt.text}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>
                );
              })}

              {verifyResult && (
                <Card
                  key={quiz.attempt}
                  ref={resultCardRef}
                  role="status"
                  className={`border-2 animate-quiz-reveal ${lessonComplete ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}
                >
                  {lessonComplete ? (
                    <CardContent className="p-6 sm:p-8 flex flex-col items-center gap-2 text-center">
                      <CheckCircle2 className="size-10 text-success" aria-hidden />
                      <h4 className="text-2xl font-bold tracking-tight">Excelente!</h4>
                      <p className="text-base text-muted-foreground">
                        {verifyResult.message || 'Você acertou todas as questões desta aula.'}
                      </p>
                      {verifyResult.currentPointsWeight > 0 && (
                        <p className="mt-2 text-5xl font-bold tracking-tight text-primary animate-in zoom-in-50 fade-in-0 duration-500 ease-out fill-mode-both [animation-delay:150ms] motion-reduce:zoom-in-100">
                          +<XpCounter value={verifyResult.currentPointsWeight} /> XP
                        </p>
                      )}
                      {verifyResult.wasUnityCorrectlyAnswered && (
                        <div className="mt-4 w-full p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center gap-3 animate-quiz-reveal [animation-delay:350ms]">
                          <Trophy className="w-6 h-6 text-primary shrink-0" aria-hidden />
                          <p className="font-semibold text-primary">Parabéns! Você concluiu todas as aulas desta unidade!</p>
                        </div>
                      )}
                      <div className="mt-6 animate-quiz-reveal [animation-delay:500ms]">
                        <LessonNavigation unityPath={unityPath} nextLesson={nextLesson} />
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="p-6 flex items-start gap-4">
                      <AlertCircle className="w-8 h-8 text-destructive shrink-0" aria-hidden />
                      <div>
                        <h4 className="text-xl font-bold mb-1">Ainda não foi dessa vez</h4>
                        <p className="text-base text-muted-foreground">
                          {verifyResult.message || 'Algumas respostas estão incorretas. Tente novamente.'}
                        </p>
                        {verifyResult.currentPointsWeight > 0 && (
                          <p className="mt-2 font-semibold">
                            {lastLoss > 0 && (
                              <span className="text-destructive">Você perdeu {lastLoss} XP. </span>
                            )}
                            <span className="text-primary">
                              {lastLoss > 0
                                ? `Acerte todas para ganhar os ${verifyResult.currentPointsWeight} XP que restam.`
                                : `Acerte todas para ganhar ${verifyResult.currentPointsWeight} XP.`}
                            </span>
                          </p>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}

              {acceptsAnswers && lessonComplete ? (
                !verifyResult && (
                  <div className="flex justify-center pt-4">
                    <LessonNavigation unityPath={unityPath} nextLesson={nextLesson} />
                  </div>
                )
              ) : acceptsAnswers ? (
                <div className="flex flex-col items-center gap-3 pt-4">
                  <p
                    aria-live="polite"
                    className={`text-center text-base ${highlightUnanswered ? 'font-medium text-primary' : 'text-muted-foreground'}`}
                  >
                    {unansweredQuestionNumbers.length > 0 && describeUnansweredQuestions(unansweredQuestionNumbers)}
                  </p>
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    className="w-full sm:w-64 h-14 text-lg rounded-xl shadow-xl shadow-primary/20"
                    disabled={verifyMutation.isPending}
                  >
                    {verifyMutation.isPending ? (
                      <>Validando <Loader2 className="w-5 h-5 ml-2 animate-spin" /></>
                    ) : (
                      <>Enviar Respostas <Send className="w-5 h-5 ml-2" /></>
                    )}
                  </Button>
                </div>
              ) : (
                <Card className="bg-muted/30">
                  <CardContent className="p-6 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-muted-foreground shrink-0" />
                    <p className="text-muted-foreground">
                      Esta unidade está inativa. Você pode ver as questões, mas elas não aceitam respostas
                      enquanto a unidade não for ativada.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
              <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sem questões</h3>
              <p className="text-muted-foreground">Esta aula ainda não possui um questionário associado.</p>
            </div>
          )}
          </section>
        </div>
      </main>
    </div>
  );
}
