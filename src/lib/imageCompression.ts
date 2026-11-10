export interface CompressionResult {
  base64Data: string; // "data:image/jpeg;base64,..."
  pureBase64: string; // raw base64 string without data prefix
  mimeType: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  width: number;
  height: number;
  durationMs: number;
  isConvertedFromHeic?: boolean;
}

/**
 * Checks if a file is Apple HEIC / HEIF format
 */
export function isHeicFile(file: File | Blob): boolean {
  const name = (file as File).name?.toLowerCase() || '';
  const type = file.type?.toLowerCase() || '';
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type === 'image/heic' ||
    type === 'image/heif'
  );
}

/**
 * Checks if a file is PDF
 */
export function isPdfFile(file: File | Blob): boolean {
  const name = (file as File).name?.toLowerCase() || '';
  const type = file.type?.toLowerCase() || '';
  return name.endsWith('.pdf') || type === 'application/pdf';
}

/**
 * Converts File or Blob to Base64 data URL
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file into base64'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image file on the client side:
 * - Handles HEIC/HEIF photos (iPhone camera) using client-side conversion or graceful server passthrough.
 * - Handles standard JPEG/PNG/WebP by resizing to maxDimension and compressing to JPEG quality.
 * - If browser fails to decode (e.g. HEIC in desktop Chrome), safely falls back to raw base64 so server can decode it!
 */
export async function compressInvoiceImage(
  file: File | Blob,
  maxDimension: number = 1600,
  quality: number = 0.85
): Promise<CompressionResult> {
  const startTime = performance.now();
  const originalSizeBytes = file.size;

  // 1. If it's a PDF, we bypass image canvas compression and send base64 directly
  if (isPdfFile(file)) {
    const base64Data = await fileToBase64(file);
    const pureBase64 = base64Data.split(',')[1] || '';
    return {
      base64Data,
      pureBase64,
      mimeType: 'application/pdf',
      originalSizeBytes,
      compressedSizeBytes: Math.round((pureBase64.length * 3) / 4),
      width: 0,
      height: 0,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  // 2. If it's an iPhone HEIC/HEIF file, try client conversion via heic2any
  let targetFile: File | Blob = file;
  let isConverted = false;

  if (isHeicFile(file) && typeof window !== 'undefined') {
    try {
      // Dynamic import of heic2any for client side
      const heic2any = (await import('heic2any')).default;
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: quality,
      });

      targetFile = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      isConverted = true;
    } catch (heicErr) {
      console.warn('Client heic2any conversion skipped or failed, passing raw HEIC to server:', heicErr);
      // Fallback: Read raw HEIC into base64 and let the server's heic-convert handle it!
      const rawBase64Data = await fileToBase64(file);
      const pureBase64 = rawBase64Data.split(',')[1] || '';
      return {
        base64Data: rawBase64Data,
        pureBase64,
        mimeType: 'image/heic',
        originalSizeBytes,
        compressedSizeBytes: Math.round((pureBase64.length * 3) / 4),
        width: 1200,
        height: 1600,
        durationMs: Math.round(performance.now() - startTime),
        isConvertedFromHeic: true,
      };
    }
  }

  // 3. Downscale and compress standard images via Canvas
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onerror = async () => {
      // Fallback to raw base64 if FileReader failed
      const raw = await fileToBase64(targetFile).catch(() => '');
      const pure = raw.split(',')[1] || '';
      resolve({
        base64Data: raw,
        pureBase64: pure,
        mimeType: targetFile.type || 'image/jpeg',
        originalSizeBytes,
        compressedSizeBytes: Math.round((pure.length * 3) / 4),
        width: 0,
        height: 0,
        durationMs: Math.round(performance.now() - startTime),
      });
    };

    reader.onload = (e) => {
      const img = new Image();

      // Graceful fallback if browser fails to decode the image format (e.g. Chrome encountering HEIC)
      img.onerror = async () => {
        console.warn('Browser could not decode image with new Image(), falling back to raw base64.');
        const raw = (e.target?.result as string) || '';
        const pure = raw.split(',')[1] || '';
        resolve({
          base64Data: raw,
          pureBase64: pure,
          mimeType: targetFile.type || (isHeicFile(file) ? 'image/heic' : 'image/jpeg'),
          originalSizeBytes,
          compressedSizeBytes: Math.round((pure.length * 3) / 4),
          width: 0,
          height: 0,
          durationMs: Math.round(performance.now() - startTime),
          isConvertedFromHeic: isHeicFile(file),
        });
      };

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
          const raw = (e.target?.result as string) || '';
          const pure = raw.split(',')[1] || '';
          resolve({
            base64Data: raw,
            pureBase64: pure,
            mimeType: 'image/jpeg',
            originalSizeBytes,
            compressedSizeBytes: Math.round((pure.length * 3) / 4),
            width,
            height,
            durationMs: Math.round(performance.now() - startTime),
          });
          return;
        }

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = 'image/jpeg';
        const base64Data = canvas.toDataURL(mimeType, quality);
        const pureBase64 = base64Data.split(',')[1] || '';

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
          isConvertedFromHeic: isConverted,
        });
      };

      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      } else {
        img.onerror(new Event('error'));
      }
    };

    reader.readAsDataURL(targetFile);
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
