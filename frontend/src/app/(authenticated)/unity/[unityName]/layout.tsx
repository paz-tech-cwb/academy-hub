import type { Metadata } from 'next';
import { TITLE_TEMPLATE } from '@/lib/metadata';

/**
 * Usa o nome da unidade, que vem na URL, como título da aba e mantém o modelo de título para as aulas.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ unityName: string }>;
}): Promise<Metadata> {
  const { unityName } = await params;
  return { title: { default: decodeURIComponent(unityName), template: TITLE_TEMPLATE } };
}

/**
 * Define o título da aba das páginas da unidade.
 */
export default function UnityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
