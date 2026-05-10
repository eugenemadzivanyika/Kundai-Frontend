// SVG chart primitives — line area, donut, horizontal bars, sparkline.

const AreaLineChart = ({ data, w=620, h=180, accent='#34d399', yLabel='', formatY = v => v }) => {
  const padL = 44, padR = 12, padT = 14, padB = 24;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const max = Math.max(...data.map(d => d.mrr));
  const min = Math.min(...data.map(d => d.mrr));
  const yMax = Math.ceil(max / 1000) * 1000;
  const yMin = Math.floor(Math.min(min, 0) / 1000) * 1000;
  const x = i => padL + (i * innerW) / Math.max(1, data.length - 1);
  const y = v => padT + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;
  const linePath = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.mrr).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${x(data.length-1)},${y(yMin)} L${x(0)},${y(yMin)} Z`;
  const ticks = 4;
  const tickVals = Array.from({length: ticks+1}, (_, i) => yMin + (i*(yMax-yMin))/ticks);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.30" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {tickVals.map((v, i) => (
        <g key={i}>
          <line x1={padL} y1={y(v)} x2={w - padR} y2={y(v)} stroke="rgba(148,163,184,.08)" strokeDasharray="2 4" />
          <text x={padL - 8} y={y(v) + 3} textAnchor="end" fontSize="9.5" fill="#7d8aa6" fontFamily="JetBrains Mono">{formatY(v)}</text>
        </g>
      ))}
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke={accent} strokeWidth="1.8" />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.mrr)} r={i === data.length - 1 ? 4 : 2.4}
          fill={i === data.length - 1 ? accent : '#0b1220'} stroke={accent} strokeWidth="1.4" />
      ))}
      {data.map((d, i) => (
        i % 2 === 0 || i === data.length-1 ? (
          <text key={`l${i}`} x={x(i)} y={h - 6} textAnchor="middle" fontSize="9.5" fill="#7d8aa6" fontFamily="Inter">{d.m}</text>
        ) : null
      ))}
    </svg>
  );
};

// Stacked horizontal bar — for status mix
const StatusMixBar = ({ data, total, h=10 }) => {
  let acc = 0;
  return (
    <div>
      <div style={{ width: '100%', height: h, borderRadius: 999, background: 'var(--bg-elev-2)', overflow: 'hidden', display: 'flex' }}>
        {data.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          acc += pct;
          return <div key={i} title={`${seg.label}: ${seg.value}`} style={{ width: `${pct}%`, background: seg.color, borderRight: i < data.length-1 ? '2px solid var(--bg-canvas)' : 'none' }} />;
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.length}, 1fr)`, gap: 12, marginTop: 14 }}>
        {data.map((seg, i) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: seg.color }} />
              <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.05em', color: 'var(--ink-lo)', textTransform: 'uppercase' }}>{seg.label}</span>
            </div>
            <div className="tnum" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-hi)' }}>{seg.value}</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>{((seg.value/total)*100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Horizontal bar list — for package mix, top schools
const HBarList = ({ items, max, accent='#34d399', formatVal = v => v }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {items.map((it, i) => {
      const pct = (it.value / max) * 100;
      const c = it.color || accent;
      return (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-mid)', fontWeight: 500 }}>{it.label}</span>
            <span className="tnum" style={{ fontSize: 12.5, color: 'var(--ink-hi)', fontWeight: 600 }}>{formatVal(it.value)} {it.suffix && <span style={{ color: 'var(--ink-faint)', fontWeight: 500 }}>{it.suffix}</span>}</span>
          </div>
          <div style={{ height: 6, background: 'var(--bg-elev-2)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: 999 }} />
          </div>
        </div>
      );
    })}
  </div>
);

// Mini sparkline
const Spark = ({ values, w=80, h=24, color='#34d399' }) => {
  const max = Math.max(...values), min = Math.min(...values);
  const x = i => (i * w) / (values.length - 1);
  const y = v => h - ((v - min) / (max - min || 1)) * h;
  const path = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return <svg width={w} height={h} style={{ display: 'block' }}><path d={path} fill="none" stroke={color} strokeWidth="1.5" /></svg>;
};

// Capacity bar (used in school cards)
const CapacityBar = ({ used, total, label='' }) => {
  const pct = Math.min(100, (used / total) * 100);
  const tone = pct >= 95 ? '#fb7185' : pct >= 85 ? '#fbbf24' : '#34d399';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-lo)', marginBottom: 4 }}>
        <span>{label || 'Seat usage'}</span>
        <span className="tnum" style={{ color: 'var(--ink-mid)', fontWeight: 600 }}>
          {used.toLocaleString()} <span style={{ color: 'var(--ink-faint)' }}>/ {total.toLocaleString()}</span>
        </span>
      </div>
      <div style={{ height: 5, background: 'var(--bg-elev-2)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: tone, borderRadius: 999 }} />
      </div>
    </div>
  );
};

Object.assign(window, { AreaLineChart, StatusMixBar, HBarList, Spark, CapacityBar });
