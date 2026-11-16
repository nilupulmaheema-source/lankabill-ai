/**
 * Document Scanner Preprocessing Pipeline
 * =========================================
 * Replicates what CamScanner / Adobe Scan / Apple Document Scanner does:
 *
 * 1. ADAPTIVE THRESHOLDING - Converts to high-contrast black text on white paper
 * 2. CONTRAST ENHANCEMENT - Makes faint dot-matrix and carbon copy text sharp and crisp
 * 3. NOISE REDUCTION - Removes background texture, paper grain, and shadow artifacts
 * 4. SHARPENING - Crisps up fuzzy edges on characters
 * 5. GRAYSCALE OPTIMIZATION - Removes color noise that confuses OCR
 *
 * The result is a clean, scanner-quality image that the AI vision model
 * can read with near-perfect accuracy, because it only needs to parse
 * table structure rather than also fighting image quality issues.
 */

export interface ScannerResult {
  /** The enhanced image as a base64 data URL (image/jpeg) */
  enhancedBase64: string;
  /** Raw base64 without data: prefix */
  pureBase64: string;
  /** Original image dimensions */
  originalWidth: number;
  originalHeight: number;
  /** Enhanced image dimensions */
  enhancedWidth: number;
  enhancedHeight: number;
  /** Processing time in ms */
  processingMs: number;
  /** Enhancement mode applied */
  mode: 'document-scan' | 'passthrough';
}

/**
 * Apply adaptive threshold (Sauvola-inspired local thresholding).
 * For each pixel, compute the local mean in a window and threshold
 * relative to it. This handles uneven lighting across the invoice.
 */
function adaptiveThreshold(
  imageData: ImageData,
  windowSize: number = 15,
  k: number = 0.15
): ImageData {
  const { width, height, data } = imageData;
  const output = new ImageData(new Uint8ClampedArray(data), width, height);
  const outData = output.data;

  // Convert to grayscale intensity array for fast windowed computation
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  // Integral image for fast mean computation
  const integral = new Float64Array(width * height);
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += gray[y * width + x];
      integral[y * width + x] = rowSum + (y > 0 ? integral[(y - 1) * width + x] : 0);
    }
  }

  const halfW = Math.floor(windowSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - halfW);
      const y1 = Math.max(0, y - halfW);
      const x2 = Math.min(width - 1, x + halfW);
      const y2 = Math.min(height - 1, y + halfW);

      const count = (x2 - x1 + 1) * (y2 - y1 + 1);

      // Sum using integral image
      let sum = integral[y2 * width + x2];
      if (x1 > 0) sum -= integral[y2 * width + (x1 - 1)];
      if (y1 > 0) sum -= integral[(y1 - 1) * width + x2];
      if (x1 > 0 && y1 > 0) sum += integral[(y1 - 1) * width + (x1 - 1)];

      const localMean = sum / count;
      const threshold = localMean * (1.0 - k);
      const pixel = gray[y * width + x];

      const idx = (y * width + x) * 4;
      // Text (dark on light) = black, background = white
      const val = pixel < threshold ? 0 : 255;
      outData[idx] = val;
      outData[idx + 1] = val;
      outData[idx + 2] = val;
      outData[idx + 3] = 255;
    }
  }

  return output;
}

/**
 * Apply unsharp masking to sharpen text edges.
 * This makes faint dot-matrix pin strikes and half-formed characters clearer.
 */
function sharpenImage(imageData: ImageData, amount: number = 0.5): ImageData {
  const { width, height, data } = imageData;
  const output = new ImageData(new Uint8ClampedArray(data), width, height);
  const outData = output.data;

  // Simple 3x3 Gaussian blur for the "unsharp" mask
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kernelSum = 16;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let blurred = 0;
        let ki = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            blurred += data[((y + ky) * width + (x + kx)) * 4 + c] * kernel[ki++];
          }
        }
        blurred /= kernelSum;

        // Unsharp mask: original + amount * (original - blurred)
        const original = data[(y * width + x) * 4 + c];
        const sharpened = original + amount * (original - blurred);
        outData[(y * width + x) * 4 + c] = Math.max(0, Math.min(255, Math.round(sharpened)));
      }
    }
  }

  return output;
}

/**
 * Apply CLAHE-inspired local contrast enhancement.
 * Boosts faint text while preventing already-dark text from clipping.
 */
function enhanceContrast(imageData: ImageData, strength: number = 1.4): ImageData {
  const { width, height, data } = imageData;
  const output = new ImageData(new Uint8ClampedArray(data), width, height);
  const outData = output.data;

  // Build histogram
  const hist = new Int32Array(256);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const gray = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
    hist[gray]++;
  }

  // Find 2nd and 98th percentile for robust contrast stretching
  const totalPixels = width * height;
  let cumulative = 0;
  let low = 0, high = 255;
  for (let i = 0; i < 256; i++) {
    cumulative += hist[i];
    if (cumulative >= totalPixels * 0.02 && low === 0) low = i;
    if (cumulative >= totalPixels * 0.98) { high = i; break; }
  }

  const range = Math.max(high - low, 1);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    for (let c = 0; c < 3; c++) {
      let val = data[idx + c];
      // Stretch to full range
      val = ((val - low) / range) * 255;
      // Apply strength curve (gamma-like boost for midtones)
      val = 255 * Math.pow(Math.max(0, Math.min(1, val / 255)), 1 / strength);
      outData[idx + c] = Math.max(0, Math.min(255, Math.round(val)));
    }
    outData[idx + 3] = 255;
  }

  return output;
}

