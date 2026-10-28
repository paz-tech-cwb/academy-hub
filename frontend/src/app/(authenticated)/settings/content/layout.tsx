import type { Metadata } from 'next';
import { TITLE_TEMPLATE } from '@/lib/metadata';

export const metadata: Metadata = {
  title: { default: 'Configuração de conteúdos', template: TITLE_TEMPLATE },
};

/**
 * Define o título da aba da página "Configuração de conteúdos" e mantém o modelo de título para as páginas abaixo dela.
 */
export default function ContentSettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
