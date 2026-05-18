/* ─────────────────────────────────────────────────────────────
   FOLD-AND-ABSORB
   1. Laptop fold (5-phase realistic close)
   2. Plan-activated toast stays floating in space — "left behind"
   3. Laptop fades; toast hangs in the void
   4. Phone descends from above with a blank/metallic screen
   5. Phone settles around the toast → toast becomes the WhatsApp
      chat header → conversation fills in below
───────────────────────────────────────────────────────────────*/
const { useState, useEffect, useRef } = React;

/* ── Timeline (ms) ── */
const T = {
  preActivate: 600,     // open laptop, hold for setup
  cursorClick: 1250,    // cursor reaches Activate
  toastFlip:   1400,    // toast snaps blue → green
  toastSit:    1900,    // hold the activated state
  foldStart:   2100,    // lid begins to fall
  foldEnd:     3500,    // lid sealed (1400ms fold)
  orphanPulse: 3550,    // toast does a tiny "I'm still here" pulse
  laptopFade:  3700,    // laptop chassis fades
  laptopGone:  4400,    // laptop opacity → 0
  phoneEnter:  4250,    // phone starts descending from above
  phoneAt:     5350,    // phone arrives at final position (1100ms)
  absorb:      5450,    // toast morphs into chat header
  chatReveal:  5600,    // WhatsApp body slides up below the header
  typingStart: 6300,
  firstMsg:    7100,
  msgLand:     7300,
  loopAt:     11000,
};

const STAGE_W = 720;
const STAGE_H = 560;

/* Laptop initial position (open, centered) */
const LAPTOP_BOX = { left: 80, top: 88, w: 460, h: 264 };

/* Phone final position — chosen so the toast sits exactly where
   the WhatsApp chat header will be inside the phone screen */
const PHONE_BOX = { left: 250, top: 80, w: 210, h: 430 };

/* Toast — STATIC stage-level position. During laptop scene it overlays
   the top-right of the dashboard. After the laptop is gone, it floats
   in space. When the phone arrives, this same position IS the chat
   header inside the phone's screen — the toast doesn't need to move. */
const TOAST = { left: 258, top: 116, w: 194 };

