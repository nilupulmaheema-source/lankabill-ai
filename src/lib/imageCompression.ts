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
  /** Whether document scanner enhancement was applied */
  scannerEnhanced?: boolean;
  /** Scanner processing time in ms (subset of durationMs) */
  scannerProcessingMs?: number;
}

/**
 * Checks if a file or blob is an Apple HEIC/HEIF file by examining
 * its magic bytes (header bytes 4-16 contains 'ftyp' and 'heic' or 'mif1').
 * This correctly catches iPhone files even if they were renamed to .jpg or .png!
 */
export async function checkIsHeicByBytes(file: File | Blob): Promise<boolean> {
  const name = (file as File).name?.toLowerCase() || '';
  const type = file.type?.toLowerCase() || '';

  if (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type === 'image/heic' ||
    type === 'image/heif'
  ) {
    return true;
  }

  // Inspect first 32 bytes for ISO Media / HEIF box header 'ftypheic', 'ftypmif1', etc.
  try {
    const slice = file.slice(0, 32);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    return str.includes('ftyp') && (str.includes('heic') || str.includes('heix') || str.includes('mif1') || str.includes('msf1'));
  } catch {
    return false;
  }
}

/**
 * Checks if a file is a PDF
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
 * Robust invoice image optimizer:
 * 1. Accurately detects iPhone HEIC/HEIF images even when renamed to .jpg!
 * 2. If it's HEIC or PDF, bypasses HTML5 Image decoding and passes raw data directly
 *    to the server's native heic-convert and Gemini 2.5 Flash pipeline.
 * 3. Never throws "Failed to decode image data" — gracefully falls back to raw data.
 */
export async function compressInvoiceImage(
  file: File | Blob,
  maxDimension: number = 1600,
  quality: number = 0.85
): Promise<CompressionResult> {
  const startTime = performance.now();
  const originalSizeBytes = file.size;

  // 1. PDF Handling: send directly to Gemini
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

  // 2. Magic-byte inspection for HEIC/HEIF (handles renamed iPhone photos like IMG_9427.jpg)
  const isHeic = await checkIsHeicByBytes(file);

  if (isHeic) {
    // If running in browser and heic2any is feasible, try it; otherwise pass directly to server heic-convert
    try {
      if (typeof window !== 'undefined') {
        const heic2any = (await import('heic2any')).default;
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: quality,
        });

        const targetBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        const base64Data = await fileToBase64(targetBlob);
        const pureBase64 = base64Data.split(',')[1] || '';

        return {
          base64Data,
          pureBase64,
          mimeType: 'image/jpeg',
          originalSizeBytes,
          compressedSizeBytes: Math.round((pureBase64.length * 3) / 4),
          width: 1200,
          height: 1600,
          durationMs: Math.round(performance.now() - startTime),
          isConvertedFromHeic: true,
        };
      }
    } catch (clientErr) {
      console.warn('Client HEIC conversion deferred to server:', clientErr);
    }

    // Direct passthrough to server heic-convert
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

  // 3. Standard image compression via Canvas + Document Scanner Enhancement
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onerror = async () => {
      const raw = await fileToBase64(file).catch(() => '');
      const pure = raw.split(',')[1] || '';
      resolve({
        base64Data: raw,
        pureBase64: pure,
        mimeType: file.type || 'image/jpeg',
        originalSizeBytes,
        compressedSizeBytes: Math.round((pure.length * 3) / 4),
        width: 0,
        height: 0,
        durationMs: Math.round(performance.now() - startTime),
      });
    };

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => {
        console.warn('Browser new Image() decoder failed. Passing raw base64 directly to server.');
        const raw = (e.target?.result as string) || '';
        const pure = raw.split(',')[1] || '';
        resolve({
          base64Data: raw,
          pureBase64: pure,
          mimeType: file.type || 'image/jpeg',
          originalSizeBytes,
          compressedSizeBytes: Math.round((pure.length * 3) / 4),
          width: 0,
          height: 0,
          durationMs: Math.round(performance.now() - startTime),
        });
      };

      img.onload = async () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

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

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
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

        ctx.drawImage(img, 0, 0, width, height);

        // ═══════════════════════════════════════════════════════════════
        // DOCUMENT SCANNER ENHANCEMENT PIPELINE
        // Replicates CamScanner / Adobe Scan / Apple Document Scanner
        // ═══════════════════════════════════════════════════════════════
        let scannerMs = 0;
        let wasEnhanced = false;
        try {
          const { scanDocument } = await import('@/lib/documentScanner');
          const rawBase64 = canvas.toDataURL('image/jpeg', 0.95);

          const scanStart = performance.now();
          const scanResult = await scanDocument(rawBase64, 'auto');
          scannerMs = Math.round(performance.now() - scanStart);

          if (scanResult.mode === 'document-scan') {
            // Load the enhanced image back onto our canvas for final export
            const enhancedImg = new Image();
            await new Promise<void>((resolveImg) => {
              enhancedImg.onload = () => {
                canvas.width = enhancedImg.naturalWidth || enhancedImg.width;
                canvas.height = enhancedImg.naturalHeight || enhancedImg.height;
                ctx.drawImage(enhancedImg, 0, 0);
                width = canvas.width;
                height = canvas.height;
                wasEnhanced = true;
                resolveImg();
              };
              enhancedImg.onerror = () => resolveImg(); // Fallback to original
              enhancedImg.src = scanResult.enhancedBase64;
            });
          }
        } catch (scanErr) {
          console.warn('Document scanner enhancement skipped:', scanErr);
        }

        // If scanner didn't run, apply basic contrast/brightness enhancement
        if (!wasEnhanced) {
          try {
            ctx.filter = 'contrast(115%) brightness(103%)';
            ctx.drawImage(canvas, 0, 0);
          } catch {
            // filter not supported
          }
        }

        const mimeType = 'image/jpeg';
        const base64Data = canvas.toDataURL(mimeType, quality);
        const pureBase64 = base64Data.split(',')[1] || '';

        resolve({
          base64Data,
          pureBase64,
          mimeType,
          originalSizeBytes,
          compressedSizeBytes: Math.round((pureBase64.length * 3) / 4),
          width,
          height,
          durationMs: Math.round(performance.now() - startTime),
          scannerEnhanced: wasEnhanced,
          scannerProcessingMs: scannerMs,
        });
      };

      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      } else {
        img.onerror(new Event('error'));
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
