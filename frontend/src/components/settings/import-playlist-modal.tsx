'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unitiesApi } from '@/lib/api/unities';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ListVideo } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal de importação de playlists do YouTube.
 *
 * Usa o `Dialog` do shadcn/Radix, que já oferece focus trap, fechamento
 * por `Esc`/clique no overlay e acessibilidade. O estado é controlado
 * pelo parent via `open` / `onOpenChange`.
 */
export default function ImportPlaylistModal({ open, onOpenChange }: Props) {
  const [url, setUrl] = useState('');
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: unitiesApi.importPlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.unities.all });
      toast.success('Playlist importada com sucesso!');
      setUrl('');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Erro ao importar playlist. Verifique o link e tente novamente.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    mutate(url.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ListVideo className="w-5 h-5 text-red-500" />
            <DialogTitle>Importar Playlist do YouTube</DialogTitle>
          </div>
          <DialogDescription>
            Cole o link de uma playlist pública para criar uma nova unidade de treinamento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="playlist-url" className="text-sm font-medium">
              Link da playlist
            </label>
            <Input
              id="playlist-url"
              placeholder="https://www.youtube.com/playlist?list=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isPending}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!url.trim() || isPending}>
              {isPending ? 'Importando...' : 'Importar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
