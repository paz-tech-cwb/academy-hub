import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Configuração de funções',
};

/**
 * Define o título da aba da página "Configuração de funções".
 */
export default function RolesSettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
