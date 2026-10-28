'use client';

import { useState } from 'react';
import { useForm, type ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { usersApi } from '@/lib/api/users';
import { getApiErrorMessage } from '@/lib/api/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  username: z
    .string()
    .min(4, 'O nome de usuário deve ter pelo menos 4 caracteres')
    .max(16, 'O nome de usuário deve ter no máximo 16 caracteres'),
  password: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .max(16, 'A senha deve ter no máximo 16 caracteres'),
});

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    setError(null);
    try {
      const { accessToken, isLogged, message } = await usersApi.login(values);

      if (isLogged) {
        await login(accessToken);
      } else {
        setError(message || 'Falha no login');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Ocorreu um erro ao fazer login'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Academy Hub</CardTitle>
          <CardDescription>
            Entre com seu usuário e senha para acessar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }: { field: ControllerRenderProps<z.infer<typeof loginSchema>, 'username'> }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="seu_usuário"
                        {...field}
                        autoCapitalize="none"
                        autoCorrect="off"
                        onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }: { field: ControllerRenderProps<z.infer<typeof loginSchema>, 'password'> }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••"
                          className="pr-11"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-1 my-auto flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <div role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center">
          <div className="text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Criar conta
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
