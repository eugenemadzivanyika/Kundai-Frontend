// UI kit — icons, primitives, small charts. Warm/educational paper-and-ink feel.
const Icon = ({ size = 16, stroke = 1.7, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...rest}>{children}</svg>
);
const I = {
  Users:    (p)=><Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>,
  User:     (p)=><Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Icon>,
  Class:    (p)=><Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></Icon>,
  ChartBar: (p)=><Icon {...p}><path d="M3 3v18h18"/><rect x="7"  y="11" width="3" height="6"/><rect x="12" y="7"  width="3" height="10"/><rect x="17" y="13" width="3" height="4"/></Icon>,
  TrendUp:  (p)=><Icon {...p}><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></Icon>,
  TrendDn:  (p)=><Icon {...p}><path d="M3 7l6 6 4-4 8 8"/><path d="M14 17h7v-7"/></Icon>,
  Alert:    (p)=><Icon {...p}><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></Icon>,
  Star:     (p)=><Icon {...p}><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18.5 5.5 22 7 14.5 2 9.5 9 9"/></Icon>,
  Flag:     (p)=><Icon {...p}><path d="M4 22V4"/><path d="M4 4l13 0a2 2 0 0 1 1.6 3.2l-2.4 3.2 2.4 3.2A2 2 0 0 1 17 17l-13 0"/></Icon>,
  Check:    (p)=><Icon {...p}><path d="M20 6 9 17l-5-5"/></Icon>,
  X:        (p)=><Icon {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></Icon>,
  Search:   (p)=><Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>,
  Filter:   (p)=><Icon {...p}><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/></Icon>,
  Download: (p)=><Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></Icon>,
  Mail:     (p)=><Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></Icon>,
  Plus:     (p)=><Icon {...p}><path d="M12 5v14"/><path d="M5 12h14"/></Icon>,
  Right:    (p)=><Icon {...p}><path d="m9 18 6-6-6-6"/></Icon>,
  Left:     (p)=><Icon {...p}><path d="m15 18-6-6 6-6"/></Icon>,
  Down:     (p)=><Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>,
  Brain:    (p)=><Icon {...p}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></Icon>,
  Book:     (p)=><Icon {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></Icon>,
  Clock:    (p)=><Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  File:     (p)=><Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></Icon>,
  Settings: (p)=><Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33A1.65 1.65 0 0 0 14 21H10a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 14V10a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H10a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V10a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>,
  Lightning:(p)=><Icon {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>,
  Target:   (p)=><Icon {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Icon>,
};

// ============ Primitives =============
function Card({ children, padded = true, style = {}, ...rest }) {
  return (
    <div style={{
      background: 'var(--paper)', border: '1px solid var(--rule)',
      borderRadius: 6, padding: padded ? 18 : 0,
      boxShadow: '0 1px 0 rgba(60,40,20,.04), 0 1px 2px rgba(60,40,20,.04)',
      ...style,
    }} {...rest}>{children}</div>
  );
}

function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '.01em' }}>{title}</h3>
        {sub && <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink-lo)' }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Pill({ tone = 'neutral', sm, children }) {
  const tones = {
    neutral: { bg: 'rgba(120,90,60,.08)', fg: 'var(--ink-mid)' },
    success: { bg: 'rgba(20,120,80,.10)',  fg: '#15784f' },
    risk:    { bg: 'rgba(190,50,50,.10)',  fg: '#a93333' },
    warn:    { bg: 'rgba(190,140,40,.12)', fg: '#9a6418' },
    info:    { bg: 'rgba(40,90,140,.10)',  fg: '#2d5d8c' },
    accent:  { bg: 'rgba(176,90,40,.10)',  fg: 'var(--accent)' },
  };
  const t = tones[tone] || tones.neutral;
  return <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: sm ? '1px 6px' : '2px 9px', borderRadius: 999,
    background: t.bg, color: t.fg, fontSize: sm ? 10 : 11.5,
    fontWeight: 600, letterSpacing: '.01em',
  }}>{children}</span>;
}

function Btn({ variant = 'ghost', size = 'md', icon: IconC, children, style = {}, ...rest }) {
  const variants = {
    primary: { bg: 'var(--accent)', fg: '#fffaf2', border: 'var(--accent)' },
    dark:    { bg: 'var(--ink-hi)', fg: 'var(--paper)', border: 'var(--ink-hi)' },
    ghost:   { bg: 'transparent', fg: 'var(--ink-mid)', border: 'var(--rule)' },
    soft:    { bg: 'rgba(176,90,40,.08)', fg: 'var(--accent)', border: 'rgba(176,90,40,.18)' },
  };
  const v = variants[variant];
  const padding = size === 'sm' ? '5px 10px' : '7px 14px';
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding, borderRadius: 6, fontSize: size === 'sm' ? 11.5 : 12.5, fontWeight: 600,
      background: v.bg, color: v.fg, border: `1px solid ${v.border}`,
      cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', ...style,
    }} {...rest}>{IconC && <IconC size={size === 'sm' ? 12 : 14} />}{children}</button>
  );
}

