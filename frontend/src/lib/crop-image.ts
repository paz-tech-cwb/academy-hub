import { CoverCrop } from '@/types';

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const MAX_BYTES = 2 * 1024 * 1024;
const QUALITY = 0.85;

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

/**
 * Recorta uma imagem local na área informada, reduz para caber em 1920x1080 e exporta
 * no mesmo formato do arquivo original. Se um PNG passar de 2 MB, exporta como WebP.
 *
 * @param src - Object URL da imagem (mesma origem, para o canvas poder exportar).
 * @param crop - Área de recorte em pixels da imagem original.
 * @param mimeType - Tipo do arquivo original (`image/png`, `image/jpeg` ou `image/webp`).
 * @returns O blob recortado e o nome de arquivo correspondente ao formato final.
 * @throws Error com mensagem para o usuário se o resultado ainda passar de 2 MB.
 */
export async function cropImageToBlob(src: string, crop: CoverCrop, mimeType: string) {
  const image = await loadImage(src);

  const scale = Math.min(1, MAX_WIDTH / crop.width, MAX_HEIGHT / crop.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(crop.width * scale));
  canvas.height = Math.max(1, Math.round(crop.height * scale));

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Não foi possível processar a imagem neste navegador.');
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);

  let type = mimeType;
  let blob = await toBlob(canvas, type);
  if (blob.size > MAX_BYTES && type === 'image/png') {
    type = 'image/webp';
    blob = await toBlob(canvas, type);
  }
  if (blob.size > MAX_BYTES) throw new Error('A imagem recortada passou de 2 MB. Tente outra imagem.');

  return { blob, fileName: `cover.${EXTENSIONS[blob.type] ?? EXTENSIONS[type]}` };
}

/** Carrega uma imagem e resolve quando ela estiver pronta para ser desenhada. */
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível carregar a imagem.'));
    image.src = src;
  });
}

/** Exporta o canvas como blob no formato pedido. */
function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível gerar a imagem recortada.'))),
      type,
      QUALITY,
    );
  });
}
