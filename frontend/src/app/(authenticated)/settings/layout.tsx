import type { Metadata } from 'next';
import { TITLE_TEMPLATE } from '@/lib/metadata';

export const metadata: Metadata = {
  title: { default: 'Configurações', template: TITLE_TEMPLATE },
};

/**
 * Define o título da aba da página "Configurações" e mantém o modelo de título para as páginas abaixo dela.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
