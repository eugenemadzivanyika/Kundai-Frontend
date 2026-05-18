import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Backdrop } from '../Backdrop';

const TAPIWA_ATTRS = [
  { l: 'Subst.',     v: 56 },
  { l: 'Factors',    v: 42 },
  { l: 'Quadratics', v: 32 },
  { l: 'Ineqs.',     v: 39 },
  { l: 'Linear Eqs', v: 48 },
  { l: 'Exprs.',     v: 44 },
  { l: 'Word Prbs',  v: 38 },
];

interface SceneTwinPanelProps {
  approved?: boolean;
  folding?: boolean;
}

export const SceneTwinPanel: React.FC<SceneTwinPanelProps> = ({ approved, folding }) => (
  <>
    <Backdrop />

    {/* Centered twin modal */}
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div
        className="sd-modal-lift-twin"
        style={{
          background: '#f0f4f8',
          borderRadius: 12,
          padding: '12px 16px',
          boxShadow: '0 18px 50px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.4)',
          display: 'flex',
          flexDirection: 'column',
          width: '62%',
          maxHeight: '88%',
          overflow: 'hidden',
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#111', textAlign: 'center', marginBottom: 8, letterSpacing: '0.04em' }}>
          Student Development
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#111', display: 'grid', placeItems: 'center', color: 'white', fontSize: 10, fontWeight: 900, flexShrink: 0 }}>TM</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#111', lineHeight: 1.1 }}>
              Moyo <span style={{ fontWeight: 400, color: '#6b7280' }}>Tapiwa</span>
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, color: '#dc2626' }}>43</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#9ca3af' }}>OVR</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 8, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Form 3</p>
            <p style={{ fontSize: 8, color: '#ef4444', fontWeight: 900, textTransform: 'uppercase', marginTop: 2 }}>Below threshold</p>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, fontWeight: 700, color: '#9ca3af', marginBottom: 3 }}>
            <span>Algebra: 38%</span><span>Target: 71%</span>
          </div>
          <div style={{ background: '#e5e7eb', borderRadius: 99, height: 5, overflow: 'hidden' }}>
            <div className="sd-grow-bar" style={{ width: '38%', background: '#ef4444', height: 5, borderRadius: 99 }} />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: 'auto auto',
          alignContent: 'center',
          gap: '3px 0',
          padding: '7px 0',
          borderTop: '1px solid #e3e8ee',
          borderBottom: '1px solid #e3e8ee',
        }}>
          {TAPIWA_ATTRS.map((a, i) => (
            <p key={`n-${a.l}`} className="sd-fade-up" style={{
              fontSize: 6, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase',
              textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word', margin: 0,
              animationDelay: `${i * 60}ms`,
            }}>{a.l}</p>
          ))}
          {TAPIWA_ATTRS.map((a, i) => (
            <p key={`v-${a.l}`} className="sd-fade-up" style={{
              fontSize: 10, fontWeight: 900, color: '#ef4444',
              textAlign: 'center', margin: 0,
              opacity: a.l === 'Quadratics' ? 0.65 : 1,
              animationDelay: `${i * 60 + 80}ms`,
              textShadow: '0 0 10px rgba(239,68,68,0.35)',
            }}>{a.v}%</p>
          ))}
        </div>
      </div>
    </div>

    {/* Plan toast — top-right; hidden when the lid is folding (stage-level toast takes over) */}
    {!folding && (!approved ? (
      <div
        className="sd-plan-toast-slide"
        style={{
          position: 'absolute', top: 10, right: 10, width: 200, zIndex: 22,
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.3)',
        }}
      >
        <div style={{ background: '#2563eb', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <AlertTriangle size={10} color="rgba(255,255,255,0.85)" />
          <p style={{ color: 'white', fontWeight: 900, fontSize: 10 }}>KundAI Plan Ready</p>
        </div>
        <div style={{ background: '#f0f4f8', padding: '7px 12px' }}>
          <p style={{ fontSize: 9, color: '#374151', marginBottom: 5 }}>14 steps · Algebra focus · Quadratics 32%</p>
          <button
            className="sd-btn-activate-press"
            style={{ width: '100%', fontSize: 9, fontWeight: 700, padding: '5px 0', borderRadius: 5, background: '#2563eb', color: 'white', border: 'none', cursor: 'default' }}
          >
            Activate Plan
          </button>
        </div>
      </div>
    ) : (
      <div
        className="sd-toast-activated"
        style={{
          position: 'absolute', top: 10, right: 10, width: 200, zIndex: 22,
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.3)',
        }}
      >
        <div style={{ background: '#059669', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <CheckCircle size={10} color="white" />
          <p style={{ color: 'white', fontWeight: 900, fontSize: 10 }}>Plan Activated</p>
        </div>
        <div style={{ background: '#f0fdf4', padding: '7px 12px' }}>
          <p style={{ fontSize: 9, color: '#059669', fontWeight: 700 }}>14-step Algebra plan · first checkpoint in 3 days</p>
        </div>
      </div>
    ))}
  </>
);
