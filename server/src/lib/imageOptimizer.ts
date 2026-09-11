import sharp from 'sharp';

interface FolderConfig {
  maxWidth: number;
  quality: number;
}

// Max width is chosen per folder based on the largest on-site display size for
// that image type, already accounting for ~2x retina. Quality 70-76 on WebP is
// visually near-lossless but cuts file size by 2-4x vs the unprocessed uploads.
const FOLDER_CONFIG: Record<string, FolderConfig> = {
  categories: { maxWidth: 800, quality: 72 },
  sets: { maxWidth: 800, quality: 72 },
  products: { maxWidth: 1000, quality: 74 },
  'hero-slides': { maxWidth: 1920, quality: 76 },
  'site-content': { maxWidth: 1600, quality: 75 },
};

const RASTER_MIME = /^image\/(jpeg|png|webp)$/;

export function getImageFolderConfig(relativePath: string): FolderConfig | null {
  const folder = relativePath.split('/')[0];
  return FOLDER_CONFIG[folder] ?? null;
}

export function isOptimizableRaster(mimetype: string): boolean {
  return RASTER_MIME.test(mimetype);
}

/** Resize (never upscale) and re-encode as WebP at the folder's target quality. */
export async function optimizeImage(buffer: Buffer, config: FolderConfig): Promise<Buffer> {
  return sharp(buffer)
    .rotate() // normalize orientation using EXIF before stripping it
    .resize({ width: config.maxWidth, withoutEnlargement: true })
    .webp({ quality: config.quality })
    .toBuffer();
}

/** Swap any extension for `.webp`. */
export function toWebpPath(relativePath: string): string {
  return relativePath.replace(/\.[^./]+$/, '') + '.webp';
}
