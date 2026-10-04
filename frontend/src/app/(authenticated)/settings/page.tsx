'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';
import { useRequireRole } from '@/hooks/use-require-auth';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ListVideo, Search, Users, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ImportPlaylistModal from '@/components/settings/import-playlist-modal';

interface SettingsItem {
  id: string;
  section: string;
  title: string;
  description: string;
  actionLabel: string;
  icon: LucideIcon;
  iconClassName: string;
  action: () => void;
}

export default function SettingsPage() {
  const { isReady } = useRequireRole(UserRole.Admin);
  const router = useRouter();
  const [showImportModal, setShowImportModal] = useState(false);
  const [search, setSearch] = useState('');

  const settingsItems = useMemo<SettingsItem[]>(
    () => [
      {
        id: 'import-playlist',
        section: 'Conteúdo',
        title: 'Playlist do YouTube',
        description:
          'Importe vídeos de uma playlist do YouTube como uma nova unidade de treinamento.',
        actionLabel: 'Importar playlist',
        icon: ListVideo,
        iconClassName: 'text-destructive',
        action: () => setShowImportModal(true),
      },
      {
        id: 'manage-users',
        section: 'Usuários',
        title: 'Gerenciar usuários',
        description: 'Visualize, edite status, role e senha dos usuários da plataforma.',
        actionLabel: 'Gerenciar usuários',
        icon: Users,
        iconClassName: 'text-primary',
        action: () => router.push('/settings/users'),
      },
    ],
    [router],
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return settingsItems;

    return settingsItems.filter((item) =>
      [item.title, item.description, item.section].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [search, settingsItems]);

  const sections = useMemo(() => {
    const grouped = new Map<string, SettingsItem[]>();
    filteredItems.forEach((item) => {
      const items = grouped.get(item.section) ?? [];
      items.push(item);
      grouped.set(item.section, items);
    });
    return Array.from(grouped.entries());
  }, [filteredItems]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="h-16 border-b px-4 flex items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <div className="ml-auto flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-9 w-72 mb-2" />
          <Skeleton className="h-5 w-56" />
          <div className="pt-4 space-y-4">
            <Skeleton className="h-6 w-36" />
            <div className="rounded-xl border bg-card p-6 space-y-4 max-w-sm">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Configurações de Conteúdos</h1>
          <p className="text-muted-foreground">Gerencie e importe conteúdos para a plataforma.</p>
        </header>

        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar configuração..."
            className="pl-9"
            aria-label="Pesquisar configuração"
          />
        </div>

        {sections.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma configuração encontrada.</p>
        ) : (
          sections.map(([section, items]) => (
            <section key={section} className="mb-8">
              <h2 className="text-lg font-semibold mb-4">{section}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <Card key={item.id} variant="interactive">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <item.icon className={`w-5 h-5 ${item.iconClassName}`} />
                        <CardTitle className="text-base">{item.title}</CardTitle>
                      </div>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" onClick={item.action}>
                        {item.actionLabel}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <ImportPlaylistModal open={showImportModal} onOpenChange={setShowImportModal} />
    </div>
  );
}