/**
 * Convert to optimized grayscale — removes color noise that confuses character recognition.
 * Dot-matrix inks, carbon copy blues, and faded thermal blacks all normalize to clean gray.
 */
function toGrayscale(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const output = new ImageData(new Uint8ClampedArray(data), width, height);
  const outData = output.data;

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const gray = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
    outData[idx] = gray;
    outData[idx + 1] = gray;
    outData[idx + 2] = gray;
    outData[idx + 3] = 255;
  }

  return output;
}

/**
 * Light denoising pass — median filter on a 3x3 window.
 * Removes speckle noise from paper texture and camera sensor noise
 * without destroying text edges.
 */
function denoiseLight(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const output = new ImageData(new Uint8ClampedArray(data), width, height);
  const outData = output.data;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const vals: number[] = [];
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            vals.push(data[((y + ky) * width + (x + kx)) * 4 + c]);
          }
        }
        vals.sort((a, b) => a - b);
        outData[(y * width + x) * 4 + c] = vals[4]; // median
      }
    }
  }

  return output;
}

export type ScanMode = 'auto' | 'bw-scan' | 'enhanced-color' | 'original';

/**
 * Main Document Scanner Pipeline
 * ===============================
 * Takes a raw phone photo and produces a clean, scanner-quality image
 * optimized for AI vision table extraction.
 *
 * Modes:
 * - 'auto': Detects document type and applies best pipeline
 * - 'bw-scan': Full black & white document scan (like CamScanner B&W mode)
 * - 'enhanced-color': Keeps color but applies contrast + sharpening + denoise
 * - 'original': Passthrough with only minor contrast boost
 */
export async function scanDocument(
  imageBase64: string,
  mode: ScanMode = 'auto'
): Promise<ScannerResult> {
  const startTime = performance.now();

  return new Promise((resolve) => {
    const img = new Image();

    img.onerror = () => {
      // Passthrough if we can't process
      resolve({
        enhancedBase64: imageBase64,
        pureBase64: imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64,
        originalWidth: 0,
        originalHeight: 0,
        enhancedWidth: 0,
        enhancedHeight: 0,
        processingMs: Math.round(performance.now() - startTime),
        mode: 'passthrough',
      });
    };

    img.onload = () => {
      const originalWidth = img.naturalWidth || img.width;
      const originalHeight = img.naturalHeight || img.height;

      // Scale to optimal resolution for OCR (2000px max dimension)
      // Higher than display resolution = better character recognition
      const maxDim = 2400;
      let width = originalWidth;
      let height = originalHeight;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      // Step 1: Draw to canvas at optimal resolution
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        resolve({
          enhancedBase64: imageBase64,
          pureBase64: imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64,
          originalWidth,
          originalHeight,
          enhancedWidth: width,
          enhancedHeight: height,
          processingMs: Math.round(performance.now() - startTime),
          mode: 'passthrough',
        });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      let imageData = ctx.getImageData(0, 0, width, height);

      // Auto-detect: analyze if document is mostly text on light background
      const effectiveMode = mode === 'auto' ? detectBestMode(imageData) : mode;

      if (effectiveMode === 'bw-scan') {
        // Full scanner pipeline: Grayscale → Denoise → Contrast → Adaptive Threshold → Sharpen
        imageData = toGrayscale(imageData);
        imageData = denoiseLight(imageData);
        imageData = enhanceContrast(imageData, 1.5);
        imageData = adaptiveThreshold(imageData, 25, 0.12);
      } else if (effectiveMode === 'enhanced-color') {
        // Enhanced color: Denoise → Contrast → Sharpen (keeps color for colored text/stamps)
        imageData = denoiseLight(imageData);
        imageData = enhanceContrast(imageData, 1.6);
        imageData = sharpenImage(imageData, 0.7);
      } else {
        // Original with mild enhancement
        imageData = enhanceContrast(imageData, 1.2);
        imageData = sharpenImage(imageData, 0.3);
      }

      // Write processed data back to canvas
      ctx.putImageData(imageData, 0, 0);

      // Export as high-quality JPEG
      const enhancedBase64 = canvas.toDataURL('image/jpeg', 0.92);
      const pureBase64 = enhancedBase64.split(',')[1] || '';

      resolve({
        enhancedBase64,
        pureBase64,
        originalWidth,
        originalHeight,
        enhancedWidth: width,
        enhancedHeight: height,
        processingMs: Math.round(performance.now() - startTime),
        mode: effectiveMode === 'bw-scan' ? 'document-scan' : 'passthrough',
      });
    };

    img.src = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
  });
}

/**
 * Auto-detect whether the image is a printed document (text on light paper)
 * or a photo/receipt that needs color preservation.
 *
 * Logic: If >60% of pixels are bright (>180 luminance) and there's clear
 * bimodal distribution (dark text vs light paper), use B&W scan mode.
 */
function detectBestMode(imageData: ImageData): ScanMode {
  const { width, height, data } = imageData;
  const totalPixels = width * height;

  let brightPixels = 0;
  let darkPixels = 0;

  // Sample every 4th pixel for speed
  for (let i = 0; i < totalPixels; i += 4) {
    const idx = i * 4;
    const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    if (lum > 180) brightPixels++;
    if (lum < 80) darkPixels++;
  }

  const sampledPixels = Math.ceil(totalPixels / 4);
  const brightRatio = brightPixels / sampledPixels;
  const darkRatio = darkPixels / sampledPixels;

  // Document pattern: lots of white paper (>50%) with some dark text (>3%)
  if (brightRatio > 0.50 && darkRatio > 0.03) {
    return 'bw-scan';
  }

  // Default to enhanced color for non-standard documents
  return 'enhanced-color';
}

