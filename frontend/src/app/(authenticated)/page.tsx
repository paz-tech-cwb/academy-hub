"use client";

import { useQuery } from "@tanstack/react-query";
import { unitiesApi } from "@/lib/api/unities";
import { usersApi } from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/contexts/auth-context";
import { Unity, UnityProgress, UserProfile } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";

type NextStep =
  | { kind: "continue" | "start"; progress: UnityProgress }
  | { kind: "all-done" };

/**
 * Escolhe o que a home deve sugerir ao aluno: continuar a unidade em que ele respondeu algo por último,
 * começar a primeira unidade com aulas pendentes ou, se ele concluiu tudo, parabenizá-lo.
 *
 * @param progress - Progresso do aluno em cada unidade ativa.
 * @returns A sugestão, ou `null` quando não há nenhuma aula publicada.
 */
function getNextStep(progress: UnityProgress[]): NextStep | null {
  const pending = progress.filter((p) => p.nextLessonTitle !== null);
  if (pending.length === 0) {
    return progress.some((p) => p.totalLessons > 0) ? { kind: "all-done" } : null;
  }

  const lastStarted = pending
    .filter((p) => p.lastActivityAt !== null)
    .sort((a, b) => b.lastActivityAt!.localeCompare(a.lastActivityAt!))[0];

  return lastStarted
    ? { kind: "continue", progress: lastStarted }
    : { kind: "start", progress: pending[0] };
}

/**
 * Calcula a porcentagem de aulas concluídas de uma unidade.
 */
function getCompletionPercentage(progress: UnityProgress): number {
  if (progress.totalLessons === 0) return 0;
  return Math.round((progress.concludedLessons / progress.totalLessons) * 100);
}

/**
 * Define o rótulo do botão de uma unidade conforme o progresso do aluno nela.
 */
function getUnityActionLabel(progress: UnityProgress | undefined): string {
  if (!progress || progress.totalLessons === 0) return "Ver aulas";
  if (progress.nextLessonTitle === null) return "Revisar aulas";
  return progress.lastActivityAt ? "Continuar" : "Começar";
}

interface NextStepPanelProps {
  nextStep: NextStep;
  unity: Unity | undefined;
}

/**
 * Painel com o próximo passo do aluno: a aula a continuar ou a começar, com o progresso da unidade.
 */
