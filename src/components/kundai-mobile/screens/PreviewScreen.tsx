import { useState, useEffect, useRef, useCallback } from 'react';
import { applyPerspectiveCrop, type Point } from '../hooks/useEdgeDetection';

interface Props {
  blob:        Blob;
  corners:     Point[] | null;  // detected corners in original image pixel space
  pageNumber:  number;
  uploading:   boolean;
  onRetake:    () => void;
  onKeep:      (cropped: Blob) => void;
}

const BLUE    = '#2563eb';
const GREEN   = '#22c55e';
const HANDLE  = 14; // handle size in px

function defaultCorners(w: number, h: number): Point[] {
  const pad = 0.05;
  return [
    { x: w * pad,       y: h * pad },
    { x: w * (1 - pad), y: h * pad },
    { x: w * (1 - pad), y: h * (1 - pad) },
    { x: w * pad,       y: h * (1 - pad) },
  ];
}

export function PreviewScreen({ blob, corners: initialCorners, pageNumber, uploading, onRetake, onKeep }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  // Handles are in image pixel space
  const [handles, setHandles] = useState<Point[] | null>(null);
  const [cropping, setCropping] = useState(false);

  const imgRef     = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging   = useRef<{ idx: number; startX: number; startY: number; origPt: Point } | null>(null);

  // Create object URL
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    // Measure natural image dimensions
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = u;
    return () => URL.revokeObjectURL(u);
  }, [blob]);

  // Set initial handles once we know the image size
  useEffect(() => {
    if (!imgSize) return;
    setHandles(initialCorners ?? defaultCorners(imgSize.w, imgSize.h));
  }, [imgSize, initialCorners]);

  // Map image pixel coords → container display coords
  function toPx(p: Point): { left: number; top: number } | null {
    const el = imgRef.current;
    if (!el || !imgSize) return null;
    const rect = el.getBoundingClientRect();
    const scaleX = rect.width  / imgSize.w;
    const scaleY = rect.height / imgSize.h;
    return {
      left: p.x * scaleX - HANDLE / 2,
      top:  p.y * scaleY - HANDLE / 2,
    };
  }

  // Map pointer event delta → image pixel delta
  function toImgDelta(dx: number, dy: number): { dx: number; dy: number } | null {
    const el = imgRef.current;
    if (!el || !imgSize) return null;
    const rect = el.getBoundingClientRect();
    return {
      dx: dx / rect.width  * imgSize.w,
      dy: dy / rect.height * imgSize.h,
    };
  }

  const onPointerDown = useCallback((idx: number, e: React.PointerEvent) => {
    e.preventDefault();
    if (!handles) return;
    dragging.current = { idx, startX: e.clientX, startY: e.clientY, origPt: handles[idx] };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [handles]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !handles) return;
    const { idx, startX, startY, origPt } = dragging.current;
    const delta = toImgDelta(e.clientX - startX, e.clientY - startY);
    if (!delta || !imgSize) return;
    const newPt: Point = {
      x: Math.max(0, Math.min(imgSize.w, origPt.x + delta.dx)),
      y: Math.max(0, Math.min(imgSize.h, origPt.y + delta.dy)),
    };
    setHandles(prev => {
      if (!prev) return prev;
      const next = [...prev];
      next[idx] = newPt;
      return next;
    });
  }, [handles, imgSize]);

  const onPointerUp = useCallback(() => { dragging.current = null; }, []);

  async function handleKeep() {
    setCropping(true);
    try {
      if (handles && imgSize) {
        const cropped = await applyPerspectiveCrop(blob, handles);
        onKeep(cropped);
      } else {
        onKeep(blob);
      }
    } catch {
      onKeep(blob); // fall back to uncropped if transform fails
    } finally {
      setCropping(false);
    }
  }

  const busy = uploading || cropping;

  return (
    <div
      style={{ height: '100%', background: '#0f172a', display: 'flex', flexDirection: 'column', fontFamily: "'Inter Tight', system-ui, sans-serif", color: '#fff', userSelect: 'none' }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Header */}
      <div style={{ padding: '60px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={onRetake} disabled={busy} style={{ background: 'transparent', border: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, opacity: busy ? 0.5 : 1 }}>
          ← Retake
        </button>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Page {pageNumber}</p>
        <button onClick={handleKeep} disabled={busy} style={{ background: 'transparent', border: 0, color: BLUE, fontSize: 14, fontWeight: 700, opacity: busy ? 0.5 : 1 }}>
          {cropping ? 'Cropping…' : uploading ? 'Uploading…' : 'Keep →'}
        </button>
      </div>

      {/* Image + draggable handles */}
      <div
        ref={containerRef}
        style={{ flex: 1, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
      >
        {url && (
          <div style={{ position: 'relative', width: '100%', maxWidth: 280, aspectRatio: '3/4' }}>
            <img
              ref={imgRef}
              src={url}
              alt={`Page ${pageNumber}`}
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4, boxShadow: '0 18px 40px rgba(0,0,0,.6)', display: 'block' }}
              draggable={false}
            />

            {/* Polygon overlay */}
            {handles && imgRef.current && handles.map((p, i) => {
              const pos = toPx(p);
              if (!pos) return null;
              return (
                <div
                  key={i}
                  onPointerDown={e => onPointerDown(i, e)}
                  style={{
                    position: 'absolute',
                    left:   pos.left,
                    top:    pos.top,
                    width:  HANDLE,
                    height: HANDLE,
                    background: GREEN,
                    borderRadius: 3,
                    boxShadow: `0 0 0 2px #fff, 0 0 10px ${GREEN}88`,
                    cursor: 'grab',
                    touchAction: 'none',
                    zIndex: 10,
                  }}
                />
              );
            })}

            {/* Draw lines between handles using SVG */}
            {handles && imgRef.current && (() => {
              const el  = imgRef.current!;
              const containerRect = containerRef.current?.getBoundingClientRect();
              if (!containerRect) return null;
              // SVG in image-local space
              const pts = handles.map(p => toPx(p)).filter(Boolean) as { left: number; top: number }[];
              if (pts.length < 4) return null;
              const polyPoints = pts.map(p => `${p.left + HANDLE / 2},${p.top + HANDLE / 2}`).join(' ');
              return (
                <svg
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}
                  viewBox={`0 0 ${el.offsetWidth} ${el.offsetHeight}`}
                >
                  <polygon points={polyPoints} fill="rgba(34,197,94,.12)" stroke={GREEN} strokeWidth="1.5" strokeDasharray="6 4" />
                </svg>
              );
            })()}
          </div>
        )}
      </div>

      {/* Hint */}
      {handles && (
        <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,.35)', margin: '0 0 8px', flexShrink: 0 }}>
          Drag corners to adjust crop
        </p>
      )}

      {/* Buttons */}
      <div style={{ padding: '16px 20px 44px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onRetake}
            disabled={busy}
            style={{ flex: 1, background: 'rgba(255,255,255,.1)', border: 0, color: '#fff', padding: 14, borderRadius: 14, fontWeight: 600, fontSize: 15, opacity: busy ? 0.5 : 1 }}
          >
            ↺ Retake
          </button>
          <button
            onClick={handleKeep}
            disabled={busy}
            style={{ flex: 1.5, background: BLUE, border: 0, color: '#fff', padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 15, boxShadow: `0 4px 14px ${BLUE}40`, opacity: busy ? 0.6 : 1 }}
          >
            {cropping ? 'Cropping…' : uploading ? 'Uploading…' : '✓ Keep page'}
          </button>
        </div>
      </div>
    </div>
  );
}
