import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Loader2, Smartphone } from 'lucide-react';
import type { StudentPageEntry } from './useOcrSession';

export interface PhonePairingPanelProps {
  pairToken:         string | null;
  pairCode:          string | null;
  phoneLive:         boolean;
  studentsWithPages: StudentPageEntry[];
  selectedStudentId: string | null;
  onConfirm:         (pageUrls: string[]) => void;
  confirming?:       boolean;
}

const PhonePairingPanel: React.FC<PhonePairingPanelProps> = ({
  pairToken, pairCode, phoneLive, studentsWithPages, selectedStudentId, onConfirm, confirming,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrReady, setQrReady] = useState(false);

  useEffect(() => {
    if (!pairToken || !canvasRef.current) return;
    setQrReady(false);
    const origin = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    const url = `${origin}/m/ocr/pair/${pairToken}`;
    QRCode.toCanvas(canvasRef.current, url, { width: 136, margin: 1 }, (err) => {
      if (!err) setQrReady(true);
    });
  }, [pairToken]);

  const selectedStudent = studentsWithPages.find(s => s.studentId === selectedStudentId);
  const hasAnonymous    = studentsWithPages.some(s => s.studentId === '__anonymous__');
  const canConfirm      = !confirming && !!selectedStudent?.pageUrls.length && !hasAnonymous;

  const formattedCode = pairCode
    ? `${pairCode.slice(0, 3)} · ${pairCode.slice(3)}`
    : '———';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <style>{`@keyframes ocrSpin { to { transform: rotate(360deg); } }`}</style>

      {/* Pairing card */}
      <div style={{ background: '#fff', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Smartphone size={13} color="#3b82f6" />
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', color: '#3b82f6' }}>Phone scanner</span>
          {phoneLive ? (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: '#dcfce7', borderRadius: 8, padding: '3px 8px' }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: '#16a34a' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#15803d' }}>PHONE LIVE</span>
            </div>
          ) : (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: '#f1f5f9', borderRadius: 8, padding: '3px 8px' }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: '#94a3b8' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>Waiting</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {/* QR code */}
          <div style={{
            flexShrink: 0, width: 136, height: 136,
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {!qrReady && (
              <Loader2 size={20} style={{ color: '#94a3b8', animation: 'ocrSpin 0.8s linear infinite' }} />
            )}
            <canvas ref={canvasRef} style={{ display: qrReady ? 'block' : 'none' }} />
          </div>

          {/* Pair code + instructions */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '7px 10px', marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' }}>Pair code</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '.12em', marginTop: 2 }}>
                {pairCode ? formattedCode : '——'}
              </div>
            </div>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
              {phoneLive
                ? 'Phone connected — capturing pages below'
                : 'Scan the QR code or enter the code on the Kundai phone app'}
            </p>
          </div>
        </div>
      </div>

      {/* Student list from phone */}
      {studentsWithPages.length > 0 && (
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>
            From phone · {studentsWithPages.length} student{studentsWithPages.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {studentsWithPages.map(student => {
              const isSelected = student.studentId === selectedStudentId;
              const initials   = student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div
                  key={student.studentId}
                  style={{
                    background: '#fff',
                    border: isSelected ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                    borderRadius: 10, padding: '8px 10px',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#0f172a',
                    color: '#fff', display: 'grid', placeItems: 'center',
                    fontWeight: 900, fontSize: 10, flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {student.name}
                    </div>
                    <div style={{ fontSize: 9, color: student.syncing ? '#3b82f6' : '#94a3b8', fontWeight: student.syncing ? 700 : 400 }}>
                      {student.syncing
                        ? '● uploading…'
                        : `${student.pageUrls.length} page${student.pageUrls.length !== 1 ? 's' : ''} · synced`}
                    </div>
                  </div>
                  {/* Page thumbnails (up to 3) */}
                  <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                    {student.pageUrls.slice(0, 3).map((_, i) => (
                      <div key={i} style={{
                        width: 20, height: 26, borderRadius: 3,
                        background: 'linear-gradient(160deg, #fefcf5, #f9f4e8)',
                        border: '1px solid #e2e8f0',
                        opacity: student.syncing && i === student.pageUrls.length - 1 ? 0.45 : 1,
                      }} />
                    ))}
                    {student.pageUrls.length > 3 && (
                      <div style={{
                        width: 20, height: 26, borderRadius: 3,
                        background: '#f1f5f9', border: '1px solid #e2e8f0',
                        display: 'grid', placeItems: 'center',
                        fontSize: 8, color: '#94a3b8', fontWeight: 700,
                      }}>
                        +{student.pageUrls.length - 3}
                      </div>
                    )}
                  </div>
                  {/* Sync indicator */}
                  <div style={{
                    width: 18, height: 18, borderRadius: 9, flexShrink: 0,
                    background: student.syncing ? '#facc15' : '#16a34a',
                    display: 'grid', placeItems: 'center',
                  }}>
                    {student.syncing ? (
                      <div style={{
                        width: 7, height: 7, border: '1.5px solid #fff',
                        borderTopColor: 'transparent', borderRadius: '50%',
                        animation: 'ocrSpin 1s linear infinite',
                      }} />
                    ) : (
                      <svg viewBox="0 0 10 10" width={10} height={10}>
                        <polyline points="2,5 4,7 8,3" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm button — shown as soon as there is at least one student */}
      {studentsWithPages.length > 0 && (
        <div style={{ flexShrink: 0 }}>
          {hasAnonymous && (
            <p style={{ fontSize: 10, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '4px 8px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>⚠</span> Some pages have no student — tag them on the phone first
            </p>
          )}
          {selectedStudentId && !selectedStudent?.pageUrls.length && (
            <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 6px', textAlign: 'center' }}>
              No pages yet for the selected student
            </p>
          )}
          <button
            disabled={!canConfirm}
            onClick={() => selectedStudent && onConfirm(selectedStudent.pageUrls)}
            style={{
              width: '100%', padding: '8px 0', borderRadius: 8, border: 0,
              fontSize: 11, fontWeight: 700, cursor: canConfirm ? 'pointer' : 'not-allowed',
              background: canConfirm ? '#3b82f6' : '#e2e8f0',
              color: canConfirm ? '#fff' : '#94a3b8',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 0.15s',
            }}
          >
            {confirming ? (
              <>
                <Loader2 size={12} style={{ animation: 'ocrSpin 0.8s linear infinite' }} />
                Fetching images…
              </>
            ) : (
              'Confirm & start OCR'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PhonePairingPanel;
