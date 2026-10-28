import type { Metadata } from 'next';

/**
 * Usa o nome da aula, que vem na URL, como título da aba.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonName: string }>;
}): Promise<Metadata> {
  const { lessonName } = await params;
  return { title: decodeURIComponent(lessonName) };
}

/**
 * Define o título da aba da página da aula.
 */
export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