function KPI({ label, value, sub, accent = 'var(--accent)', icon: IconC, delta }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-lo)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</span>
        {IconC && <div style={{ width: 26, height: 26, borderRadius: 6, background: `color-mix(in oklab, ${accent} 12%, transparent)`, display: 'grid', placeItems: 'center', color: accent }}><IconC size={13} /></div>}
      </div>
      <div className="tnum" style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink-hi)', marginTop: 8, letterSpacing: '-.02em', lineHeight: 1 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 11.5, color: 'var(--ink-lo)' }}>
        {delta != null && <span style={{ color: delta >= 0 ? '#15784f' : '#a93333', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2 }}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%</span>}
        {sub && <span>{sub}</span>}
      </div>
    </Card>
  );
}

// ============ Charts =============
// Mastery bar — horizontal segmented bar
function MasteryBar({ value, target = 0.6, h = 6, showLabel = true }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.8 ? '#15784f' : value >= 0.6 ? '#9a6418' : value >= 0.4 ? '#b85e2c' : '#a93333';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: h, background: 'var(--rule-soft)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 999, transition: 'width .3s' }} />
        <div style={{ position: 'absolute', top: -2, bottom: -2, left: target * 100 + '%', width: 1, background: 'var(--ink-faint)', opacity: .5 }} />
      </div>
      {showLabel && <span className="tnum" style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mid)', minWidth: 30, textAlign: 'right' }}>{pct}%</span>}
    </div>
  );
}

