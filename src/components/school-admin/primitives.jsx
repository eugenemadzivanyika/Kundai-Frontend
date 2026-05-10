// Schoolhouse UI primitives — warm paper, ink, schoolhouse colors.
// Theme is light by default; supports dark via [data-theme="dark"] on <html>.

// ─── Avatars: stylized initials with warm color tones ─────────────────────────
const TONE_MAP = {
  terracotta: { bg: '#e8c5b3', fg: '#7a2e1a', dark_bg: '#5a2418', dark_fg: '#f0c5a8' },
  forest:     { bg: '#c5d8c8', fg: '#1f4d36', dark_bg: '#1a3826', dark_fg: '#9ec9a8' },
  sky:        { bg: '#cad8e5', fg: '#2a4a6b', dark_bg: '#1e3548', dark_fg: '#a8c4dc' },
  gold:       { bg: '#ead7a8', fg: '#7a5a14', dark_bg: '#4a3815', dark_fg: '#e8c878' },
  plum:       { bg: '#d8c5d8', fg: '#5a2b5a', dark_bg: '#3d1e3d', dark_fg: '#c8a8c8' },
  clay:       { bg: '#dcc6b0', fg: '#5a3818', dark_bg: '#3a2618', dark_fg: '#c8a888' },
};

const Avatar = ({ name, tone = 'forest', size = 36, square = false }) => {
  const initials = name.split(' ').filter(w => !['Mr.','Mrs.','Ms.','Dr.'].includes(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const t = TONE_MAP[tone] || TONE_MAP.forest;
  const isDark = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark';
  return (
    <div style={{
      width: size, height: size,
      borderRadius: square ? Math.round(size * 0.18) : '50%',
      background: isDark ? t.dark_bg : t.bg,
      color: isDark ? t.dark_fg : t.fg,
      display: 'grid', placeItems: 'center',
      fontSize: Math.round(size * 0.36), fontWeight: 700,
      letterSpacing: '-.01em',
      flexShrink: 0,
      fontFamily: "'Inter Tight', system-ui, sans-serif",
    }}>{initials}</div>
  );
};

// ─── Card with optional ruled-paper or stamp decoration ───────────────────────
const Card = ({ children, padded = true, decoration, accent, style = {}, ...rest }) => (
  <div style={{
    background: 'var(--paper)',
    border: '1px solid var(--rule)',
    borderRadius: 6,
    padding: padded ? 22 : 0,
    position: 'relative',
    boxShadow: '0 1px 0 var(--rule-soft), 0 4px 16px -8px rgba(60, 40, 20, 0.06)',
    ...(accent ? { borderTop: `3px solid var(--${accent})` } : {}),
    ...style,
  }} {...rest}>
    {decoration === 'ruled' && (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 6, opacity: 0.5,
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, var(--rule-soft) 27px, var(--rule-soft) 28px)',
        backgroundPosition: '0 16px',
      }} />
    )}
    {children}
  </div>
);

// ─── KPI tile — paper-card style, optional sparkline / delta ──────────────────
const KPI = ({ label, value, sub, accent = 'forest', icon: Icon, delta, size = 'md' }) => (
  <div style={{
    background: 'var(--paper)',
    border: '1px solid var(--rule)',
    borderRadius: 6,
    padding: size === 'sm' ? '14px 16px' : 18,
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `var(--${accent})` }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>{label}</div>
        <div className="serif tnum" style={{ fontSize: size === 'sm' ? 24 : 30, fontWeight: 700, color: 'var(--ink-1)', marginTop: 6, letterSpacing: '-.02em', lineHeight: 1.05 }}>{value}</div>
        {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 5 }}>{sub}</div>}
      </div>
      {Icon && (
        <div style={{
          width: 34, height: 34, borderRadius: 6,
          background: `var(--${accent}-soft)`, color: `var(--${accent})`,
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}><Icon size={16} /></div>
      )}
    </div>
    {delta && (
      <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: delta.dir === 'up' ? 'var(--forest)' : delta.dir === 'down' ? 'var(--terracotta)' : 'var(--ink-3)', fontWeight: 600 }} className="tnum">
        {delta.dir === 'up' ? <SI.ArrowUp size={11} /> : delta.dir === 'down' ? <SI.ArrowDown size={11} /> : null}
        {delta.label}
      </div>
    )}
  </div>
);

