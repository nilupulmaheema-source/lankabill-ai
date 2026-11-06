export interface CompressionResult {
  base64Data: string; // "data:image/jpeg;base64,..."
  pureBase64: string; // raw base64 string without data prefix
  mimeType: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  width: number;
  height: number;
  durationMs: number;
}

/**
 * Compresses an image file on the client side:
 * - Resizes proportionally so max width or height is 1600px.
 * - Encodes as JPEG with 0.85 quality.
 * - Drastically shrinks typical 5MB-10MB phone camera snaps to 250KB-600KB in ~100ms.
 */
export async function compressInvoiceImage(
  file: File | Blob,
  maxDimension: number = 1600,
  quality: number = 0.85
): Promise<CompressionResult> {
  const startTime = performance.now();
  const originalSizeBytes = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image data'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-ratio preserved downscaling
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = 'image/jpeg';
        const base64Data = canvas.toDataURL(mimeType, quality);
        const pureBase64 = base64Data.split(',')[1] || '';
        
        // Approximate byte size of base64
        const compressedSizeBytes = Math.round((pureBase64.length * 3) / 4);
        const durationMs = Math.round(performance.now() - startTime);

        resolve({
          base64Data,
          pureBase64,
          mimeType,
          originalSizeBytes,
          compressedSizeBytes,
          width,
          height,
          durationMs,
        });
      };

      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      } else {
        reject(new Error('Invalid image result'));
      }
    };

    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
