'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InstagramLogoIcon } from '@phosphor-icons/react';
import { Pencil, UserX } from 'lucide-react';

import Navbar from '@/components/layout/navbar';
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { usersApi } from '@/lib/api/users';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/contexts/auth-context';

/**
 * Monta o link e o texto exibido do Instagram a partir do que o usuário
 * cadastrou, que pode ser só o identificador (`@usuario` ou `usuario`) ou o
 * endereço completo do perfil.
 *
 * @param value - Valor salvo no campo `instagram`.
 * @returns `href` para o perfil e `label` com o identificador sem o `@`.
 */
function toInstagramLink(value: string) {
  const trimmed = value.trim();
  const isUrl = /^https?:\/\//i.test(trimmed);
  const handle = isUrl
    ? trimmed.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').split(/[/?#]/)[0]
    : trimmed.replace(/^@/, '');

  return {
    href: isUrl ? trimmed : `https://instagram.com/${handle}`,
    label: handle,
  };
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username: usernameParam } = use(params);
  const username = decodeURIComponent(usernameParam);
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  // O username é único sem diferenciar maiúsculas no banco, então a URL pode vir com outra caixa.
  const isOwnProfile = !!user && user.username.toLowerCase() === username.toLowerCase();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: queryKeys.users.profile(username),
    queryFn: () => usersApi.getProfile(username),
  });

  const instagram = profile?.instagram ? toInstagramLink(profile.instagram) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1 max-w-3xl">
        {!isLoading && !profile ? (
          <div className="text-center py-16 bg-muted/20 rounded-xl border-2 border-dashed">
            <UserX className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-medium">
              {isError ? 'Não foi possível carregar o perfil' : 'Usuário não encontrado'}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {isError
                ? 'Tente novamente em instantes.'
                : <>Não existe nenhum usuário chamado &quot;{username}&quot;.</>}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <header className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
              <Avatar className="size-28 border-4 border-primary/20">
                {profile?.profilePicUrl && (
                  <AvatarImage src={profile.profilePicUrl} alt={`Foto de ${username}`} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold uppercase">
                  {username.substring(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2 min-w-0">
                <h1 className="text-3xl font-bold tracking-tight break-all">{username}</h1>
                {instagram && (
                  <a
                    href={instagram.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <InstagramLogoIcon className="w-4 h-4" />
                    {instagram.label}
                  </a>
                )}
              </div>

              {isOwnProfile && profile && (
                <Button variant="outline" className="sm:ml-auto" onClick={() => setEditing(true)}>
                  <Pencil className="w-4 h-4" />
                  Editar perfil
                </Button>
              )}
            </header>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nível</p>
                    {isLoading ? (
                      <Skeleton className="h-9 w-12 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold tabular-nums">{profile?.level}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">XP total</p>
                    {isLoading ? (
                      <Skeleton className="h-7 w-24 mt-1 ml-auto" />
                    ) : (
                      <p className="text-xl font-semibold tabular-nums">
                        {profile?.experience.toLocaleString('pt-BR')} XP
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {isLoading ? (
                    <Skeleton className="h-1 w-full" />
                  ) : (
                    <Progress value={profile?.levelPercentage ?? 0} />
                  )}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {isLoading ? (
                      <Skeleton className="h-4 w-40" />
                    ) : (
                      <>
                        <span>{Math.floor(profile?.levelPercentage ?? 0)}% do nível atual</span>
                        <span className="tabular-nums">
                          Próximo nível em{' '}
                          {profile?.requiredExperienceToNextLevel.toLocaleString('pt-BR')} XP
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {profile?.aboutMe && (
              <section className="space-y-2">
                <h2 className="text-xl font-bold">Sobre mim</h2>
                <p className="text-muted-foreground whitespace-pre-line break-words">
                  {profile.aboutMe}
                </p>
              </section>
            )}
          </div>
        )}
      </main>

      {editing && user && (
        <EditProfileDialog open onOpenChange={setEditing} username={user.username} />
      )}
    </div>
  );
}
