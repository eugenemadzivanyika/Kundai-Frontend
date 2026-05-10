// Schoolhouse charts — paper-friendly, hand-rendered feel
const SChart = {};

// Area + line chart, paper colors
SChart.AreaLine = ({ data, h = 200, valueKey = 'mrr', accent = 'var(--forest)', formatY = v => v }) => {
  if (!data?.length) return null;
  const w = 800;
  const padL = 40, padR = 12, padT = 14, padB = 26;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const max = Math.max(...data.map(d => d[valueKey]));
  const min = Math.min(...data.map(d => d[valueKey])) * 0.92;
  const xs = i => padL + (i / Math.max(data.length - 1, 1)) * innerW;
  const ys = v => padT + innerH - ((v - min) / (max - min || 1)) * innerH;

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xs(i)} ${ys(d[valueKey])}`).join(' ');
  const area = path + ` L ${xs(data.length-1)} ${padT + innerH} L ${xs(0)} ${padT + innerH} Z`;
  const ticks = [min, min + (max-min)/2, max];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h, display: 'block' }}>
      <defs>
        <linearGradient id="schoolArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={ys(t)} x2={w-padR} y2={ys(t)} stroke="var(--rule-soft)" strokeDasharray="2 4" />
          <text x={padL - 6} y={ys(t) + 3} fontSize="9.5" fill="var(--ink-3)" textAnchor="end" fontFamily="'JetBrains Mono', monospace">{formatY(t)}</text>
        </g>
      ))}
      <path d={area} fill="url(#schoolArea)" />
      <path d={path} fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={i} cx={xs(i)} cy={ys(d[valueKey])} r={2.5} fill="var(--paper)" stroke={accent} strokeWidth="1.5" />
      ))}
      {data.map((d, i) => (
        i % Math.ceil(data.length / 8) === 0 || i === data.length-1 ? (
          <text key={i} x={xs(i)} y={h - 8} fontSize="10" fill="var(--ink-3)" textAnchor="middle">{d.week || d.m || d.label}</text>
        ) : null
      ))}
    </svg>
  );
};

// Vertical bar chart — paper-style with subtle drop
SChart.Bars = ({ data, valueKey = 'value', labelKey = 'label', h = 180, accent = 'var(--forest)', formatY = v => v }) => {
  if (!data?.length) return null;
  const w = 800;
  const padL = 36, padR = 12, padT = 14, padB = 30;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const max = Math.max(...data.map(d => d[valueKey])) || 1;
  const barW = innerW / data.length * 0.62;
  const step = innerW / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h, display: 'block' }}>
      {[0, 0.5, 1].map((t, i) => {
        const v = max * t;
        return (
          <g key={i}>
            <line x1={padL} y1={padT + innerH * (1-t)} x2={w-padR} y2={padT + innerH * (1-t)} stroke="var(--rule-soft)" strokeDasharray="2 4" />
            <text x={padL - 6} y={padT + innerH * (1-t) + 3} fontSize="9.5" fill="var(--ink-3)" textAnchor="end" fontFamily="'JetBrains Mono', monospace">{formatY(v)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = padL + step * i + (step - barW) / 2;
        const barH = (d[valueKey] / max) * innerH;
        const y = padT + innerH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(barH, 1)} rx={2} fill={accent} opacity={0.85} />
            <text x={x + barW/2} y={h - 10} fontSize="10" fill="var(--ink-3)" textAnchor="middle">{d[labelKey]}</text>
          </g>
        );
      })}
    </svg>
  );
};

// Horizontal stacked subject performance
SChart.HBars = ({ items, max, h = 16, formatVal = v => v }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {items.map((it, i) => {
      const pct = (it.value / max) * 100;
      return (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600 }}>{it.label}</span>
            <span className="tnum" style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 700 }}>
              {formatVal(it.value)}
              {it.suffix && <span style={{ color: 'var(--ink-3)', fontWeight: 400, marginLeft: 4 }}>{it.suffix}</span>}
            </span>
          </div>
          <div style={{ height: h, background: 'var(--paper-shade)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--rule-soft)' }}>
            <div style={{ height: '100%', width: pct + '%', background: it.color || 'var(--forest)', borderRadius: 3 }} />
          </div>
        </div>
      );
    })}
  </div>
);

window.SChart = SChart;
