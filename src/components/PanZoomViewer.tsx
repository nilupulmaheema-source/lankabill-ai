'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, RefreshCw } from 'lucide-react';

interface PanZoomViewerProps {
  imageUrl: string;
  alt?: string;
  onRetake?: () => void;
}

export function PanZoomViewer({ imageUrl, alt = 'Supplier Bill' }: PanZoomViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  return (
    <div className="relative w-full h-full min-h-[320px] md:min-h-[500px] flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-inner select-none">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs font-medium text-slate-200 pointer-events-auto shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Original Bill Photo</span>
          <span className="text-slate-400 font-mono text-[11px] ml-1">({Math.round(scale * 100)}%)</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1 rounded-lg border border-slate-700/80 pointer-events-auto shadow-md">
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
          className="max-w-full max-h-full flex items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={alt}
            draggable={false}
            className="max-h-[70vh] md:max-h-[750px] w-auto object-contain rounded-md shadow-2xl pointer-events-none"
          />
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 pointer-events-none">
        <span className="bg-slate-950/70 backdrop-blur-sm px-2 py-0.5 rounded border border-slate-800">
          Tip: Drag to pan • Pinch or scroll to zoom
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