// ─── Pill / Badge / Status ────────────────────────────────────────────────────
const Pill = ({ children, tone = 'neutral', sm, dotted, style = {} }) => {
  const tones = {
    forest:     { bg: 'var(--forest-soft)', fg: 'var(--forest)' },
    terracotta: { bg: 'var(--terracotta-soft)', fg: 'var(--terracotta)' },
    gold:       { bg: 'var(--gold-soft)', fg: 'var(--gold-deep)' },
    sky:        { bg: 'var(--sky-soft)', fg: 'var(--sky-deep)' },
    plum:       { bg: 'var(--plum-soft)', fg: 'var(--plum)' },
    clay:       { bg: 'var(--clay-soft)', fg: 'var(--clay)' },
    neutral:    { bg: 'var(--neutral-soft)', fg: 'var(--ink-2)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: sm ? '2px 8px' : '3px 10px',
      background: t.bg, color: t.fg,
      borderRadius: 999,
      fontSize: sm ? 10.5 : 11.5, fontWeight: 600, lineHeight: 1.2,
      letterSpacing: '.01em',
      ...style,
    }}>
      {dotted && <span style={{ width: 6, height: 6, borderRadius: 999, background: t.fg }} />}
      {children}
    </span>
  );
};

const StatusPill = ({ status, sm }) => {
  const map = {
    active:   { tone: 'forest',     label: 'Active' },
    trial:    { tone: 'gold',       label: 'On trial' },
    suspended:{ tone: 'terracotta', label: 'Suspended' },
    pending:  { tone: 'gold',       label: 'Pending' },
    complete: { tone: 'forest',     label: 'Complete' },
    'in-progress': { tone: 'sky',   label: 'In progress' },
    'trial-credit':{ tone: 'plum',  label: 'Trial credit' },
    paid:     { tone: 'forest',     label: 'Paid' },
    overdue:  { tone: 'terracotta', label: 'Overdue' },
    inactive: { tone: 'neutral',    label: 'Inactive' },
    graded:   { tone: 'forest',     label: 'Graded' },
  };
  const m = map[status] || { tone: 'neutral', label: status };
  return <Pill tone={m.tone} sm={sm} dotted>{m.label}</Pill>;
};

// ─── Buttons ──────────────────────────────────────────────────────────────────
const Btn = ({ children, variant = 'ghost', size = 'md', icon: Icon, iconAfter: IconAfter, style = {}, ...rest }) => {
  const padding = size === 'sm' ? '6px 12px' : size === 'lg' ? '11px 20px' : '8px 14px';
  const fontSize = size === 'sm' ? 12 : 13;
  const variants = {
    primary: { bg: 'var(--ink-1)', color: 'var(--paper)', border: '1px solid var(--ink-1)', hover: { background: 'var(--ink-2)' } },
    accent:  { bg: 'var(--forest)', color: '#fbf8f1', border: '1px solid var(--forest)', hover: { background: 'var(--forest-deep)' } },
    warning: { bg: 'var(--terracotta)', color: '#fbf8f1', border: '1px solid var(--terracotta)', hover: {} },
    ghost:   { bg: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--rule)', hover: { background: 'var(--paper-shade)' } },
    quiet:   { bg: 'transparent', color: 'var(--ink-2)', border: '1px solid transparent', hover: { background: 'var(--paper-shade)' } },
  };
  const v = variants[variant] || variants.ghost;
  return (
    <button {...rest} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding, fontSize, fontWeight: 600,
      background: v.bg, color: v.color, border: v.border,
      borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit',
      letterSpacing: '-.005em', whiteSpace: 'nowrap',
      transition: 'background .12s, border-color .12s',
      ...style,
    }}>
      {Icon && <Icon size={size === 'sm' ? 12 : 13} />}
      {children}
      {IconAfter && <IconAfter size={size === 'sm' ? 12 : 13} />}
    </button>
  );
};

