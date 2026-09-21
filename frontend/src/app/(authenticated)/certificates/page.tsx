'use client';

import { useQuery } from '@tanstack/react-query';
import { certificatesApi } from '@/lib/api/certificates';
import { queryKeys } from '@/lib/query-keys';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CertificatesPage() {
  const { data: certificates, isLoading } = useQuery({
    queryKey: queryKeys.certificates.all,
    queryFn: certificatesApi.list,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-8">
          {isLoading ? (
            <>
              <Skeleton className="h-9 w-56 mb-2" />
              <Skeleton className="h-5 w-72" />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Meus Certificados</h1>
              <p className="text-muted-foreground">Aqui você encontra todas as suas conquistas no Academy Hub.</p>
            </>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}

          {certificates?.map((cert) => (
            <Card key={cert.unityName} variant="interactive" className="group relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <Award className="w-24 h-24 text-primary" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  {cert.unityName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Concluído em: {format(new Date(cert.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => toast.info('Download do PDF em desenvolvimento...')}
                >
                  <Download className="w-4 h-4" /> Baixar Certificado
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {certificates?.length === 0 && (
          <div className="text-center py-20 bg-card rounded-2xl border-2 border-dashed">
            <Award className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhum certificado ainda</h2>
            <p className="text-muted-foreground mb-6">Complete as unidades e responda aos questionários para ganhar seus certificados.</p>
            <Button asChild>
              <Link href="/">Começar a Aprender</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
