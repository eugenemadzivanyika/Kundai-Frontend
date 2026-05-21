import { useState, useEffect, useRef } from 'react';
import { pairPhone, PairResult } from '../mobile-ocr.api';

interface Props {
  initialToken?: string;
  onPaired: (result: PairResult) => void;
}

export function PairScreen({ initialToken, onPaired }: Props) {
  const [mode, setMode] = useState<'qr' | 'code'>('qr');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanningRef = useRef(false);

  // Auto-pair from deep-link token
  useEffect(() => {
    if (!initialToken) return;
    setLoading(true);
    pairPhone({ pairToken: initialToken })
      .then(onPaired)
      .catch(err => { setError(err.message); setLoading(false); });
  }, [initialToken, onPaired]);

  // Native BarcodeDetector QR scan
  useEffect(() => {
    if (mode !== 'qr') return;
    if (!('BarcodeDetector' in window)) return;

    let stream: MediaStream | null = null;
    let rafId: number;

    const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
        const scan = async () => {
          if (scanningRef.current || !videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              scanningRef.current = true;
              const raw = barcodes[0].rawValue as string;
              // Accept either a pairToken (64 hex chars) or a 6-char code
              if (raw.length === 64) {
                setLoading(true);
                pairPhone({ pairToken: raw }).then(onPaired).catch(e => {
                  setError(e.message); setLoading(false); scanningRef.current = false;
                });
              } else {
                setLoading(true);
                pairPhone({ pairCode: raw.toUpperCase() }).then(onPaired).catch(e => {
                  setError(e.message); setLoading(false); scanningRef.current = false;
                });
              }
              return;
            }
          } catch { /* ignore frame decode errors */ }
          rafId = requestAnimationFrame(scan);
        };
        rafId = requestAnimationFrame(scan);
      })
      .catch(() => setMode('code'));

    return () => {
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [mode, onPaired]);

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const result = await pairPhone({ pairCode: code.toUpperCase() });
      onPaired(result);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ height: '100%', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'Inter Tight', system-ui, sans-serif", position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1d29 0%, #0f172a 50%, #1e293b 100%)' }} />

      <div style={{ position: 'relative', padding: '60px 20px 0', textAlign: 'center', zIndex: 2 }}>
        <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', margin: 0 }}>Step 1 of 3</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 0' }}>Scan QR on web</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', margin: '6px 0 0', lineHeight: 1.4 }}>Open the OCR page on your computer<br />and scan the code shown there.</p>
      </div>

      {mode === 'qr' ? (
        <>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
            <div style={{ width: 220, height: 220, position: 'relative' }}>
              <video ref={videoRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, opacity: 0.85 }} muted playsInline />
              {/* Corner brackets */}
              {(['nw','ne','sw','se'] as const).map(c => {
                const s: React.CSSProperties = { position: 'absolute', width: 36, height: 36 };
                if (c === 'nw') Object.assign(s, { top: 0, left: 0, borderTop: '3px solid #fff', borderLeft: '3px solid #fff', borderTopLeftRadius: 12 });
                if (c === 'ne') Object.assign(s, { top: 0, right: 0, borderTop: '3px solid #fff', borderRight: '3px solid #fff', borderTopRightRadius: 12 });
                if (c === 'sw') Object.assign(s, { bottom: 0, left: 0, borderBottom: '3px solid #fff', borderLeft: '3px solid #fff', borderBottomLeftRadius: 12 });
                if (c === 'se') Object.assign(s, { bottom: 0, right: 0, borderBottom: '3px solid #fff', borderRight: '3px solid #fff', borderBottomRightRadius: 12 });
                return <div key={c} style={s} />;
              })}
              <div style={{ position: 'absolute', left: 8, right: 8, top: '50%', height: 2, background: '#25D366', boxShadow: '0 0 12px #25D366' }} />
            </div>
          </div>
          <div style={{ padding: '0 20px 40px', textAlign: 'center', zIndex: 2, position: 'relative' }}>
            {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            {loading && <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>Pairing…</p>}
            <button
              onClick={() => setMode('code')}
              style={{ background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 14, color: '#fff', fontSize: 14, fontWeight: 600, padding: '12px 20px', width: '100%' }}
            >
              Enter 6-digit code instead
            </button>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', margin: '12px 0 0' }}>Code shown above the QR on web</p>
          </div>
        </>
      ) : (
        <form onSubmit={handleCodeSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 20px', zIndex: 2, position: 'relative' }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginBottom: 8 }}>Enter the 6-character code</label>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="e.g. 47K92X"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 800, letterSpacing: '.2em', textAlign: 'center', padding: '16px', borderRadius: 14, border: '2px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.08)', color: '#fff', outline: 'none' }}
            autoFocus
            autoCapitalize="characters"
          />
          {error && <p style={{ color: '#f87171', fontSize: 13, marginTop: 12 }}>{error}</p>}
          <button
            type="submit"
            disabled={code.length !== 6 || loading}
            style={{ marginTop: 20, background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 16, padding: 14, border: 0, borderRadius: 14, opacity: code.length !== 6 || loading ? 0.5 : 1 }}
          >
            {loading ? 'Pairing…' : 'Pair'}
          </button>
          <button type="button" onClick={() => setMode('qr')} style={{ background: 'transparent', border: 0, color: 'rgba(255,255,255,.5)', fontSize: 13, padding: '12px', marginTop: 4 }}>
            Back to QR scan
          </button>
        </form>
      )}
    </div>
  );
}
