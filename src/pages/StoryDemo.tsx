import React, { useEffect, useState, useRef, useCallback } from 'react';
import { CheckCircle, ChevronRight, Zap, ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   GLOBAL CSS
───────────────────────────────────────────────────────────────*/
const STORY_CSS = `
  @keyframes sd-slideDown  { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sd-slideUp    { from{opacity:0;transform:translateY(20px)}  to{opacity:1;transform:translateY(0)} }
  @keyframes sd-scaleIn    { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
  @keyframes sd-growBar    { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes sd-fadeUp     { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sd-blink      { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes sd-typingDot  { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
  @keyframes sd-msgPop     { from{opacity:0;transform:scale(.93) translateY(3px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes sd-ringPulse  { 0%{box-shadow:0 0 0 0 rgba(37,99,235,0.5)} 60%{box-shadow:0 0 0 8px rgba(37,99,235,0)} 100%{box-shadow:0 0 0 0 rgba(37,99,235,0)} }

  /*
   * ═══════════════════════════════════════════════════
   *  REAL 3D LAPTOP FOLD
   *  The parent wrapper gets perspective(1400px) so the
   *  rotateX happens in actual 3D space, not flat 2D.
   *  transform-origin sits at the hinge (bottom edge).
   * ═══════════════════════════════════════════════════
   */

  /* Whole laptop body tilts slightly toward viewer first (natural open → close arc) */
  @keyframes sd-laptop-body {
    0%   { transform: rotateX(-4deg) translateY(0px);   }
    15%  { transform: rotateX(-8deg) translateY(-6px);  }
    80%  { transform: rotateX(-4deg) translateY(4px);   }
    100% { transform: rotateX(0deg)  translateY(10px);  opacity:0; }
  }

  /* The lid itself pivots on the hinge — slow ease in, then gravity-accelerated close */
  @keyframes sd-lid-fold {
    0%   { transform: rotateX(0deg);    }
    12%  { transform: rotateX(-6deg);   }   /* brief pause — fingers finding grip */
    30%  { transform: rotateX(-22deg);  }   /* slow opening movement */
    55%  { transform: rotateX(-58deg);  }   /* mid-arc, gravity takes over */
    75%  { transform: rotateX(-83deg);  }   /* approaching closed */
    88%  { transform: rotateX(-88.5deg);}   /* near-close with tiny bounce */
    94%  { transform: rotateX(-87deg);  }   /* bounce back slightly */
    100% { transform: rotateX(-88.8deg);}   /* fully shut */
  }

  /* Screen glare sweeps across as lid falls — a bright diagonal band */
  @keyframes sd-glare-sweep {
    0%   { opacity:0;   transform: translateX(-100%) skewX(-15deg); }
    15%  { opacity:0;   transform: translateX(-100%) skewX(-15deg); }
    40%  { opacity:0.55;transform: translateX(0%)    skewX(-15deg); }
    65%  { opacity:0.3; transform: translateX(60%)   skewX(-15deg); }
    80%  { opacity:0;   transform: translateX(120%)  skewX(-15deg); }
    100% { opacity:0;   transform: translateX(120%)  skewX(-15deg); }
  }

  /* Screen darkens as lid closes (ambient light cut-off) */
  @keyframes sd-screen-dim {
    0%   { background: rgba(0,0,0,0);    }
    20%  { background: rgba(0,0,0,0);    }
    70%  { background: rgba(0,0,0,0.45); }
    100% { background: rgba(0,0,0,0.85); }
  }

  /* Ground shadow shrinks + sharpens as laptop lowers */
  @keyframes sd-ground-shadow {
    0%   { box-shadow: 0 24px 48px -8px rgba(0,0,0,0.38), 0 8px 16px -4px rgba(0,0,0,0.22); transform:scaleX(1);   }
    50%  { box-shadow: 0 12px 24px -4px rgba(0,0,0,0.28), 0 4px  8px -2px rgba(0,0,0,0.16); transform:scaleX(0.92);}
    100% { box-shadow: 0  4px  8px -2px rgba(0,0,0,0.12), 0 1px  3px  0px rgba(0,0,0,0.08); transform:scaleX(0.82);}
  }

  /* Whole assembly fades after close */
  @keyframes sd-laptop-fadeout {
    0%   { opacity:1; transform: translateY(0) scale(1);    }
    100% { opacity:0; transform: translateY(18px) scale(0.96); }
  }

  /*
   * ═══════════════════════════════════════════════════
   *  FLASH BURST
   * ═══════════════════════════════════════════════════
   */
  @keyframes sd-flash-burst {
    0%   { opacity:0;   transform:scale(0.2);  }
    20%  { opacity:1;   transform:scale(1);    }
    60%  { opacity:0.7; transform:scale(1.5);  }
    100% { opacity:0;   transform:scale(2.2);  }
  }
  @keyframes sd-flash-core {
    0%   { opacity:0;   transform:scale(0.1); }
    15%  { opacity:1;   transform:scale(1);   }
    45%  { opacity:0.8; transform:scale(1.3); }
    100% { opacity:0;   transform:scale(1.8); }
  }
  @keyframes sd-spark {
    0%   { opacity:1; transform:var(--spark-t0); }
    60%  { opacity:0.8; }
    100% { opacity:0; transform:var(--spark-t1); }
  }

  /*
   * ═══════════════════════════════════════════════════
   *  PHONE ARRIVAL — genuine physical weight
   *  Starts high, accelerates (gravity), then compresses
   *  on landing like a rubber object hitting a surface.
   * ═══════════════════════════════════════════════════
   */
  @keyframes sd-phone-fall {
    0%   { opacity:0; transform: translateY(-140px) scale(0.82) rotateX(12deg); filter:blur(8px);  }
    18%  { opacity:1; filter:blur(3px); }
    52%  { opacity:1; transform: translateY(14px)   scale(1.02) rotateX(-3deg); filter:blur(0px); }
    66%  { transform: translateY(-7px)  scale(0.99) rotateX(1.5deg); }
    78%  { transform: translateY(4px)   scale(1.005) rotateX(-0.5deg); }
    88%  { transform: translateY(-2px)  scale(1)    rotateX(0.2deg); }
    95%  { transform: translateY(1px)   scale(1)    rotateX(0deg); }
    100% { transform: translateY(0)     scale(1)    rotateX(0deg); opacity:1; filter:blur(0); }
  }

  /* The phone's own cast shadow — appears on landing */
  @keyframes sd-phone-shadow {
    0%,45% { opacity:0;   transform:scaleX(0.5) scaleY(0.3) translateY(20px); }
    65%    { opacity:0.5; transform:scaleX(1.05) scaleY(1.1) translateY(0px);  }
    80%    { opacity:0.35;transform:scaleX(0.95) scaleY(0.9) translateY(2px); }
    100%   { opacity:0.28;transform:scaleX(1)    scaleY(1)   translateY(0);   }
  }

  /* Motion-blur ghost — a faint copy trailing above the phone */
  @keyframes sd-phone-blur-ghost {
    0%   { opacity:0.4; transform:translateY(-28px) scaleX(0.94); filter:blur(5px); }
    40%  { opacity:0.2; transform:translateY(-10px) scaleX(0.97); filter:blur(3px); }
    70%  { opacity:0.05;transform:translateY(-3px)  scaleX(1);    filter:blur(1px); }
    100% { opacity:0;   transform:translateY(0);    filter:blur(0); }
  }

  /* ── Utility classes ── */
  .sd-slide-down  { animation: sd-slideDown .35s cubic-bezier(.34,1.4,.64,1) both; }
  .sd-slide-up    { animation: sd-slideUp   .35s cubic-bezier(.34,1.4,.64,1) both; }
  .sd-scale-in    { animation: sd-scaleIn   .32s cubic-bezier(.34,1.4,.64,1) both; }
  .sd-grow-bar    { transform-origin:left; animation: sd-growBar 1s cubic-bezier(.4,0,.2,1) both; }
  .sd-fade-up     { animation: sd-fadeUp    .3s ease both; }
  .sd-blink-cur   { display:inline-block;width:2px;height:.8em;background:#25D366;vertical-align:middle;margin-left:1px;animation:sd-blink .85s step-end infinite;border-radius:1px; }
  .sd-typing-dot  { display:inline-block;width:5px;height:5px;border-radius:50%;background:#adb5bd;animation:sd-typingDot 1.2s infinite; }
  .sd-typing-dot:nth-child(2){animation-delay:.2s}
  .sd-typing-dot:nth-child(3){animation-delay:.4s}
  .sd-msg-pop     { animation: sd-msgPop .22s cubic-bezier(.34,1.4,.64,1) both; }
  .sd-ring-pulse  { animation: sd-ringPulse 1.3s ease infinite; }
  .sd-flash-el    { animation: sd-flash-burst 0.7s ease-out both; }
  .sd-flash-core  { animation: sd-flash-core  0.6s ease-out both; }

  /* 3D laptop wrapper — perspective lives HERE so children rotate in real 3D */
  .sd-laptop-3d-stage {
    perspective: 1400px;
    perspective-origin: 50% 30%;
  }
  /* The entire laptop body (lid + base together) for the body tilt */
  .sd-laptop-body-anim {
    transform-style: preserve-3d;
    animation: sd-laptop-body 1.55s cubic-bezier(.42,0,.58,1) forwards;
  }
  /* The lid — rotates on the hinge (bottom-center origin) */
  .sd-lid-anim {
    transform-origin: center bottom;
    transform-style: preserve-3d;
    animation: sd-lid-fold 1.55s cubic-bezier(.55,.06,.68,.19) forwards;
    backface-visibility: hidden;
  }
  /* Ground shadow under whole assembly */
  .sd-shadow-anim {
    animation: sd-ground-shadow 1.55s cubic-bezier(.42,0,.58,1) forwards;
  }
  /* Laptop fadeout after lid shuts */
  .sd-laptop-exit {
    animation: sd-laptop-fadeout 0.45s ease-in forwards;
  }

  /* Phone container */
  .sd-phone-stage {
    perspective: 900px;
    perspective-origin: 50% 60%;
  }
  .sd-phone-fall-anim {
    animation: sd-phone-fall 1.1s cubic-bezier(.23,1,.32,1) both;
    transform-style: preserve-3d;
  }
  .sd-phone-ghost {
    animation: sd-phone-blur-ghost 0.9s ease-out both;
    pointer-events: none;
    position: absolute;
    top: 0; left: 0; right: 0;
  }
`;

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────*/
type Scene =
  | 'idle' | 'dashboard' | 'notification' | 'perf-glow'
  | 'perf-panel' | 'twin-panel' | 'confirmed' | 'phone'
  | 'outcome' | 'fading';

/* ─────────────────────────────────────────────────────────────
   LAPTOP SHELL
───────────────────────────────────────────────────────────────*/
type FoldPhase = 'idle' | 'folding' | 'exit';

interface LaptopShellProps {
  children: React.ReactNode;
  foldPhase?: FoldPhase;
}

const LaptopShell: React.FC<LaptopShellProps> = ({ children, foldPhase = 'idle' }) => {
  const folding = foldPhase === 'folding';
  const exiting = foldPhase === 'exit';
  return (
    <div
      className="sd-laptop-3d-stage"
      style={{ position: 'relative', width: 700, margin: '0 auto', userSelect: 'none', fontFamily: 'system-ui, sans-serif' }}
    >
      <div
        className={folding ? 'sd-laptop-body-anim' : exiting ? 'sd-laptop-exit' : undefined}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transformStyle: 'preserve-3d' }}
      >
        {/* Ground shadow */}
        <div
          className={folding ? 'sd-shadow-anim' : undefined}
          style={{ position: 'absolute', bottom: -8, left: '10%', width: '80%', height: 20, borderRadius: '50%', background: 'transparent', boxShadow: '0 24px 48px -8px rgba(0,0,0,0.38), 0 8px 16px -4px rgba(0,0,0,0.22)', zIndex: -1 }}
        />
        {/* Camera */}
        <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: '#bcbdc1', zIndex: 10 }} />
        {/* LID — rotates on hinge */}
        <div
          className={folding ? 'sd-lid-anim' : undefined}
          style={{ position: 'relative', width: 550, transformStyle: 'preserve-3d', transformOrigin: 'center bottom' }}
        >
          {/* Front face: screen */}
          <div style={{ width: 550, height: 340, background: '#89c9e5', border: '15px solid #3f3f41', borderTop: '20px solid #3f3f41', borderRadius: '14px 14px 0 0', boxShadow: '0 0 0 1px #bcbdc1, inset 0 0 0 1px rgba(255,255,255,0.06)', overflow: 'hidden', boxSizing: 'border-box', position: 'relative' }}>
            {children}
            {folding && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 30, animation: 'sd-screen-dim 1.55s cubic-bezier(.42,0,.58,1) forwards', pointerEvents: 'none' }} />
            )}
            {folding && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 31, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '-60%', width: '55%', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 45%, rgba(255,255,255,0.45) 55%, transparent 100%)', animation: 'sd-glare-sweep 1.55s cubic-bezier(.42,0,.58,1) forwards' }} />
              </div>
            )}
          </div>
          {/* Back face: lid exterior (visible at steep angles during rotation) */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #2a2a2e 0%, #1a1a1d 100%)', borderRadius: '14px 14px 0 0', border: '15px solid #3f3f41', borderTop: '20px solid #3f3f41', boxSizing: 'border-box', transform: 'rotateX(180deg) translateZ(2px)', backfaceVisibility: 'visible', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }} />
        </div>
        {/* BASE */}
        <div style={{ position: 'relative', width: 700 }}>
          <div style={{ width: '100%', height: 10, background: '#2a2a2d', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 80, height: 10, background: '#1a1a1d', borderRadius: '0 0 6px 6px' }} />
          <div style={{ width: '100%', height: 10, background: '#1d1d1f', borderRadius: '0 0 10px 10px' }} />
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────────────────────────*/
const NAV_TABS = [
  { label: 'Home',        active: true,  d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { label: 'Classroom',   active: false, d: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z' },
  { label: 'Assessments', active: false, d: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 3h6v4H9z M9 12h6 M9 16h4' },
  { label: 'Staffroom',   active: false, d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6' },
  { label: 'Calendar',    active: false, d: 'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18' },
  { label: 'Analytics',   active: false, d: 'M18 20V10 M12 20V4 M6 20v-6' },
];

const STAFF = [
  { i: 'JD', n: 'John Dube',       t: '10:25' },
  { i: 'DG', n: 'David Gumbo',     t: '09:55' },
  { i: 'TS', n: 'Thembani Shumba', t: '08:17' },
  { i: 'TM', n: 'Thabani Moyo',    t: '07:48' },
];

const PERF_STUDENTS = [
  { n: 'Chipo Ndlovu',  s: 92, f: false },
  { n: 'Farai Sibanda', s: 81, f: false },
  { n: 'Tatenda Banda', s: 64, f: false },
  { n: 'Tapiwa Moyo',   s: 38, f: true  },
];

const TWIN_ATTRS = [
  { l: 'Real Numbers', v: 10 }, { l: 'Sets', v: 10 },
  { l: 'Financial Mat.', v: 10 }, { l: 'Graphs', v: 10 },
  { l: 'Algebra', v: 10 }, { l: 'Geometry', v: 10 },
  { l: 'Statistics', v: 10 },
];

const CAL_DAYS = [
  { d: 'Sat', n: '16', active: true },
  { d: 'Sun', n: '17' }, { d: 'Mon', n: '18' }, { d: 'Tue', n: '19' },
  { d: 'Wed', n: '20' }, { d: 'Thu', n: '21' }, { d: 'Fri', n: '22' },
];

interface DashboardProps { perfGlowing?: boolean; twinGlowing?: boolean }

const Dashboard: React.FC<DashboardProps> = ({ perfGlowing, twinGlowing }) => (
  <div style={{ width: '100%', height: '100%', background: '#1976d2', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }}>
    <div style={{ flexShrink: 0, padding: '6px 8px 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#111', display: 'grid', placeItems: 'center', color: 'white', fontSize: 7, fontWeight: 900, flexShrink: 0, position: 'relative', zIndex: 2, marginRight: -18 }}>PM</div>
            <div style={{ background: 'white', padding: '0px 22px 3px 25px', clipPath: 'polygon(0 0,100% 0,90% 100%,0 100%)', width: 90, position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: 8, fontWeight: 900, color: '#111', lineHeight: 1.2, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>MRS. MATHE</p>
              <p style={{ fontSize: 6.5, color: '#2563eb', fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap' }}>Mathematics ▾</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ position: 'relative', background: '#e5e7eb', borderRadius: 5, width: 20, height: 20, display: 'grid', placeItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' }}>
              <svg width="10" height="10" fill="none" stroke="#374151" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <div style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'grid', placeItems: 'center', color: 'white', fontSize: 4, fontWeight: 900 }}>1</div>
            </div>
            <div style={{ background: '#e5e7eb', borderRadius: 5, width: 20, height: 20, display: 'grid', placeItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' }}>
              <svg width="10" height="10" fill="none" stroke="#374151" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <div style={{ position: 'relative', background: '#e5e7eb', borderRadius: 5, width: 20, height: 20, display: 'grid', placeItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' }}>
            <svg width="10" height="10" fill="none" stroke="#374151" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <div style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'grid', placeItems: 'center', color: 'white', fontSize: 4, fontWeight: 900 }}>1</div>
          </div>
          <div style={{ background: '#e5e7eb', borderRadius: 5, width: 20, height: 20, display: 'grid', placeItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' }}>
            <svg width="10" height="10" fill="none" stroke="#374151" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        {NAV_TABS.map(t => (
          <div key={t.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 5, background: t.active ? '#2563eb' : '#e5e7eb', boxShadow: t.active ? '0 2px 4px rgba(37,99,235,0.3)' : '0 1px 2px rgba(0,0,0,0.08)', fontSize: 6, fontWeight: 900, color: t.active ? 'white' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            <svg width="8" height="8" fill="none" stroke={t.active ? 'white' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={t.d} /></svg>
            {t.label}
          </div>
        ))}
      </div>
    </div>
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 6, minHeight: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
        <div style={{ background: '#f0f4f8', borderRadius: 8, padding: '8px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', flex: '2 1 0', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <p style={{ fontSize: 11, fontWeight: 900, color: '#111' }}>May 2026</p>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'black', display: 'grid', placeItems: 'center', color: 'white', fontSize: 9, fontWeight: 700 }}>+</div>
          </div>
          <div style={{ display: 'flex', gap: 2, marginBottom: 3 }}>
            {CAL_DAYS.map(d => (<div key={d.n} style={{ flex: d.active ? 2 : 1, textAlign: 'center', fontSize: 6, fontWeight: 700, color: '#9ca3af', paddingBottom: 2 }}>{d.d[0]}</div>))}
          </div>
          <div style={{ display: 'flex', gap: 2, flex: 1 }}>
            {CAL_DAYS.map(d => (
              <div key={d.n} style={{ flex: d.active ? 2 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 0', borderRadius: 5, background: d.active ? '#1565c0' : 'transparent' }}>
                <span style={{ fontSize: d.active ? 12 : 9, fontWeight: d.active ? 900 : 700, color: d.active ? 'white' : '#4b5563', lineHeight: 1 }}>{d.n}</span>
                {d.active && <p style={{ fontSize: 5, color: 'rgba(255,255,255,0.75)', marginTop: 2, textAlign: 'center', lineHeight: 1.2 }}>No upcoming<br />events today.</p>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flex: '3 1 0', minHeight: 0 }}>
          <div style={{ flex: 1, background: '#f0f4f8', borderRadius: 8, padding: '8px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: '#111', marginBottom: 6 }}>Staff Room</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden', flex: 1 }}>
              {STAFF.map(s => (
                <div key={s.i} style={{ display: 'flex', alignItems: 'center', gap: 5, paddingBottom: 4, borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#111', display: 'grid', placeItems: 'center', color: 'white', fontSize: 6, fontWeight: 900, flexShrink: 0 }}>{s.i}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 7, fontWeight: 700, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.n}</p>
                    <p style={{ fontSize: 6, color: '#9ca3af', fontStyle: 'italic' }}>"Sir, I have a question..."</p>
                  </div>
                  <span style={{ fontSize: 6, color: '#9ca3af', flexShrink: 0 }}>{s.t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={perfGlowing ? 'sd-ring-pulse' : undefined} style={{ flex: 1, background: '#f0f4f8', borderRadius: 8, padding: '8px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: '#111', marginBottom: 6 }}>Performance</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden', flex: 1 }}>
              {PERF_STUDENTS.map(st => (
                <div key={st.n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4, borderBottom: '1px solid #f3f4f6' }}>
                  <p style={{ fontSize: 8, fontWeight: st.f ? 900 : 500, color: st.f ? '#dc2626' : '#374151' }}>{st.n}</p>
                  <span style={{ fontSize: 8, fontWeight: 700, color: st.f ? '#dc2626' : '#374151' }}>{st.s}%</span>
                </div>
              ))}
              <p style={{ fontSize: 7, color: '#9ca3af', fontStyle: 'italic', marginTop: 2 }}>No assessments found for this course</p>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
        <div className={twinGlowing ? 'sd-ring-pulse' : undefined} style={{ background: '#f0f4f8', borderRadius: 8, padding: '6px 8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', flex: '1 1 0', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', color: '#111', textAlign: 'center', marginBottom: 4, flexShrink: 0 }}>Student Development</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#111', display: 'grid', placeItems: 'center', color: 'white', fontSize: 8, fontWeight: 900, flexShrink: 0 }}>LM</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#111', lineHeight: 1.1 }}>Mavhuku <span style={{ fontWeight: 400, color: '#6b7280' }}>Leeroy</span></p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1, color: '#111' }}>10</span>
                <span style={{ fontSize: 7, fontWeight: 700, color: '#9ca3af' }}>OVR</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 6.5, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Form 3</p>
              <p style={{ fontSize: 6.5, color: '#3b82f6', fontWeight: 900, textTransform: 'uppercase', marginTop: 2 }}>0 Plans</p>
              <p style={{ fontSize: 6.5, color: '#10b981', fontWeight: 900, textTransform: 'uppercase' }}>None Active</p>
            </div>
          </div>
          <div style={{ marginBottom: 4, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 6, fontWeight: 700, color: '#9ca3af', marginBottom: 2 }}>
              <span>Current: 10%</span><span>Potential: 90%</span>
            </div>
            <div style={{ background: '#e5e7eb', borderRadius: 99, height: 4, overflow: 'hidden' }}>
              <div style={{ width: '11%', background: '#22c55e', height: 4, borderRadius: 99 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'auto auto', flex: 1, minHeight: 0, alignContent: 'center', gap: '2px 0' }}>
            {TWIN_ATTRS.map(a => (<p key={`n-${a.l}`} style={{ fontSize: 5, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word', margin: 0 }}>{a.l}</p>))}
            {TWIN_ATTRS.map(a => (<p key={`v-${a.l}`} style={{ fontSize: 8, fontWeight: 900, color: '#ef4444', textAlign: 'center', margin: 0 }}>{a.v}%</p>))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flex: '1 1 0', minHeight: 0 }}>
          {[{ l: 'RESOURCES', s: 'Syllabus & Materials' }, { l: 'GRADING', s: 'Review Submissions' }].map(b => (
            <div key={b.l} style={{ flex: 1, background: '#f0f4f8', borderRadius: 8, padding: 10, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 0 }}>
              <p style={{ fontSize: 9, fontWeight: 900, color: '#111', textTransform: 'uppercase' }}>{b.l}</p>
              <p style={{ fontSize: 7, color: '#9ca3af' }}>{b.s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   BACKDROP
───────────────────────────────────────────────────────────────*/
const Backdrop: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(15,23,42,0.38)' }} />
);

/* ─────────────────────────────────────────────────────────────
   SCENE: Notification
───────────────────────────────────────────────────────────────*/
const SceneNotification: React.FC = () => (
  <>
    <Backdrop />
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', justifyContent: 'flex-end', padding: '10px 12px 0 0' }}>
      <div className="sd-slide-down" style={{ background: 'white', borderRadius: 10, overflow: 'hidden', width: 210, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ background: '#059669', padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,.2)', display: 'grid', placeItems: 'center' }}>
              <CheckCircle size={13} color="white" />
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 900, fontSize: 10 }}>Algebra Test Auto-Graded</p>
              <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 8, fontWeight: 600 }}>38 submissions · 4 seconds</p>
            </div>
          </div>
        </div>
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div className="sd-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', borderRadius: 5, padding: '5px 7px' }}>
            <Zap size={10} color="#2563eb" />
            <p style={{ fontSize: 9, fontWeight: 600, color: '#374151' }}>Marked in <strong>4 seconds</strong></p>
          </div>
          <div className="sd-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fffbeb', borderRadius: 5, padding: '5px 7px', animationDelay: '120ms' }}>
            <AlertTriangle size={10} color="#d97706" />
            <p style={{ fontSize: 9, fontWeight: 600, color: '#92400e' }}><strong>4 students flagged</strong></p>
          </div>
        </div>
        <div style={{ padding: '0 12px 10px', display: 'flex', gap: 6 }}>
          <button style={{ flex: 1, fontSize: 9, fontWeight: 700, padding: '6px 0', borderRadius: 6, background: '#f3f4f6', color: '#6b7280', border: 'none' }}>Close</button>
          <button style={{ flex: 1, fontSize: 9, fontWeight: 700, padding: '6px 0', borderRadius: 6, background: '#2563eb', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            View <ChevronRight size={9} />
          </button>
        </div>
      </div>
    </div>
  </>
);

/* ─────────────────────────────────────────────────────────────
   SCENE: Performance panel
───────────────────────────────────────────────────────────────*/
const PERF_ROWS = [
  { name: 'Chipo Ndlovu',  score: 92, w: '92%', c: '#22c55e', f: false },
  { name: 'Farai Sibanda', score: 81, w: '81%', c: '#22c55e', f: false },
  { name: 'Tatenda Banda', score: 64, w: '64%', c: '#3b82f6', f: false },
  { name: 'Tapiwa Moyo',   score: 38, w: '38%', c: '#ef4444', f: true  },
];

const ScenePerfPanel: React.FC = () => (
  <>
    <Backdrop />
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 12px' }}>
      <div className="sd-slide-up" style={{ background: 'white', borderRadius: 12, overflow: 'hidden', width: '60%', boxShadow: '0 16px 50px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#1f2937' }}>Performance · Form 3B</p>
            <p style={{ fontSize: 8, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', marginTop: 1 }}>Quadratics Test</p>
          </div>
          <span style={{ fontSize: 7, fontWeight: 700, background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: 3 }}>LATEST</span>
        </div>
        <div style={{ padding: '6px 14px' }}>
          {PERF_ROWS.map(st => (
            <div key={st.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 7px', borderRadius: 6, marginBottom: 3, background: st.f ? '#fef2f2' : 'transparent', border: `1px solid ${st.f ? '#fecaca' : 'transparent'}` }}>
              <p style={{ flex: 1, fontSize: 10, fontWeight: st.f ? 900 : 500, color: st.f ? '#b91c1c' : '#374151' }}>{st.name}</p>
              <div style={{ width: 64, background: '#e5e7eb', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                <div className="sd-grow-bar" style={{ width: st.w, background: st.c, height: 5, borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: st.f ? '#b91c1c' : '#374151', minWidth: 26, textAlign: 'right' }}>{st.score}%</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '7px 14px 10px', background: '#f9fafb', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: 9, color: '#6b7280', fontWeight: 600 }}>
            Class avg: <strong style={{ color: '#1f2937' }}>71%</strong>{' '}
            <span style={{ color: '#ef4444', fontWeight: 900 }}>· Tapiwa 33pts below</span>
          </p>
        </div>
      </div>
    </div>
  </>
);

/* ─────────────────────────────────────────────────────────────
   SCENE: Digital twin panel
───────────────────────────────────────────────────────────────*/
const TWIN_SUBS = [
  { l: 'Algebra',      v: 82, c: '#22c55e', delay: '150ms' },
  { l: 'Geometry',     v: 64, c: '#3b82f6', delay: '280ms' },
  { l: 'Trigonometry', v: 71, c: '#3b82f6', delay: '410ms' },
  { l: 'Statistics',   v: 38, c: '#ef4444', delay: '540ms', low: true },
];

const SceneTwinPanel: React.FC<{ approved?: boolean }> = ({ approved }) => (
  <>
    <Backdrop />
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="sd-scale-in" style={{ background: 'white', borderRadius: 12, overflow: 'hidden', width: '60%', boxShadow: '0 16px 50px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#111', color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 900, flexShrink: 0 }}>TM</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 900, color: '#111' }}>Tapiwa Moyo</p>
            <p style={{ fontSize: 8, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>Form 3 · Digital Twin · OVR 78</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 8, color: '#3b82f6', fontWeight: 900, textTransform: 'uppercase' }}>3 Plans</p>
            <p style={{ fontSize: 8, color: '#10b981', fontWeight: 900, textTransform: 'uppercase', marginTop: 2 }}>Active · Algebra</p>
          </div>
        </div>
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {TWIN_SUBS.map(s => (
            <div key={s.l} className="sd-fade-up" style={{ animationDelay: s.delay }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{s.l}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <p style={{ fontSize: 9, fontWeight: 900, color: s.v < 50 ? '#b91c1c' : s.v < 70 ? '#2563eb' : '#059669' }}>{s.v}%</p>
                  {s.low && <span style={{ fontSize: 7, fontWeight: 900, color: '#b91c1c', background: '#fef2f2', padding: '1px 5px', borderRadius: 3 }}>LOW</span>}
                </div>
              </div>
              <div style={{ width: '100%', background: '#e5e7eb', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                <div className="sd-grow-bar" style={{ width: `${s.v}%`, background: s.c, height: 4, borderRadius: 99, animationDelay: s.delay }} />
              </div>
            </div>
          ))}
        </div>
        <div className="sd-fade-up" style={{ margin: '0 14px 8px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '7px 10px', animationDelay: '750ms' }}>
          <p style={{ fontSize: 8, fontWeight: 900, color: '#92400e', textTransform: 'uppercase', marginBottom: 2 }}>KundAI detected a gap</p>
          <p style={{ fontSize: 9, color: '#b45309' }}>Stats 38% — 33pts below class avg. Weak on probability trees.</p>
        </div>
        <div style={{ margin: '0 14px 8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '7px 10px' }}>
          <p style={{ fontSize: 9, fontWeight: 900, color: '#14532d', marginBottom: 4 }}>Plan generated — 14 steps · Statistics focus</p>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['Probability trees', 'Data interpretation', 'Past papers'].map(t => (
              <span key={t} style={{ fontSize: 7, fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 99 }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ padding: '0 14px 12px', display: 'flex', gap: 8 }}>
          <button style={{ flex: 1, fontSize: 10, fontWeight: 700, padding: '7px 0', borderRadius: 7, background: '#f3f4f6', color: '#6b7280', border: 'none' }}>Review Plan</button>
          <button style={{ flex: 1, fontSize: 10, fontWeight: 700, padding: '7px 0', borderRadius: 7, background: approved ? '#059669' : '#2563eb', color: 'white', border: 'none', transition: 'background .3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            {approved ? '✓ Approved' : <><span>Approve Plan</span><ArrowRight size={11} /></>}
          </button>
        </div>
      </div>
    </div>
  </>
);

/* ─────────────────────────────────────────────────────────────
   SCENE: Confirmed
───────────────────────────────────────────────────────────────*/
const SceneConfirmed: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'flex-end', padding: '0 0 10px 10px' }}>
    <div className="sd-slide-up" style={{ background: 'white', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, maxWidth: 230, border: '1px solid #bbf7d0', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: '#dcfce7', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <CheckCircle size={13} color="#16a34a" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 900, color: '#111' }}>Tapiwa's Plan Activated</p>
        <p style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>ETA: 3 days to first checkpoint</p>
        <div style={{ display: 'flex', gap: 3, marginTop: 6, flexWrap: 'wrap' }}>
          {[['14 steps', '#dcfce7', '#166534'], ['Stats focus', '#dbeafe', '#1e40af'], ['WhatsApp active', '#ede9fe', '#5b21b6']].map(([label, bg, color]) => (
            <span key={label} style={{ fontSize: 7, fontWeight: 900, background: bg, color, padding: '2px 5px', borderRadius: 99, textTransform: 'uppercase' }}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   SCENE: Outcome
───────────────────────────────────────────────────────────────*/
const SceneOutcome: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'white', display: 'flex', flexDirection: 'column', padding: '14px 18px', fontFamily: 'system-ui, sans-serif' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 10, borderBottom: '1px solid #f3f4f6', marginBottom: 12 }}>
      <div style={{ width: 20, height: 20, borderRadius: 5, background: '#2563eb', display: 'grid', placeItems: 'center', color: 'white', fontSize: 9, fontWeight: 900 }}>K</div>
      <span style={{ fontSize: 9, fontWeight: 700, color: '#1f2937' }}>FORM 3B · MATHEMATICS</span>
    </div>
    <div className="sd-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', whiteSpace: 'nowrap' }}>3 days later</p>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
    </div>
    <div className="sd-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f9fafb', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#111', color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>TM</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>Tapiwa Moyo</p>
        <p style={{ fontSize: 8, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>Statistics · Day 3 of 14</p>
      </div>
      <span style={{ fontSize: 8, fontWeight: 900, color: '#059669', background: '#dcfce7', padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' }}>On track</span>
    </div>
    <div className="sd-fade-up" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <p style={{ fontSize: 9, fontWeight: 900, color: '#374151', textTransform: 'uppercase' }}>Statistics score</p>
        <p style={{ fontSize: 11, fontWeight: 900, color: '#059669' }}>61%</p>
      </div>
      <div style={{ position: 'relative', width: '100%', background: '#e5e7eb', borderRadius: 99, height: 10, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '70%', width: 2, background: '#93c5fd', zIndex: 1 }} />
        <div className="sd-grow-bar" style={{ width: '61%', background: '#22c55e', height: 10, borderRadius: 99 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <p style={{ fontSize: 9, color: '#ef4444', fontWeight: 700 }}>Start: 38%</p>
        <p style={{ fontSize: 9, color: '#3b82f6', fontWeight: 700 }}>Target: 70%</p>
      </div>
    </div>
    <div className="sd-fade-up" style={{ marginTop: 'auto', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
        <TrendingUp size={12} color="#16a34a" />
        <p style={{ fontSize: 11, fontWeight: 900, color: '#14532d' }}>+23 points in 3 days</p>
      </div>
      <p style={{ fontSize: 9, color: '#166534' }}>Plan active · 11 days remaining · On track for 70%</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   WHATSAPP PHONE
───────────────────────────────────────────────────────────────*/
interface WaMessage {
  id: number; from: 'kundai' | 'tapiwa';
  text: string; time: string;
  typed: string; done: boolean;
}

const WA_MESSAGES: Omit<WaMessage, 'typed' | 'done'>[] = [
  { id: 1, from: 'kundai',  text: 'Hie Tapiwa! 👋', time: '10:42 AM' },
  { id: 2, from: 'kundai',  text: 'Your KundAI has flagged something important regarding your Statistics performance. 📊', time: '10:42 AM' },
  { id: 3, from: 'kundai',  text: 'MISSION BRIEFING\n\nAgent Tapiwa, your Statistics score has dropped to 38%. We have assembled a 14-step plan specifically for you.', time: '10:42 AM' },
  { id: 4, from: 'kundai',  text: 'Your mission:\n\n✅ Probability trees — 5 sessions\n✅ Data interpretation — 4 sessions\n✅ Past paper drills — 5 sessions', time: '10:43 AM' },
  { id: 5, from: 'tapiwa',  text: "Mission accepted. Let's go! 🔥", time: '10:43 AM' },
  { id: 6, from: 'kundai',  text: 'Outstanding. Session 1: Probability Trees.\n\nP(Heads) = ½ · P(Tails) = ½\n\nIf P(rain) = 0.4, what is P(no rain)? Reply with your answer. 🎯', time: '10:44 AM' },
];

const PhoneMockup: React.FC<{ started: boolean; onComplete?: () => void }> = ({ started, onComplete }) => {
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [status, setStatus] = useState('Your academic assistant');
  const [showTyping, setShowTyping] = useState(false);
  const seqRef = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!started || seqRef.current) return;
    seqRef.current = true;
    let cursor = 0;

    const typeMsg = (msgId: number, fullText: string, resolve: () => void) => {
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, typed: fullText.slice(0, i), done: i >= fullText.length } : m));
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        if (i >= fullText.length) { clearInterval(iv); resolve(); }
      }, 16);
    };

    const runNext = () => {
      if (cursor >= WA_MESSAGES.length) { setStatus('online'); setShowTyping(false); onComplete?.(); return; }
      const cfg = WA_MESSAGES[cursor++];
      setStatus('typing...'); setShowTyping(true);
      setTimeout(() => {
        setShowTyping(false);
        setMessages(prev => [...prev, { ...cfg, typed: '', done: false }]);
        setTimeout(() => new Promise<void>(res => typeMsg(cfg.id, cfg.text, res)).then(() => setTimeout(runNext, cfg.from === 'tapiwa' ? 600 : 800)), 80);
      }, cfg.from === 'tapiwa' ? 900 : 1300);
    };

    setTimeout(runNext, 400);
  }, [started, onComplete]);

  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [messages, showTyping]);

  return (
    /* 3D stage: perspective on outermost, phone body rotates inside */
    <div className="sd-phone-stage" style={{ fontFamily: 'system-ui, sans-serif', position: 'relative' }}>
      {/* Motion-blur ghost — blurred copy that fades out first */}
      <div className="sd-phone-ghost" aria-hidden>
        <div style={{ width: 200, margin: '0 auto', height: 390, borderRadius: 24, background: 'linear-gradient(180deg,#2a2a3e 0%,#1a1a2e 100%)', opacity: 0.6 }} />
      </div>
      {/* Phone body — actual 3D drop-in */}
      <div className="sd-phone-fall-anim" style={{ position: 'relative' }}>
        <div style={{ width: 200, margin: '0 auto', position: 'relative' }}>
          <div style={{ background: '#1a1a2e', borderRadius: '24px 24px 0 0', padding: '8px 14px 5px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 44, height: 4, borderRadius: 3, background: '#333' }} />
          </div>
          <div style={{ background: '#e5ddd5', borderLeft: '2.5px solid #1a1a2e', borderRight: '2.5px solid #1a1a2e', display: 'flex', flexDirection: 'column', height: 360, overflow: 'hidden' }}>
            <div style={{ background: '#075e54', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#25D366', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#075e54' }}>K</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'white', margin: 0 }}>KundAI</p>
                <p style={{ fontSize: 8, color: 'rgba(255,255,255,.7)', margin: 0 }}>{status}</p>
              </div>
            </div>
            <div ref={bodyRef} style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', scrollbarWidth: 'none' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 8, background: 'rgba(0,0,0,.1)', color: '#555', padding: '2px 8px', borderRadius: 12 }}>Today</span>
              </div>
              {messages.map(msg => (
                <div key={msg.id} className="sd-msg-pop" style={{ display: 'flex', justifyContent: msg.from === 'tapiwa' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '82%' }}>
                    <div style={{ background: msg.from === 'tapiwa' ? '#dcf8c6' : 'white', borderRadius: msg.from === 'tapiwa' ? '8px 0 8px 8px' : '0 8px 8px 8px', padding: '6px 8px' }}>
                      <p style={{ fontSize: 10, color: '#111', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                        {msg.typed}{!msg.done && <span className="sd-blink-cur" />}
                      </p>
                    </div>
                    <p style={{ fontSize: 8, color: '#94a3b8', margin: '2px 3px 0', textAlign: msg.from === 'tapiwa' ? 'right' : 'left' }}>{msg.time}</p>
                  </div>
                </div>
              ))}
              {showTyping && (
                <div className="sd-msg-pop" style={{ display: 'flex' }}>
                  <div style={{ background: 'white', borderRadius: '0 8px 8px 8px', padding: '7px 10px', display: 'flex', gap: 3, alignItems: 'center' }}>
                    <span className="sd-typing-dot" /><span className="sd-typing-dot" /><span className="sd-typing-dot" />
                  </div>
                </div>
              )}
            </div>
            <div style={{ background: '#f0f0f0', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, borderTop: '.5px solid #d0d0d0' }}>
              <div style={{ flex: 1, background: 'white', borderRadius: 16, padding: '4px 10px' }}>
                <p style={{ fontSize: 9, color: '#aaa', margin: 0 }}>Type a message</p>
              </div>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#25D366', display: 'grid', placeItems: 'center' }}>
                <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              </div>
            </div>
          </div>
          <div style={{ background: '#1a1a2e', borderRadius: '0 0 24px 24px', padding: '6px 14px 10px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 60, height: 3, borderRadius: 3, background: '#444' }} />
          </div>
          {/* Phone's own drop-shadow — blooms on landing */}
          <div style={{ position: 'absolute', bottom: -18, left: '10%', width: '80%', height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.28)', filter: 'blur(8px)', animation: 'sd-phone-shadow 1.1s cubic-bezier(.23,1,.32,1) both' }} />
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   FLASH BURST OVERLAY
   Rendered at the exact moment the laptop disappears —
   a radial white ring expands from centre then fades.
───────────────────────────────────────────────────────────────*/
const FlashBurst: React.FC = () => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      zIndex: 50,
    }}
  >
    {/* outer ring */}
    <div
      className="sd-flash-el"
      style={{
        position: 'absolute',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 40%, transparent 70%)',
      }}
    />
    {/* inner bright core */}
    <div
      className="sd-flash-el"
      style={{
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 50%, transparent 75%)',
        animationDelay: '30ms',
      }}
    />
    {/* particle sparks — 8 small dots */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
      <div
        key={deg}
        className="sd-flash-el"
        style={{
          position: 'absolute',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'white',
          transform: `rotate(${deg}deg) translateY(-120px)`,
          animationDelay: `${40 + deg * 0.5}ms`,
          opacity: 0,
        }}
      />
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   SEQUENCER HOOK
───────────────────────────────────────────────────────────────*/

// Swap sub-states — maps to LaptopShell foldPhase + phone visibility
type SwapPhase = 'none' | 'folding' | 'exit' | 'flash' | 'phone-in';

function useSequencer(visible: boolean) {
  const [scene, setScene] = useState<Scene>('idle');
  const [swapPhase, setSwapPhase] = useState<SwapPhase>('none');
  const [phoneStarted, setPhoneStarted] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  const [twinApproved, setTwinApproved] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = useCallback(() => { timers.current.forEach(clearTimeout); timers.current = []; }, []);
  const after = useCallback((ms: number, fn: () => void) => { const id = setTimeout(fn, ms); timers.current.push(id); }, []);

  const triggerSwap = useCallback(() => {
    // Stage 1: 3D lid fold — 1550ms (real weight, gravity-accelerated)
    setSwapPhase('folding');
    after(1400, () => {
      // Stage 1b: lid is fully closed — whole laptop exits down
      setSwapPhase('exit');
      after(300, () => {
        // Stage 2: flash burst at moment of disappearance
        setSwapPhase('flash');
        after(120, () => {
          // Stage 3: phone drops in with elastic landing — 1100ms
          setSwapPhase('phone-in');
          setScene('phone');
          setPhoneStarted(true);
        });
      });
    });
  }, [after]);

  const runSequence = useCallback(() => {
    clearAll();
    setTwinApproved(false);
    setSwapPhase('none');
    setScene('dashboard');
    after(1800,  () => setScene('notification'));
    after(5000,  () => setScene('perf-glow'));
    after(6400,  () => setScene('perf-panel'));
    after(10200, () => setScene('twin-panel'));
    after(11500, () => setTwinApproved(true));
    after(14200, () => setScene('confirmed'));
    // Cinematic swap begins here instead of directly going to 'phone'
    after(16800, triggerSwap);
  }, [clearAll, after, triggerSwap]);

  const hasStarted = useRef(false);
  useEffect(() => {
    if (!visible || hasStarted.current) return;
    hasStarted.current = true;
    after(400, runSequence);
  }, [visible, runSequence, after]);

  const handlePhoneComplete = useCallback(() => {
    after(2000, () => {
      setScene('outcome');
      after(3500, () => {
        setScene('fading');
        after(600, () => {
          clearAll();
          setPhoneStarted(false);
          setSwapPhase('none');
          setRestartKey(k => k + 1);
          setScene('idle');
          after(200, runSequence);
        });
      });
    });
  }, [after, clearAll, runSequence]);

  useEffect(() => () => clearAll(), [clearAll]);
  return { scene, swapPhase, phoneStarted, restartKey, twinApproved, handlePhoneComplete };
}

/* ─────────────────────────────────────────────────────────────
   SCREEN CONTENT
───────────────────────────────────────────────────────────────*/
const ScreenContent: React.FC<{ scene: Scene; twinApproved: boolean }> = ({ scene, twinApproved }) => (
  <>
    <Dashboard perfGlowing={scene === 'perf-glow'} twinGlowing={scene === 'twin-panel'} />
    {scene === 'notification' && <SceneNotification />}
    {scene === 'perf-panel'   && <ScenePerfPanel />}
    {scene === 'twin-panel'   && <SceneTwinPanel approved={twinApproved} />}
    {scene === 'confirmed'    && <SceneConfirmed />}
    {(scene === 'outcome' || scene === 'fading') && <SceneOutcome />}
  </>
);

/* ─────────────────────────────────────────────────────────────
   STEP STRIP
───────────────────────────────────────────────────────────────*/
const STEPS: { id: Scene; label: string }[] = [
  { id: 'dashboard',    label: 'Dashboard'   },
  { id: 'notification', label: 'Auto-graded' },
  { id: 'perf-glow',   label: 'Flagged'      },
  { id: 'perf-panel',  label: 'Performance'  },
  { id: 'twin-panel',  label: 'Twin'         },
  { id: 'confirmed',   label: 'Approved'     },
  { id: 'phone',       label: 'Notified'     },
  { id: 'outcome',     label: 'Outcome'      },
];

const LABELS: Partial<Record<Scene, string>> = {
  dashboard:    'Teacher opens the dashboard',
  notification: 'Auto-grade complete — 38 submissions in 4 seconds',
  'perf-glow':  'Performance panel flagging Tapiwa',
  'perf-panel': 'Tapiwa flagged — 33pts below class average',
  'twin-panel': 'Digital twin — plan approved',
  confirmed:    'Plan activated — WhatsApp incoming',
  phone:        'Teaching Tapiwa live on WhatsApp',
  outcome:      'Tapiwa: 38% → 61% in 3 days',
  fading:       'Tapiwa: 38% → 61% in 3 days',
};

/* ─────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────────*/
export const StoryDemo: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const { scene, swapPhase, phoneStarted, restartKey, twinApproved, handlePhoneComplete } = useSequencer(visible);

  // Laptop is visible during normal laptop scenes AND during the fold (swapPhase folding/flash)
  const isLaptopScene = !['phone', 'outcome', 'fading'].includes(scene) && scene !== 'idle';
  const showLaptopHtml = isLaptopScene || swapPhase === 'folding' || swapPhase === 'flash';
  // Phone is visible once swap starts or scene is phone/outcome
  const showPhone = swapPhase === 'phone-in' || swapPhase === 'flash' || scene === 'phone' || scene === 'outcome' || scene === 'fading';

  const activeIdx = STEPS.findIndex(s => s.id === scene || (scene === 'fading' && s.id === 'outcome'));

  return (
    <section
      ref={sectionRef}
      id="how"
      className="relative bg-white/70 backdrop-blur-sm border-y border-gray-200/70"
    >
      <style>{STORY_CSS}</style>

      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgb(148 163 184 / .25) 1px, transparent 1.2px)', backgroundSize: '24px 24px' }}
      />

      <div className="relative max-w-6xl mx-auto px-6 py-20">

        <div className="max-w-2xl mb-14">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">How it works</p>
          <h2 className="text-4xl font-black tracking-tighter text-gray-900">From insight to action — instantly.</h2>
          <p className="mt-3 text-gray-600">Kundai spots a gap, builds a plan, and the student gets the brief — right on their phone.</p>
        </div>

        {/* ── STAGE ── */}
        {scene !== 'idle' && (
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 420 }}>

            {/* LAPTOP */}
            {showLaptopHtml && (
              <div style={{
                position: showPhone ? 'absolute' : 'relative',
                width: '100%',
                opacity: swapPhase === 'flash' ? 0 : 1,
                transition: swapPhase === 'flash' ? 'opacity 0.08s ease' : 'none',
              }}>
                <LaptopShell folding={swapPhase === 'folding'}>
                  <ScreenContent scene={scene} twinApproved={twinApproved} />
                </LaptopShell>
              </div>
            )}

            {/* FLASH BURST — overlaid at centre of stage */}
            {swapPhase === 'flash' && <FlashBurst />}

            {/* PHONE */}
            {showPhone && (
              <div style={{
                position: showLaptopHtml ? 'absolute' : 'relative',
              }}>
                <PhoneMockup
                  key={restartKey}
                  started={phoneStarted}
                  onComplete={handlePhoneComplete}
                />
              </div>
            )}
          </div>
        )}

        {/* ── STEP STRIP ── */}
        {scene !== 'idle' && (
          <div className="mt-12" aria-hidden>
            <div className="flex items-start justify-center gap-1">
              {STEPS.map((step, idx) => {
                const isPast   = activeIdx > idx;
                const isActive = activeIdx === idx;
                return (
                  <div key={step.id} className="flex flex-col items-center" style={{ minWidth: 56 }}>
                    <div className="flex items-center w-full">
                      <div style={{ flex: 1, height: 1, background: idx === 0 ? 'transparent' : (isPast || isActive) ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)', transition: 'background .3s' }} />
                      <div style={{ width: isActive ? 11 : 7, height: isActive ? 11 : 7, borderRadius: '50%', flexShrink: 0, transition: 'all .3s', background: isActive ? 'white' : isPast ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)', boxShadow: isActive ? '0 0 0 4px rgba(255,255,255,0.25)' : 'none' }} />
                      <div style={{ flex: 1, height: 1, background: idx === STEPS.length - 1 ? 'transparent' : isPast ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)', transition: 'background .3s' }} />
                    </div>
                    <p style={{ marginTop: 5, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', transition: 'color .3s', color: isActive ? 'white' : isPast ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)' }}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {LABELS[scene] && (
              <div className="flex justify-center mt-3">
                <span className="sd-fade-up inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.28)', letterSpacing: '0.07em' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'white', animation: 'sd-blink 1.4s step-end infinite', display: 'inline-block' }} />
                  {LABELS[scene]}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default StoryDemo;