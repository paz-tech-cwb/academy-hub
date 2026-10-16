'use client';

import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { PendingCover } from '@/types';
import { ImageCropField } from '@/components/image-crop-field';

const COVER_ASPECT = 16 / 9;

interface UnityCoverFieldProps {
  /** URL da capa atual da unidade, se houver. */
  currentCoverUrl?: string | null;
  /** Alteração pendente; só é aplicada quando o modal é salvo. */
  value: PendingCover | null;
  onChange: (value: PendingCover | null) => void;
  disabled?: boolean;
}

/**
 * Campo de capa do modal de unidade: mostra a capa atual e permite escolher uma nova por
 * upload ou URL, reposicionando-a numa moldura 16:9, ou marcar a capa para remoção.
 * Não faz requisições; apenas informa a alteração pendente via `onChange`.
 */
export function UnityCoverField({ currentCoverUrl, value, onChange, disabled }: UnityCoverFieldProps) {
  return (
    <ImageCropField
      currentUrl={currentCoverUrl}
      value={value}
      onChange={onChange}
      disabled={disabled}
      aspect={COVER_ASPECT}
      frameClassName="aspect-video w-full"
      preview={
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {currentCoverUrl ? (
            <Image src={currentCoverUrl} alt="Capa atual da unidade" fill sizes="512px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-secondary/20">
              <BookOpen className="w-10 h-10 text-primary/40" />
            </div>
          )}
        </div>
      }
      labels={{
        add: 'Adicionar capa',
        change: 'Trocar capa',
        remove: 'Remover capa',
        removed: 'A capa será removida ao salvar.',
        cropHint: 'Arraste a imagem para escolher o enquadramento. A capa é salva junto com a unidade.',
      }}
    />
  );
}
