import type { CSSProperties } from 'react';
import { Source_Serif_4 } from 'next/font/google';
import { Award } from 'lucide-react';

const serif = Source_Serif_4({ subsets: ['latin'], style: ['normal', 'italic'] });

const paperColors = {
  '--certificate-ink': 'oklch(0.2393 0 0)',
  '--certificate-muted': 'oklch(0.4461 0.0263 256.8018)',
  '--certificate-accent': 'oklch(0.5200 0.2152 262.8809)',
} as CSSProperties;

interface CertificateDocumentProps {
  username: string;
  unityName: string;
  issuedAt: string;
  /** Anima o selo como um carimbo; usado só logo depois da emissão. */
  stampSeal: boolean;
}

/**
 * Folha do certificado de conclusão de uma unidade, na proporção de um A4 deitado.
 * Mantém as cores de papel claro em qualquer tema, para parecer um documento.
 */
export function CertificateDocument({ username, unityName, issuedAt, stampSeal }: CertificateDocumentProps) {
  return (
    <article
      aria-label={`Certificado de conclusão da unidade ${unityName}`}
      style={paperColors}
      className="@container relative aspect-[297/210] w-full overflow-hidden rounded-xl bg-white text-[var(--certificate-ink)] shadow-[0_24px_60px_-24px_rgb(0_0_0/0.55)]"
    >
      <div
        className="pointer-events-none absolute inset-[3cqw] rounded-[0.4cqw] border-[0.18cqw] border-[var(--certificate-accent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-[3.9cqw] border-[0.08cqw] border-[color-mix(in_oklch,var(--certificate-accent)_35%,transparent)]"
        aria-hidden
      />

      <div className="relative flex h-full flex-col items-center px-[11cqw] pt-[9cqw] pb-[8cqw] text-center">
        <h1 className={`${serif.className} text-[5.4cqw] leading-none font-semibold tracking-[-0.02em]`}>
          Certificado de conclusão
        </h1>

        <div className="flex flex-1 flex-col items-center justify-center gap-[1.2cqw]">
          <p className="text-[1.7cqw] text-[var(--certificate-muted)]">Certificamos que</p>
          <p className={`${serif.className} text-[5cqw] leading-tight italic break-all`}>{username}</p>
          <p className="text-[1.7cqw] text-[var(--certificate-muted)]">concluiu todas as aulas e questionários da unidade</p>
          <p
            className={`${serif.className} max-w-[60cqw] text-[3.4cqw] leading-tight font-semibold text-balance text-[var(--certificate-accent)]`}
          >
            {unityName}
          </p>
        </div>

        <div className="flex w-full items-end justify-between gap-[4cqw] text-left">
          <div className="space-y-[0.4cqw]">
            <p className="text-[2cqw] font-bold tracking-[-0.02em]">Academy Hub</p>
            <p className="text-[1.5cqw] text-[var(--certificate-muted)]">Emitido em {issuedAt}</p>
          </div>
          <div
            className={`flex size-[10cqw] shrink-0 items-center justify-center rounded-full border-[0.3cqw] border-[var(--certificate-accent)] text-[var(--certificate-accent)] outline-[0.12cqw] outline-offset-[0.6cqw] outline-[var(--certificate-accent)] outline-solid ${
              stampSeal
                ? 'animate-in fade-in-0 zoom-in-150 spin-in-12 duration-500 ease-out delay-500 fill-mode-both motion-reduce:zoom-in-100 motion-reduce:spin-in-0'
                : ''
            }`}
            aria-hidden
          >
            <Award className="size-[5cqw]" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </article>
  );
}
