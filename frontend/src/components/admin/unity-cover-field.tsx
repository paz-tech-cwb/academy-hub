'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Cropper, { Area } from 'react-easy-crop';
import { BookOpen, ImagePlus, Link2, Trash2, Undo2 } from 'lucide-react';
import { PendingCover } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const COVER_ASPECT = 16 / 9;

/** Imagem aberta no recorte: um arquivo local (object URL) ou uma URL da internet. */
type CoverSource =
  | { kind: 'file'; src: string; mimeType: string }
  | { kind: 'url'; src: string };

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
  const [choosing, setChoosing] = useState(false);
  const [source, setSource] = useState<CoverSource | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Libera a object URL do arquivo anterior quando a imagem muda ou o modal fecha.
  useEffect(() => {
    if (source?.kind !== 'file') return;
    const src = source.src;
    return () => URL.revokeObjectURL(src);
  }, [source]);

  /** Abre uma nova imagem no recorte, descartando a seleção anterior. */
  function openSource(next: CoverSource) {
    setError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setSource(next);
    onChange(null);
  }

  /** Valida o arquivo escolhido e o abre no recorte. */
  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Envie uma imagem PNG, JPG ou WebP.');
      return;
    }
    openSource({ kind: 'file', src: URL.createObjectURL(file), mimeType: file.type });
  }

  /** Abre a imagem da URL informada no recorte. */
  function handleLoadUrl() {
    const url = urlInput.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setError('Informe uma URL válida começando com http:// ou https://.');
      return;
    }
    openSource({ kind: 'url', src: url });
  }

  /** Atualiza a alteração pendente sempre que o usuário termina de mover ou dar zoom. */
  function handleCropComplete(_: Area, pixels: Area) {
    if (!source) return;
    const area = {
      x: Math.round(pixels.x),
      y: Math.round(pixels.y),
      width: Math.round(pixels.width),
      height: Math.round(pixels.height),
    };
    onChange(
      source.kind === 'file'
        ? { kind: 'file', src: source.src, mimeType: source.mimeType, crop: area }
        : { kind: 'url', url: source.src, crop: area },
    );
  }

  /** Descarta a imagem escolhida e volta a mostrar a capa atual. */
  function handleDiscard() {
    setSource(null);
    setChoosing(false);
    setUrlInput('');
    setError(null);
    onChange(null);
  }

  if (value?.kind === 'remove') {
    return (
      <div className="space-y-2">
        <div className="aspect-video w-full flex flex-col items-center justify-center gap-2 rounded-lg bg-muted text-sm text-muted-foreground">
          <Trash2 className="w-8 h-8" />
          A capa será removida ao salvar.
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(null)} disabled={disabled}>
          <Undo2 className="w-4 h-4" />
          Desfazer
        </Button>
      </div>
    );
  }

  if (source) {
    return (
      <div className="space-y-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <Cropper
            image={source.src}
            crop={crop}
            zoom={zoom}
            aspect={COVER_ASPECT}
            objectFit="cover"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            mediaProps={{
              onError: () => {
                setError('Não foi possível carregar a imagem dessa URL.');
                setSource(null);
                onChange(null);
              },
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <Slider
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onValueChange={(next) => setZoom(Array.isArray(next) ? next[0] : next)}
            disabled={disabled}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Arraste a imagem para escolher o enquadramento. A capa é salva junto com a unidade.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={handleDiscard} disabled={disabled}>
          Descartar imagem
        </Button>
      </div>
    );
  }

  if (choosing) {
    return (
      <div className="space-y-3">
        <Tabs defaultValue="file" onValueChange={() => setError(null)}>
          <TabsList>
            <TabsTrigger value="file">Upload de imagem</TabsTrigger>
            <TabsTrigger value="url">Colar URL</TabsTrigger>
          </TabsList>
          <TabsContent value="file" className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={disabled}>
              <ImagePlus className="w-4 h-4" />
              Escolher imagem
            </Button>
            <p className="text-xs text-muted-foreground">PNG, JPG ou WebP.</p>
          </TabsContent>
          <TabsContent value="url" className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="https://exemplo.com/imagem.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLoadUrl();
                  }
                }}
                disabled={disabled}
              />
              <Button type="button" variant="outline" onClick={handleLoadUrl} disabled={disabled}>
                <Link2 className="w-4 h-4" />
                Carregar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Link direto para uma imagem PNG, JPG ou WebP de até 10 MB.
            </p>
          </TabsContent>
        </Tabs>
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        <Button type="button" variant="ghost" size="sm" onClick={handleDiscard} disabled={disabled}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
        {currentCoverUrl ? (
          <Image src={currentCoverUrl} alt="Capa atual da unidade" fill sizes="512px" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-secondary/20">
            <BookOpen className="w-10 h-10 text-primary/40" />
          </div>
        )}
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setChoosing(true)} disabled={disabled}>
          <ImagePlus className="w-4 h-4" />
          {currentCoverUrl ? 'Trocar capa' : 'Adicionar capa'}
        </Button>
        {currentCoverUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ kind: 'remove' })}
            disabled={disabled}
          >
            <Trash2 className="w-4 h-4" />
            Remover capa
          </Button>
        )}
      </div>
    </div>
  );
}
