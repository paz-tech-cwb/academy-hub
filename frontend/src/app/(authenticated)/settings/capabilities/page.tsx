'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useCapabilities } from '@/hooks/use-capabilities';
import { permissionsApi } from '@/lib/api/permissions';
import { queryKeys } from '@/lib/query-keys';

export default function CapabilitiesSettingsPage() {
  const { isReady } = useRequireAuth();
  const { has, isLoading: capabilitiesLoading } = useCapabilities();

  const canManage = has('permissions.manage');

  const { data: capabilities, isLoading } = useQuery({
    queryKey: queryKeys.permissions.capabilities,
    queryFn: permissionsApi.listCapabilities,
    enabled: isReady && canManage,
  });

  const breadcrumb = (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/settings" />}>Configurações</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Configuração de funcionalidades</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  const header = (
    <header className="mb-8">
      {breadcrumb}
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Configuração de funcionalidades
      </h1>
      <p className="text-muted-foreground">
        A funcionalidade é a unidade de acesso: é ela que cada perfil concede. O catálogo é
        definido em código, então esta tela é apenas de consulta.
      </p>
    </header>
  );

  if (!isReady || capabilitiesLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex-1">
          {header}
          <Skeleton className="h-96 w-full rounded-xl bg-card ring-1 ring-foreground/10" />
        </main>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex-1">
          {header}
          <p className="text-sm text-muted-foreground">
            Você não tem acesso à configuração de permissionamento.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        {header}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Catálogo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}

            {!isLoading && capabilities?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma funcionalidade cadastrada. Rode o script de permissionamento no banco.
              </p>
            )}

            {capabilities?.map((capability) => (
              <div
                key={capability.publicId}
                className="rounded-lg border p-3"
              >
                <p className="text-sm font-medium truncate">{capability.name}</p>
                <p className="text-xs text-muted-foreground">
                  {capability.description || 'Sem descrição'}
                </p>
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  {capability.code}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
