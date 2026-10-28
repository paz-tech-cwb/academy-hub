'use client';

import { useQuery } from '@tanstack/react-query';
import { certificatesApi } from '@/lib/api/certificates';
import { queryKeys } from '@/lib/query-keys';
import Navbar from '@/components/layout/navbar';
import { ActionTile } from '@/components/action-tile';
import { Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

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
          <h1 className="text-3xl font-bold tracking-tight mb-2">Meus Certificados</h1>
          <p className="text-muted-foreground">Aqui você encontra todas as suas conquistas no Academy Hub.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {isLoading && !certificates &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] rounded-xl" />
            ))}

          {certificates?.map((cert) => (
            <ActionTile
              key={cert.unityName}
              icon={Award}
              title={cert.unityName}
              description={`Concluído em ${format(new Date(cert.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
              href={`/certificates/${encodeURIComponent(cert.unityName)}`}
            />
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
