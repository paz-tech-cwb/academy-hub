import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meus certificados',
};

/**
 * Define o título da aba da página "Meus certificados".
 */
export default function CertificatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
