'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useCapabilities } from '@/hooks/use-capabilities';
import Navbar from '@/components/layout/navbar';
import { ActionTile } from '@/components/action-tile';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  BookOpenCheck,
  KeyRound,
  ListVideo,
  Lock,
  Search,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import ImportPlaylistModal from '@/components/settings/import-playlist-modal';
import ChangePasswordDialog from '@/components/settings/change-password-dialog';

interface SettingsItem {
  id: string;
  section: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /**
   * Capacidades que liberam o card. Basta ter **uma** delas: a tela de
   * conteúdos, por exemplo, serve tanto quem gerencia unidades e aulas quanto
   * quem só mexe em questões. Lista vazia libera para todos, como a troca da
   * própria senha.
   */
  capabilities: string[];
  /** Tela de destino; sem ela, o item abre uma ação na própria página, como um diálogo. */
  href?: string;
  onClick?: () => void;
}

export default function SettingsPage() {
  const { isReady } = useRequireAuth();
  const { has, isLoading: capabilitiesLoading } = useCapabilities();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [search, setSearch] = useState('');

  const settingsItems = useMemo<SettingsItem[]>(
    () => [
      {
        id: 'change-password',
        section: 'Minha conta',
        title: 'Trocar senha',
        description:
          'Defina uma nova senha para a sua conta, confirmando a senha atual.',
        icon: Lock,
        capabilities: [],
        onClick: () => setShowChangePassword(true),
      },
      {
        id: 'manage-content',
        section: 'Conteúdo',
        title: 'Configurar conteúdos',
        description:
          'Crie e organize unidades, aulas, questões e alternativas em uma única tela.',
        icon: BookOpenCheck,
        capabilities: ['content.manage', 'content.read', 'questionnaire.manage'],
        href: '/settings/content',
      },
      {
        id: 'import-playlist',
        section: 'Conteúdo',
        title: 'Playlist do YouTube',
        description:
          'Importe vídeos de uma playlist do YouTube como uma nova unidade de treinamento.',
        icon: ListVideo,
        capabilities: ['playlist.import'],
        onClick: () => setShowImportModal(true),
      },
      {
        id: 'manage-users',
        section: 'Usuários',
        title: 'Gerenciar usuários',
        description: 'Visualize, edite status, função e senha dos usuários da plataforma.',
        icon: Users,
        capabilities: ['users.manage'],
        href: '/settings/users',
      },
      {
        id: 'manage-roles',
        section: 'Permissionamento',
        title: 'Configuração de funções',
        description:
          'Defina as funções que podem ser atribuídas aos usuários e as funcionalidades de cada uma.',
        icon: UserCog,
        capabilities: ['permissions.manage'],
        href: '/settings/roles',
      },
      {
        id: 'manage-capabilities',
        section: 'Permissionamento',
        title: 'Consultar funcionalidades',
        description: 'Veja o catálogo de funcionalidades que podem ser atribuídas às funções.',
        icon: KeyRound,
        capabilities: ['permissions.manage'],
        href: '/settings/capabilities',
      },
    ],
    [],
  );

  /** Cards liberados para o usuário, antes da busca. */
  const allowedItems = useMemo(
    () =>
      settingsItems.filter(
        (item) => item.capabilities.length === 0 || item.capabilities.some(has),
      ),
    [settingsItems, has],
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allowedItems;

    return allowedItems.filter((item) =>
      [item.title, item.description, item.section].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [search, allowedItems]);

  const sections = useMemo(() => {
    const grouped = new Map<string, SettingsItem[]>();
    filteredItems.forEach((item) => {
      const items = grouped.get(item.section) ?? [];
      items.push(item);
      grouped.set(item.section, items);
    });
    return Array.from(grouped.entries());
  }, [filteredItems]);

  const breadcrumb = (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Configurações</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  const header = (
    <header className="mb-8">
      {breadcrumb}
      <h1 className="text-3xl font-bold tracking-tight mb-2">Configurações</h1>
      <p className="text-muted-foreground">
        Gerencie as configurações gerais da plataforma, como conteúdo, usuários e preferências.
      </p>
    </header>
  );

  if (!isReady || capabilitiesLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex-1">
          {header}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        {header}

        {allowedItems.length > 0 && (
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
        )}

        {sections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {allowedItems.length === 0
              ? 'Você não tem acesso a nenhuma configuração. Fale com um administrador se precisar de acesso.'
              : 'Nenhuma configuração encontrada.'}
          </p>
        ) : (
          sections.map(([section, items]) => (
            <section key={section} className="mb-8">
              <h2 className="text-lg font-semibold mb-3">{section}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => (
                  <ActionTile
                    key={item.id}
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    href={item.href}
                    onClick={item.onClick}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <ImportPlaylistModal open={showImportModal} onOpenChange={setShowImportModal} />
      <ChangePasswordDialog
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
    </div>
  );
}
