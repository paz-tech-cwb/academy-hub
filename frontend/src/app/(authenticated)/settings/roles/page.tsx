'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Lock, Pencil, Plus, Trash2, UserCog } from 'lucide-react';

import Navbar from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
import { getApiErrorMessage } from '@/lib/api/errors';
import { Role, UserRole } from '@/types';
import { RoleDialog } from '@/components/settings/role-dialog';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

export default function RolesSettingsPage() {
  const { isReady } = useRequireAuth();
  const { has, isLoading: capabilitiesLoading } = useCapabilities();
  const queryClient = useQueryClient();

  const [roleSelection, setRoleSelection] = useState<string | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const canManage = has('permissions.manage');

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: queryKeys.permissions.roles,
    queryFn: permissionsApi.listRoles,
    enabled: isReady && canManage,
  });

  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: queryKeys.permissions.capabilities,
    queryFn: permissionsApi.listCapabilities,
    enabled: isReady && canManage,
  });

  /**
   * A seleção é derivada da lista: enquanto não houver escolha (ou a função
   * escolhida for removida), a primeira da lista fica ativa.
   */
  const selectedRoleId =
    roleSelection && roles?.some((role) => role.publicId === roleSelection)
      ? roleSelection
      : (roles?.[0]?.publicId ?? null);

  const selectedRole = useMemo(
    () => roles?.find((role) => role.publicId === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  /**
   * A função Admin sempre tem acesso total, então seus vínculos não podem ser
   * removidos. A UI desabilita e o backend devolve 409 como rede de segurança.
   */
  const isAdminRole = selectedRole?.name === UserRole[UserRole.Admin];

  const deleteRoleMutation = useMutation({
    mutationFn: (publicId: string) => permissionsApi.removeRole(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.roles });
      toast.success('Função excluída.');
      setRoleToDelete(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Falha ao excluir a função.'));
    },
  });

  const toggleCapabilityMutation = useMutation({
    mutationFn: ({
      rolePublicId,
      capabilityPublicId,
      attach,
    }: {
      rolePublicId: string;
      capabilityPublicId: string;
      attach: boolean;
    }) =>
      attach
        ? permissionsApi.attachCapability(rolePublicId, capabilityPublicId)
        : permissionsApi.detachCapability(rolePublicId, capabilityPublicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.roles });
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.me });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Falha ao alterar o vínculo da funcionalidade.'));
    },
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
          <BreadcrumbPage>Configuração de funções</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  const header = (
    <header className="mb-8">
      {breadcrumb}
      <h1 className="text-3xl font-bold tracking-tight mb-2">Configuração de funções</h1>
      <p className="text-muted-foreground">
        A função é o que se atribui ao usuário, e são as funcionalidades ligadas a ela que
        definem o que ela pode fazer.
      </p>
    </header>
  );

  if (!isReady || capabilitiesLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex-1">
          {header}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <Skeleton className="h-64 w-full rounded-xl bg-card ring-1 ring-foreground/10" />
            </div>
            <div className="lg:col-span-8">
              <Skeleton className="h-96 w-full rounded-xl bg-card ring-1 ring-foreground/10" />
            </div>
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 w-full">
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-lg">Funções</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingRole(null);
                    setRoleDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" /> Nova
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {rolesLoading &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}

                {!rolesLoading && roles?.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma função cadastrada. Crie a primeira.
                  </p>
                )}

                {roles?.map((role) => {
                  const isSelected = role.publicId === selectedRoleId;
                  return (
                    <div
                      key={role.publicId}
                      className={`flex items-center gap-1 rounded-lg border p-2 transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setRoleSelection(role.publicId)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <span className="block font-medium text-sm truncate">{role.name}</span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {role.isSystem
                            ? 'Função do sistema'
                            : `${role.capabilities.length} funcionalidade(s)`}
                        </span>
                      </button>
                      {role.isSystem ? (
                        // Função do sistema não aceita edição nem exclusão, então
                        // no lugar de dois botões desabilitados fica só o cadeado.
                        <span
                          className="flex w-8 h-8 shrink-0 items-center justify-center text-muted-foreground"
                          title="Função do sistema: não pode ser alterada nem excluída."
                        >
                          <Lock className="w-4 h-4" />
                          <span className="sr-only">
                            {role.name} é uma função do sistema e está bloqueada
                          </span>
                        </span>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 shrink-0"
                            onClick={() => {
                              setEditingRole(role);
                              setRoleDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="sr-only">Editar {role.name}</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 shrink-0 text-destructive"
                            onClick={() => setRoleToDelete(role)}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">Excluir {role.name}</span>
                          </Button>
                        </>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8 w-full">
            {selectedRole ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Funcionalidades de {selectedRole.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {isAdminRole
                      ? 'A função Admin sempre tem acesso total, então suas funcionalidades não podem ser removidas.'
                      : 'Ligue o que esta função deve permitir. A mudança vale no próximo acesso, sem precisar relogar.'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {catalogLoading &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}

                  {catalog?.map((capability) => {
                    const isLinked = selectedRole.capabilities.some(
                      (linked) => linked.publicId === capability.publicId,
                    );
                    const pending =
                      toggleCapabilityMutation.isPending &&
                      toggleCapabilityMutation.variables?.capabilityPublicId ===
                        capability.publicId &&
                      toggleCapabilityMutation.variables?.rolePublicId === selectedRole.publicId;

                    // O Admin sempre tem acesso total, então uma funcionalidade
                    // já vinculada a ele não pode ser desligada.
                    const locked = isAdminRole && isLinked;

                    return (
                      <label
                        key={capability.publicId}
                        className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">{capability.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {capability.description || 'Sem descrição'}
                          </span>
                          <span className="block text-xs font-mono text-muted-foreground mt-1">
                            {capability.code}
                          </span>
                        </span>
                        {pending && (
                          <Loader2 className="w-4 h-4 shrink-0 animate-spin text-muted-foreground" />
                        )}
                        <Switch
                          className={
                            locked
                              ? 'shrink-0 data-[state=checked]:bg-muted-foreground/40'
                              : 'shrink-0'
                          }
                          checked={isLinked}
                          disabled={locked || pending}
                          title={
                            locked
                              ? 'A função Admin sempre tem acesso total, então esta funcionalidade não pode ser removida.'
                              : undefined
                          }
                          onCheckedChange={(checked: boolean) =>
                            toggleCapabilityMutation.mutate({
                              rolePublicId: selectedRole.publicId,
                              capabilityPublicId: capability.publicId,
                              attach: checked,
                            })
                          }
                        />
                      </label>
                    );
                  })}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-20 bg-card rounded-2xl border-2 border-dashed">
                {rolesLoading ? (
                  <Loader2 className="w-12 h-12 mx-auto text-muted-foreground/30 animate-spin mb-4" />
                ) : (
                  <>
                    <UserCog className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma função cadastrada</h3>
                    <p className="text-muted-foreground mb-6">
                      Crie a primeira função para vincular funcionalidades a ela.
                    </p>
                    <Button
                      onClick={() => {
                        setEditingRole(null);
                        setRoleDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Criar função
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {roleDialogOpen && (
        <RoleDialog open onOpenChange={setRoleDialogOpen} role={editingRole} />
      )}

      <ConfirmDialog
        open={!!roleToDelete}
        onOpenChange={(open) => {
          if (!open) setRoleToDelete(null);
        }}
        title="Excluir função"
        description={`Excluir "${roleToDelete?.name}" também remove os vínculos dela com as funcionalidades. Funções que ainda têm usuários vinculados não podem ser excluídas. Esta ação não pode ser desfeita.`}
        isLoading={deleteRoleMutation.isPending}
        onConfirm={() => roleToDelete && deleteRoleMutation.mutate(roleToDelete.publicId)}
      />
    </div>
  );
}