function NextStepPanel({ nextStep, unity }: NextStepPanelProps) {
  if (nextStep.kind === "all-done") {
    return (
      <section
        aria-labelledby="next-step-title"
        className="rounded-2xl border border-success/30 bg-success/5 p-5 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center"
      >
        <CheckCircle2 className="size-10 shrink-0 text-success" aria-hidden />
        <div className="flex-1 space-y-1">
          <h2 id="next-step-title" className="text-xl font-bold tracking-tight">
            Você concluiu todas as unidades
          </h2>
          <p className="text-base text-muted-foreground text-pretty">
            Novas unidades aparecem aqui assim que forem publicadas.
          </p>
        </div>
        <Button asChild size="lg" variant="outline">
          <Link href="/certificates">Ver meus certificados</Link>
        </Button>
      </section>
    );
  }

  const { progress } = nextStep;
  const unityPath = `/unity/${encodeURIComponent(progress.unityName)}`;
  const lessonPath = `${unityPath}/lesson/${encodeURIComponent(progress.nextLessonTitle!)}`;

  return (
    <section
      aria-labelledby="next-step-title"
      className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 flex flex-col gap-5 sm:flex-row sm:items-center"
    >
      {unity?.unityCover && (
        <div className="relative hidden aspect-video w-40 shrink-0 overflow-hidden rounded-xl bg-muted sm:block">
          <Image src={unity.unityCover} alt="" fill sizes="160px" className="object-cover" />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-3">
        <div className="space-y-1">
          <h2 id="next-step-title" className="text-xl font-bold tracking-tight">
            {nextStep.kind === "continue" ? "Continue de onde parou" : "Comece por aqui"}
          </h2>
          <p className="text-base font-medium text-pretty">{progress.nextLessonTitle}</p>
          <p className="text-sm text-muted-foreground">
            <Link href={unityPath} className="underline-offset-4 hover:underline">
              {progress.unityName}
            </Link>
          </p>
        </div>
        <div className="max-w-sm space-y-1.5">
          <Progress
            value={getCompletionPercentage(progress)}
            aria-label={`Aulas concluídas em ${progress.unityName}`}
          />
          <p className="text-sm text-muted-foreground tabular-nums">
            {progress.concludedLessons} de {progress.totalLessons} aulas concluídas
          </p>
        </div>
      </div>
      <Button asChild size="lg">
        <Link href={lessonPath}>
          {nextStep.kind === "continue" ? "Continuar aula" : "Começar aula"} <ArrowRight />
        </Link>
      </Button>
    </section>
  );
}

/**
 * Painel com o nível do aluno, o XP total e quanto falta para o próximo nível.
 * Aparece quando não há unidade em andamento, no lugar onde ficaria o "continue de onde parou".
 */
function LevelPanel({ profile }: { profile: UserProfile }) {
  const missingExperience = profile.requiredExperienceToNextLevel - profile.experience;

  return (
    <section aria-labelledby="level-title" className="rounded-2xl border bg-card p-5 sm:p-6 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="level-title" className="text-xl font-bold tracking-tight">
          Nível {profile.level}
        </h2>
        <p className="text-sm text-muted-foreground tabular-nums">
          {profile.experience.toLocaleString("pt-BR")} XP no total
        </p>
      </div>
      <Progress value={profile.levelPercentage} aria-label={`Progresso no nível ${profile.level}`} />
      <p className="text-sm text-muted-foreground tabular-nums text-pretty">
        Faltam {missingExperience.toLocaleString("pt-BR")} XP para o nível {profile.level + 1}. Conclua
        aulas para ganhar XP.
      </p>
    </section>
  );
}

export default function HomePage() {
  const { user } = useAuth();

  const { data: unities, isLoading } = useQuery({
    queryKey: queryKeys.unities.all,
    queryFn: unitiesApi.list,
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: queryKeys.users.progress,
    queryFn: usersApi.getMyProgress,
  });

  const { data: profile } = useQuery({
    queryKey: queryKeys.users.profile(user?.username ?? ""),
    queryFn: () => usersApi.getProfile(user!.username),
    enabled: !!user,
  });

  const progressByUnity = new Map(progress?.map((p) => [p.unityPublicId, p]));
  const nextStep = progress ? getNextStep(progress) : null;
  const showLevelPanel = nextStep?.kind !== "continue";
  const nextStepUnity =
    nextStep && nextStep.kind !== "all-done"
      ? unities?.find((u) => u.publicId === nextStep.progress.unityPublicId)
      : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {user ? `Olá, ${user.username}` : "Olá!"}
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e continue de onde parou.
          </p>
        </header>

        {progressLoading && !progress ? (
          <Skeleton className="mb-10 h-[148px] w-full rounded-2xl" />
        ) : (
          <div className="mb-10 space-y-4 empty:hidden">
            {nextStep && <NextStepPanel nextStep={nextStep} unity={nextStepUnity} />}
            {showLevelPanel && profile && <LevelPanel profile={profile} />}
          </div>
        )}

        <h2 className="text-2xl font-bold tracking-tight mb-4">Unidades</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && !unities &&
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} variant="interactive" className="group">
                <Skeleton className="aspect-video w-full rounded-none" />
                <CardHeader className="gap-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
              </Card>
            ))}

          {unities?.map((unity) => {
            const unityProgress = progressByUnity.get(unity.publicId);
            const isConcluded =
              !!unityProgress && unityProgress.totalLessons > 0 && unityProgress.nextLessonTitle === null;

            return (
              <Card key={unity.publicId} variant="interactive" className="group">
                <div className="aspect-video bg-muted relative">
                  {unity.unityCover ? (
                    <Image
                      src={unity.unityCover}
                      alt={unity.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-secondary/20">
                      <BookOpen className="w-12 h-12 text-primary/40" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle>{unity.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {unity.description || "Nenhuma descrição disponível."}
                  </CardDescription>
                </CardHeader>
                {unityProgress && unityProgress.totalLessons > 0 && (
                  <CardContent className="space-y-1.5">
                    <Progress
                      value={getCompletionPercentage(unityProgress)}
                      aria-label={`Aulas concluídas em ${unity.name}`}
                    />
                    <p
                      className={`flex items-center gap-1.5 text-sm tabular-nums ${isConcluded ? "text-success" : "text-muted-foreground"}`}
                    >
                      {isConcluded && <CheckCircle2 className="size-4" aria-hidden />}
                      {isConcluded ? "Concluída · " : ""}
                      {unityProgress.concludedLessons} de {unityProgress.totalLessons} aulas
                    </p>
                  </CardContent>
                )}
                <CardFooter className="flex justify-between items-center gap-4">
                  <Button
                    asChild
                    variant={isConcluded ? "outline" : "default"}
                    className="w-full"
                  >
                    <Link href={`/unity/${encodeURIComponent(unity.name)}`}>
                      {getUnityActionLabel(unityProgress)}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {unities?.length === 0 && (
          <div className="text-center py-20 bg-card rounded-lg border-2 border-dashed">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Nenhuma unidade encontrada
            </h2>
            <p className="text-muted-foreground">
              Novos conteúdos serão adicionados em breve.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
