'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Target,
  Eye,
  EyeOff,
} from 'lucide-react';
import { InvoiceItem } from '@/types/invoice';

interface PanZoomViewerProps {
  imageUrl: string;
  alt?: string;
  items?: InvoiceItem[];
  activeItemIndex?: number | null;
  onSelectItem?: (index: number) => void;
  onRetake?: () => void;
}

export function PanZoomViewer({
  imageUrl,
  alt = 'Supplier Bill',
  items,
  activeItemIndex,
  onSelectItem,
}: PanZoomViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.35, 4.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.35, 0.4));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.15, 4.5));
    } else {
      setScale((prev) => Math.max(prev - 0.15, 0.4));
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch drag handlers for mobile counter staff
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Reset view when image changes
  useEffect(() => {
    handleReset();
  }, [imageUrl]);

  // Count items with valid bounding boxes
  const groundedCount = items?.filter((it) => it.bounding_box && it.bounding_box.length === 4).length || 0;

  return (
    <div className="relative w-full h-full min-h-[340px] md:min-h-[500px] flex flex-col bg-slate-100 dark:bg-[#0d0f18] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-sm select-none">
      {/* Top Floating Apple Glass Pill Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 ios-glass px-3 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.1] text-xs font-semibold text-slate-800 dark:text-zinc-200 pointer-events-auto shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Receipt Scan</span>
          {groundedCount > 0 && (
            <span className="text-emerald-700 dark:text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
              <Target className="w-3 h-3 text-emerald-500" />
              <span>{groundedCount} Pinned</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 ios-glass p-1 rounded-full border border-black/[0.06] dark:border-white/[0.1] pointer-events-auto shadow-md">
          {groundedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ios-pressable ${
                showBoundingBoxes
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={showBoundingBoxes ? 'Hide Laser Bounding Boxes' : 'Show Laser Bounding Boxes'}
            >
              {showBoundingBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={handleZoomIn}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors ios-pressable"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors ios-pressable"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors ios-pressable"
            title="Rotate 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors ios-pressable"
            title="Reset View"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Canvas Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full flex-1 flex items-center justify-center overflow-hidden cursor-${
          isDragging ? 'grabbing' : 'grab'
        } bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]`}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            transformOrigin: 'center center',
          }}
          className="max-w-full max-h-full flex items-center justify-center p-4"
        >
          {/* Wrapper hugging the exact image dimensions */}
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={alt}
              draggable={false}
              className="max-h-[60vh] md:max-h-[700px] w-auto object-contain rounded-2xl shadow-xl pointer-events-none block border border-black/[0.05] dark:border-white/[0.05]"
            />

            {/* Apple Styled Visual Grounding Overlays */}
            {showBoundingBoxes && items && items.length > 0 && (
              <div className="absolute inset-0 pointer-events-auto">
                {items.map((item, idx) => {
                  if (!item.bounding_box || item.bounding_box.length !== 4) return null;
                  const [ymin, xmin, ymax, xmax] = item.bounding_box;
                  const top = `${ymin / 10}%`;
                  const left = `${xmin / 10}%`;
                  const width = `${Math.max(1, (xmax - xmin) / 10)}%`;
                  const height = `${Math.max(1.8, (ymax - ymin) / 10)}%`;
                  const isActive = activeItemIndex === idx;

                  return (
                    <div
                      key={item.id || idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem?.(idx);
                      }}
                      style={{ top, left, width, height }}
                      className={`absolute cursor-pointer transition-all duration-200 rounded-lg ${
                        isActive
                          ? 'border-2 border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.5)] z-20'
                          : 'border border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-400 hover:bg-emerald-500/20 z-10'
                      }`}
                      title={`#${idx + 1} ${item.name} (${item.unit_price ? `Rs. ${item.unit_price}` : ''})`}
                    >
                      {isActive && (
                        <div className="absolute -top-7 left-0 ios-glass text-slate-900 dark:text-white font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40 shadow-xl whitespace-nowrap flex items-center gap-1.5 z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                          <Target className="w-3 h-3 text-emerald-500 animate-pulse" />
                          <span>#{idx + 1} {item.name.slice(0, 20)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Hint Pill */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pointer-events-none">
        <span className="ios-glass px-2.5 py-1 rounded-full border border-black/[0.05] dark:border-white/[0.08] shadow-sm">
          Tap any highlighted box on receipt to jump to row
        </span>
        {rotation > 0 && (
          <span className="ios-glass px-2.5 py-1 rounded-full border border-black/[0.05] dark:border-white/[0.08] text-amber-500 font-medium">
            Rotated {rotation}°
          </span>
        )}
      </div>
    </div>
  );
}