// ─── Inputs ───────────────────────────────────────────────────────────────────
const Input = ({ icon: Icon, style = {}, ...rest }) => (
  <div style={{ position: 'relative', ...style }}>
    {Icon && <Icon size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }} />}
    <input {...rest} style={{
      width: '100%', padding: Icon ? '8px 12px 8px 32px' : '8px 12px',
      background: 'var(--paper)', border: '1px solid var(--rule)',
      borderRadius: 5, color: 'var(--ink-1)', fontFamily: 'inherit', fontSize: 12.5,
      outline: 'none',
    }} />
  </div>
);

// ─── Section header ──────────────────────────────────────────────────────────
const SectionHeader = ({ title, sub, action, eyebrow }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
    <div>
      {eyebrow && <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700, marginBottom: 4 }}>{eyebrow}</div>}
      <h3 className="serif" style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-.015em' }}>{title}</h3>
      {sub && <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>{sub}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ─── Table cells ─────────────────────────────────────────────────────────────
const Th = ({ children, style = {}, ...rest }) => (
  <th {...rest} style={{
    textAlign: 'left', padding: '11px 14px',
    fontSize: 10.5, fontWeight: 700,
    color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em',
    borderBottom: '1px solid var(--rule)',
    background: 'var(--paper-shade)',
    ...style,
  }}>{children}</th>
);
const Td = ({ children, dim, mono, style = {}, ...rest }) => (
  <td {...rest} style={{
    padding: '12px 14px',
    fontSize: 12.5,
    color: dim ? 'var(--ink-3)' : 'var(--ink-2)',
    borderBottom: '1px solid var(--rule-soft)',
    fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
    fontFeatureSettings: mono ? "'tnum' 1" : undefined,
    verticalAlign: 'middle',
    ...style,
  }}>{children}</td>
);

// ─── Capacity bar ────────────────────────────────────────────────────────────
const CapacityBar = ({ used, total, accent = 'forest', label = true, height = 8 }) => {
  const pct = Math.min(100, (used / total) * 100);
  const tone = pct > 95 ? 'terracotta' : pct > 80 ? 'gold' : accent;
  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span className="tnum" style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>{used.toLocaleString()} <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>/ {total.toLocaleString()}</span></span>
          <span className="tnum" style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>{Math.round(pct)}%</span>
        </div>
      )}
      <div style={{ height, background: 'var(--paper-shade)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--rule-soft)' }}>
        <div style={{ height: '100%', width: pct + '%', background: `var(--${tone})`, borderRadius: 999, transition: 'width .35s' }} />
      </div>
    </div>
  );
};

// ─── Decorative bits — schoolhouse stamps and headers ────────────────────────
const PaperStamp = ({ children, tone = 'terracotta', rotate = -4, style = {} }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 9px',
    border: `2px solid var(--${tone})`,
    color: `var(--${tone})`,
    fontSize: 9.5, fontWeight: 800,
    textTransform: 'uppercase', letterSpacing: '.14em',
    transform: `rotate(${rotate}deg)`,
    fontFamily: "'Inter Tight', sans-serif",
    background: 'transparent',
    ...style,
  }}>{children}</div>
);

window.SUI = { Avatar, Card, KPI, Pill, StatusPill, Btn, Input, SectionHeader, Th, Td, CapacityBar, PaperStamp };
// also expose individually for convenience
Object.assign(window, { Avatar, Card, KPI, Pill, StatusPill, Btn, Input, SectionHeader, Th, Td, CapacityBar, PaperStamp });
