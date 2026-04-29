import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Plus, X, Eye, Loader2, AlertTriangle, RefreshCw,
  RotateCcw, RotateCw, ZoomIn, ZoomOut, FileText,
  Image as ImageIcon, Layers, ChevronRight,
} from 'lucide-react';

import type {
  OcrPage, OcrRegion, DragState, ResizeHandle,
  OcrReviewProps, CompiledSubmission, BackendOcrPage,
} from './ocr.types';
import { PALETTE, uid } from './ocr.constants';
import { runOcr, mapRegion, collapseToThree } from './ocr.api';
import { OrderConfirmModal } from './OrderConfirmModal';
import { PageTextEditor }    from './PageTextEditor';
import { PageThumb }         from './PageThumb';
import { CompileModal }      from './CompileModal';

// ── Mode config ────────────────────────────────────────────────────────────────

const MODE_CONFIG = {
  'resource-upload': {
    label:  'Upload Handwritten Resource',
    hint:   'Upload images or PDFs of handwritten content to extract text via OCR.',
    submit: 'Save Resource',
  },
  'teacher-mark': {
    label:  'Mark Manual Submission',
    hint:   'Upload scanned student submissions, review the extracted text, then submit for AI marking.',
    submit: 'Submit for Marking',
  },
  'student-submit': {
    label:  'Submit Handwritten Work',
    hint:   'Upload photos or scans of your work, correct any OCR errors, then submit.',
    submit: 'Submit Assignment',
  },
} as const;

// ── OcrReviewComponent ─────────────────────────────────────────────────────────

