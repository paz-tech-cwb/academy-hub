import { cn } from '@/lib/utils';

interface CharacterCountProps {
  /** Quantidade de caracteres já digitados. */
  length: number;
  /** Limite de caracteres do campo. */
  max: number;
}

/**
 * Contador de caracteres exibido abaixo de um campo de texto, no formato "182/500".
 * Fica vermelho quando o limite é atingido.
 */
export function CharacterCount({ length, max }: CharacterCountProps) {
  return (
    <p
      aria-live="polite"
      className={cn(
        'text-right text-xs tabular-nums',
        length >= max ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      {length}/{max}
    </p>
  );
}