/* ─────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────────*/
const STYLE = `
  /* ─── 5-phase realistic lid fold ─── */
  @keyframes hf-lid-fold {
    0%   { transform: rotateX(0deg);     animation-timing-function: cubic-bezier(.55,0,.78,.12); }
    5%   { transform: rotateX(-2deg);    animation-timing-function: cubic-bezier(.55,0,.78,.12); }
    62%  { transform: rotateX(-86deg);   animation-timing-function: cubic-bezier(.3,0,.35,1); }
    72%  { transform: rotateX(-91.5deg); animation-timing-function: cubic-bezier(.4,0,.2,1); }
    82%  { transform: rotateX(-87deg);   animation-timing-function: cubic-bezier(.35,0,.5,1); }
    92%  { transform: rotateX(-89.6deg); animation-timing-function: cubic-bezier(.5,0,.5,1); }
    100% { transform: rotateX(-88.8deg); }
  }
  .hf-lid-fold { animation: hf-lid-fold 1400ms forwards; }

  /* Chassis recoils at lid impact (78-92%) — Newton's third law */
  @keyframes hf-body-recoil {
    0%, 60% { transform: rotateX(-12deg) translateY(0); }
    72%     { transform: rotateX(-12.8deg) translateY(-1.4px); }
    82%     { transform: rotateX(-11.4deg) translateY(1.5px); }
    92%     { transform: rotateX(-12deg)   translateY(0.3px); }
    100%    { transform: rotateX(-12deg)   translateY(0); }
  }
  .hf-body-recoil { animation: hf-body-recoil 1400ms forwards; }

  /* Screen dim as lid descends — ambient light cut-off */
  @keyframes hf-screen-dim {
    0%   { opacity: 0; }
    25%  { opacity: 0.15; }
    55%  { opacity: 0.55; }
    100% { opacity: 0.95; }
  }
  .hf-screen-dim { animation: hf-screen-dim 1400ms forwards; }

  /* Glare sweep across screen during fold */
  @keyframes hf-glare-sweep {
    0%, 15%   { opacity: 0;   transform: translateX(-110%) skewX(-15deg); }
    42%       { opacity: 0.55; transform: translateX(0%)    skewX(-15deg); }
    65%       { opacity: 0.25; transform: translateX(70%)   skewX(-15deg); }
    80%, 100% { opacity: 0;   transform: translateX(130%)  skewX(-15deg); }
  }
  .hf-glare-sweep { animation: hf-glare-sweep 1400ms forwards; }

  /* Ground shadow under the laptop — sharpens + shrinks during fold */
  @keyframes hf-base-shadow {
    0%   { box-shadow: 0 28px 50px -8px rgba(15,23,42,0.42), 0 12px 22px -4px rgba(15,23,42,0.26); opacity: 1; }
    62%  { box-shadow: 0 14px 26px -4px rgba(15,23,42,0.26), 0 6px  12px -2px rgba(15,23,42,0.16); opacity: 0.9; }
    100% { box-shadow: 0 6px  14px -2px rgba(15,23,42,0.18), 0 2px   6px  0px rgba(15,23,42,0.10); opacity: 0.85; }
  }
  .hf-base-shadow { animation: hf-base-shadow 1400ms forwards; }

  /* Toast snaps when activated (blue → green) */
  @keyframes hf-toast-flip {
    0%   { transform: scale(1); }
    50%  { transform: scale(0.95); }
    100% { transform: scale(1); }
  }
  .hf-toast-flip { animation: hf-toast-flip 280ms cubic-bezier(.34,1.4,.64,1); }

  /* Orphan pulse — toast does a tiny breath when the lid hits.
     "I'm still here." */
  @keyframes hf-toast-orphan {
    0%   { transform: scale(1);    filter: drop-shadow(0 4px 10px rgba(15,23,42,0.18)); }
    35%  { transform: scale(1.06); filter: drop-shadow(0 14px 28px rgba(15,23,42,0.34)); }
    100% { transform: scale(1.02); filter: drop-shadow(0 10px 22px rgba(15,23,42,0.26)); }
  }
  .hf-toast-orphan { animation: hf-toast-orphan 600ms cubic-bezier(.34,1.4,.64,1) forwards; }

  /* Phone screen pre-wake — subtle slow shimmer on the blank screen */
  @keyframes hf-screen-shimmer {
    0%, 100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }
  }
  .hf-screen-shimmer {
    background: linear-gradient(135deg, #050507 0%, #0e1015 25%, #1a1d24 50%, #0e1015 75%, #050507 100%);
    background-size: 240% 240%;
    animation: hf-screen-shimmer 3s ease-in-out infinite;
  }

  /* Phone awakens — soft blue glow blooming from center when it
     senses the toast. Plays right before absorb. */
  @keyframes hf-screen-wake {
    0%   { opacity: 0; transform: scale(0.4); }
    60%  { opacity: 0.85; transform: scale(1); }
    100% { opacity: 0;   transform: scale(1.6); }
  }
  .hf-screen-wake { animation: hf-screen-wake 600ms ease-out forwards; }

  /* Cursor reaches the Activate button */
  @keyframes hf-cursor-to-btn {
    0%   { transform: translate(0, 0); opacity: 0; }
    8%   { opacity: 1; }
    72%  { transform: translate(-150px, -60px); opacity: 1; }
    78%  { transform: translate(-150px, -60px) scale(0.82); }
    88%  { transform: translate(-150px, -60px) scale(1.06); }
    100% { transform: translate(-150px, -60px) scale(1);   opacity: 1; }
  }
  .hf-cursor { animation: hf-cursor-to-btn 1300ms cubic-bezier(.5,.05,.4,1) both; }
  @keyframes hf-cursor-fade-out { to { opacity: 0; } }
  .hf-cursor-out { animation: hf-cursor-fade-out 200ms 1450ms ease-out forwards; }

  /* Button press at moment of cursor click */
  @keyframes hf-btn-press {
    0%   { transform: scale(1);    filter: brightness(1); }
    30%  { transform: scale(0.92); filter: brightness(0.85); }
    65%  { transform: scale(1.03); filter: brightness(1.08); }
    100% { transform: scale(1);    filter: brightness(1); }
  }
  .hf-btn-press { animation: hf-btn-press 350ms cubic-bezier(.34,1.4,.64,1) both; animation-delay: 1150ms; }

  /* Chat body reveal — slides up below the absorbed toast/header */
  @keyframes hf-chat-reveal {
    0%   { opacity: 0; transform: translateY(14px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .hf-chat-reveal { animation: hf-chat-reveal 480ms cubic-bezier(.34,1.2,.5,1) both; }

  /* Misc */
  @keyframes hf-blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes hf-dot   { 0%,80%,100%{opacity:.25} 40%{opacity:1} }
  @keyframes hf-pop   { from{opacity:0;transform:scale(.92) translateY(4px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes hf-fade  { from{opacity:0} to{opacity:1} }
  .hf-dot   { width:5px;height:5px;border-radius:50%;background:#94a3b8;display:inline-block;animation:hf-dot 1.2s infinite; }
  .hf-dot:nth-child(2){animation-delay:.2s} .hf-dot:nth-child(3){animation-delay:.4s}
  .hf-pop   { animation: hf-pop 240ms cubic-bezier(.34,1.4,.64,1) both; }
  .hf-fade  { animation: hf-fade 380ms ease-out both; }

  /* Body morph: from activate-button view to absorbed/empty */
  @keyframes hf-toast-body-out {
    0%   { opacity: 1; max-height: 60px; padding-top: 8px; padding-bottom: 8px; }
    60%  { opacity: 0; max-height: 60px; }
    100% { opacity: 0; max-height: 0;    padding-top: 0;   padding-bottom: 0; }
  }
  .hf-toast-body-out { animation: hf-toast-body-out 420ms cubic-bezier(.5,0,.25,1) forwards; }
`;