const OcrReviewComponent: React.FC<OcrReviewProps> = ({
  mode,
  initialFiles,
  onSubmit,
  onCancel,
}) => {
  const [pages,          setPages]          = useState<OcrPage[]>([]);
  const [activePage,     setActivePage]     = useState(0);
  const [hoveredRegion,  setHoveredRegion]  = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [dragIdx,        setDragIdx]        = useState<number | null>(null);
  const [dragOver,       setDragOver]       = useState<number | null>(null);
  const [zoom,           setZoom]           = useState(1);
  const [showCompile,    setShowCompile]    = useState(false);
  const [dropHighlight,  setDropHighlight]  = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [activeDrag,     setActiveDrag]     = useState<DragState | null>(null);
  const [pendingFiles,   setPendingFiles]   = useState<File[] | null>(null);

  const fileInputRef    = useRef<HTMLInputElement>(null);
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const rotationRef     = useRef<0 | 90 | 180 | 270>(0);

  const page = pages[activePage];
  const cfg  = MODE_CONFIG[mode];

  // ── Sync rotation ref ─────────────────────────────────────────────────────────

  useEffect(() => {
    rotationRef.current = (pages[activePage]?.rotation ?? 0) as 0 | 90 | 180 | 270;
  }, [pages, activePage]);

  // ── Region bounds ─────────────────────────────────────────────────────────────

  const updateRegionBounds = useCallback((regionId: string, bounds: OcrRegion['bounds']) => {
    setPages(prev => prev.map((p, pi) =>
      pi !== activePage ? p : {
        ...p,
        regions: p.regions.map(r => r.id !== regionId ? r : { ...r, bounds }),
      }
    ));
  }, [activePage]);

  // ── Mouse drag / resize ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!activeDrag) return;

    const onMove = (e: MouseEvent) => {
      const container = imgContainerRef.current;
      if (!container) return;
      const rect  = container.getBoundingClientRect();
      const rawDx = ((e.clientX - activeDrag.startX) / rect.width)  * 100;
      const rawDy = ((e.clientY - activeDrag.startY) / rect.height) * 100;
      const r  = rotationRef.current;
      const dx = r === 90 ? -rawDy : r === 180 ? -rawDx : r === 270 ?  rawDy : rawDx;
      const dy = r === 90 ?  rawDx : r === 180 ? -rawDy : r === 270 ? -rawDx : rawDy;
      const sb = activeDrag.startBounds;
      let nb = { ...sb };

      if (activeDrag.mode === 'move') {
        nb.x = Math.max(0, Math.min(100 - sb.w, sb.x + dx));
        nb.y = Math.max(0, Math.min(100 - sb.h, sb.y + dy));
      } else {
        switch (activeDrag.handle) {
          case 'se': nb.w = Math.max(5, sb.w + dx); nb.h = Math.max(5, sb.h + dy); break;
          case 'sw': nb.x = Math.max(0, sb.x + dx); nb.w = Math.max(5, sb.w - dx); nb.h = Math.max(5, sb.h + dy); break;
          case 'ne': nb.y = Math.min(sb.y + sb.h - 5, sb.y + dy); nb.w = Math.max(5, sb.w + dx); nb.h = Math.max(5, sb.h - dy); break;
          case 'nw': nb.x = Math.max(0, sb.x + dx); nb.y = Math.min(sb.y + sb.h - 5, sb.y + dy); nb.w = Math.max(5, sb.w - dx); nb.h = Math.max(5, sb.h - dy); break;
        }
      }

      updateRegionBounds(activeDrag.regionId, nb);
    };

    const onUp = () => setActiveDrag(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',  onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',  onUp);
    };
  }, [activeDrag, updateRegionBounds]);

  // ── OCR processing ────────────────────────────────────────────────────────────

  const processFiles = useCallback(async (files: File[]) => {
    const accepted = files.filter(
      f => f.type.startsWith('image/') || f.type === 'application/pdf'
    );
    if (!accepted.length) return;

    const newPages: OcrPage[] = accepted.map(f => ({
      id:         uid(),
      name:       f.name.replace(/\.[^.]+$/, ''),
      imageUrl:   f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
      isPdf:      f.type === 'application/pdf',
      status:     'processing' as const,
      regions:    [],
      sourceFile: f,
      rotation:   0 as const,
    }));

    setPages(prev => {
      const insertAt = prev.length;
      setActivePage(insertAt);
      return [...prev, ...newPages];
    });

    // Fire all OCR requests in parallel — each page updates its own slot independently.
    // setPages uses functional updates so concurrent calls are serialised by React safely.
    await Promise.allSettled(
      newPages.map(async (pg, i) => {
        try {
          const { regions, extraPages } = await runOcr(accepted[i]);

          const extra: OcrPage[] = extraPages.map((ep: BackendOcrPage) => ({
            id:       uid(),
            name:     `${pg.name} — p${ep.page_number}`,
            imageUrl: undefined,
            isPdf:    true,
            status:   'done' as const,
            regions:  collapseToThree(ep.regions.map(mapRegion)),
            rotation: 0 as const,
          }));

          setPages(prev => {
            const updated = prev.map(p => p.id !== pg.id ? p : { ...p, status: 'done' as const, regions });
            if (!extra.length) return updated;
            const idx = updated.findIndex(p => p.id === pg.id);
            return [...updated.slice(0, idx + 1), ...extra, ...updated.slice(idx + 1)];
          });
        } catch {
          setPages(prev => prev.map(p => p.id !== pg.id ? p : { ...p, status: 'error' as const }));
        }
      })
    );
  }, []);

  // ── Rotation ──────────────────────────────────────────────────────────────────

  const rotatePage = (dir: 'cw' | 'ccw') => {
    setPages(prev => prev.map((p, pi) =>
      pi !== activePage ? p : {
        ...p,
        rotation: (((p.rotation ?? 0) + (dir === 'cw' ? 90 : 270)) % 360) as 0 | 90 | 180 | 270,
      }
    ));
  };

  // ── File queueing ─────────────────────────────────────────────────────────────

  const queueFiles = useCallback((raw: File[]) => {
    const accepted = raw.filter(
      f => f.type.startsWith('image/') || f.type === 'application/pdf'
    );
    if (accepted.length) {
      setPendingFiles(prev => prev ? [...prev, ...accepted] : accepted);
    }
  }, []);

  const confirmOrder = useCallback((ordered: File[]) => {
    setPendingFiles(null);
    processFiles(ordered);
  }, [processFiles]);

  const initialFilesRef = useRef(initialFiles);
  useEffect(() => {
    if (initialFilesRef.current?.length) queueFiles(initialFilesRef.current);
  }, [queueFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    queueFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropHighlight(false);
    queueFiles(Array.from(e.dataTransfer.files));
  };

  const retryOcr = async (pageId: string) => {
    const srcFile = pages.find(p => p.id === pageId)?.sourceFile;
    if (!srcFile) return;
    setPages(prev => prev.map(p => p.id !== pageId ? p : { ...p, status: 'processing' as const, regions: [] }));
    try {
      const { regions } = await runOcr(srcFile);
      setPages(prev => prev.map(p => p.id !== pageId ? p : { ...p, status: 'done' as const, regions }));
    } catch {
      setPages(prev => prev.map(p => p.id !== pageId ? p : { ...p, status: 'error' as const }));
    }
  };

  // ── Page reorder / remove ─────────────────────────────────────────────────────

  const handlePageDrop = (targetIdx: number) => {
    if (dragIdx == null || dragIdx === targetIdx) { setDragIdx(null); setDragOver(null); return; }
    setPages(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIdx, 1);
      arr.splice(targetIdx, 0, moved);
      return arr;
    });
    setActivePage(targetIdx);
    setDragIdx(null); setDragOver(null);
  };

  const removePage = (idx: number) => {
    setPages(prev => prev.filter((_, i) => i !== idx));
    setActivePage(prev => Math.min(prev, Math.max(0, pages.length - 2)));
    setSelectedRegion(null);
  };

  // ── Corrections ───────────────────────────────────────────────────────────────

  const saveCorrection = (regionId: string, draft: string) => {
    setPages(prev => prev.map((p, pi) =>
      pi !== activePage ? p : {
        ...p,
        regions: p.regions.map(r =>
          r.id !== regionId ? r : {
            ...r,
            correctedText: draft,
            corrected:     true,
            lines: draft.split('\n').map((text, i) => ({
              ...(r.lines[i] ?? { text, confidence: 1 }),
              text,
              correctedText: text,
              confidence:    1,
              error:         undefined,
            })),
          }
        ),
      }
    ));
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const fullText = pages
      .map((p, pi) =>
        `=== Page ${pi + 1}: ${p.name} ===\n` +
        p.regions
          .map(r =>
            `--- ${r.label} ---\n` +
            (r.correctedText ?? r.lines.map(l => l.correctedText ?? l.text).join('\n'))
          )
          .join('\n\n')
      )
      .join('\n\n');

    setSubmitting(true);
    try {
      await onSubmit?.({ pages, fullText });
      setShowCompile(false);
    } catch {
      // parent shows error toast; keep modal open for retry
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────────

  const totalErrors    = pages.reduce((a, p) => a + p.regions.reduce((b, r) => b + r.lines.filter(l => l.error).length, 0), 0);
  const totalCorrected = pages.reduce((a, p) => a + p.regions.filter(r => r.corrected).length, 0);

  // Rotation-aware image dimensions
  const rot    = (page?.rotation ?? 0) as 0 | 90 | 180 | 270;
  const is90   = rot === 90 || rot === 270;
  const baseW  = Math.round(520 * zoom);
  const natAR  = (page?.naturalW && page?.naturalH) ? page.naturalW / page.naturalH : 1;
  const baseH  = Math.round(baseW / natAR);
  const outerW = is90 ? baseH : baseW;
  const outerH = is90 ? baseW : baseH;

  // ── Order modal ───────────────────────────────────────────────────────────────

  if (pendingFiles) {
    return (
      <>
        <OrderConfirmModal
          initialFiles={pendingFiles}
          onConfirm={confirmOrder}
          onCancel={() => setPendingFiles(null)}
          onAddMore={() => fileInputRef.current?.click()}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
      </>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────────

  if (pages.length === 0) {
    return (
      <div className="h-full flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800">{cfg.label}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{cfg.hint}</p>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
              <X size={16} />
            </button>
          )}
        </div>

        <div
          className="flex-1 flex items-center justify-center p-8"
          onDragOver={e => { e.preventDefault(); setDropHighlight(true); }}
          onDragLeave={() => setDropHighlight(false)}
          onDrop={handleFileDrop}
        >
          <div
            className="w-full max-w-md flex flex-col items-center text-center rounded-2xl border-2 border-dashed py-14 px-8 cursor-pointer transition-all duration-150"
            style={{
              borderColor: dropHighlight ? '#3b82f6' : '#cbd5e1',
              background:  dropHighlight ? '#eff6ff' : 'white',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <Upload size={24} className="text-blue-500" />
            </div>
            <p className="text-sm font-bold text-slate-700 mb-1">Drop files here or click to browse</p>
            <p className="text-[11px] text-slate-400 mb-6">PNG · JPG · PDF · Multiple files become separate pages</p>
            <button
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-extrabold text-white rounded-xl bg-blue-500 hover:bg-blue-600 transition-colors"
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              <Plus size={13} /> Select Files
            </button>
            <p className="text-[10px] text-slate-300 mt-5 leading-relaxed">
              Images &amp; PDFs will be OCR-processed. You can review and correct extracted text before submitting.
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    );
  }

  // ── Main 3-panel layout ───────────────────────────────────────────────────────

  return (
    <div
      className="h-full flex bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
      onDragOver={e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDropHighlight(true); } }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropHighlight(false); }}
      onDrop={handleFileDrop}
    >
      {/* Drop overlay */}
      {dropHighlight && (
        <div className="absolute inset-0 z-40 rounded-xl border-2 border-dashed border-blue-400 bg-blue-500/10 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-blue-600">
            <Upload size={28} />
            <span className="text-sm font-bold">Drop to add pages</span>
          </div>
        </div>
      )}

      {/* ── FILMSTRIP ──────────────────────────────────────────────────────────── */}
      <div className="w-[140px] flex-shrink-0 border-r border-slate-200 flex flex-col bg-white overflow-hidden">
        <div className="px-3 pt-2.5 pb-2 border-b border-slate-100 flex-shrink-0">
          <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Pages</div>
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {totalErrors > 0 && (
              <span className="text-[7px] font-extrabold bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">
                {totalErrors} flag{totalErrors !== 1 ? 's' : ''}
              </span>
            )}
            {totalCorrected > 0 && (
              <span className="text-[7px] font-extrabold bg-green-100 text-green-700 border border-green-300 px-1.5 py-0.5 rounded-full">
                {totalCorrected} fixed
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
          {pages.map((p, pi) => (
            <div
              key={p.id}
              className="relative group"
              style={{
                outline: dragOver === pi ? '2px dashed #3b82f6' : undefined,
                outlineOffset: 2,
                borderRadius: 8,
              }}
            >
              <PageThumb
                page={p}
                pageNum={pi + 1}
                active={activePage === pi}
                onClick={() => { setActivePage(pi); setSelectedRegion(null); setHoveredRegion(null); }}
                onDragStart={() => setDragIdx(pi)}
                onDragOver={() => setDragOver(pi)}
                onDrop={() => handlePageDrop(pi)}
              />
              <button
                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white hidden group-hover:flex items-center justify-center z-10 shadow"
                onClick={e => { e.stopPropagation(); removePage(pi); }}
                title="Remove page"
              >
                <X size={8} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-2 border-t border-slate-100 flex-shrink-0 flex flex-col gap-1.5">
          <button
            className="w-full flex items-center justify-center gap-1 py-1.5 text-[9px] font-extrabold uppercase tracking-wide text-blue-500 rounded-lg border-2 border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus size={10} /> Add page
          </button>
          <button
            className="w-full flex items-center justify-center gap-1 py-1.5 text-[9px] font-extrabold uppercase tracking-wide text-white rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
            onClick={() => setShowCompile(true)}
          >
            <Layers size={10} /> Compile
          </button>
        </div>
      </div>

      {/* ── IMAGE VIEWER ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-slate-50">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-slate-200 flex-shrink-0 min-w-0">
          <Eye size={13} className="text-slate-400 flex-shrink-0" />
          <span className="text-[11px] font-bold text-slate-700 truncate min-w-0 flex-1">
            {page?.name ?? '—'}
          </span>

          {page?.status === 'processing' && (
            <span className="flex items-center gap-1 text-[10px] text-blue-500 font-semibold flex-shrink-0">
              <Loader2 size={10} className="animate-spin" /> OCR running…
            </span>
          )}
          {page?.status === 'done' && (
            <span className="text-[10px] text-slate-400 flex-shrink-0">
              {page.regions.length} region{page.regions.length !== 1 ? 's' : ''}
            </span>
          )}
          {page?.status === 'error' && (
            <button
              className="flex items-center gap-1 text-[10px] text-red-500 font-semibold flex-shrink-0 hover:text-red-700"
              onClick={() => page && retryOcr(page.id)}
            >
              <RefreshCw size={10} /> Retry OCR
            </button>
          )}

          {/* Rotate controls */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
            <button
              className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              title="Rotate left"
              onClick={() => rotatePage('ccw')}
            >
              <RotateCcw size={11} className="text-slate-500" />
            </button>
            <button
              className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              title="Rotate right"
              onClick={() => rotatePage('cw')}
            >
              <RotateCw size={11} className="text-slate-500" />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-0.5" />
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              onClick={() => setZoom(z => Math.max(0.4, parseFloat((z - 0.15).toFixed(2))))}
            >
              <ZoomOut size={11} className="text-slate-500" />
            </button>
            <span className="text-[10px] font-bold text-slate-500 min-w-[34px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              onClick={() => setZoom(z => Math.min(3, parseFloat((z + 0.15).toFixed(2))))}
            >
              <ZoomIn size={11} className="text-slate-500" />
            </button>
            <button
              className="text-[9px] font-bold text-blue-500 px-2 py-0.5 border border-blue-200 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
              onClick={() => setZoom(1)}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Image canvas */}
        <div className="flex-1 overflow-auto flex justify-center p-5">
          {page?.status === 'processing' ? (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400 py-16">
              <Loader2 size={28} className="animate-spin text-blue-400" />
              <p className="text-xs font-semibold">Running OCR on {page.name}…</p>
              <p className="text-[10px] text-slate-300">This usually takes a few seconds</p>
            </div>

          ) : page?.status === 'error' ? (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400 py-16">
              <AlertTriangle size={28} className="text-red-300" />
              <p className="text-xs font-semibold text-red-500">OCR failed for this page</p>
              <button
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-700 underline"
                onClick={() => page && retryOcr(page.id)}
              >
                <RefreshCw size={12} /> Try again
              </button>
            </div>

          ) : page?.isPdf ? (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400 py-16">
              <FileText size={36} className="text-slate-300" />
              <p className="text-xs font-semibold">{page.name}</p>
              <p className="text-[10px] text-slate-300 text-center max-w-xs">
                PDF preview not available in browser. Extracted text is shown in the panel on the right.
              </p>
            </div>

          ) : page?.imageUrl ? (
            <div
              className="relative flex-shrink-0 shadow-xl rounded overflow-hidden"
              style={{ width: outerW, height: outerH || undefined }}
            >
              <div
                ref={imgContainerRef}
                style={{
                  position:        'absolute',
                  width:            baseW,
                  height:           baseH,
                  left:             Math.round((outerW - baseW) / 2),
                  top:              Math.round((outerH - baseH) / 2),
                  transform:        rot ? `rotate(${rot}deg)` : undefined,
                  transformOrigin: 'center center',
                  userSelect:       activeDrag ? 'none' : undefined,
                }}
              >
                <img
                  src={page.imageUrl}
                  className="block w-full select-none"
                  alt={page.name}
                  draggable={false}
                  onLoad={e => {
                    const img = e.currentTarget;
                    setPages(prev => prev.map((p, pi) =>
                      pi !== activePage ? p : { ...p, naturalW: img.naturalWidth, naturalH: img.naturalHeight }
                    ));
                  }}
                />

                {/* Region overlays */}
                {page.regions.map(region => {
                  const c          = PALETTE[region.colorIdx % PALETTE.length];
                  const isHov      = hoveredRegion  === region.id;
                  const isSel      = selectedRegion === region.id;
                  const isActive   = isHov || isSel;
                  const isDragging = activeDrag?.regionId === region.id;

                  return (
                    <div
                      key={region.id}
                      style={{
                        position:   'absolute',
                        left:       `${region.bounds.x}%`,
                        top:        `${region.bounds.y}%`,
                        width:      `${region.bounds.w}%`,
                        height:     `${region.bounds.h}%`,
                        border:     `${isActive ? 2 : 1.5}px ${isSel ? 'solid' : 'dashed'} ${c.border}`,
                        background: isActive ? c.fill.replace('0.15', '0.28') : c.fill,
                        borderRadius: 4,
                        cursor:     isDragging && activeDrag?.mode === 'move' ? 'grabbing' : 'grab',
                        transition: isDragging ? 'none' : 'background 0.1s, border 0.1s',
                        boxSizing:  'border-box',
                      }}
                      onClick={() => setSelectedRegion(prev => prev === region.id ? null : region.id)}
                      onMouseEnter={() => !activeDrag && setHoveredRegion(region.id)}
                      onMouseLeave={() => !activeDrag && setHoveredRegion(null)}
                      onMouseDown={e => {
                        if ((e.target as HTMLElement).dataset.resizeHandle) return;
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedRegion(region.id);
                        setActiveDrag({
                          regionId:    region.id,
                          mode:        'move',
                          handle:      null,
                          startX:      e.clientX,
                          startY:      e.clientY,
                          startBounds: { ...region.bounds },
                        });
                      }}
                    >
                      {/* Region label */}
                      <div
                        className="absolute -top-[15px] left-0 px-1.5 text-[8px] font-extrabold text-white rounded-t-sm truncate max-w-[90%] leading-[14px]"
                        style={{ background: c.border, pointerEvents: 'none' }}
                      >
                        {region.label}
                      </div>

                      {/* Confidence badge */}
                      {isActive && (
                        <div
                          className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold text-white"
                          style={{ background: c.border, pointerEvents: 'none' }}
                        >
                          {Math.round(
                            (region.lines.reduce((a, l) => a + l.confidence, 0) /
                            (region.lines.length || 1)) * 100
                          )}%
                        </div>
                      )}

                      {/* Corner resize handles */}
                      {isSel && (
                        <>
                          {(['nw', 'ne', 'sw', 'se'] as ResizeHandle[]).map(handle => (
                            <div
                              key={handle}
                              data-resize-handle={handle}
                              style={{
                                position:   'absolute',
                                width: 10, height: 10,
                                background: 'white',
                                border:     `2px solid ${c.border}`,
                                borderRadius: 2,
                                zIndex: 10,
                                ...(handle === 'nw' ? { top: -5,    left: -5,   cursor: 'nw-resize' } :
                                    handle === 'ne' ? { top: -5,    right: -5,  cursor: 'ne-resize' } :
                                    handle === 'sw' ? { bottom: -5, left: -5,   cursor: 'sw-resize' } :
                                                     { bottom: -5, right: -5,  cursor: 'se-resize' }),
                              }}
                              onMouseDown={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveDrag({
                                  regionId:    region.id,
                                  mode:        'resize',
                                  handle,
                                  startX:      e.clientX,
                                  startY:      e.clientY,
                                  startBounds: { ...region.bounds },
                                });
                              }}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-300 py-16">
              <ImageIcon size={32} />
              <span className="text-xs">No preview available</span>
            </div>
          )}
        </div>
      </div>

      {/* ── EXTRACTION PANEL ───────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 border-l border-slate-200 flex flex-col overflow-hidden bg-white"
        style={{ width: 500 }}
      >
        <div className="px-3.5 py-2.5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-800">Extracted Text</span>
            <div className="flex gap-1.5">
              <span className="text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                {page?.regions.reduce((a, r) => a + r.lines.filter(l => l.error).length, 0) ?? 0} flags
              </span>
              <span className="text-[8px] font-bold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                {page?.regions.filter(r => r.corrected).length ?? 0} ok
              </span>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 mt-1 leading-snug">
            Hover or click a region to cross-highlight · edit to correct OCR
          </p>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          {page?.status === 'processing' ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
              <Loader2 size={20} className="animate-spin text-blue-400" />
              <span className="text-[11px]">Extracting text…</span>
            </div>

          ) : page?.status === 'error' ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
              <AlertTriangle size={20} className="text-red-300" />
              <span className="text-[11px] text-red-400">OCR failed</span>
            </div>

          ) : !page?.regions.length ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-300">
              <FileText size={22} />
              <span className="text-[11px]">No text detected</span>
            </div>

          ) : (
            <PageTextEditor
              text={
                page.regions
                  .map(r => r.correctedText ?? r.lines.map(l => l.correctedText ?? l.text).join('\n'))
                  .join('\n\n')
              }
              corrected={page.regions.some(r => r.corrected)}
              onSave={text => {
                const regionId = page.regions[0]?.id;
                if (regionId) saveCorrection(regionId, text);
              }}
            />
          )}
        </div>

        <div className="px-3 py-2.5 border-t border-slate-100 flex-shrink-0 flex flex-col gap-1.5">
          <button
            className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-extrabold text-white rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
            onClick={() => setShowCompile(true)}
          >
            <ChevronRight size={12} />
            Review &amp; {cfg.submit}
          </button>
          {onCancel && (
            <button
              className="w-full text-[10px] font-semibold text-slate-400 hover:text-slate-600 py-1 transition-colors"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {showCompile && (
        <CompileModal
          pages={pages}
          mode={mode}
          submitting={submitting}
          onClose={() => setShowCompile(false)}
          onSubmit={handleSubmit}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
};

export default OcrReviewComponent;
export type { OcrReviewProps, CompiledSubmission };
