import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface PerformanceWeekPoint {
  week: string;
  date: string;
  schoolAvg: number;
  byForm: { F1: number; F2: number; F3: number; F4: number; F5: number; F6: number };
}

export interface PerformanceData {
  weekly: PerformanceWeekPoint[];
  current: number;
  previousTerm: number;
  target: number;
}

// Hardcoded warm-paper hex values (SVG stroke doesn't always resolve CSS vars)
const COLORS = {
  schoolAvg: '#1a1814',   // --ink-1
  F1: '#2a5a7a',          // --sky
  F2: '#1f4d36',          // --forest
  F3: '#b88827',          // --gold
  F4: '#6b2e5e',          // --plum
  F5: '#a83a1f',          // --terracotta
  F6: '#2a5a7a',          // --sky (+ dash to distinguish F1)
  target: '#b88827',      // --gold (dashed)
};

export function PerformanceOverviewChart({
  data,
  onPeriodChange,
}: {
  data: PerformanceData;
  onPeriodChange: (period: '4w' | 'term' | 'year') => void;
}): JSX.Element {
  const [view, setView] = useState<'aggregate' | 'by-form'>('aggregate');
  const [period, setPeriod] = useState<'4w' | 'term' | 'year'>('term');

  const handlePeriodChange = (p: '4w' | 'term' | 'year') => {
    setPeriod(p);
    onPeriodChange(p);
  };

  const W = 800, H = 220;
  const PAD = { l: 44, r: 20, t: 18, b: 28 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const n = data.weekly.length;
  const xs = (i: number) => n < 2 ? PAD.l + innerW / 2 : PAD.l + (i / (n - 1)) * innerW;
  const minY = 0.35, maxY = 0.85;
  const ys = (v: number) => PAD.t + (1 - (v - minY) / (maxY - minY)) * innerH;

  const change = data.current - data.previousTerm;
  const gap = data.target - data.current;

  const formLines: Array<{ key: string; label: string; color: string; width: number; dash?: string }> =
    view === 'aggregate'
      ? [{ key: 'schoolAvg', label: 'School average', color: COLORS.schoolAvg, width: 2.5 }]
      : [
          { key: 'F1', label: 'Form 1', color: COLORS.F1, width: 1.5 },
          { key: 'F2', label: 'Form 2', color: COLORS.F2, width: 1.5 },
          { key: 'F3', label: 'Form 3', color: COLORS.F3, width: 1.5 },
          { key: 'F4', label: 'Form 4', color: COLORS.F4, width: 1.5 },
          { key: 'F5', label: 'Form 5', color: COLORS.F5, width: 1.5 },
          { key: 'F6', label: 'Form 6', color: COLORS.F6, width: 1.5, dash: '4 3' },
        ];

  const getVal = (pt: PerformanceWeekPoint, key: string): number =>
    key === 'schoolAvg' ? pt.schoolAvg : (pt.byForm as any)[key] ?? 0;

  const linePath = (key: string) =>
    data.weekly.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xs(i)} ${ys(getVal(pt, key))}`).join(' ');

  const areaPath =
    n > 0
      ? `M ${xs(0)} ${ys(minY)} ${data.weekly.map((pt, i) => `L ${xs(i)} ${ys(pt.schoolAvg)}`).join(' ')} L ${xs(n - 1)} ${ys(minY)} Z`
      : '';

  const yGridLines = [0.40, 0.50, 0.60, 0.70, 0.80].filter(v => v >= minY && v <= maxY);

  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, padding: '18px 20px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 15, fontWeight: 700, color: 'var(--ink-1)' }}>
            Performance overview
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--ink-3)' }}>
            Average BKT mastery across all students
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--paper-shade)', borderRadius: 5, padding: 2 }}>
            {(['aggregate', 'by-form'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '4px 10px', border: 0, borderRadius: 4, cursor: 'pointer', fontSize: 11.5, fontWeight: 600,
                  fontFamily: 'inherit',
                  background: view === v ? 'var(--paper)' : 'transparent',
                  color: view === v ? 'var(--ink-1)' : 'var(--ink-3)',
                  boxShadow: view === v ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {v === 'aggregate' ? 'School avg' : 'By form'}
              </button>
            ))}
          </div>
          {/* Period selector */}
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as '4w' | 'term' | 'year')}
            style={{ fontSize: 11.5, border: '1px solid var(--rule)', background: 'var(--paper)', borderRadius: 4, padding: '4px 8px', color: 'var(--ink-2)', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}
          >
            <option value="4w">Last 4 weeks</option>
            <option value="term">This term</option>
            <option value="year">Academic year</option>
          </select>
        </div>
      </div>

      {/* Headline metrics */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Current mastery</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
            <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, fontWeight: 700, color: 'var(--ink-1)', fontFeatureSettings: "'tnum' 1" }}>
              {Math.round(data.current * 100)}<span style={{ fontSize: 16, color: 'var(--ink-3)' }}>%</span>
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: change >= 0 ? 'var(--forest)' : 'var(--terracotta)' }}>
              {change >= 0 ? '▲' : '▼'} {Math.abs(change * 100).toFixed(1)} pts
              <span style={{ fontWeight: 400, color: 'var(--ink-3)', marginLeft: 3 }}>vs last term</span>
            </span>
          </div>
        </div>
        <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 18 }}>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Target</div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, fontWeight: 700, color: 'var(--ink-3)', fontFeatureSettings: "'tnum' 1", marginTop: 2 }}>
            {Math.round(data.target * 100)}<span style={{ fontSize: 16 }}>%</span>
          </div>
        </div>
        <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 18 }}>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Gap to target</div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, fontWeight: 700, color: gap > 0 ? 'var(--gold)' : 'var(--forest)', fontFeatureSettings: "'tnum' 1", marginTop: 2 }}>
            {gap > 0 ? '+' : ''}{Math.round(gap * 100)}<span style={{ fontSize: 16 }}>pts</span>
          </div>
        </div>
      </div>

      {/* SVG chart */}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
        <defs>
          <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.schoolAvg} stopOpacity="0.08" />
            <stop offset="100%" stopColor={COLORS.schoolAvg} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines + y-axis labels */}
        {yGridLines.map((v) => (
          <g key={v}>
            <line x1={PAD.l} y1={ys(v)} x2={W - PAD.r} y2={ys(v)} stroke="#d9cfb8" strokeDasharray={v === yGridLines[0] ? '0' : '2 5'} strokeWidth="1" />
            <text x={PAD.l - 6} y={ys(v) + 3.5} fontSize="10" fill="#7a7062" textAnchor="end" fontVariantNumeric="tabular-nums">
              {Math.round(v * 100)}%
            </text>
          </g>
        ))}

        {/* Target line */}
        {data.target >= minY && data.target <= maxY && (
          <>
            <line x1={PAD.l} y1={ys(data.target)} x2={W - PAD.r} y2={ys(data.target)}
              stroke={COLORS.target} strokeDasharray="6 4" strokeWidth="1.5" />
            <text x={W - PAD.r - 2} y={ys(data.target) - 5} fontSize="9" fill={COLORS.target}
              textAnchor="end" fontWeight="700">
              TARGET {Math.round(data.target * 100)}%
            </text>
          </>
        )}

        {/* Area fill — aggregate only */}
        {view === 'aggregate' && n > 0 && (
          <path d={areaPath} fill="url(#perfGrad)" />
        )}

        {/* Lines + dots */}
        {n > 0 && formLines.map((line) => (
          <g key={line.key}>
            <path d={linePath(line.key)} fill="none" stroke={line.color} strokeWidth={line.width}
              strokeLinejoin="round" strokeLinecap="round"
              strokeDasharray={line.dash ?? undefined} />
            {data.weekly.map((pt, i) => (
              <circle key={i} cx={xs(i)} cy={ys(getVal(pt, line.key))} r={3}
                fill="var(--paper)" stroke={line.color} strokeWidth="1.5" />
            ))}
          </g>
        ))}

        {/* X-axis labels */}
        {data.weekly.map((pt, i) => (
          <text key={i} x={xs(i)} y={H - 8} fontSize="10" fill="#7a7062" textAnchor="middle"
            fontVariantNumeric="tabular-nums">
            {pt.week}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 16px', marginTop: 8, paddingTop: 10, borderTop: '1px solid var(--rule-soft)' }}>
        {formLines.map((line) => (
          <div key={line.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ink-2)' }}>
            <span style={{ display: 'inline-block', width: 16, height: line.width, background: line.color, borderRadius: 1 }} />
            <span style={{ fontWeight: 500 }}>{line.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ink-3)', marginLeft: 'auto' }}>
          <span style={{ display: 'inline-block', width: 16, borderTop: `1.5px dashed ${COLORS.target}` }} />
          Target line
        </div>
      </div>
    </div>
  );
}

export function ChartLoadingState(): JSX.Element {
  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 14, width: 160, background: 'var(--paper-shade)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 11, width: 220, background: 'var(--paper-shade)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ height: 28, width: 110, background: 'var(--paper-shade)', borderRadius: 5, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 28, width: 90, background: 'var(--paper-shade)', borderRadius: 5, animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      </div>
      <div style={{ height: 260, background: 'var(--paper-shade)', borderRadius: 5, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}

export function ChartEmptyState(): JSX.Element {
  const navigate = useNavigate();
  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ width: 44, height: 44, background: 'var(--paper-shade)', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 6-6" />
        </svg>
      </div>
      <h3 style={{ margin: '0 0 6px', fontFamily: "'Source Serif 4', serif", fontSize: 15, fontWeight: 700, color: 'var(--ink-1)' }}>
        No performance data yet
      </h3>
      <p style={{ margin: '0 auto', fontSize: 12.5, color: 'var(--ink-3)', maxWidth: 420, lineHeight: 1.6 }}>
        Once students complete assessments, the BKT engine will compute mastery scores and this chart will populate.
      </p>
      <button
        onClick={() => navigate('/admin/subjects')}
        style={{ marginTop: 16, padding: '7px 16px', background: 'var(--forest)', color: '#fbf8f1', border: 0, borderRadius: 5, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit' }}
      >
        Set up your first assessment
      </button>
    </div>
  );
}

export function ChartErrorState({ onRetry }: { onRetry: () => void }): JSX.Element {
  return (
    <div style={{ background: 'var(--terracotta-soft)', border: '1px solid color-mix(in srgb, var(--terracotta) 25%, transparent)', borderRadius: 7, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 34, height: 34, background: 'color-mix(in srgb, var(--terracotta) 15%, white)', borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--terracotta)" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 3 }}>
            Couldn't load performance data
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>
            The analytics service didn't respond. Dashboard counts are still accurate.
          </div>
          <button
            onClick={onRetry}
            style={{ marginTop: 10, padding: '5px 14px', background: 'var(--paper)', border: '1px solid color-mix(in srgb, var(--terracotta) 35%, transparent)', color: 'var(--terracotta)', borderRadius: 4, cursor: 'pointer', fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit' }}
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
