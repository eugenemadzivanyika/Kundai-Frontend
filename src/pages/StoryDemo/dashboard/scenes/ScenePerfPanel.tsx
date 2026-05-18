import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Backdrop } from '../Backdrop';

const PERF_ROWS = [
  { name: 'Tapiwa Moyo',    score: 38, f: true  },
  { name: 'Rudo Chikwanda', score: 44, f: false },
  { name: 'Prosper Ncube',  score: 51, f: false },
  { name: 'Blessing Dube',  score: 58, f: false },
  { name: 'Tatenda Banda',  score: 62, f: false },
  { name: 'Nyasha Mutasa',  score: 67, f: false },
  { name: 'Farai Sibanda',  score: 76, f: false },
  { name: 'Tafadzwa Nkosi', score: 83, f: false },
  { name: 'Chipo Ndlovu',   score: 92, f: false },
];

export const ScenePerfPanel: React.FC = () => (
  <>
    <Backdrop />
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div
        className="sd-modal-lift-perf"
        style={{
          background: '#f0f4f8',
          borderRadius: 12,
          padding: '12px 16px',
          boxShadow: '0 18px 50px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.4)',
          display: 'flex',
          flexDirection: 'column',
          width: '62%',
          maxHeight: '82%',
          overflow: 'hidden',
        }}
      >
        <div style={{ marginBottom: 8, flexShrink: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#111', letterSpacing: '0.02em', textAlign: 'center' }}>Performance</p>
          <p style={{ fontSize: 8, fontWeight: 600, color: '#6b7280', marginTop: 2, textAlign: 'left' }}>Latest Assessment: Algebra Test</p>
        </div>

        {/* Scrollable list — ~4 full rows + 5th peeking */}
        <div style={{ position: 'relative', minHeight: 0 }}>
          <div style={{ overflowY: 'auto', maxHeight: 132, paddingRight: 2 }}>
            {PERF_ROWS.map((st, idx) => (
              <div
                key={st.name}
                className={idx === 0 ? undefined : 'sd-fade-up'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 4,
                  paddingBottom: 4,
                  borderBottom: '1px solid #e3e8ee',
                  animationDelay: idx === 0 ? undefined : `${idx * 60}ms`,
                  animation: idx === 0
                    ? `sd-fadeUp .3s 0ms ease both, sd-row-click-flash 0.4s 1506ms ease both`
                    : undefined,
                }}
              >
                <p style={{ fontSize: 10, fontWeight: st.f ? 900 : 500, color: st.f ? '#dc2626' : '#374151' }}>
                  {st.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {st.f && <AlertTriangle size={9} color="#f97316" />}
                  <span style={{ fontSize: 10, fontWeight: 700, color: st.f ? '#dc2626' : '#374151' }}>
                    {st.score}%
                  </span>
                </div>
              </div>
            ))}
            <p className="sd-fade-up" style={{ fontSize: 9, color: '#9ca3af', fontStyle: 'italic', marginTop: 5, paddingBottom: 4, animationDelay: '600ms' }}>
              Class avg <strong style={{ color: '#374151' }}>63%</strong> · Tapiwa 25pts below
            </p>
          </div>
          {/* Fade hint — 5th row peeks through */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 22, background: 'linear-gradient(to bottom, transparent, #f0f4f8)', pointerEvents: 'none' }} />
        </div>
      </div>
    </div>
  </>
);
