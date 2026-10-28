import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar',
};

/**
 * Define o título da aba da página "Entrar".
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
