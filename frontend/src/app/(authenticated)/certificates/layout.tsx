import type { Metadata } from 'next';
import { TITLE_TEMPLATE } from '@/lib/metadata';

export const metadata: Metadata = {
  title: { default: 'Meus certificados', template: TITLE_TEMPLATE },
};

/**
 * Define o título da aba da página "Meus certificados" e mantém o modelo de título para as páginas abaixo dela.
 */
export default function CertificatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
