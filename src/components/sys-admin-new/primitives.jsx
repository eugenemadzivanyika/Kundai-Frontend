// Shared visual primitives — cards, badges, pills, layout helpers.
// All components write to `window` at the bottom for cross-script access.

const cls = (...xs) => xs.filter(Boolean).join(' ');

const TONE = {
  emerald: { bg: 'rgba(16,185,129,.12)', fg: '#34d399', line: 'rgba(16,185,129,.30)' },
  amber:   { bg: 'rgba(245,158,11,.12)', fg: '#fbbf24', line: 'rgba(245,158,11,.30)' },
  rose:    { bg: 'rgba(244,63,94,.12)',  fg: '#fb7185', line: 'rgba(244,63,94,.30)' },
  sky:     { bg: 'rgba(56,189,248,.12)', fg: '#7dd3fc', line: 'rgba(56,189,248,.30)' },
  violet:  { bg: 'rgba(139,92,246,.14)', fg: '#a78bfa', line: 'rgba(139,92,246,.30)' },
  indigo:  { bg: 'rgba(99,102,241,.14)', fg: '#818cf8', line: 'rgba(99,102,241,.30)' },
  slate:   { bg: 'rgba(148,163,184,.10)',fg: '#94a3b8', line: 'rgba(148,163,184,.20)' },
};

// Status pill — small rounded chip
const Pill = ({ tone='slate', children, dot=false, sm=false }) => {
  const t = TONE[tone] || TONE.slate;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: t.bg, color: t.fg, border: `1px solid ${t.line}`,
      borderRadius: 999, padding: sm ? '2px 8px' : '3px 10px',
      fontSize: sm ? 10.5 : 11, fontWeight: 600, letterSpacing: '.01em',
      whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: t.fg, boxShadow: `0 0 0 3px ${t.bg}` }} />}
      {children}
    </span>
  );
};

const Card = ({ children, style, padded=true, hover=false, onClick }) => (
  <div onClick={onClick} style={{
    background: 'linear-gradient(180deg, #131e35 0%, #111a2c 100%)',
    border: '1px solid var(--line)',
    borderRadius: 14,
    padding: padded ? 18 : 0,
    boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px -16px rgba(0,0,0,.6)',
    cursor: hover || onClick ? 'pointer' : 'default',
    transition: 'border-color .15s, transform .15s',
    ...style,
  }}>{children}</div>
);

const SectionHeader = ({ title, sub, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
    <div>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: '-.005em', color: 'var(--ink-hi)' }}>{title}</h3>
      {sub && <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink-lo)' }}>{sub}</p>}
    </div>
    {action}
  </div>
);

// Numeric KPI
const KPI = ({ label, value, sub, accent='emerald', icon: Icn, delta, deltaSub }) => {
  const t = TONE[accent];
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', color: 'var(--ink-lo)', textTransform: 'uppercase' }}>{label}</div>
          <div className="tnum" style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink-hi)', marginTop: 6, letterSpacing: '-.02em', lineHeight: 1.05 }}>{value}</div>
          {sub && <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--ink-lo)' }}>{sub}</div>}
        </div>
        {Icn && (
          <div style={{ width: 34, height: 34, borderRadius: 10, background: t.bg, color: t.fg, display: 'grid', placeItems: 'center', border: `1px solid ${t.line}`, flexShrink: 0 }}>
            <Icn size={17} />
          </div>
        )}
      </div>
      {delta != null && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            color: delta >= 0 ? '#34d399' : '#fb7185', fontWeight: 600,
          }}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
          {deltaSub && <span style={{ color: 'var(--ink-faint)' }}>{deltaSub}</span>}
        </div>
      )}
    </Card>
  );
};

// School logo — colored monogram tile
const SchoolLogo = ({ name, tone='slate', size=36, square=false }) => {
  const t = TONE[tone] || TONE.slate;
  const initials = name.split(/\s+/).slice(0,2).map(w => w[0]).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: square ? 8 : Math.round(size/3),
      background: t.bg, color: t.fg, border: `1px solid ${t.line}`,
      display: 'grid', placeItems: 'center', fontWeight: 700,
      fontSize: Math.round(size * 0.36), letterSpacing: '-.02em', flexShrink: 0,
    }}>{initials}</div>
  );
};

