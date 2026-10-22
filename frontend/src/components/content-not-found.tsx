import Link from 'next/link';
import { SearchX } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';

interface ContentNotFoundProps {
  title: string;
}

/**
 * Página exibida quando a unidade ou a aula não existe ou não está disponível para o usuário.
 *
 * @param title - Mensagem principal, por exemplo "Unidade não encontrada".
 */
export function ContentNotFound({ title }: ContentNotFoundProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16 flex-1 flex flex-col items-center text-center gap-4">
        <SearchX className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">
          Ela pode ter sido removida ou não estar disponível no momento.
        </p>
        <Button asChild>
          <Link href="/">Voltar para a home</Link>
        </Button>
      </main>
    </div>
  );
}
