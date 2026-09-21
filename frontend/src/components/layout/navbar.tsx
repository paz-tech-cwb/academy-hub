'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, BookOpen, Award, Settings2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { UserRole } from '@/types';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b bg-card text-card-foreground sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          Academy Hub
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium hover:text-primary flex items-center gap-1">
              <BookOpen className="w-4 h-4" /> Unidades
            </Link>
            <Link href="/certificates" className="text-sm font-medium hover:text-primary flex items-center gap-1">
              <Award className="w-4 h-4" /> Certificados
            </Link>
            {user?.profile?.role === UserRole.Admin && (
              <Link href="/settings" className="text-sm font-medium hover:text-primary flex items-center gap-1">
                <Settings2 className="w-4 h-4" /> Configurações
              </Link>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-4 border-l pl-4">
              {user.profile && (
                <div className="hidden lg:flex flex-col items-end gap-1">
                  <span className="text-xs font-semibold">Nível {user.profile.level}</span>
                  <Progress value={user.profile.levelPercentage} className="w-24 h-2" />
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold leading-none">{user.username}</p>
                  {user.profile && (
                    <p className="text-xs text-muted-foreground">{user.profile.experience} XP</p>
                  )}
                </div>
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src={user.profile?.profilePic} />
                  <AvatarFallback className="bg-primary/10 text-primary uppercase">
                    {user.username.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="icon" onClick={logout} title="Sair">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
