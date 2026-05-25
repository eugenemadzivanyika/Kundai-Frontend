import { useRef, useEffect, useState } from 'react';
import { RosterEntry } from '../mobile-ocr.api';
import { useCamera } from '../hooks/useCamera';
import { useEdgeDetection, type Point } from '../hooks/useEdgeDetection';

interface Props {
  student: RosterEntry | null;
  pageIndex: number;
  onCapture: (blob: Blob, corners: Point[] | null) => void;
  onSaveDone: () => void;
  onBack: () => void;
}

const BLUE  = '#2563eb';
const GREEN = '#22c55e';

export function CameraScreen({ student, pageIndex, onCapture, onSaveDone, onBack }: Props) {
  const { videoRef, ready, error, capture } = useCamera();
  const { corners, cvLoaded } = useEdgeDetection(videoRef);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

  // Draw the green quad polygon on the overlay canvas each frame
  useEffect(() => {
    const canvas = overlayRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    let raf: number;
    function draw() {
      raf = requestAnimationFrame(draw);
      const ctx = canvas!.getContext('2d');
      if (!ctx) return;

      // Keep canvas dimensions in sync with rendered video size
      const rect = canvas!.getBoundingClientRect();
      if (canvas!.width !== rect.width || canvas!.height !== rect.height) {
        canvas!.width  = rect.width;
        canvas!.height = rect.height;
      }

      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      if (!corners || corners.length !== 4) return;

      // Map video pixel coords → canvas display coords
      const vw = video!.videoWidth  || 1;
      const vh = video!.videoHeight || 1;
      const sx = canvas!.width  / vw;
      const sy = canvas!.height / vh;

      ctx.beginPath();
      ctx.moveTo(corners[0].x * sx, corners[0].y * sy);
      for (let i = 1; i < 4; i++) ctx.lineTo(corners[i].x * sx, corners[i].y * sy);
      ctx.closePath();
      ctx.strokeStyle = GREEN;
      ctx.lineWidth   = 3;
      ctx.shadowColor = GREEN;
      ctx.shadowBlur  = 8;
      ctx.stroke();

      // Corner dots
      corners.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * sx, p.y * sy, 7, 0, Math.PI * 2);
        ctx.fillStyle = GREEN;
        ctx.shadowBlur = 12;
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [corners, videoRef]);

  async function handleShutter() {
    setCaptureError(null);
    try {
      const blob = await capture();
      onCapture(blob, corners);
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : 'Capture failed');
    }
  }

  const initials = student ? student.name.split(' ').map(n => n[0]).join('') : '?';

  return (
    <div style={{ height: '100%', background: '#000', position: 'relative', fontFamily: "'Inter Tight', system-ui, sans-serif", color: '#fff' }}>
      <video
        ref={videoRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        autoPlay
        muted
        playsInline
      />

      {/* Edge-polygon overlay */}
      <canvas
        ref={overlayRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 4 }}
      />

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 56, left: 0, right: 0, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(20px)', border: 0, color: '#fff', width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center', flexShrink: 0 }}>←</button>
        <div style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(20px)', padding: '6px 12px 6px 6px', borderRadius: 22, display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: 13, background: BLUE, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 9, flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0, lineHeight: 1.15 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student?.name ?? 'Anonymous'}</p>
            <p style={{ fontSize: 9, color: GREEN, margin: '1px 0 0', fontWeight: 700, letterSpacing: '.04em' }}>● PAGE {pageIndex + 1} OF SUBMISSION</p>
          </div>
        </div>
        {/* Edge-detection status chip */}
        {cvLoaded && (
          <div style={{ background: corners ? 'rgba(34,197,94,.25)' : 'rgba(0,0,0,.5)', backdropFilter: 'blur(20px)', borderRadius: 12, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: corners ? GREEN : '#94a3b8' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: corners ? GREEN : '#94a3b8' }}>
              {corners ? 'PAGE DETECTED' : 'SCANNING…'}
            </span>
          </div>
        )}
      </div>

      {!ready && !error && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 5 }}>
          <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 14 }}>Opening camera…</p>
        </div>
      )}
      {(error || captureError) && (
        <div style={{ position: 'absolute', bottom: 160, left: 16, right: 16, background: 'rgba(239,68,68,.9)', borderRadius: 12, padding: '10px 14px', zIndex: 20 }}>
          <p style={{ color: '#fff', fontSize: 13, margin: 0, textAlign: 'center' }}>{error || captureError}</p>
        </div>
      )}

      {/* Bottom controls */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 0 46px', background: 'linear-gradient(180deg, transparent, rgba(0,0,0,.88))', zIndex: 10 }}>
        <div style={{ padding: '0 16px 14px' }}>
          <button
            onClick={onSaveDone}
            style={{ width: '100%', background: 'rgba(34,197,94,.95)', border: 0, color: '#fff', padding: 11, borderRadius: 14, fontWeight: 700, fontSize: 14, boxShadow: '0 4px 14px rgba(22,163,74,.4)' }}
          >
            ✓ Done — save {student ? `${student.name.split(' ')[0]}'s` : 'anonymous'} submission
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={handleShutter}
            disabled={!ready}
            style={{ width: 76, height: 76, borderRadius: 38, background: '#fff', border: `4px solid ${corners ? GREEN : 'rgba(255,255,255,.4)'}`, boxShadow: `0 0 0 2px ${corners ? GREEN : '#fff'}`, display: 'grid', placeItems: 'center', opacity: ready ? 1 : 0.4, transition: 'border-color 0.2s, box-shadow 0.2s' }}
          >
            <div style={{ width: 60, height: 60, borderRadius: 30, background: '#fff' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