/* ─────────────────────────────────────────────────────────────
   LAPTOP — base + 3D lid that folds via CSS animation
───────────────────────────────────────────────────────────────*/
function LaptopShell({ foldPhase, fading, children }) {
  // foldPhase: 'open' | 'folding'
  const folding = foldPhase === 'folding';

  return (
    <div style={{
      position: 'absolute',
      left: LAPTOP_BOX.left, top: LAPTOP_BOX.top,
      width: LAPTOP_BOX.w, height: LAPTOP_BOX.h,
      perspective: 1800,
      perspectiveOrigin: '50% 30%',
      opacity: fading ? 0 : 1,
      transition: 'opacity 700ms ease-out',
      pointerEvents: 'none',
    }}>
      <div
        className={folding ? 'hf-body-recoil' : ''}
        style={{
          position: 'relative', width: '100%', height: '100%',
          transformStyle: 'preserve-3d',
          transform: folding ? undefined : 'rotateX(-12deg)',
        }}
      >
        {/* Base — flat slab at the bottom */}
        <div
          className={folding ? 'hf-base-shadow' : ''}
          style={{
            position: 'absolute', left: -22, right: -22, bottom: 0, height: 14,
            background: 'linear-gradient(180deg, #2b2b30 0%, #1a1a1f 60%, #0a0a0c 100%)',
            borderRadius: '2px 2px 8px 8px',
            boxShadow: '0 28px 50px -8px rgba(15,23,42,0.42), 0 12px 22px -4px rgba(15,23,42,0.26), inset 0 1px 0 rgba(255,255,255,0.10)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Hinge crease across the back of base */}
          <div style={{
            position: 'absolute', left: '38%', right: '38%', top: 0, height: 4,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent)',
            borderRadius: '0 0 6px 6px',
          }} />
        </div>

        {/* Lid — preserve-3d wrapper that rotates */}
        <div
          className={folding ? 'hf-lid-fold' : ''}
          style={{
            position: 'absolute',
            left: 0, right: 0, top: 0, bottom: 14,
            transformOrigin: 'center bottom',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Screen face — front of lid, faces camera when open */}
          <div style={{
            position: 'absolute', inset: 0,
            background: '#3a3a3d',
            border: '12px solid #3a3a3d',
            borderTopWidth: 18,
            borderRadius: '14px 14px 0 0',
            overflow: 'hidden',
            transformStyle: 'flat',
            boxShadow: '0 18px 40px -10px rgba(15,23,42,0.5)',
          }}>
            <div style={{ width: '100%', height: '100%', background: '#1976d2', position: 'relative' }}>
              {children}
              {folding && (
                <div className="hf-screen-dim" style={{ position: 'absolute', inset: 0, background: '#000', pointerEvents: 'none', zIndex: 8 }} />
              )}
              {folding && (
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 9 }}>
                  <div className="hf-glare-sweep" style={{ position: 'absolute', top: 0, bottom: 0, left: '-60%', width: '55%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
                </div>
              )}
            </div>
          </div>
          {/* Back face — titanium with K logo. Only mounted during fold (after which we see it briefly). */}
          {folding && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(140deg, #3a3a3f 0%, #25252a 35%, #1c1c20 70%, #131316 100%)',
              border: '12px solid #3a3a3d',
              borderTopWidth: 18,
              borderRadius: '14px 14px 0 0',
              backfaceVisibility: 'hidden',
              transform: 'translateZ(-4px) rotateY(180deg)',
              display: 'grid', placeItems: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.45)',
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 14,
                background: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.10) 0%, transparent 60%)',
                display: 'grid', placeItems: 'center',
                color: 'rgba(255,255,255,0.18)',
                fontSize: 30, fontWeight: 900, letterSpacing: '-0.04em',
              }}>K</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DASHBOARD — twin panel + cursor (no toast — that's stage-level)
───────────────────────────────────────────────────────────────*/
const TWIN_ATTRS = [
  { l: 'Subst.',    v: 56 }, { l: 'Factors',   v: 42 }, { l: 'Quadrat.', v: 32 },
  { l: 'Ineqs.',    v: 39 }, { l: 'Linear',    v: 48 }, { l: 'Exprs.',   v: 44 }, { l: 'Words', v: 38 },
];

function Dashboard({ showCursor, btnPressed }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', boxSizing: 'border-box', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0f172a', color: 'white', display: 'grid', placeItems: 'center', fontSize: 8, fontWeight: 900 }}>PM</div>
          <div style={{ background: 'white', padding: '2px 18px 2px 8px', clipPath: 'polygon(0 0,100% 0,90% 100%,0 100%)' }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: '#0f172a' }}>MRS. MATHE</p>
            <p style={{ margin: 0, fontSize: 7, color: '#2563eb', fontWeight: 700 }}>Mathematics ▾</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['Home', 'Class', 'Tests', 'Cal'].map((t, i) => (
            <div key={t} style={{ padding: '3px 7px', borderRadius: 5, background: i === 0 ? '#2563eb' : '#e2e8f0', color: i === 0 ? 'white' : '#64748b', fontSize: 7, fontWeight: 900, letterSpacing: '.05em', textTransform: 'uppercase' }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Twin + perf */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 8, minHeight: 0 }}>
        <div style={{ background: '#f0f4f8', borderRadius: 8, padding: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', textAlign: 'center' }}>Student Development</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#0f172a', color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 900 }}>TM</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>Moyo <span style={{ color: '#64748b', fontWeight: 400 }}>Tapiwa</span></p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#dc2626' }}>43</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8' }}>OVR</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Form 3</p>
              <p style={{ margin: 0, fontSize: 7, color: '#ef4444', fontWeight: 900, textTransform: 'uppercase' }}>Below thr.</p>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#94a3b8', fontWeight: 700 }}>
              <span>Algebra: 38%</span><span>Target: 71%</span>
            </div>
            <div style={{ marginTop: 3, background: '#e2e8f0', borderRadius: 99, height: 4 }}>
              <div style={{ width: '38%', height: '100%', background: '#ef4444', borderRadius: 99 }} />
            </div>
          </div>
          <div style={{
            marginTop: 8, paddingTop: 6, borderTop: '1px solid #e2e8f0',
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px 0',
          }}>
            {TWIN_ATTRS.map(a => <p key={a.l + 'n'} style={{ margin: 0, fontSize: 6, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>{a.l}</p>)}
            {TWIN_ATTRS.map(a => <p key={a.l + 'v'} style={{ margin: 0, fontSize: 9, color: '#ef4444', fontWeight: 900, textAlign: 'center' }}>{a.v}%</p>)}
          </div>
        </div>

        <div style={{ background: '#f0f4f8', borderRadius: 8, padding: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <p style={{ margin: 0, fontSize: 8, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>Performance</p>
          {['Tapiwa 38%', 'Rudo 44%', 'Pros. 51%', 'Bless. 58%', 'Tatenda 62%'].map(r => (
            <div key={r} style={{ fontSize: 7, color: '#475569', padding: '2px 0', borderBottom: '1px solid #e2e8f0' }}>{r}</div>
          ))}
        </div>
      </div>

      {/* Cursor over the dashboard, approaches Activate button */}
      {showCursor && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12 }}>
          <div className={`hf-cursor ${btnPressed ? 'hf-cursor-out' : ''}`} style={{ position: 'absolute', left: 270, top: 200 }}>
            <svg width="14" height="17" viewBox="0 0 13 16" fill="none">
              <path d="M1 1L1 14L4.5 10.5L7 15.5L9 14.5L6.5 9.5L11 9.5L1 1Z" fill="#0f172a" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STAGE-LEVEL TOAST — sits in space; does NOT fold with the laptop.
   Same screen position throughout the whole sequence. After phone
   arrives, this exact div acts as the WhatsApp chat header.
───────────────────────────────────────────────────────────────*/
function StageToast({ phase, btnPressed, orphaned }) {
  // phase: 'pending' | 'activated' | 'absorbed'
  const isPending  = phase === 'pending';
  const isAbsorbed = phase === 'absorbed';

  return (
    <div
      className={orphaned ? 'hf-toast-orphan' : ''}
      style={{
        position: 'absolute',
        left: TOAST.left, top: TOAST.top, width: TOAST.w,
        zIndex: 22,
        borderRadius: isAbsorbed ? '0' : 10,
        overflow: 'hidden',
        boxShadow: isAbsorbed
          ? 'none'
          : '0 8px 24px rgba(15,23,42,0.22), 0 0 0 1px rgba(255,255,255,0.5)',
        transition: 'border-radius 420ms cubic-bezier(.5,0,.25,1), box-shadow 420ms ease-out',
      }}
    >
      {/* Header bar */}
      <div
        className={phase === 'activated' && !orphaned ? 'hf-toast-flip' : ''}
        style={{
          background: isPending ? '#2563eb' : '#075e54',
          padding: isAbsorbed ? '8px 12px' : '6px 10px',
          display: 'flex', alignItems: 'center', gap: 8,
          transition: 'background 320ms ease, padding 320ms ease',
        }}
      >
        {/* KundAI 'K' avatar — stays the same shape through the entire arc */}
        <div style={{
          width: isAbsorbed ? 26 : 22, height: isAbsorbed ? 26 : 22,
          borderRadius: '50%',
          background: '#25D366',
          color: '#075e54',
          display: 'grid', placeItems: 'center',
          fontSize: isAbsorbed ? 11 : 10, fontWeight: 900,
          border: '1.5px solid white',
          flexShrink: 0,
          transition: 'width 320ms ease, height 320ms ease, font-size 320ms ease',
        }}>K</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, color: 'white',
            fontSize: isAbsorbed ? 10 : 10, fontWeight: 900,
            lineHeight: 1.1, letterSpacing: '0.01em',
          }}>
            KundAI
          </p>
          <p style={{
            margin: 0, color: 'rgba(255,255,255,.85)',
            fontSize: 8, fontWeight: 600, lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {isPending  && '14 steps · Algebra · Quadratics 32%'}
            {phase === 'activated' && 'Plan Activated · sending to Tapiwa…'}
            {isAbsorbed && 'online'}
          </p>
        </div>
        {phase === 'activated' && (
          <span className="hf-fade" style={{ color: 'white', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>✓</span>
        )}
        {isAbsorbed && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}><path d="M23 7l-7 5 7 5V7z M1 5h15v14H1z" /></svg>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="white" style={{ opacity: 0.8 }}><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>
          </div>
        )}
      </div>

      {/* Body — visible during pending + activated, collapses on absorb */}
      <div
        className={isAbsorbed ? 'hf-toast-body-out' : ''}
        style={{
          background: phase === 'pending' ? '#f0f4f8' : '#f0fdf4',
          padding: '7px 10px',
          transition: 'background 320ms ease',
          overflow: 'hidden',
        }}
      >
        {isPending && (
          <>
            <p style={{ margin: '0 0 5px', fontSize: 8, color: '#475569' }}>
              14 steps · Algebra focus · Quadratics 32%
            </p>
            <button
              className={btnPressed ? 'hf-btn-press' : ''}
              style={{
                width: '100%', padding: '5px 0',
                background: '#2563eb', color: 'white',
                border: 'none', borderRadius: 5,
                fontSize: 9, fontWeight: 700, cursor: 'default',
              }}
            >Activate Plan</button>
          </>
        )}
        {phase === 'activated' && (
          <p style={{ margin: 0, fontSize: 8, color: '#059669', fontWeight: 700 }}>
            ✓ Plan sent to Tapiwa via WhatsApp
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PHONE — descends from above with a blank screen, then unlocks
   into WhatsApp once it has "absorbed" the toast.
───────────────────────────────────────────────────────────────*/
function PhoneShell({ phase, wake, children }) {
  // phase: 'hidden' | 'descending' | 'settled'
  const hidden = phase === 'hidden';
  const settled = phase === 'settled';

  // translateY: starts above stage (-stage_h), ends at 0.
  // We use state to drive this: when phase becomes 'descending',
  // we keep it at the starting offset for 1 frame, then transition.
  const offsetY = hidden || phase === 'descending-init' ? -540 : 0;

  return (
    <div style={{
      position: 'absolute',
      left: PHONE_BOX.left, top: PHONE_BOX.top,
      width: PHONE_BOX.w, height: PHONE_BOX.h,
      zIndex: 18,
      pointerEvents: 'none',
      transform: `translateY(${offsetY}px)`,
      transition: hidden ? 'none' : 'transform 1100ms cubic-bezier(.2,.7,.25,1)',
      opacity: hidden ? 0 : 1,
    }}>
      {/* Chassis */}
      <div style={{
        width: '100%', height: '100%',
        borderRadius: 36,
        background: 'linear-gradient(135deg, #4a4d54 0%, #8e9098 22%, #c8cad0 38%, #6a6d76 55%, #9c9fa8 72%, #5a5d65 100%)',
        boxShadow: '0 30px 60px -12px rgba(15,23,42,0.55), 0 12px 24px -8px rgba(15,23,42,0.4), inset 0 0 0 2px #1a1a1f',
        padding: 4,
        position: 'relative',
        boxSizing: 'border-box',
      }}>
        {/* Screen */}
        <div className={!settled ? 'hf-screen-shimmer' : ''} style={{
          width: '100%', height: '100%',
          borderRadius: 32,
          background: settled ? '#e5ddd5' : '#0a0a0c',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'inset 0 0 0 1px #000',
        }}>
          {children}
          {/* Pre-wake glow — fires just before absorb to suggest the phone "senses" the toast */}
          {wake && (
            <div className="hf-screen-wake" aria-hidden style={{
              position: 'absolute',
              top: '20%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '70%', height: '40%',
              background: 'radial-gradient(circle, rgba(96,165,250,0.55) 0%, rgba(96,165,250,0.2) 35%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 4,
            }} />
          )}
        </div>

        {/* Dynamic Island */}
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          width: 78, height: 22, borderRadius: 12, background: '#000', zIndex: 30,
        }}>
          <div style={{ position: 'absolute', top: 6, right: 12, width: 6, height: 6, borderRadius: '50%', background: 'radial-gradient(circle, #1a3045 0%, #050c14 70%)' }} />
        </div>

        {/* Status bar */}
        <div style={{ position: 'absolute', top: 14, left: 18, fontSize: 9, fontWeight: 700, color: 'white', zIndex: 30 }}>9:41</div>
        <div style={{ position: 'absolute', top: 14, right: 18, display: 'flex', gap: 3, alignItems: 'flex-end', zIndex: 30 }}>
          {[3, 5, 7, 9].map(h => <span key={h} style={{ width: 2, height: h, background: 'white', borderRadius: 0.5 }} />)}
        </div>

        {/* Home indicator */}
        <div style={{
          position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
          width: 80, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.7)', zIndex: 30,
        }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   WHATSAPP — message body that fills the phone screen below the
   absorbed-toast (which now functions as the chat header)
───────────────────────────────────────────────────────────────*/
function WhatsAppBody({ showTyping, showMsg }) {
  return (
    <div className="hf-chat-reveal" style={{
      position: 'absolute',
      // Sits BELOW the toast (which is at stage TOAST.top relative to stage,
      // = TOAST.top - PHONE_BOX.top from the phone top). The toast height is ~46px
      // when absorbed (header bar only). Body starts below.
      top: (TOAST.top - PHONE_BOX.top) + 46,
      left: 4, right: 4, bottom: 18,
      borderRadius: '0 0 28px 28px',
      background: '#e5ddd5',
      padding: '10px 8px',
      display: 'flex', flexDirection: 'column', gap: 6,
      overflow: 'hidden',
      zIndex: 5,
    }}>
      <div style={{ alignSelf: 'center', background: 'rgba(0,0,0,0.08)', padding: '2px 8px', borderRadius: 10, fontSize: 7, color: '#475569' }}>Today</div>

      {showTyping && !showMsg && (
        <div className="hf-pop" style={{ alignSelf: 'flex-start' }}>
          <div style={{ background: 'white', padding: '7px 10px', borderRadius: '0 8px 8px 8px', display: 'flex', gap: 3, alignItems: 'center', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)' }}>
            <span className="hf-dot" /><span className="hf-dot" /><span className="hf-dot" />
          </div>
        </div>
      )}

      {showMsg && (
        <div className="hf-pop" style={{ alignSelf: 'flex-start', maxWidth: '86%' }}>
          <div style={{ background: 'white', padding: '6px 9px', borderRadius: '0 8px 8px 8px', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)' }}>
            <p style={{ margin: 0, fontSize: 9, color: '#0f172a' }}>Hie Tapiwa! 👋</p>
            <p style={{ margin: '4px 0 0', fontSize: 9, color: '#0f172a', lineHeight: 1.4 }}>Mrs. Mathe just sent you a 14-step Algebra plan. Mission accepted? 🎯</p>
          </div>
          <p style={{ margin: '2px 4px 0', fontSize: 7, color: '#94a3b8' }}>16:42 AM</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STAGE
───────────────────────────────────────────────────────────────*/
function Stage({ runId }) {
  const [t, setT] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    startRef.current = performance.now();
    const tick = (now) => {
      setT(now - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [runId]);

  // Derive scene state from time
  const showCursor   = t >= 200 && t < T.toastFlip + 200;
  const btnPressed   = t >= T.cursorClick - 100;

  const toastPhase =
    t < T.toastFlip  ? 'pending'   :
    t < T.absorb     ? 'activated' :
                       'absorbed';
  const toastOrphaned = t >= T.orphanPulse && t < T.orphanPulse + 800;

  const laptopFolding = t >= T.foldStart && t < T.laptopFade;
  const laptopPhase   = laptopFolding ? 'folding' : 'open';
  const laptopFading  = t >= T.laptopFade;

  const phonePhase =
    t < T.phoneEnter ? 'hidden'     :
    t < T.phoneAt    ? 'descending' :
                       'settled';

  const phoneWake    = t >= T.phoneAt - 200 && t < T.absorb + 200;
  const showWhatsApp = t >= T.chatReveal;
  const showTyping   = t >= T.typingStart && t < T.firstMsg;
  const showMsg      = t >= T.firstMsg;

  return (
    <div style={{
      position: 'relative',
      width: STAGE_W, height: STAGE_H,
      margin: '0 auto',
      overflow: 'visible',
    }}>
      {/* Laptop */}
      <LaptopShell foldPhase={laptopPhase} fading={laptopFading}>
        <Dashboard showCursor={showCursor} btnPressed={btnPressed} />
      </LaptopShell>

      {/* Phone — descends from above */}
      <PhoneShell phase={phonePhase} wake={phoneWake}>
        {showWhatsApp && <WhatsAppBody showTyping={showTyping} showMsg={showMsg} />}
      </PhoneShell>

      {/* Stage-level toast — never folds, never moves */}
      <StageToast phase={toastPhase} btnPressed={btnPressed} orphaned={toastOrphaned} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   NARRATION
───────────────────────────────────────────────────────────────*/
const NARRATION = [
  { at: 0,             text: 'Mrs. Mathe activates the plan KundAI prepared for Tapiwa.' },
  { at: T.foldStart,   text: 'She closes the laptop — but the brief is already on its way.' },
  { at: T.phoneEnter,  text: 'Tapiwa\'s phone receives it.' },
  { at: T.firstMsg,    text: 'KundAI starts the conversation. The mission begins.' },
];

function Narration({ t }) {
  const idx = NARRATION.reduce((acc, n, i) => t >= n.at ? i : acc, 0);
  return (
    <div className="narration">
      {NARRATION.map((n, i) => (
        <div key={i} className={`nar-row ${i === idx ? 'active' : i < idx ? 'past' : ''}`}>
          <span className="nar-dot" />
          <span className="nar-text">{n.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   APP
───────────────────────────────────────────────────────────────*/
function App() {
  const [runId, setRunId] = useState(0);
  const [t, setT] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(performance.now());

  useEffect(() => {
    startRef.current = performance.now();
    const tick = (now) => {
      const elapsed = now - startRef.current;
      setT(elapsed);
      if (elapsed > T.loopAt) {
        setRunId(r => r + 1);
        startRef.current = now;
        setT(0);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [runId]);

  return (
    <>
      <style>{STYLE}</style>
      <div className="page">
        <div className="copy">
          <p className="eyebrow">How it works · Step 3 → 4</p>
          <h1>From dashboard, <em>straight to the student.</em></h1>
          <p>Mrs. Mathe activates a plan and closes her laptop. The brief is left in the room — and Tapiwa's phone arrives to receive it.</p>
        </div>
        <div className="stage-wrap">
          <Stage runId={runId} />
        </div>
        <div className="copy">
          <Narration t={t} />
          <button className="replay" onClick={() => setRunId(r => r + 1)}>↻ Replay</button>
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