// Line chart — week trend with class vs school
function LineChart({ data, keys, h = 180, formatY = v => Math.round(v*100) + '%' }) {
  const W = 600, P = { l: 36, r: 12, t: 10, b: 22 };
  const xs = (i) => P.l + (i / (data.length - 1)) * (W - P.l - P.r);
  const allVals = data.flatMap(d => keys.map(k => d[k.key]));
  const minY = Math.min(...allVals) * 0.92, maxY = Math.max(...allVals) * 1.05;
  const ys = (v) => P.t + (1 - (v - minY) / (maxY - minY)) * (h - P.t - P.b);

  const path = (key) => data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xs(i).toFixed(1)} ${ys(d[key]).toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${h}`} style={{ width: '100%', height: h, display: 'block' }}>
      {[0,0.25,0.5,0.75,1].map((p,i) => {
        const v = minY + p * (maxY - minY);
        const y = ys(v);
        return <g key={i}>
          <line x1={P.l} x2={W-P.r} y1={y} y2={y} stroke="var(--rule-soft)" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '2 4'} />
          <text x={P.l - 6} y={y + 3} fontSize="9.5" fill="var(--ink-faint)" textAnchor="end" fontFamily="inherit">{formatY(v)}</text>
        </g>;
      })}
      {data.map((d, i) => i % 2 === 0 && <text key={i} x={xs(i)} y={h-6} fontSize="9.5" fill="var(--ink-faint)" textAnchor="middle" fontFamily="inherit">{d.week || d.term}</text>)}
      {keys.map((k, ki) => (
        <g key={ki}>
          <path d={path(k.key)} stroke={k.color} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {data.map((d, i) => <circle key={i} cx={xs(i)} cy={ys(d[k.key])} r="2.5" fill="var(--paper)" stroke={k.color} strokeWidth="1.5" />)}
        </g>
      ))}
    </svg>
  );
}

// Bar chart
function BarChart({ data, h = 180, accent = 'var(--accent)' }) {
  const W = 600, P = { l: 12, r: 12, t: 10, b: 32 };
  const max = Math.max(...data.map(d => d.value)) * 1.1;
  const bw = (W - P.l - P.r) / data.length * 0.72;
  return (
    <svg viewBox={`0 0 ${W} ${h}`} style={{ width: '100%', height: h, display: 'block' }}>
      {[0,0.5,1].map((p,i) => {
        const y = P.t + (1-p) * (h - P.t - P.b);
        return <line key={i} x1={P.l} x2={W-P.r} y1={y} y2={y} stroke="var(--rule-soft)" strokeWidth="1" strokeDasharray={p === 0 ? '0' : '2 4'} />;
      })}
      {data.map((d, i) => {
        const x = P.l + (i + .14) * (W - P.l - P.r) / data.length;
        const bh = d.value / max * (h - P.t - P.b);
        const y = h - P.b - bh;
        const c = d.color || accent;
        return <g key={i}>
          <rect x={x} y={y} width={bw} height={bh} fill={c} fillOpacity=".85" rx="2" />
          <text x={x + bw/2} y={y - 5} fontSize="10" fill="var(--ink-mid)" textAnchor="middle" fontFamily="inherit" fontWeight="600">{d.value}{d.unit||''}</text>
          <text x={x + bw/2} y={h - 16} fontSize="9.5" fill="var(--ink-faint)" textAnchor="middle" fontFamily="inherit">{d.label}</text>
          {d.sub && <text x={x + bw/2} y={h - 4} fontSize="9" fill="var(--ink-faint)" textAnchor="middle" fontFamily="inherit">{d.sub}</text>}
        </g>;
      })}
    </svg>
  );
}

// Donut for distribution
function Donut({ value, max = 1, size = 64, stroke = 8, color = 'var(--accent)', label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value / max;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--rule-soft)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div className="tnum" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-hi)' }}>{Math.round(value*100)}%</div>
          {label && <div style={{ fontSize: 8, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>}
        </div>
      </div>
    </div>
  );
}

// Score histogram
function Histogram({ buckets, h = 90, accent = 'var(--accent)' }) {
  const W = 600, P = { l: 8, r: 8, t: 8, b: 18 };
  const max = Math.max(...buckets.map(b => b.count));
  const bw = (W - P.l - P.r) / buckets.length;
  return (
    <svg viewBox={`0 0 ${W} ${h}`} style={{ width: '100%', height: h, display: 'block' }}>
      {buckets.map((b, i) => {
        const x = P.l + i * bw + 1;
        const bh = b.count / max * (h - P.t - P.b);
        const y = h - P.b - bh;
        const isFail = parseInt(b.range) < 50;
        return <g key={i}>
          <rect x={x} y={y} width={bw - 2} height={bh} fill={isFail ? '#a93333' : accent} fillOpacity=".75" rx="1" />
          <text x={x + bw/2} y={h-6} fontSize="9" fill="var(--ink-faint)" textAnchor="middle" fontFamily="inherit">{b.range}</text>
        </g>;
      })}
    </svg>
  );
}

// Heatmap — students × skills mastery grid
function Heatmap({ rows, cols, getValue, onCell, h = 360, rowLabel = (r) => r, colLabel = (c) => c }) {
  // colors via mastery quintiles
  const cellColor = (v) => {
    if (v == null) return 'var(--rule-soft)';
    if (v >= 0.85) return '#15784f';
    if (v >= 0.65) return '#5a9d6e';
    if (v >= 0.45) return '#d8a14f';
    if (v >= 0.25) return '#c87238';
    return '#a93333';
  };
  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: h }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 10.5, width: '100%' }}>
        <thead>
          <tr>
            <th style={{ position: 'sticky', left: 0, top: 0, background: 'var(--paper)', zIndex: 2, padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-lo)', minWidth: 130, borderBottom: '1px solid var(--rule)' }}>Student</th>
            {cols.map(c => (
              <th key={c.id} style={{ position: 'sticky', top: 0, background: 'var(--paper)', padding: '6px 4px', fontWeight: 600, color: 'var(--ink-lo)', borderBottom: '1px solid var(--rule)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 9.5, height: 80 }}>{colLabel(c)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td style={{ position: 'sticky', left: 0, background: 'var(--paper)', padding: '4px 8px', borderRight: '1px solid var(--rule-soft)', fontWeight: 500, color: 'var(--ink-mid)', whiteSpace: 'nowrap', cursor: onCell ? 'pointer' : 'default' }} onClick={() => onCell && onCell(r, null)}>
                {rowLabel(r)}
              </td>
              {cols.map(c => {
                const v = getValue(r, c);
                return (
                  <td key={c.id} style={{ padding: 1 }}>
                    <div onClick={() => onCell && onCell(r, c)}
                         title={`${r.name || r.id} · ${c.name || c.id}: ${v != null ? Math.round(v*100)+'%' : '—'}`}
                         style={{
                           width: 22, height: 22, background: cellColor(v),
                           borderRadius: 2, cursor: onCell ? 'pointer' : 'default',
                           display: 'grid', placeItems: 'center', color: '#fff', fontSize: 8.5, fontWeight: 700,
                         }}>
                      {v != null ? Math.round(v*100) : '—'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

window.UI = { I, Icon, Card, SectionHeader, Pill, Btn, KPI, MasteryBar, LineChart, BarChart, Donut, Histogram, Heatmap };
Object.assign(window, { I, Card, SectionHeader, Pill, Btn, KPI, MasteryBar, LineChart, BarChart, Donut, Histogram, Heatmap });
