(function () {
const { useState, useEffect } = React;

// ─── Shared bits ───
const FONT = "'Inter Tight', -apple-system, system-ui, sans-serif";
const BLUE = '#2563eb';
const BLUE_DARK = '#1d4ed8';

// Tiny icon helpers
const ico = (path, size = 18, color = 'currentColor', strokeWidth = 2) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);
const IcQr      = (s, c) => ico(<><rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><path d="M15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z"/></>, s, c);
const IcCam     = (s, c) => ico(<><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3.5"/></>, s, c);
const IcCheck   = (s, c) => ico(<polyline points="20 6 9 17 4 12"/>, s, c);
const IcX       = (s, c) => ico(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>, s, c);
const IcRefresh = (s, c) => ico(<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>, s, c);
const IcPlus    = (s, c) => ico(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>, s, c);
const IcArrow   = (s, c) => ico(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>, s, c);
const IcBack    = (s, c) => ico(<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>, s, c);
const IcLink    = (s, c) => ico(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>, s, c);
const IcSpark   = (s, c) => ico(<><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4z"/></>, s, c);
const IcCloud   = (s, c) => ico(<><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></>, s, c);
const IcZap     = (s, c) => ico(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>, s, c);
const IcFlash   = (s, c) => ico(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={c} stroke={c}/>, s, c);
const IcCrop    = (s, c) => ico(<><path d="M6.13 1 6 16a2 2 0 0 0 2 2h15"/><path d="M1 6.13 16 6a2 2 0 0 1 2 2v15"/></>, s, c);
const IcFile    = (s, c) => ico(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>, s, c);
const IcWifi    = (s, c) => ico(<><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>, s, c);

// ──────────────────────────────────────────────
// SCREEN 1 — PAIR (QR scanner)
// ──────────────────────────────────────────────
function ScreenPair() {
  return (
    <div style={{ height: '100%', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: FONT, position: 'relative' }}>
      {/* Camera feed mock — subtle pattern to read as "live" */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1d29 0%, #0f172a 50%, #1e293b 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4,
          backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(37,99,235,.3), transparent 50%), radial-gradient(circle at 70% 70%, rgba(16,185,129,.2), transparent 50%)' }}/>
      </div>

      {/* Header */}
      <div style={{ position: 'relative', padding: '60px 20px 0', textAlign: 'center', zIndex: 2 }}>
        <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', margin: 0 }}>Step 1 of 3</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', margin: '6px 0 0' }}>Scan QR on web</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', margin: '6px 0 0', lineHeight: 1.4 }}>Open the OCR page on your computer<br/>and scan the code shown there.</p>
      </div>

      {/* Viewfinder */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{ width: 220, height: 220, position: 'relative' }}>
          {/* Corner brackets */}
          {['nw','ne','sw','se'].map(c => {
            const pos = {
              nw: { top: 0, left: 0, borderTop: '3px solid #fff', borderLeft: '3px solid #fff', borderTopLeftRadius: 12 },
              ne: { top: 0, right: 0, borderTop: '3px solid #fff', borderRight: '3px solid #fff', borderTopRightRadius: 12 },
              sw: { bottom: 0, left: 0, borderBottom: '3px solid #fff', borderLeft: '3px solid #fff', borderBottomLeftRadius: 12 },
              se: { bottom: 0, right: 0, borderBottom: '3px solid #fff', borderRight: '3px solid #fff', borderBottomRightRadius: 12 },
            };
            return <div key={c} style={{ position: 'absolute', width: 36, height: 36, ...pos[c] }}/>;
          })}
          {/* Inner QR placeholder pattern */}
          <div style={{ position: 'absolute', inset: 28, background: 'rgba(255,255,255,.06)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
            {IcQr(72, 'rgba(255,255,255,.18)')}
          </div>
          {/* Scan line */}
          <div style={{ position: 'absolute', left: 8, right: 8, top: '50%', height: 2, background: '#25D366', boxShadow: '0 0 12px #25D366' }}/>
        </div>
      </div>

      {/* Enter code option */}
      <div style={{ padding: '0 20px 40px', textAlign: 'center', zIndex: 2 }}>
        <button style={{ background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 14, color: '#fff', fontSize: 14, fontWeight: 600, padding: '12px 20px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          Enter 6-digit code instead
        </button>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', margin: '12px 0 0' }}>Code shown above the QR on web</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// SCREEN 2 — CONNECTED (Batch info)
// ──────────────────────────────────────────────
function ScreenConnected() {
  return (
    <div style={{ height: '100%', background: '#f1f5f9', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      <div style={{ padding: '60px 20px 0' }}>
        <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.15em', textTransform: 'uppercase', color: BLUE, margin: 0 }}>✓ Connected</p>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.025em', color: '#0f172a', margin: '4px 0 0', lineHeight: 1.1 }}>You're paired.</h1>
        <p style={{ fontSize: 14, color: '#475569', margin: '8px 0 0' }}>Shoot one student's work, save, then move to the next.</p>
      </div>

      {/* Batch card */}
      <div style={{ padding: '20px' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: BLUE, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, fontSize: 15 }}>K</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', color: '#64748b', margin: 0 }}>Assessment</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '2px 0 0' }}>Algebra Quiz — Quadratics</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Stat label="Class" val="Form 3B" />
            <Stat label="Subject" val="Maths" />
            <Stat label="Students" val="28" />
            <Stat label="Submitted" val="0 / 28" hl />
          </div>
        </div>

        {/* How it works mini */}
        <div style={{ marginTop: 14, background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04)' }}>
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', color: '#64748b', margin: '0 0 10px' }}>The cycle</p>
          {[
            ['1', 'Pick or type student'],
            ['2', 'Shoot all their pages'],
            ['3', 'Save → next student'],
          ].map(([n, t]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: '#eff6ff', display: 'grid', placeItems: 'center', color: BLUE, fontWeight: 900, fontSize: 11 }}>{n}</div>
              <p style={{ fontSize: 13, color: '#334155', margin: 0 }}>{t}</p>
            </div>
          ))}
        </div>

        {/* Connection chip */}
        <div style={{ marginTop: 14, background: '#dcfce7', border: '1px solid #86efac', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: '#16a34a', boxShadow: '0 0 8px #16a34a' }}/>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#15803d', margin: 0 }}>Live sync · MBP-Moyo</p>
            <p style={{ fontSize: 10, color: '#16a34a', margin: 0 }}>Pages upload as you shoot</p>
          </div>
          {IcWifi(16, '#16a34a')}
        </div>
      </div>

      {/* CTA */}
      <div style={{ marginTop: 'auto', padding: '0 20px 44px' }}>
        <button style={{ width: '100%', background: BLUE, color: '#fff', fontWeight: 700, fontSize: 16, padding: '14px', border: 0, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 14px ${BLUE}40` }}>
          {IcCam(18, '#fff')}
          Start with first student
        </button>
        <button style={{ width: '100%', background: 'transparent', color: '#64748b', fontSize: 13, padding: '12px', border: 0, marginTop: 4 }}>
          Disconnect
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// SCREEN 2B — NEW STUDENT (pick before shooting)
// ──────────────────────────────────────────────
function ScreenNewStudent() {
  const ROSTER = [
    { name: 'Chipo Ndlovu',    done: true,  pages: 2 },
    { name: 'Farai Sibanda',   done: true,  pages: 3 },
    { name: 'Tatenda Banda',   done: true,  pages: 2 },
    { name: 'Rumbi Phiri',     done: true,  pages: 2 },
    { name: 'Tapiwa Moyo',     done: false },
    { name: 'Anesu Chigumba',  done: false },
    { name: 'Mufaro Kanyemba', done: false },
    { name: 'Vimbai Mhlanga',  done: false },
  ];

  return (
    <div style={{ height: '100%', background: '#f1f5f9', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      {/* Header */}
      <div style={{ padding: '60px 20px 14px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button style={{ background: 'transparent', border: 0, color: '#475569', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, padding: 0 }}>
            {IcBack(18, '#475569')} Back
          </button>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>4 of 28 submitted</span>
        </div>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: BLUE, margin: 0 }}>Step 1 · Pick a student</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.025em', color: '#0f172a', margin: '4px 0 0', lineHeight: 1.15 }}>Whose work is next?</h1>

        {/* Search */}
        <div style={{ marginTop: 12, position: 'relative' }}>
          <input placeholder="Search or type a name" style={{ width: '100%', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px 10px 36px', fontSize: 14, color: '#0f172a', boxSizing: 'border-box', fontFamily: FONT }}/>
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
        </div>
      </div>

      {/* Roster */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: '#94a3b8', margin: '6px 8px 6px' }}>To do · 24</p>
        {ROSTER.filter(s => !s.done).map((s, i) => {
          const initials = s.name.split(' ').map(n => n[0]).join('');
          const active = i === 0;
          return (
            <div key={s.name} style={{ background: active ? '#eff6ff' : '#fff', border: active ? `1.5px solid ${BLUE}` : '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 17, background: '#0f172a', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 11 }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{s.name}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>Not submitted</p>
              </div>
              {active && IcArrow(16, BLUE)}
            </div>
          );
        })}

        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: '#94a3b8', margin: '14px 8px 6px' }}>Done · 4</p>
        {ROSTER.filter(s => s.done).map(s => {
          const initials = s.name.split(' ').map(n => n[0]).join('');
          return (
            <div key={s.name} style={{ background: '#fff', borderRadius: 12, padding: '10px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12, opacity: .55 }}>
              <div style={{ width: 30, height: 30, borderRadius: 15, background: '#cbd5e1', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 10 }}>{initials}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{s.name}</p>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{s.pages} pages submitted</p>
              </div>
              <div style={{ width: 18, height: 18, borderRadius: 9, background: '#16a34a', display: 'grid', placeItems: 'center' }}>
                {IcCheck(11, '#fff', 2.5)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: '12px 16px 44px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
        <button style={{ width: '100%', background: BLUE, color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px', border: 0, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 14px ${BLUE}40` }}>
          {IcCam(16, '#fff')} Shoot Tapiwa's work
        </button>
        <button style={{ width: '100%', background: 'transparent', color: '#64748b', fontSize: 12, padding: '10px', border: 0, marginTop: 2 }}>
          Shoot anonymously — tag on web
        </button>
      </div>
    </div>
  );
}

function Stat({ label, val, hl }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', color: '#94a3b8', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 17, fontWeight: 800, color: hl ? BLUE : '#0f172a', margin: '2px 0 0', letterSpacing: '-.02em' }}>{val}</p>
    </div>
  );
}

// ──────────────────────────────────────────────
// SCREEN 3 — CAMERA CAPTURE
// ──────────────────────────────────────────────
function ScreenCamera() {
  return (
    <div style={{ height: '100%', background: '#000', position: 'relative', fontFamily: FONT, color: '#fff' }}>
      {/* Mock camera feed: simulates a handwritten paper on a desk */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #2a2018 0%, #1a1410 60%, #0f0a07 100%)' }}/>
      {/* Paper */}
      <div style={{ position: 'absolute', top: '18%', left: '12%', right: '12%', bottom: '24%',
        background: 'linear-gradient(160deg, #fefcf5 0%, #f9f4e8 100%)',
        borderRadius: 4,
        transform: 'rotate(-2deg)',
        boxShadow: '0 18px 40px rgba(0,0,0,.6)',
      }}>
        {/* Handwritten content suggestion */}
        <div style={{ padding: '18px 16px', color: '#1a1410' }}>
          <p style={{ fontFamily: '"Caveat", "Bradley Hand", cursive', fontSize: 12, fontWeight: 700, margin: 0 }}>Form 3B · Algebra Quiz</p>
          <p style={{ fontFamily: '"Caveat", "Bradley Hand", cursive', fontSize: 11, margin: '2px 0 12px', color: '#5c4a3a' }}>Tapiwa Moyo</p>
          {[
            '1) Solve x² + 5x + 6 = 0',
            '   x = -2, x = -3',
            '2) Factorise x² - 9',
            '   (x - 3)(x + 3)',
            '3) Find the roots of...',
          ].map((line, i) => (
            <div key={i} style={{ fontFamily: '"Caveat", "Bradley Hand", cursive', fontSize: 11, lineHeight: 1.5, color: '#1a1410', opacity: .8 - i*.08 }}>{line}</div>
          ))}
        </div>
      </div>

      {/* Edge detection overlay */}
      <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} viewBox="0 0 360 780" preserveAspectRatio="none">
        <polygon points="55,150 305,140 312,580 48,590" fill="none" stroke="#25D366" strokeWidth="3" strokeDasharray="0" style={{ filter: 'drop-shadow(0 0 6px #25D366)' }}/>
      </svg>

      {/* Top bar — student context */}
      <div style={{ position: 'absolute', top: 56, left: 0, right: 0, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <button style={{ background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: 0, color: '#fff', width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          {IcBack(18, '#fff')}
        </button>
        <div style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '6px 12px 6px 6px', borderRadius: 22, display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: 13, background: BLUE, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 9, flexShrink: 0 }}>TM</div>
          <div style={{ flex: 1, minWidth: 0, lineHeight: 1.15 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Tapiwa Moyo</p>
            <p style={{ fontSize: 9, color: '#22c55e', margin: '1px 0 0', fontWeight: 700, letterSpacing: '.04em' }}>● PAGE 2 OF SUBMISSION</p>
          </div>
        </div>
        <button style={{ background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: 0, color: '#fff', width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          {IcFlash(16, '#facc15')}
        </button>
      </div>

      {/* Edge guide hint */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, textAlign: 'center', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginTop: 90 }}>
          {IcCheck(13, '#fff')} Page detected — hold steady
        </div>
      </div>

      {/* Bottom controls */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 0 46px', background: 'linear-gradient(180deg, transparent, rgba(0,0,0,.88))' }}>
        {/* "Done with student" CTA */}
        <div style={{ padding: '0 16px 14px' }}>
          <button style={{ width: '100%', background: 'rgba(34,197,94,.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: 0, color: '#fff', padding: '11px', borderRadius: 14, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(22,163,74,.4)' }}>
            {IcCheck(16, '#fff', 2.5)} Done — save Tapiwa's submission
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 24px' }}>
          {/* Gallery thumb — pages for THIS student */}
          <button style={{ width: 50, height: 50, borderRadius: 10, border: '2px solid #fff', background: '#1e293b', display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #f9f4e8, #d4c5a8)' }}/>
            <span style={{ position: 'absolute', bottom: -3, right: -3, background: BLUE, color: '#fff', fontSize: 9, fontWeight: 900, borderRadius: 8, padding: '2px 5px' }}>1</span>
          </button>
          {/* Shutter */}
          <button style={{ width: 76, height: 76, borderRadius: 38, background: '#fff', border: '4px solid rgba(255,255,255,.4)', boxShadow: '0 0 0 2px #fff', display: 'grid', placeItems: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: 30, background: '#fff' }}/>
          </button>
          {/* Auto/Manual toggle */}
          <button style={{ width: 50, height: 50, borderRadius: 25, background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: 0, color: '#fff', display: 'grid', placeItems: 'center', position: 'relative' }}>
            {IcZap(20, '#fff')}
            <span style={{ position: 'absolute', bottom: -16, fontSize: 9, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>AUTO</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// SCREEN 4 — PAGE PREVIEW (after capture)
// ──────────────────────────────────────────────
function ScreenPreview() {
  return (
    <div style={{ height: '100%', background: '#0f172a', display: 'flex', flexDirection: 'column', fontFamily: FONT, color: '#fff' }}>
      {/* Top bar */}
      <div style={{ padding: '60px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button style={{ background: 'transparent', border: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600 }}>
          {IcBack(18, '#fff')} Retake
        </button>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Page 5</p>
        <button style={{ background: 'transparent', border: 0, color: BLUE, fontSize: 14, fontWeight: 700 }}>Keep</button>
      </div>

      {/* Captured page (cropped, with edge handles) */}
      <div style={{ flex: 1, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 280, aspectRatio: '3/4' }}>
          {/* Paper */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #fefcf5 0%, #f9f4e8 100%)', borderRadius: 4, boxShadow: '0 18px 40px rgba(0,0,0,.6)' }}>
            <div style={{ padding: '20px 18px', color: '#1a1410' }}>
              <p style={{ fontFamily: '"Caveat", "Bradley Hand", cursive', fontSize: 13, fontWeight: 700, margin: 0 }}>Form 3B · Algebra Quiz</p>
              <p style={{ fontFamily: '"Caveat", "Bradley Hand", cursive', fontSize: 11, margin: '2px 0 12px', color: '#5c4a3a' }}>Tapiwa Moyo</p>
              {['1) Solve x² + 5x + 6 = 0','   x = -2, x = -3','2) Factorise x² - 9','   (x - 3)(x + 3)','3) Find the roots of','   2x² - 8x + 6 = 0','   x = 1, x = 3'].map((line, i) => (
                <div key={i} style={{ fontFamily: '"Caveat", "Bradley Hand", cursive', fontSize: 12, lineHeight: 1.6, color: '#1a1410' }}>{line}</div>
              ))}
            </div>
          </div>
          {/* Crop handles */}
          {[
            { top: -6, left: -6, br: '6 0 0 0' },
            { top: -6, right: -6, br: '0 6 0 0' },
            { bottom: -6, left: -6, br: '0 0 0 6' },
            { bottom: -6, right: -6, br: '0 0 6 0' },
          ].map((p, i) => (
            <div key={i} style={{ position: 'absolute', width: 18, height: 18, background: '#22c55e', borderRadius: p.br + 'px', boxShadow: '0 0 0 2px #fff, 0 0 8px rgba(34,197,94,.6)', ...p }}/>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div style={{ padding: '16px 20px 44px' }}>
        <div style={{ background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 16, padding: 12, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,.15)', display: 'grid', placeItems: 'center' }}>
            {IcCrop(18, '#22c55e')}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>Auto-cropped</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', margin: '2px 0 0' }}>Drag corners to fine-tune</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ flex: 1, background: 'rgba(255,255,255,.1)', border: 0, color: '#fff', padding: '14px', borderRadius: 14, fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {IcRefresh(16, '#fff')} Retake
          </button>
          <button style={{ flex: 1.5, background: BLUE, border: 0, color: '#fff', padding: '14px', borderRadius: 14, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: `0 4px 14px ${BLUE}40` }}>
            {IcCheck(16, '#fff')} Keep page
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// SCREEN 4B — STUDENT SUBMISSION SUMMARY
// ──────────────────────────────────────────────
function ScreenStudentDone() {
  return (
    <div style={{ height: '100%', background: '#f1f5f9', display: 'flex', flexDirection: 'column', fontFamily: FONT, position: 'relative' }}>
      <div style={{ position: 'absolute', top: -80, left: -60, right: -60, height: 240, background: 'radial-gradient(ellipse at center, rgba(34,197,94,.18) 0%, transparent 70%)', pointerEvents: 'none' }}/>

      <div style={{ position: 'relative', padding: '60px 20px 0', textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: 30, background: '#16a34a', display: 'inline-grid', placeItems: 'center', boxShadow: '0 6px 18px rgba(22,163,74,.35), 0 0 0 6px rgba(22,163,74,.1)', marginBottom: 12 }}>
          {IcCheck(30, '#fff', 2.5)}
        </div>
        <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.15em', textTransform: 'uppercase', color: '#15803d', margin: 0 }}>Submission saved</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.025em', color: '#0f172a', margin: '4px 0 0', lineHeight: 1.15 }}>Tapiwa's work is on the web.</h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0' }}>3 pages uploaded · synced to Mrs Moyo</p>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: '#0f172a', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 10 }}>TM</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>Tapiwa Moyo</p>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>3 pages · 4.2 MB</p>
            </div>
            <button style={{ background: 'transparent', border: 0, color: BLUE, fontSize: 12, fontWeight: 700 }}>Edit</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: '3/4', background: 'linear-gradient(160deg, #fefcf5, #f9f4e8)', borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
                <div style={{ padding: '6px 5px' }}>
                  {Array.from({ length: 7 }).map((_, li) => (
                    <div key={li} style={{ height: 1.5, background: '#1a1410', opacity: .32 - li*.03, borderRadius: 1, marginBottom: 2.5, width: `${80 - li*6}%` }}/>
                  ))}
                </div>
                <div style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: 7, background: '#16a34a', display: 'grid', placeItems: 'center' }}>
                  {IcCheck(8, '#fff', 2.5)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', margin: 0 }}>Class progress</p>
            <p style={{ fontSize: 11, fontWeight: 800, color: BLUE, margin: 0 }}>5 / 28</p>
          </div>
          <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${5/28*100}%`, background: BLUE, borderRadius: 3 }}/>
          </div>
          <p style={{ fontSize: 11, color: '#64748b', margin: '8px 0 0' }}>23 students still to shoot</p>
        </div>
      </div>

      <div style={{ marginTop: 'auto', padding: '0 20px 44px' }}>
        <button style={{ width: '100%', background: BLUE, color: '#fff', fontWeight: 700, fontSize: 16, padding: '14px', border: 0, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 14px ${BLUE}40` }}>
          Next student {IcArrow(18, '#fff')}
        </button>
        <button style={{ width: '100%', background: '#fff', color: '#0f172a', fontWeight: 600, fontSize: 14, padding: '12px', border: '1px solid #e2e8f0', borderRadius: 14, marginTop: 8 }}>
          See full batch
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// SCREEN 5 — BATCH GALLERY
// ──────────────────────────────────────────────
function ScreenGallery() {
  const STUDENTS = [
    { name: 'Chipo Ndlovu',  pages: 2, status: 'synced' },
    { name: 'Farai Sibanda', pages: 3, status: 'synced' },
    { name: 'Tatenda Banda', pages: 2, status: 'synced' },
    { name: 'Rumbi Phiri',   pages: 2, status: 'synced' },
    { name: 'Tapiwa Moyo',   pages: 3, status: 'syncing' },
  ];

  return (
    <div style={{ height: '100%', background: '#f1f5f9', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      {/* Header */}
      <div style={{ padding: '60px 20px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button style={{ background: 'transparent', border: 0, color: '#475569', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, padding: 0 }}>
            {IcBack(18, '#475569')} Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dcfce7', borderRadius: 12, padding: '4px 10px' }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: '#16a34a' }}/>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>SYNCED</span>
          </div>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.025em', color: '#0f172a', margin: 0 }}>Algebra Quiz</h1>
        <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Form 3B · 5 of 28 students submitted</p>

        <div style={{ marginTop: 12, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${5/28*100}%`, background: BLUE, borderRadius: 3 }}/>
        </div>
      </div>

      {/* Students grouped */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}>
        {STUDENTS.map(s => {
          const initials = s.name.split(' ').map(n => n[0]).join('');
          return (
            <div key={s.name} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 14, background: '#0f172a', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 10 }}>{initials}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{s.name}</p>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{s.pages} pages</p>
                </div>
                <div style={{ width: 18, height: 18, borderRadius: 9, background: s.status === 'synced' ? '#16a34a' : '#facc15', display: 'grid', placeItems: 'center' }}>
                  {s.status === 'synced' ? IcCheck(10, '#fff', 2.5) : <div style={{ width: 6, height: 6, border: '1.5px solid #fff', borderTopColor: 'transparent', borderRadius: 3, animation: 'spin 1s linear infinite' }}/>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {Array.from({ length: s.pages }).map((_, i) => (
                  <div key={i} style={{ flex: '0 0 44px', aspectRatio: '3/4', background: 'linear-gradient(160deg, #fefcf5, #f9f4e8)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ padding: '4px 3px' }}>
                      {Array.from({ length: 6 }).map((_, li) => (
                        <div key={li} style={{ height: 1.2, background: '#1a1410', opacity: .32 - li*.04, borderRadius: 1, marginBottom: 2, width: `${82 - li*8}%` }}/>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <button style={{ width: '100%', background: '#fff', border: `2px dashed ${BLUE}`, borderRadius: 12, padding: 16, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: BLUE, fontWeight: 700, fontSize: 14 }}>
          {IcPlus(18, BLUE)} Next student
        </button>
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: '12px 20px 44px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
        <button style={{ width: '100%', background: BLUE, color: '#fff', fontWeight: 700, fontSize: 16, padding: '14px', border: 0, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 14px ${BLUE}40` }}>
          Done — review on web {IcArrow(18, '#fff')}
        </button>
        <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: '8px 0 0' }}>Mrs Moyo confirms pages before OCR runs</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// SCREEN 6 — DONE / HANDOFF
// ──────────────────────────────────────────────
function ScreenDone() {
  return (
    <div style={{ height: '100%', background: '#f1f5f9', display: 'flex', flexDirection: 'column', fontFamily: FONT, position: 'relative' }}>
      {/* Soft brand wash */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 320, height: 320, borderRadius: '50%', background: 'rgba(37,99,235,.12)', filter: 'blur(40px)' }}/>
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 320, height: 320, borderRadius: '50%', background: 'rgba(34,197,94,.12)', filter: 'blur(40px)' }}/>
      </div>

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
        {/* Success badge */}
        <div style={{ width: 84, height: 84, borderRadius: 42, background: '#16a34a', display: 'grid', placeItems: 'center', boxShadow: '0 8px 24px rgba(22,163,74,.35), 0 0 0 8px rgba(22,163,74,.1)', marginBottom: 24 }}>
          {IcCheck(40, '#fff', 2.5)}
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.025em', color: '#0f172a', margin: 0 }}>All pages sent</h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: '8px 0 0', maxWidth: 280, lineHeight: 1.5 }}>
          28 pages are now on Mrs Moyo's screen. She'll confirm before OCR runs.
        </p>

        {/* Status card */}
        <div style={{ marginTop: 28, background: '#fff', borderRadius: 16, padding: 18, width: '100%', maxWidth: 320, boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: BLUE, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, fontSize: 13 }}>K</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>Algebra Quiz · Form 3B</p>
              <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>28 pages · 14.2 MB uploaded</p>
            </div>
          </div>
          <div style={{ paddingTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            {IcCloud(14, '#16a34a')}
            <p style={{ fontSize: 11, fontWeight: 700, color: '#15803d', margin: 0 }}>Synced to your dashboard</p>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', padding: '0 20px 44px' }}>
        <button style={{ width: '100%', background: BLUE, color: '#fff', fontWeight: 700, fontSize: 16, padding: '14px', border: 0, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 14px ${BLUE}40` }}>
          {IcPlus(18, '#fff')} New batch
        </button>
        <button style={{ width: '100%', background: 'transparent', color: '#64748b', fontSize: 13, padding: '12px', border: 0, marginTop: 4 }}>
          Disconnect
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// WEB COMPANION — what shows on teacher's screen
// ──────────────────────────────────────────────
function WebOcrCompanion() {
  return (
    <div style={{ fontFamily: FONT, background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 50px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.06)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Browser chrome */}
      <div style={{ background: '#f8fafc', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c }}/>)}
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#64748b', border: '1px solid #e2e8f0' }}>
          kundai.ac.zw/ocr/algebra-quiz-3b
        </div>
      </div>

      {/* OCR page content */}
      <div style={{ flex: 1, padding: '20px 22px', overflow: 'auto', background: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.15em', textTransform: 'uppercase', color: BLUE, margin: 0 }}>OCR · Mark Submissions</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', color: '#0f172a', margin: '4px 0 0' }}>Algebra Quiz — Form 3B</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dcfce7', borderRadius: 10, padding: '5px 10px' }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: '#16a34a', animation: 'pulse 1.5s ease-in-out infinite' }}/>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>PHONE LIVE</span>
          </div>
        </div>

        {/* Two-column: Upload zone + Phone pairing panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14, marginBottom: 16 }}>
          {/* Upload zone */}
          <div style={{ background: '#fff', border: '2px dashed #cbd5e1', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'grid', placeItems: 'center', margin: '0 auto 10px' }}>
              {IcFile(22, BLUE)}
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Drop files or capture from phone</p>
            <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>JPG, PNG or PDF</p>
          </div>

          {/* Phone pairing card */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: `1px solid ${BLUE}33` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              {IcLink(14, BLUE)}
              <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', color: BLUE, margin: 0 }}>Phone paired</p>
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '.06em' }}>Pair code</p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '2px 0 0', letterSpacing: '.15em' }}>4 7 K · 9 2 X</p>
            </div>
            <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>iPhone · Mr Moyo · 12 mins</p>
          </div>
        </div>

        {/* Submissions from phone — grouped by student */}
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '-.01em', color: '#0f172a', margin: 0 }}>Submissions from phone · <span style={{ color: '#64748b' }}>5 of 28 students</span></p>
          <button style={{ background: BLUE, color: '#fff', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 8, border: 0 }}>Confirm & start OCR</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { name: 'Chipo Ndlovu',  pages: 2, syncing: false },
            { name: 'Farai Sibanda', pages: 3, syncing: false },
            { name: 'Tatenda Banda', pages: 2, syncing: false },
            { name: 'Rumbi Phiri',   pages: 2, syncing: false },
            { name: 'Tapiwa Moyo',   pages: 3, syncing: true  },
          ].map(s => {
            const initials = s.name.split(' ').map(n => n[0]).join('');
            return (
              <div key={s.name} style={{ background: '#fff', borderRadius: 10, padding: 10, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 2px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04)', border: s.syncing ? `1.5px solid ${BLUE}55` : '1px solid transparent' }}>
                <div style={{ width: 30, height: 30, borderRadius: 15, background: '#0f172a', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 11, flexShrink: 0 }}>{initials}</div>
                <div style={{ minWidth: 0, flex: '0 0 auto', width: 110 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', margin: 0 }}>{s.name}</p>
                  <p style={{ fontSize: 10, color: s.syncing ? BLUE : '#94a3b8', margin: 0, fontWeight: s.syncing ? 700 : 500 }}>
                    {s.syncing ? '● Uploading…' : `${s.pages} pages · synced`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                  {Array.from({ length: s.pages }).map((_, i) => (
                    <div key={i} style={{ flex: '0 0 34px', aspectRatio: '3/4', background: 'linear-gradient(160deg, #fefcf5, #f9f4e8)', borderRadius: 5, overflow: 'hidden', opacity: s.syncing && i === s.pages - 1 ? .45 : 1 }}>
                      <div style={{ padding: '3px 2px' }}>
                        {Array.from({ length: 6 }).map((_, li) => (
                          <div key={li} style={{ height: 1, background: '#1a1410', opacity: .32 - li*.04, borderRadius: 1, marginBottom: 1.5, width: `${82 - li*8}%` }}/>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ width: 20, height: 20, borderRadius: 10, background: s.syncing ? '#facc15' : '#16a34a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  {s.syncing
                    ? <div style={{ width: 8, height: 8, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: 4, animation: 'spin 1s linear infinite' }}/>
                    : IcCheck(11, '#fff', 2.5)}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14, padding: 12, background: '#eff6ff', borderRadius: 10, border: `1px solid ${BLUE}22`, display: 'flex', alignItems: 'center', gap: 10 }}>
          {IcSpark(16, BLUE)}
          <p style={{ fontSize: 11, color: '#1e3a8a', margin: 0 }}><strong>Tapiwa's submission arriving</strong> · 3 pages · Mr Moyo just hit "Done" on his phone.</p>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Render utility — Android shell (S21 Ultra-ish, ~19.5:9)
// Chrome is overlaid (absolute) so screen content can keep its own
// 60px top / 44px bottom safe-area padding without colliding.
// ──────────────────────────────────────────────
function AndroidPhoneShell({ children, width = 360, height = 780, dark = false }) {
  const c = dark ? '#fff' : '#0f172a';
  return (
    <div style={{
      width, height, borderRadius: 38, overflow: 'hidden', position: 'relative',
      background: dark ? '#000' : '#F2F2F7',
      boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12), 0 0 0 6px #14181c, 0 0 0 7px rgba(255,255,255,0.05)',
      fontFamily: 'Roboto, "Inter Tight", system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Status bar overlay — time left, punch-hole center, icons right */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 36, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px 0', pointerEvents: 'none',
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: c, letterSpacing: 0.2 }}>9:30</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {/* signal */}
          <svg width="14" height="14" viewBox="0 0 16 16"><path d="M8 13.3L.67 5.97a10.37 10.37 0 0114.66 0L8 13.3z" fill={c}/></svg>
          {/* wifi */}
          <svg width="14" height="14" viewBox="0 0 16 16"><path d="M14.67 14.67V1.33L1.33 14.67h13.34z" fill={c}/></svg>
          {/* battery */}
          <svg width="14" height="14" viewBox="0 0 16 16">
            <rect x="3.75" y="2" width="8.5" height="13" rx="1.5" fill={c}/>
            <rect x="5.5" y="0.9" width="5" height="2" rx="0.5" fill={c}/>
          </svg>
        </div>
      </div>
      {/* Punch-hole camera, top-center */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        width: 11, height: 11, borderRadius: 6, background: '#000', zIndex: 60,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset',
      }} />

      {/* Content */}
      <div style={{ width: '100%', height: '100%' }}>
        {children}
      </div>

      {/* Gesture pill */}
      <div style={{
        position: 'absolute', bottom: 8, left: 0, right: 0, zIndex: 60,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none',
      }}>
        <div style={{
          width: 108, height: 4, borderRadius: 2,
          background: dark ? '#fff' : '#0f172a', opacity: 0.55,
        }}/>
      </div>
    </div>
  );
}

function Phone({ children, dark = false }) {
  return (
    <AndroidPhoneShell width={360} height={780} dark={dark}>
      {children}
    </AndroidPhoneShell>
  );
}

window.Phone = Phone;
window.ScreenPair = ScreenPair;
window.ScreenConnected = ScreenConnected;
window.ScreenNewStudent = ScreenNewStudent;
window.ScreenCamera = ScreenCamera;
window.ScreenPreview = ScreenPreview;
window.ScreenStudentDone = ScreenStudentDone;
window.ScreenGallery = ScreenGallery;
window.ScreenDone = ScreenDone;
window.WebOcrCompanion = WebOcrCompanion;
})();
