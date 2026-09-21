'use client';

import { useState } from 'react';
import { UserRole } from '@/types';
import { useRequireRole } from '@/hooks/use-require-auth';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListVideo } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ImportPlaylistModal from '@/components/settings/import-playlist-modal';

export default function SettingsPage() {
  const { isReady } = useRequireRole(UserRole.Admin);
  const [showImportModal, setShowImportModal] = useState(false);

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

        <section>
          <h2 className="text-lg font-semibold mb-4">Importar conteúdo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card variant="interactive">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ListVideo className="w-5 h-5 text-red-500" />
                  <CardTitle className="text-base">Playlist do YouTube</CardTitle>
                </div>
                <CardDescription>
                  Importe vídeos de uma playlist do YouTube como uma nova unidade de treinamento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => setShowImportModal(true)}>
                  Importar playlist
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <ImportPlaylistModal open={showImportModal} onOpenChange={setShowImportModal} />
    </div>
  );
}
