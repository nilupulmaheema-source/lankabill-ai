'use client';

import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Languages,
} from 'lucide-react';
import { compressInvoiceImage, formatBytes, CompressionResult } from '@/lib/imageCompression';
import { SAMPLE_BILLS, SampleBill } from '@/data/sampleBills';
import { InvoiceExtraction } from '@/types/invoice';
import { getUserSettings } from '@/lib/supabase';

interface ScreenCaptureProps {
  onExtractionComplete: (result: {
    extraction: InvoiceExtraction;
    imageUrl: string;
    processingTimeMs: number;
    compressionStats?: CompressionResult;
  }) => void;
}

export function ScreenCapture({ onExtractionComplete }: ScreenCaptureProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('Preparing...');
  const [loadingTimer, setLoadingTimer] = useState<number>(0);
  const [dragActive, setDragActive] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<CompressionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<any>(null);

  const startTimer = () => {
    setLoadingTimer(0);
    const start = performance.now();
    timerIntervalRef.current = setInterval(() => {
      setLoadingTimer(parseFloat(((performance.now() - start) / 1000).toFixed(1)));
    }, 100);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const processImageFile = async (file: File) => {
    console.log('[LankaBill] Selected file:', file.name, file.type, file.size);
    const fileName = file.name?.toLowerCase() || '';
    const fileType = file.type?.toLowerCase() || '';
    const isSupported =
      fileType.startsWith('image/') ||
      fileName.endsWith('.heic') ||
      fileName.endsWith('.heif') ||
      fileName.endsWith('.pdf') ||
      fileType === 'application/pdf';

    if (!isSupported) {
      setErrorMsg('Please select a valid bill photo (JPEG, PNG, HEIC from iPhone, WebP) or PDF.');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);
    startTimer();

    try {
      // 1. Client-side compression & format handling (with HEIC support)
      setLoadingStep('Optimizing photo for high-speed upload...');
      console.log('[LankaBill] Compressing image...');
      const compResult = await compressInvoiceImage(file, 1600, 0.85);
      console.log('[LankaBill] Compression complete:', compResult);
      setCompressionInfo(compResult);

      // 2. Call Gemini Vision API Route
      setLoadingStep('Reading bill with Gemini Flash...');
      const userSettings = getUserSettings();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      try {
        console.log('[LankaBill] Sending extraction request to /api/extract...');
        const response = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            imageBase64: compResult.base64Data,
            mimeType: compResult.mimeType,
            userApiKey: userSettings.geminiApiKey || undefined,
          }),
        });
        clearTimeout(timeoutId);

        const json = await response.json();
        console.log('[LankaBill] Extraction response received:', json);
        stopTimer();
        setIsProcessing(false);

        if (json.success && json.data) {
          onExtractionComplete({
            extraction: json.data,
            imageUrl: json.displayImageUrl || compResult.base64Data,
            processingTimeMs: json.processingTimeMs || Math.round(loadingTimer * 1000),
            compressionStats: compResult,
          });
        } else {
          setErrorMsg(json.error || 'Failed to extract invoice data. Please try again.');
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        stopTimer();
        setIsProcessing(false);
        console.error('[LankaBill] Fetch error:', fetchErr);
        setErrorMsg('Network timeout reaching AI server. Please check internet connection.');
      }
    } catch (compErr: any) {
      stopTimer();
      setIsProcessing(false);
      console.error('[LankaBill] Compression error:', compErr);
      setErrorMsg(compErr.message || 'Error preparing image for scanning.');
    }
  };

  const handleSelectSample = async (sample: SampleBill) => {
    setErrorMsg(null);
    setIsProcessing(true);
    startTimer();
    setLoadingStep(`Loading ${sample.title}...`);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleId: sample.id,
        }),
      });

      const json = await response.json();
      stopTimer();

      onExtractionComplete({
        extraction: json.data || sample.data,
        imageUrl: sample.imageUrl,
        processingTimeMs: json.processingTimeMs || 840,
      });
    } catch (err: any) {
      stopTimer();
      setIsProcessing(false);
      onExtractionComplete({
        extraction: sample.data,
        imageUrl: sample.imageUrl,
        processingTimeMs: 650,
      });
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
      {/* Apple Styled Hero Heading */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ios-glass border border-black/[0.06] dark:border-white/[0.08] text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-sm">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Sri Lankan Retail &amp; Pharmacy AI</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Scan Bills in Seconds
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-zinc-400 max-w-lg mx-auto font-normal leading-relaxed">
          Snap any handwritten or printed receipt in Sinhala Unicode (සිමෙන්ති, බට), Singlish, or English. Instant arithmetic validation and price check.
        </p>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Processing Failed</p>
            <p className="text-xs text-rose-600 dark:text-rose-300 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Processing State: Apple Document Scanner Look */}
      {isProcessing ? (
        <div className="ios-glass border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-8 sm:p-12 text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse" />

          <div className="max-w-sm mx-auto space-y-6">
            {/* Spinning Indicator */}
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-mono text-xs mb-2">
                <Clock className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                <span>Elapsed: {loadingTimer.toFixed(1)}s</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Reading bill with Gemini Flash
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-normal">{loadingStep}</p>
            </div>

            {/* Skeleton Line Items */}
            <div className="space-y-2 pt-2">
              <div className="h-3 bg-black/[0.04] dark:bg-white/[0.06] rounded-full animate-pulse w-3/4 mx-auto" />
              <div className="h-3 bg-black/[0.04] dark:bg-white/[0.06] rounded-full animate-pulse w-5/6 mx-auto" />
              <div className="h-3 bg-black/[0.04] dark:bg-white/[0.06] rounded-full animate-pulse w-1/2 mx-auto" />
            </div>

            {compressionInfo && (
              <div className="text-[11px] text-slate-400 dark:text-zinc-500 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center gap-2">
                <span>Compressed to {formatBytes(compressionInfo.compressedSizeBytes)}</span>
                <span>•</span>
                <span>{compressionInfo.width}×{compressionInfo.height}px</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Capture Controls */
        <div className="space-y-4 sm:space-y-6">
          {/* PRIMARY APPLE STYLE MOBILE CAPTURE CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* 1. Direct Camera */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    e.target.value = '';
                    processImageFile(file);
                  }
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full group bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl p-5 sm:p-6 shadow-lg shadow-emerald-600/25 flex items-center gap-3.5 transition-all ios-pressable border border-emerald-400/20 text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base sm:text-lg tracking-tight">Camera Snap</span>
                    <span className="text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 font-normal mt-0.5">
                    Launch phone camera directly
                  </p>
                </div>
              </button>
            </div>

            {/* 2. Photo Library / Gallery */}
            <div>
              <input
                ref={desktopInputRef}
                type="file"
                accept="image/*,.heic,.heif,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    e.target.value = '';
                    processImageFile(file);
                  }
                }}
              />

              <button
                type="button"
                onClick={() => desktopInputRef.current?.click()}
                className="w-full h-full group ios-glass hover:bg-white/80 dark:hover:bg-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-sm flex items-center gap-3.5 transition-all ios-pressable border border-black/[0.06] dark:border-white/[0.08] text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 text-slate-700 dark:text-zinc-200">
                  <Upload className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">Photo Library</span>
                    <span className="text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-2 py-0.5 rounded-full border border-black/[0.04] dark:border-white/[0.06]">
                      HEIC / PDF
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
                    Choose existing bill from phone
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* SECONDARY DRAG & DROP ZONE (Desktop & File Picker) */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => desktopInputRef.current?.click()}
            className={`cursor-pointer ios-glass rounded-3xl p-4 sm:p-5 text-center transition-all border ios-pressable ${
              dragActive
                ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                : 'border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.16]'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-400">
              <Upload className="w-3.5 h-3.5 text-emerald-500" />
              <span>Or drop file here (iPhone HEIC, JPEG, PNG, PDF up to 25MB)</span>
            </div>
          </div>

          {/* SRI LANKA BENCHMARK SAMPLES (Apple Grouped Inset Style) */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  1-Click Benchmark Samples
                </span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                Instant test without paper
              </span>
            </div>

            <div className="ios-glass rounded-3xl border border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.05] dark:divide-white/[0.06] overflow-hidden shadow-sm">
              {SAMPLE_BILLS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="w-full text-left p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors flex items-center justify-between gap-3 group ios-pressable"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          sample.category === 'Hardware'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                            : 'bg-teal-500/10 text-teal-700 dark:text-teal-400'
                        }`}
                      >
                        {sample.category}
                      </span>
                      {sample.hasDiscrepancy && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400">
                          Math Check Test
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {sample.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      {sample.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0 text-right">
                    <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                      Rs. {sample.data.grand_total.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Counter Trust Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
            <div className="flex items-center gap-2 p-2.5 rounded-2xl ios-glass border border-black/[0.04] dark:border-white/[0.06] text-[11px] text-slate-600 dark:text-zinc-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>Sinhala &amp; Singlish</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-2xl ios-glass border border-black/[0.04] dark:border-white/[0.06] text-[11px] text-slate-600 dark:text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>Math Integrity Check</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-2xl ios-glass border border-black/[0.04] dark:border-white/[0.06] text-[11px] text-slate-600 dark:text-zinc-400 col-span-2 sm:col-span-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>Gemini Flash Vision</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