// Buttons
const Btn = ({ variant='primary', size='md', icon: Icn, children, onClick, style }) => {
  const sizes = {
    sm: { p: '6px 10px',  fs: 12,   h: 30, ic: 13 },
    md: { p: '8px 14px',  fs: 13,   h: 36, ic: 14 },
    lg: { p: '10px 18px', fs: 13.5, h: 40, ic: 15 },
  }[size];
  const variants = {
    primary:  { bg: 'var(--emerald)', fg: '#04190e', bd: 'transparent' },
    ghost:    { bg: 'transparent',    fg: 'var(--ink-mid)', bd: 'var(--line)' },
    soft:     { bg: 'rgba(56,189,248,.12)', fg: '#7dd3fc', bd: 'rgba(56,189,248,.25)' },
    danger:   { bg: 'rgba(244,63,94,.12)',  fg: '#fb7185', bd: 'rgba(244,63,94,.30)' },
    dark:     { bg: 'var(--bg-elev-2)', fg: 'var(--ink-hi)', bd: 'var(--line-bright)' },
  }[variant];
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: sizes.p, height: sizes.h, fontSize: sizes.fs, fontWeight: 600,
      background: variants.bg, color: variants.fg, border: `1px solid ${variants.bd}`,
      borderRadius: 8, cursor: 'pointer', transition: 'transform .08s, filter .15s',
      ...style,
    }}
    onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
    onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {Icn && <Icn size={sizes.ic} />}
      {children}
    </button>
  );
};

// Plain table row helpers
const Th = ({ children, style, w }) => (
  <th style={{
    textAlign: 'left', fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase',
    color: 'var(--ink-lo)', fontWeight: 600,
    padding: '10px 14px', borderBottom: '1px solid var(--line-soft)',
    width: w, ...style,
  }}>{children}</th>
);
const Td = ({ children, style, mono=false, dim=false }) => (
  <td style={{
    padding: '12px 14px', fontSize: 13, color: dim ? 'var(--ink-lo)' : 'var(--ink-mid)',
    fontFamily: mono ? "'JetBrains Mono',monospace" : 'inherit',
    fontVariantNumeric: 'tabular-nums',
    borderBottom: '1px solid var(--line-soft)',
    ...style,
  }}>{children}</td>
);

const Input = ({ icon: Icn, placeholder, style, value, onChange }) => (
  <div style={{ position: 'relative', ...style }}>
    {Icn && (
      <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}>
        <Icn size={15} />
      </div>
    )}
    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width: '100%', height: 36, paddingLeft: Icn ? 36 : 12, paddingRight: 12,
        background: 'var(--bg-elev-1)', border: '1px solid var(--line)',
        borderRadius: 8, color: 'var(--ink-hi)', fontSize: 13, outline: 'none',
        fontFamily: 'inherit',
      }}
    />
  </div>
);

const HealthDot = ({ status }) => {
  const map = {
    healthy:   { c: '#34d399', g: 'rgba(16,185,129,.25)' },
    attention: { c: '#fbbf24', g: 'rgba(245,158,11,.25)' },
    critical:  { c: '#fb7185', g: 'rgba(244,63,94,.25)' },
  };
  const m = map[status] || map.healthy;
  return <span style={{ width: 8, height: 8, borderRadius: 999, background: m.c, boxShadow: `0 0 0 3px ${m.g}`, display: 'inline-block' }} />;
};

const StatusPill = ({ status }) => {
  const map = {
    active:    { tone: 'emerald', label: 'Active' },
    trial:     { tone: 'sky',     label: 'Trial' },
    suspended: { tone: 'amber',   label: 'Suspended' },
    expired:   { tone: 'rose',    label: 'Expired' },
    cancelled: { tone: 'slate',   label: 'Cancelled' },
    received:  { tone: 'emerald', label: 'Received' },
    pending:   { tone: 'amber',   label: 'Pending' },
    overdue:   { tone: 'rose',    label: 'Overdue' },
  };
  const m = map[status] || { tone: 'slate', label: status };
  return <Pill tone={m.tone} dot sm>{m.label}</Pill>;
};

Object.assign(window, { cls, TONE, Pill, Card, SectionHeader, KPI, SchoolLogo, Btn, Th, Td, Input, HealthDot, StatusPill });
