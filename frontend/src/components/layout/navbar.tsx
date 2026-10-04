'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { LogOut, BookOpen, Award, Settings2, Menu, Sun, Moon, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { UserRole } from '@/types';

const emptySubscribe = () => () => {};

const menuItemClass =
  'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground';

export default function Navbar() {
  const { user, logout } = useAuth();
  const isAdmin = user?.profile?.role === UserRole.Admin;
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <nav className="border-b bg-card text-card-foreground sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Academy Hub
        </Link>

        <div className="flex items-center gap-6">
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

                <Drawer swipeDirection="right">
                  <DrawerTrigger render={<Button variant="ghost" size="icon" aria-label="Abrir menu" />}>
                    <Menu className="h-5 w-5" />
                  </DrawerTrigger>
                  <DrawerContent className="w-80 max-w-[85vw]">
                    <DrawerHeader className="border-b pb-4">
                      <DrawerTitle>Menu</DrawerTitle>
                      <DrawerDescription>
                        {user.username}
                        {user.profile ? ` · Nível ${user.profile.level}` : ''}
                      </DrawerDescription>
                    </DrawerHeader>

                    <div className="flex flex-col gap-1 p-2">
                      <DrawerClose
                        nativeButton={false}
                        render={<Link href="/" className={menuItemClass} />}
                      >
                        <BookOpen className="w-4 h-4" /> Unidades
                      </DrawerClose>
                      <DrawerClose
                        nativeButton={false}
                        render={<Link href="/certificates" className={menuItemClass} />}
                      >
                        <Award className="w-4 h-4" /> Certificados
                      </DrawerClose>
                      <DrawerClose
                        nativeButton={false}
                        render={<Link href="/leaderboard" className={menuItemClass} />}
                      >
                        <Trophy className="w-4 h-4" /> Leaderboard
                      </DrawerClose>
                      {isAdmin && (
                        <DrawerClose
                          nativeButton={false}
                          render={<Link href="/settings" className={menuItemClass} />}
                        >
                          <Settings2 className="w-4 h-4" /> Configurações
                        </DrawerClose>
                      )}
                      <div className="flex items-center justify-between gap-3 rounded-md px-3 py-2.5">
                        <span className="flex items-center gap-3 text-sm font-medium">
                          {isDark ? (
                            <Moon className="w-4 h-4" />
                          ) : (
                            <Sun className="w-4 h-4" />
                          )}
                          {isDark ? 'Modo escuro' : 'Modo claro'}
                        </span>
                        <Switch
                          checked={isDark}
                          onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                          aria-label="Alternar tema"
                          disabled={!mounted}
                        />
                      </div>
                      <DrawerClose
                        render={
                          <Button
                            variant="ghost"
                            onClick={logout}
                            className="justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          />
                        }
                      >
                        <LogOut className="w-4 h-4" /> Sair
                      </DrawerClose>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
