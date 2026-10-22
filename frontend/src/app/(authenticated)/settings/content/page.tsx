'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useContentUnities } from '@/hooks/use-content-unities';
import { UnityDialog } from '@/components/admin/unity-dialog';
import { ContentSettingsShell } from '@/components/admin/content-settings-shell';

const SKELETON_ROWS = 3;

export default function ContentSettingsPage() {
  const router = useRouter();
  const { has } = useCapabilities();
  const canManageContent = has('content.manage');

  const [unityDialogOpen, setUnityDialogOpen] = useState(false);

  const { unities, isLoading: unitiesLoading } = useContentUnities();

  return (
    <ContentSettingsShell
      title="Configuração de conteúdos"
      description="Escolha uma unidade para editar os dados dela, as aulas, as questões e as alternativas. Nesta tela não é possível assistir às aulas nem responder questionários."
    >
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-lg">Unidades</CardTitle>
          {canManageContent && (
            <Button size="sm" onClick={() => setUnityDialogOpen(true)}>
              <Plus className="w-4 h-4" /> Nova unidade
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-28">Situação</TableHead>
                  <TableHead className="w-20 text-right">Editar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitiesLoading ? (
                  Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : unities?.length ? (
                  unities.map((unity) => (
                    <TableRow key={unity.publicId}>
                      <TableCell className="font-medium">{unity.name}</TableCell>
                      <TableCell>
                        <Badge variant={unity.isActive ? 'default' : 'secondary'}>
                          {unity.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" className="w-8 h-8" asChild>
                          <Link href={`/settings/content/${unity.publicId}`}>
                            <ArrowUpRight className="w-4 h-4" />
                            <span className="sr-only">Editar {unity.name}</span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3}className="h-24 text-center text-muted-foreground">
                      {canManageContent
                        ? 'Nenhuma unidade cadastrada. Crie a primeira.'
                        : 'Nenhuma unidade cadastrada. Peça a um administrador para criar a primeira.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {unityDialogOpen && (
        <UnityDialog
          open
          onOpenChange={setUnityDialogOpen}
          onCreated={(publicId) => router.push(`/settings/content/${publicId}`)}
        />
      )}
    </ContentSettingsShell>
  );
}
