/* ============================================
   EIFA COUTURE — Browser image compression
   ============================================
   Resizes (never enlarges) and re-encodes a photo as WebP before it is
   uploaded. Quality starts high (0.86, visually lossless for product
   photos) and only steps down, to a floor of 0.72, while the file is
   still above `targetBytes`; if it is STILL too big the long edge is
   reduced a little and the loop repeats. A 1 MB photo typically ends up
   at 150-300 KB.

   Falls back to the original file if the browser can't decode/encode,
   or if re-encoding made it larger.
   ============================================ */

export interface CompressOptions {
  /** Longest side in px (default 1600 — enough for product zoom). */
  maxEdge?: number;
  /** Aim for at most this many bytes (default 300 KB). */
  targetBytes?: number;
}

export interface CompressedImage {
  blob: Blob;
  extension: string;
  contentType: string;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

function extensionOf(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
}

export async function compressImage(file: File, options: CompressOptions = {}): Promise<CompressedImage> {
  const original: CompressedImage = { blob: file, extension: extensionOf(file), contentType: file.type };
  const targetBytes = options.targetBytes ?? 300 * 1024;
  let maxEdge = options.maxEdge ?? 1600;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return original;
  }

  try {
    let best: Blob | null = null;

    for (let pass = 0; pass < 3; pass += 1) {
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) return original;
      context.imageSmoothingQuality = 'high';
      context.drawImage(bitmap, 0, 0, width, height);

      for (let quality = 0.86; quality >= 0.72; quality -= 0.06) {
        const blob = await toBlob(canvas, 'image/webp', quality);
        // Browsers that can't encode WebP return PNG: keep the original then.
        if (!blob || blob.type !== 'image/webp') return original;
        best = blob;
        if (blob.size <= targetBytes) break;
      }

      if (best && best.size <= targetBytes) break;
      maxEdge = Math.round(maxEdge * 0.85); // still too big: shrink slightly and retry
    }

    if (!best || best.size >= file.size) return original;
    return { blob: best, extension: 'webp', contentType: 'image/webp' };
  } finally {
    bitmap.close();
  }
}
