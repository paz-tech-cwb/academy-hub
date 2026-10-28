'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';
import { certificatesApi } from '@/lib/api/certificates';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/contexts/auth-context';
import Navbar from '@/components/layout/navbar';
import { CertificateDocument } from '@/components/certificates/certificate-document';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function CertificatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const unityName = decodeURIComponent(params.unityName as string);
  const justIssued = searchParams.get('emitido') === '1';
  const { user } = useAuth();

  const { data: certificates, isLoading } = useQuery({
    queryKey: queryKeys.certificates.all,
    queryFn: certificatesApi.list,
  });

  const certificate = certificates?.find((cert) => cert.unityName === unityName);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 py-8 flex-1">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link href="/certificates">
            <ArrowLeft /> Meus certificados
          </Link>
        </Button>

        {isLoading && !certificates ? (
          <Skeleton className="aspect-[297/210] w-full rounded-xl" />
        ) : certificate && user ? (
          <div className="animate-quiz-reveal">
            <CertificateDocument
              username={user.username}
              unityName={certificate.unityName}
              issuedAt={format(new Date(certificate.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              stampSeal={justIssued}
            />
          </div>
        ) : (
          <div className="py-16 text-center">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Certificado não encontrado</h1>
            <p className="text-muted-foreground mb-6">
              Você ainda não tem um certificado da unidade “{unityName}”.
            </p>
            <Button asChild>
              <Link href="/certificates">Ver meus certificados</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
