'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { ImagePlus, Link2, Trash2, Undo2 } from 'lucide-react';
import { PendingCover } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/** Imagem aberta no recorte: um arquivo local (object URL) ou uma URL da internet. */
type ImageSource =
  | { kind: 'file'; src: string; mimeType: string }
  | { kind: 'url'; src: string };

export interface ImageCropFieldLabels {
  /** Botão que abre a escolha quando ainda não há imagem. */
  add: string;
  /** Botão que abre a escolha quando já existe imagem. */
  change: string;
  /** Botão que marca a imagem atual para remoção. */
  remove: string;
  /** Aviso exibido enquanto a remoção está pendente. */
  removed: string;
  /** Dica exibida abaixo do recorte. */
  cropHint: string;
}

interface ImageCropFieldProps {
  /** URL da imagem atual, se houver. Só decide entre os rótulos de adicionar/trocar e se dá para remover. */
  currentUrl?: string | null;
  /** Alteração pendente; só é aplicada quando o modal é salvo. */
  value: PendingCover | null;
  onChange: (value: PendingCover | null) => void;
  disabled?: boolean;
  /** Proporção do recorte (largura / altura). */
  aspect: number;
  /** Formato da máscara do recorte. */
  cropShape?: 'rect' | 'round';
  /** Classes da moldura do recorte e do aviso de remoção, que definem tamanho e proporção. */
  frameClassName: string;
  /** Imagem atual (ou placeholder) exibida quando não há alteração pendente. */
  preview: ReactNode;
  labels: ImageCropFieldLabels;
  /**
   * Alinhamento da imagem e dos botões. Padrão: `start`. Em `stretch`, os botões abaixo da
   * imagem dividem igualmente a largura dela.
   */
  align?: 'start' | 'center' | 'stretch';
}

/**
 * Campo de imagem com recorte: mostra a imagem atual e permite escolher uma nova por upload ou
 * URL, reposicionando-a numa moldura com a proporção pedida, ou marcar a imagem para remoção.
 * Não faz requisições; apenas informa a alteração pendente via `onChange`.
 */
export function ImageCropField({
  currentUrl,
  value,
  onChange,
  disabled,
  aspect,
  cropShape = 'rect',
  frameClassName,
  preview,
  labels,
  align = 'start',
}: ImageCropFieldProps) {
  const centered = align === 'center';
  /** Classes do contêiner de cada estado do campo. */
  const rootClass = (spacing: string) => cn(spacing, centered && 'flex w-full flex-col items-center text-center');
  /** Classes das linhas de botões. */
  const actionsClass =
    align === 'stretch'
      ? 'grid auto-cols-fr grid-flow-col gap-2'
      : cn('flex flex-wrap gap-2', centered && 'justify-center');
  const [choosing, setChoosing] = useState(false);
  const [source, setSource] = useState<ImageSource | null>(null);
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
  function openSource(next: ImageSource) {
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

  /** Descarta a imagem escolhida e volta a mostrar a imagem atual. */
  function handleDiscard() {
    setSource(null);
    setChoosing(false);
    setUrlInput('');
    setError(null);
    onChange(null);
  }

  if (value?.kind === 'remove') {
    return (
      <div className={rootClass('space-y-2')}>
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground',
            frameClassName,
          )}
        >
          <Trash2 className="w-8 h-8" />
          {labels.removed}
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
      <div className={rootClass('space-y-3')}>
        <div className={cn('relative overflow-hidden rounded-lg bg-muted', frameClassName)}>
          <Cropper
            image={source.src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
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
        <div className={cn('flex w-full items-center gap-3', centered && 'max-w-64')}>
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
        <p className="text-xs text-muted-foreground">{labels.cropHint}</p>
        <Button type="button" variant="outline" size="sm" onClick={handleDiscard} disabled={disabled}>
          Descartar imagem
        </Button>
      </div>
    );
  }

  if (choosing) {
    return (
      <div className={rootClass('space-y-3')}>
        <Tabs defaultValue="file" onValueChange={() => setError(null)} className={cn(centered && 'w-full items-center')}>
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
          <TabsContent value="url" className="w-full space-y-2">
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
    <div className={rootClass('space-y-2')}>
      {preview}
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      <div className={actionsClass}>
        <Button type="button" variant="outline" size="sm" onClick={() => setChoosing(true)} disabled={disabled}>
          <ImagePlus className="w-4 h-4" />
          {currentUrl ? labels.change : labels.add}
        </Button>
        {currentUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ kind: 'remove' })}
            disabled={disabled}
          >
            <Trash2 className="w-4 h-4" />
            {labels.remove}
          </Button>
        )}
      </div>
    </div>
  );
}
