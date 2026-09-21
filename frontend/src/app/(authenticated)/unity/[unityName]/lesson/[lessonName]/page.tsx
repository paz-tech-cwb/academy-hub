'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useReducer, useState } from 'react';
import { lessonsApi } from '@/lib/api/lessons';
import { questionnaireApi } from '@/lib/api/questionnaire';
import { queryKeys } from '@/lib/query-keys';
import { Question, VerifyAnswersResponse, UserRole } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { LessonAdminEditor } from '@/components/admin/lesson-admin-editor';
import Navbar from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, PlayCircle, ClipboardList, Send, Loader2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface QuizState {
  selectedAnswers: Record<string, string>;
  allAnswersStatus: Record<string, boolean>;
  verifyResult: VerifyAnswersResponse | null;
}

type QuizAction =
  | { type: 'select'; questionId: string; alternativeId: string }
  | { type: 'apply-result'; result: VerifyAnswersResponse };

const initialQuizState: QuizState = {
  selectedAnswers: {},
  allAnswersStatus: {},
  verifyResult: null,
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
      action.result.answers.forEach((a) => {
        allAnswersStatus[a.publicQuestionId] = a.isCorrect;
      });
      return { ...state, verifyResult: action.result, allAnswersStatus };
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

export default function LessonPage() {
  const params = useParams();
  const unityNameParam = params.unityName as string;
  const lessonNameParam = params.lessonName as string;

  const unityName = unityNameParam;
  const lessonName = lessonNameParam;

  const unityNameDisplay = decodeURIComponent(unityNameParam);

  const { user } = useAuth();
  const isAdmin = user?.profile?.role === UserRole.Admin;

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('video');
  const [quiz, dispatch] = useReducer(quizReducer, initialQuizState);
  const { selectedAnswers, allAnswersStatus, verifyResult } = quiz;

  const { data: lesson, isLoading: lessonLoading } = useQuery({
    queryKey: queryKeys.lessons.detail(unityName, lessonName),
    queryFn: () => lessonsApi.getByName(unityName, lessonName),
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: queryKeys.questionnaire.byLesson(unityName, lessonName),
    queryFn: () => questionnaireApi.getByLesson(unityName, lessonName),
  });

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
      dispatch({ type: 'apply-result', result: data });

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

  const handleAnswerSelect = (questionId: string, alternativeId: string) => {
    dispatch({ type: 'select', questionId, alternativeId });
  };

  const getYouTubeId = (url: string | null) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const isLoading = lessonLoading || questionsLoading;

  const videoId = getYouTubeId(lesson?.videoUrl || null);
  const lessonComplete = isLessonComplete(questions, allAnswersStatus);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-6">
          {isLoading ? (
            <>
              <Skeleton className="h-4 w-40 mb-4" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Skeleton className="h-9 w-80" />
                <Skeleton className="h-7 w-28" />
              </div>
            </>
          ) : (
            <>
              <Link href={`/unity/${unityNameParam}`} className="text-sm text-primary hover:underline flex items-center gap-1 mb-4">
                ← Voltar para {unityNameDisplay}
              </Link>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">{lesson?.title}</h1>
                <Badge variant={lesson?.concluded ? 'success' : 'secondary'} className="px-4 py-1">
                  {lesson?.concluded ? 'Concluída' : 'Em andamento'}
                </Badge>
              </div>
            </>
          )}
        </header>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-full max-w-md" />
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <div className="rounded-xl border bg-card p-6 space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : null}

        {!isLoading && <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 h-12 bg-muted/50 p-1 border">
            <TabsTrigger value="video" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <PlayCircle className="w-4 h-4 mr-2" /> Aula em Vídeo
            </TabsTrigger>
            <TabsTrigger value="quiz" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <ClipboardList className="w-4 h-4 mr-2" /> Questionário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="space-y-6">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-border">
              {videoId ? (
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

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Sobre esta aula</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {lesson?.description || 'Nenhuma descrição detalhada disponível.'}
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => setActiveTab('quiz')} size="lg" className="gap-2 px-8 py-6 text-lg rounded-xl">
                Ir para o Questionário <ClipboardList className="w-5 h-5" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="quiz" className="space-y-6">
            {isAdmin && lesson?.publicId ? (
              <LessonAdminEditor
                unityName={unityName}
                lessonName={lessonName}
                lessonPublicId={lesson.publicId}
              />
            ) : questions && questions.length > 0 ? (
              <div className="max-w-3xl mx-auto space-y-8 pb-12">
                {questions.map((question, qIndex) => {
                  const isCorrect = allAnswersStatus[question.publicId];
                  const isWrong = verifyResult?.answers.find(a => a.publicQuestionId === question.publicId)?.isCorrect === false;

                  return (
                    <Card key={question.publicId} className={`border-2 overflow-hidden transition-all ${isWrong ? 'border-destructive/30' : isCorrect ? 'border-green-500/30' : ''}`}>
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="text-lg flex gap-3">
                          <span className="text-primary opacity-50">{qIndex + 1}.</span>
                          {question.statement}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <RadioGroup
                          onValueChange={(val) => handleAnswerSelect(question.publicId, val)}
                          value={selectedAnswers[question.publicId] || ''}
                          className="space-y-3"
                          disabled={isCorrect}
                        >
                          {question.alternatives.map((alt) => (
                            <div
                              key={alt.publicId}
                              className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors ${selectedAnswers[question.publicId] === alt.publicId ? 'border-primary bg-primary/5' : ''} ${isCorrect ? 'opacity-80' : ''}`}
                              onClick={() => handleAnswerSelect(question.publicId, alt.publicId)}
                            >
                              <RadioGroupItem value={alt.publicId} id={alt.publicId} />
                              <Label htmlFor={alt.publicId} className="flex-1 cursor-pointer font-medium leading-relaxed">
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
                  <Card className={`border-2 ${lessonComplete ? 'bg-green-500/5 border-green-500/20' : 'bg-destructive/5 border-destructive/20'}`}>
                    <CardContent className="p-6 flex items-start gap-4">
                      {lessonComplete ? (
                        <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-8 h-8 text-destructive shrink-0" />
                      )}
                      <div>
                        <h4 className="text-xl font-bold mb-1">
                          {lessonComplete ? 'Excelente!' : 'Ainda não foi dessa vez'}
                        </h4>
                        <p className="text-muted-foreground">
                          {verifyResult.message || (lessonComplete ? 'Você acertou todas as questões desta aula!' : 'Algumas respostas estão incorretas. Tente novamente.')}
                        </p>
                        {verifyResult.currentPointsWeight > 0 && (
                          <p className="mt-2 font-bold text-primary">+{verifyResult.currentPointsWeight} XP</p>
                        )}
                        {verifyResult.wasUnityCorrectlyAnswered && (
                          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                            <p className="font-semibold text-primary">Parabéns! Você concluiu todas as lições desta unidade!</p>
                          </div>
                        )}
                        {lessonComplete && (
                          <Button asChild className="mt-4" variant="outline">
                            <Link href={`/unity/${unityNameParam}`}>Voltar para Unidade</Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => verifyMutation.mutate()}
                    size="lg"
                    className="w-full sm:w-64 h-14 text-lg rounded-xl shadow-xl shadow-primary/20"
                    disabled={verifyMutation.isPending || Object.keys(selectedAnswers).filter(id => !allAnswersStatus[id]).length === 0}
                  >
                    {verifyMutation.isPending ? (
                      <>Validando <Loader2 className="w-5 h-5 ml-2 animate-spin" /></>
                    ) : (
                      <>Enviar Respostas <Send className="w-5 h-5 ml-2" /></>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
                <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sem questões</h3>
                <p className="text-muted-foreground">Esta aula ainda não possui um questionário associado.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>}
      </main>
    </div>
  );
}
