'use client';

import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/navbar';
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

const CONTENT_SETTINGS_HREF = '/settings/content';
const CONTENT_SETTINGS_LABEL = 'Configuração de conteúdos';

interface ContentSettingsShellProps {
  /** Último item do breadcrumb abaixo de "Configuração de conteúdos", quando houver. */
  currentPage?: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
}

/**
 * Estrutura comum das telas de configuração de conteúdos: navbar, breadcrumb, cabeçalho e
 * bloqueio de acesso. Só renderiza o conteúdo para quem tem `content.manage`,
 * `content.read` ou `questionnaire.manage`.
 */
export function ContentSettingsShell({ currentPage, title, description, children }: ContentSettingsShellProps) {
  const { isReady } = useRequireAuth();
  const { has, isLoading: capabilitiesLoading } = useCapabilities();

  const canOpen = has('content.manage') || has('content.read') || has('questionnaire.manage');

  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Configurações', href: '/settings' },
    { label: CONTENT_SETTINGS_LABEL, href: currentPage ? CONTENT_SETTINGS_HREF : undefined },
    ...(currentPage ? [{ label: currentPage, href: undefined }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                {trail.map((item, index) => (
                  <Fragment key={item.label}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {item.href ? (
                        <BreadcrumbLink render={<Link href={item.href} />}>{item.label}</BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </header>

          {!isReady || capabilitiesLoading ? (
            <Skeleton className="h-96 w-full rounded-xl bg-card ring-1 ring-foreground/10" />
          ) : canOpen ? (
            children
          ) : (
            <p className="text-sm text-muted-foreground">
              Você não tem acesso à configuração de conteúdos.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
