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
    // Only drag when clicking canvas background or image, not buttons
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
    <div className="relative w-full h-full min-h-[320px] md:min-h-[500px] flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-inner select-none">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs font-medium text-slate-200 pointer-events-auto shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Original Bill Photo</span>
          {groundedCount > 0 && (
            <span className="text-emerald-400 font-mono text-[10px] ml-1 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Target className="w-3 h-3 text-emerald-400" />
              <span>{groundedCount} Grounded</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1 rounded-lg border border-slate-700/80 pointer-events-auto shadow-md">
          {groundedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
              className={`p-1.5 rounded-md transition-colors ${
                showBoundingBoxes
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={showBoundingBoxes ? 'Hide AI Laser Bounding Boxes' : 'Show AI Laser Bounding Boxes'}
            >
              {showBoundingBoxes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Reset to Fit"
          >
            <RefreshCw className="w-4 h-4" />
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
        } bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]`}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            transformOrigin: 'center center',
          }}
          className="max-w-full max-h-full flex items-center justify-center p-4"
        >
          {/* Wrapper that hugs the exact rendered dimensions of the image */}
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={alt}
              draggable={false}
              className="max-h-[65vh] md:max-h-[720px] w-auto object-contain rounded-md shadow-2xl pointer-events-none block"
            />

            {/* Visual Grounding Bounding Box Overlays (Day 2 Magic Moment) */}
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
                      className={`absolute cursor-pointer transition-all duration-200 rounded ${
                        isActive
                          ? 'border-2 border-emerald-400 bg-emerald-400/25 ring-2 ring-emerald-400/60 shadow-[0_0_20px_rgba(52,211,153,0.7)] z-20'
                          : 'border border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-300 hover:bg-emerald-500/30 z-10'
                      }`}
                      title={`#${idx + 1} ${item.name} (${item.unit_price ? `Rs. ${item.unit_price}` : ''})`}
                    >
                      {isActive && (
                        <div className="absolute -top-7 left-0 bg-slate-950/95 text-emerald-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-400 shadow-xl whitespace-nowrap flex items-center gap-1 z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                          <Target className="w-3 h-3 text-emerald-400 animate-pulse" />
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

      {/* Bottom Hint */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 pointer-events-none">
        <span className="bg-slate-950/70 backdrop-blur-sm px-2 py-0.5 rounded border border-slate-800">
          Tip: Tap any box on receipt to jump to row • Pinch to zoom
        </span>
        {rotation > 0 && (
          <span className="bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800 text-amber-400">
            Rotated {rotation}°
          </span>
        )}
      </div>
    </div>
  );
}
