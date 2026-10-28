import type { Metadata } from 'next';

/**
 * Usa o nome da unidade, que vem na URL, no título da aba do certificado.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ unityName: string }>;
}): Promise<Metadata> {
  const { unityName } = await params;
  return { title: `Certificado de ${decodeURIComponent(unityName)}` };
}

/**
 * Define o título da aba da página do certificado.
 */
export default function CertificateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
