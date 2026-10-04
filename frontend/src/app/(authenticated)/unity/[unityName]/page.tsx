'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { unitiesApi } from '@/lib/api/unities';
import { lessonsApi } from '@/lib/api/lessons';
import { certificatesApi } from '@/lib/api/certificates';
import { getApiErrorMessage } from '@/lib/api/errors';
import { queryKeys } from '@/lib/query-keys';
import Navbar from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, PlayCircle, Award, Loader2 } from 'lucide-react';
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
import { useState } from 'react';
import { toast } from 'sonner';

export default function UnityPage() {
  const params = useParams();
  const unityNameParam = params.unityName as string;
  const unityName = unityNameParam;
  const unityNameDisplay = decodeURIComponent(unityNameParam);

  const router = useRouter();
  const [issuing, setIssuing] = useState(false);

  const { data: unityDetails, isLoading: unityLoading } = useQuery({
    queryKey: queryKeys.unities.detail(unityName),
    queryFn: () => unitiesApi.getByName(unityName),
    enabled: !!unityName,
  });

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: queryKeys.lessons.list(unityName),
    queryFn: () => lessonsApi.listByUnity(unityName),
    enabled: !!unityName,
  });

  const issueCertificate = async () => {
    setIssuing(true);
    try {
      await certificatesApi.issue(unityName);
      toast.success('Certificado emitido com sucesso!');
      router.push('/certificates');
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Falha ao emitir certificado. Verifique se concluiu todas as aulas e questionários.',
        ),
      );
    } finally {
      setIssuing(false);
    }
  };

  const isLoading = unityLoading || lessonsLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <Breadcrumb className="mb-2">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{unityNameDisplay}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            {isLoading ? (
              <>
                <Skeleton className="h-10 w-72" />
                <Skeleton className="h-5 w-96" />
              </>
            ) : (
              <>
                <h1 className="text-4xl font-extrabold tracking-tight">{unityNameDisplay}</h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  {unityDetails?.description || 'Explore as aulas desta unidade e complete os desafios.'}
                </p>
              </>
            )}
          </div>

          {unityDetails?.wasUnityCorrectlyAnswered && (
            <div className="bg-primary/10 border border-primary/20 p-6 rounded-2xl flex flex-col items-center gap-3">
              <Award className="w-12 h-12 text-primary" />
              <div className="text-center">
                <p className="text-sm font-medium mb-3">Parabéns! Você concluiu esta unidade.</p>
                <Button
                  onClick={issueCertificate}
                  disabled={issuing || unityDetails.wasCertificateAlreadyIssued}
                  className="w-full shadow-lg shadow-primary/20"
                >
                  {issuing ? 'Emitindo...' : unityDetails.wasCertificateAlreadyIssued ? 'Certificado Emitido' : 'Emitir Certificado'}
                </Button>
              </div>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <Skeleton className="h-8 w-48 mb-4" />
          ) : (
            <h2 className="text-2xl font-bold mb-4">Cronograma de Aulas</h2>
          )}
          {isLoading && !!!lessons &&
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} variant="interactive">
                <CardContent className="flex items-center p-4 sm:p-6 gap-4 sm:gap-6 group">
                  <Skeleton className="shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="shrink-0 w-10 h-10 rounded-full" />
                </CardContent>
              </Card>
            ))}
          {lessons?.map((lesson, index) => (
            <Card
              key={lesson.publicId}
              variant="interactive"
              className={lesson.concluded ? 'bg-secondary/20 border-success/20' : ''}
            >
              <CardContent className="p-0">
                <Link
                  href={`/unity/${unityNameParam}/lesson/${encodeURIComponent(lesson.title)}`}
                  className="flex items-center p-4 sm:p-6 gap-4 sm:gap-6 group"
                >
                  <div className={`shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl font-bold transition-colors ${lesson.concluded ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'}`}>
                    {lesson.concluded ? <CheckCircle2 className="w-8 h-8" /> : index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold truncate group-hover:text-primary transition-colors">
                      {lesson.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant={lesson.concluded ? 'success' : 'secondary'}>
                        {lesson.concluded ? 'Concluída' : 'Pendente'}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <PlayCircle className="w-3 h-3" /> Assistir aula
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Button size="icon" variant="ghost" className="rounded-full group-hover:bg-primary/10 group-hover:text-primary">
                      <PlayCircle className="w-8 h-8" />
                    </Button>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}

          {lessons?.length === 0 && (
            <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed">
              <Loader2 className="w-12 h-12 mx-auto text-muted-foreground/30 animate-spin mb-4" />
              <p className="text-muted-foreground">Carregando aulas ou nenhuma aula disponível.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
