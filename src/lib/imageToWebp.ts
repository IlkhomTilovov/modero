/**
 * Convert an image File to WebP format using the browser canvas.
 * Returns the original file if conversion is not supported or fails (e.g. SVG, GIF).
 */
export async function convertImageToWebP(file: File, quality = 0.9): Promise<File> {
  // Skip non-raster or already-webp images
  if (!file.type.startsWith('image/') || file.type === 'image/webp' || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file).catch(() => null);
    let width: number, height: number;
    let drawSource: CanvasImageSource;

    if (bitmap) {
      width = bitmap.width;
      height = bitmap.height;
      drawSource = bitmap;
    } else {
      const img = await loadImage(file);
      width = img.naturalWidth;
      height = img.naturalHeight;
      drawSource = img;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(drawSource, 0, 0);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
  } catch (err) {
    console.warn('WebP conversion failed, uploading original:', err);
    return file;
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}
