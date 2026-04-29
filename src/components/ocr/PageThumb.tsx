// ── OCR Review — PageThumb ────────────────────────────────────────────────────

import React from 'react';
import { FileText, Image as ImageIcon, Loader2, AlertTriangle } from 'lucide-react';
import type { OcrPage } from './ocr.types';
import { PALETTE } from './ocr.constants';

interface PageThumbProps {
  page: OcrPage;
  pageNum: number;
  active: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export function PageThumb({
  page,
  pageNum,
  active,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
}: PageThumbProps) {
  const corrCount = page.regions.filter(r => r.corrected).length;
  const errCount  = page.regions.reduce(
    (a, r) => a + r.lines.filter(l => l.error).length,
    0
  );

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); onDragOver(); }}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); onDrop(e); }}
      onClick={onClick}
      className="rounded-lg cursor-pointer p-1.5 select-none transition-all duration-100"
      style={{
        border:     `2px solid ${active ? '#3b82f6' : '#e2e8f0'}`,
        background: active ? '#eff6ff' : 'white',
      }}
    >
      {/* Thumbnail area */}
      <div
        className="w-full overflow-hidden rounded-sm relative"
        style={{ aspectRatio: '0.707', background: '#f8fafc', border: '1px solid #f1f5f9' }}
      >
        {page.imageUrl && !page.isPdf ? (
          <img
            src={page.imageUrl}
            className="w-full h-full object-cover"
            alt={page.name}
          />
        ) : page.isPdf ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <FileText size={18} className="text-slate-300" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon size={14} className="text-slate-300" />
          </div>
        )}

        {/* Processing overlay */}
        {page.status === 'processing' && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Loader2 size={12} className="text-blue-500 animate-spin" />
          </div>
        )}

        {/* Error overlay */}
        {page.status === 'error' && (
          <div className="absolute inset-0 bg-red-50/80 flex items-center justify-center">
            <AlertTriangle size={12} className="text-red-400" />
          </div>
        )}

        {/* Region overlays */}
        {page.status === 'done' && page.regions.map(r => {
          const c = PALETTE[r.colorIdx % PALETTE.length];
          return (
            <div
              key={r.id}
              style={{
                position:     'absolute',
                left:         `${r.bounds.x}%`,
                top:          `${r.bounds.y}%`,
                width:        `${r.bounds.w}%`,
                height:       `${r.bounds.h}%`,
                background:   c.fill,
                border:       `1px solid ${c.border}`,
                borderRadius: 1,
                pointerEvents: 'none',
              }}
            />
          );
        })}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between mt-1">
        <span
          className="text-[9px] font-bold"
          style={{ color: active ? '#1d4ed8' : '#64748b' }}
        >
          Pg {pageNum}
        </span>
        <div className="flex gap-0.5">
          {corrCount > 0 && (
            <span className="text-[7px] font-extrabold bg-green-100 text-green-700 px-1 py-0.5 rounded-full">
              {corrCount}✓
            </span>
          )}
          {errCount > 0 && (
            <span className="text-[7px] font-extrabold bg-red-50 text-red-600 px-1 py-0.5 rounded-full">
              {errCount}!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}