import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gerenciar usuários',
};

/**
 * Define o título da aba da página "Gerenciar usuários".
 */
export default function UsersSettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
