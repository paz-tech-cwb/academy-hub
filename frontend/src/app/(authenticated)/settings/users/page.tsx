'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper, type PaginationState } from '@tanstack/react-table';
import Link from 'next/link';
import { ManagedUser, UserRole } from '@/types';
import { useRequireRole } from '@/hooks/use-require-auth';
import { permissionsApi } from '@/lib/api/permissions';
import { queryKeys } from '@/lib/query-keys';
import Navbar from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Save, Search, X } from 'lucide-react';
import { usersApi } from '@/lib/api/users';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api/errors';
import { DataTable } from './data-table';
import type { UsersTableFeatures } from './data-table-features';

type StatusFilter = 'all' | 'active' | 'inactive';
/** 'all' ou o publicId de uma função vinda de `GET /api/role`. */
type RoleFilter = string;

const columnHelper = createColumnHelper<UsersTableFeatures, ManagedUser>();

export default function UsersSettingsPage() {
  const { isReady } = useRequireRole(UserRole.Admin);
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    password: string;
    status: boolean;
    rolePublicId: string;
  }>({ password: '', status: true, rolePublicId: '' });

  // As opções de função vêm do servidor: assim qualquer função cadastrada,
  // inclusive as criadas em runtime, pode ser filtrada e atribuída.
  const { data: roles } = useQuery({
    queryKey: queryKeys.permissions.roles,
    queryFn: permissionsApi.listRoles,
    enabled: isReady,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: [
      'admin',
      'users',
      pagination.pageIndex,
      pagination.pageSize,
      debouncedSearch,
      statusFilter,
      roleFilter,
    ],
    queryFn: () =>
      usersApi.listUsers({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter === 'active',
        rolePublicId: roleFilter === 'all' ? undefined : roleFilter,
      }),
    enabled: isReady,
  });

  const updateUserMutation = useMutation({
    mutationFn: ({
      publicId,
      status,
      rolePublicId,
    }: {
      publicId: string;
      status?: boolean;
      rolePublicId?: string;
    }) => usersApi.updateUser(publicId, { status, rolePublicId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.me });
      toast.success('Usuário atualizado.');
      setEditingId(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Falha ao atualizar usuário.'));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ publicId, password }: { publicId: string; password: string }) =>
      usersApi.resetUserPassword(publicId, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Senha redefinida.');
      setEditingId(null);
      setEditValues((prev) => ({ ...prev, password: '' }));
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Falha ao redefinir senha.'));
    },
  });

  const isSaving = updateUserMutation.isPending || resetPasswordMutation.isPending;

  const handleEdit = useCallback((user: ManagedUser) => {
    setEditingId(user.publicId);
    setEditValues({
      password: '',
      status: user.status,
      rolePublicId: user.rolePublicId ?? '',
    });
  }, []);

  const handleSave = useCallback(
    async (userId: string) => {
      if (editValues.password.trim()) {
        await resetPasswordMutation.mutateAsync({ publicId: userId, password: editValues.password });
      }
      updateUserMutation.mutate({
        publicId: userId,
        status: editValues.status,
        rolePublicId: editValues.rolePublicId || undefined,
      });
    },
    [editValues, resetPasswordMutation, updateUserMutation],
  );

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setEditValues({ password: '', status: true, rolePublicId: '' });
  }, []);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor('username', {
          header: 'Username',
          meta: { width: 260 },
          cell: (info) => (
            <span className="block max-w-[220px] truncate font-medium">{info.getValue()}</span>
          ),
        }),
        columnHelper.accessor('experience', {
          header: 'Experiência',
          meta: { width: 130 },
          cell: (info) => info.getValue(),
        }),
        columnHelper.display({
          id: 'password',
          header: 'Senha',
          meta: { width: 200 },
          cell: ({ row }) =>
            editingId === row.original.publicId ? (
              <Input
                type="text"
                placeholder="Nova senha"
                value={editValues.password}
                onChange={(e) => setEditValues((prev) => ({ ...prev, password: e.target.value }))}
                className="w-[160px]"
              />
            ) : (
              <span className="text-muted-foreground">••••••••</span>
            ),
        }),
        columnHelper.display({
          id: 'status',
          header: 'Status',
          meta: { width: 100 },
          cell: ({ row }) =>
            editingId === row.original.publicId ? (
              <Switch
                checked={editValues.status}
                onCheckedChange={(checked: boolean) =>
                  setEditValues((prev) => ({ ...prev, status: checked }))
                }
              />
            ) : (
              <span className={row.original.status ? 'text-success' : 'text-destructive'}>
                {row.original.status ? 'Ativo' : 'Inativo'}
              </span>
            ),
        }),
        columnHelper.display({
          id: 'role',
          header: 'Função',
          meta: { width: 130 },
          cell: ({ row }) =>
            editingId === row.original.publicId ? (
              <Select
                value={editValues.rolePublicId}
                onValueChange={(v: string) =>
                  setEditValues((prev) => ({ ...prev, rolePublicId: v }))
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Função" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.publicId} value={role.publicId}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span>{row.original.roleName}</span>
            ),
        }),
        columnHelper.display({
          id: 'actions',
          header: () => <div className="text-right">Ações</div>,
          meta: { width: 120 },
          cell: ({ row }) =>
            editingId === row.original.publicId ? (
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving}>
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => handleSave(row.original.publicId)} disabled={isSaving}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(row.original)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            ),
        }),
      ]),
    [editingId, editValues, handleCancel, handleSave, handleEdit, isSaving, roles],
  );

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
          <BreadcrumbPage>Gerenciar Usuários</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-8">
          {breadcrumb}
          <h1 className="text-3xl font-bold tracking-tight mb-2">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">Visualize e gerencie usuários da plataforma.</p>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por username..."
              className="pl-9"
              aria-label="Pesquisar por username"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as StatusFilter);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v as RoleFilter);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue placeholder="Função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as funções</SelectItem>
              {roles?.map((role) => (
                <SelectItem key={role.publicId} value={role.publicId}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          totalCount={data?.totalCount ?? 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
