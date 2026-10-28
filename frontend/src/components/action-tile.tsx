import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';

interface ActionTileProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Destino do item. Sem ele, o item vira um botão que chama `onClick`. */
  href?: string;
  onClick?: () => void;
}

const tileClassName =
  'group flex w-full items-start gap-4 rounded-xl bg-card p-4 text-left ring-1 ring-foreground/10 transition-[box-shadow,background-color] duration-200 ease-out hover:bg-accent/40 hover:ring-primary/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

/**
 * Item clicável por inteiro, com ícone, título e descrição, que leva a uma tela ou abre uma ação.
 * Substitui o card com botão próprio quando a página lista várias ações do mesmo peso.
 */
export function ActionTile({ icon: Icon, title, description, href, onClick }: ActionTileProps) {
  const content = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground text-pretty">{description}</span>
      </span>
      <ChevronRight
        className="size-4 shrink-0 self-center text-muted-foreground transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
        aria-hidden
      />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={tileClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={tileClassName}>
      {content}
    </button>
  );
}
