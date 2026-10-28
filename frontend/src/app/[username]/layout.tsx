import type { Metadata } from 'next';

/**
 * Usa o nome do usuário, que vem na URL, no título da aba.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `Perfil de ${decodeURIComponent(username)}` };
}

/**
 * Define o título da aba da página de perfil.
 */
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
