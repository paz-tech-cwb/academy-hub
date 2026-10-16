'use client';

import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usersApi } from '@/lib/api/users';
import { queryKeys } from '@/lib/query-keys';
import { getApiErrorMessage } from '@/lib/api/errors';
import { cropImageToBlob } from '@/lib/crop-image';
import { MyProfile, PendingCover } from '@/types';
import { ImageCropField } from '@/components/image-crop-field';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

const PROFILE_PIC_SIZE = 512;

// Os limites espelham o validador da API.
const profileSchema = z.object({
  aboutMe: z.string().max(1000, 'O "sobre mim" deve ter no máximo 1000 caracteres.'),
  instagram: z.string().max(255, 'O Instagram deve ter no máximo 255 caracteres.'),
  email: z
    .string()
    .trim()
    .max(255, 'O e-mail deve ter no máximo 255 caracteres.')
    .refine((value) => value === '' || z.email().safeParse(value).success, 'Informe um e-mail válido.'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

/** Falha ao aplicar a foto depois de os dados do perfil já terem sido salvos. */
class ProfilePicError extends Error {}

/**
 * Envia para a API a alteração de foto escolhida no modal.
 *
 * @param pic - Alteração pendente: arquivo recortado, URL com recorte ou remoção.
 */
async function applyProfilePic(pic: PendingCover) {
  if (pic.kind === 'remove') {
    await usersApi.removeProfilePic();
  } else if (pic.kind === 'url') {
    await usersApi.setProfilePicFromUrl(pic.url, pic.crop);
  } else {
    const { blob, fileName } = await cropImageToBlob(pic.src, pic.crop, pic.mimeType, {
      maxWidth: PROFILE_PIC_SIZE,
      maxHeight: PROFILE_PIC_SIZE,
      fileName: 'profile-pic',
    });
    await usersApi.uploadProfilePic(blob, fileName);
  }
}

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Username do usuário autenticado, usado nas iniciais e para atualizar o perfil público em cache. */
  username: string;
}

/**
 * Modal de edição do próprio perfil: foto (upload ou URL), "sobre mim", Instagram e e-mail.
 * Busca os dados atuais ao abrir, já que o e-mail não vem no perfil público.
 */
export function EditProfileDialog({ open, onOpenChange, username }: EditProfileDialogProps) {
  const { data: profile, isError } = useQuery({
    queryKey: queryKeys.users.me,
    queryFn: usersApi.getMyProfile,
    // Sempre busca de novo ao abrir, para não editar em cima de dados antigos.
    staleTime: 0,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>
        {profile ? (
          <EditProfileForm profile={profile} username={username} onClose={() => onOpenChange(false)} />
        ) : isError ? (
          <p className="text-sm font-medium text-destructive">
            Não foi possível carregar seu perfil. Tente novamente em instantes.
          </p>
        ) : (
          <div className="space-y-4">
            <Skeleton className="mx-auto size-32 rounded-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface EditProfileFormProps {
  profile: MyProfile;
  username: string;
  onClose: () => void;
}

/** Formulário do modal, montado só depois que os dados atuais do perfil chegam. */
function EditProfileForm({ profile, username, onClose }: EditProfileFormProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pendingPic, setPendingPic] = useState<PendingCover | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      aboutMe: profile.aboutMe ?? '',
      instagram: profile.instagram ?? '',
      email: profile.email ?? '',
    },
  });

  /** Atualiza tudo que mostra dados do perfil: a página pública, a navbar, o leaderboard e o próprio modal. */
  function invalidateProfile() {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(username) });
    queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard.all });
  }

  const mutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      await usersApi.updateMyProfile({
        aboutMe: values.aboutMe.trim() || null,
        instagram: values.instagram.trim() || null,
        email: values.email || null,
      });

      if (!pendingPic) return;
      try {
        await applyProfilePic(pendingPic);
      } catch (err) {
        // Os dados já foram salvos: atualiza a tela e mantém o modal aberto para tentar a foto de novo.
        invalidateProfile();
        const reason = axios.isAxiosError(err)
          ? getApiErrorMessage(err, 'Falha ao salvar a foto.')
          : (err as Error).message;
        throw new ProfilePicError(`Seus dados foram salvos, mas a foto não: ${reason}`);
      }
    },
    onSuccess: () => {
      invalidateProfile();
      toast.success('Perfil atualizado!');
      onClose();
    },
    onError: (err) => {
      setError(err instanceof ProfilePicError ? err.message : getApiErrorMessage(err, 'Falha ao salvar o perfil.'));
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
        <div className="flex flex-col items-center space-y-2">
          <Label>Foto de perfil</Label>
          <ImageCropField
            align="center"
            currentUrl={profile.profilePicUrl}
            value={pendingPic}
            onChange={setPendingPic}
            disabled={mutation.isPending}
            aspect={1}
            cropShape="round"
            frameClassName="aspect-square w-64 max-w-full"
            preview={
              <Avatar className="size-32 border-4 border-primary/20">
                {profile.profilePicUrl && <AvatarImage src={profile.profilePicUrl} alt="Sua foto de perfil atual" />}
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold uppercase">
                  {username.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
            }
            labels={{
              add: 'Adicionar foto',
              change: 'Trocar foto',
              remove: 'Remover foto',
              removed: 'A foto será removida ao salvar.',
              cropHint: 'Arraste a imagem para escolher o enquadramento. A foto é salva junto com o perfil.',
            }}
          />
        </div>
        <FormField
          control={form.control}
          name="aboutMe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sobre mim</FormLabel>
              <FormControl>
                <Textarea placeholder="Conte um pouco sobre você" className="min-h-24" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instagram"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instagram</FormLabel>
              <FormControl>
                <Input placeholder="seu.usuario ou https://instagram.com/seu.usuario" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="email" placeholder="voce@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
