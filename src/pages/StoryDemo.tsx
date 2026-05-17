import React, { useEffect, useState, useRef, useCallback } from 'react';
import { CheckCircle, ChevronRight, TrendingUp, AlertTriangle } from 'lucide-react';

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
   *  REAL 3D LAPTOP FOLD — 1.9s, 5-phase physics
   *  Phase A (0-18%):  hands finding grip — tiny jostle
   *  Phase B (18-45%): deliberate slow close
   *  Phase C (45-78%): gravity takes over (quartic accel)
   *  Phase D (78-92%): near-close + micro-bounce on seal
   *  Phase E (92-100%): spring settle into final angle
   * ═══════════════════════════════════════════════════
   */

  /* Body sits on the desk: a small jostle at grip, near-static through the close,
   * then a real chassis recoil when the lid slams shut (Newton's third law).
   * End state matches sd-laptop-fadeout's 0% so the exit phase blends seamlessly. */
  @keyframes sd-laptop-body {
    /* A: grip jostle (0-15%) */
    0%   { transform: rotateX(-12deg)   translateY(0px); }
    5%   { transform: rotateX(-12.6deg) translateY(-1.5px); animation-timing-function: cubic-bezier(.45,0,.55,1); }
    10%  { transform: rotateX(-11.6deg) translateY(0.4px);  animation-timing-function: cubic-bezier(.4,0,.6,.7); }
    15%  { transform: rotateX(-12deg)   translateY(-0.4px); }
    /* B+C: virtually stationary on the desk while the lid closes (15-78%) */
    60%  { transform: rotateX(-11.7deg) translateY(0.3px); animation-timing-function: cubic-bezier(.4,0,.6,1); }
    78%  { transform: rotateX(-11.6deg) translateY(0.5px); animation-timing-function: cubic-bezier(.3,0,.4,1); }
    /* D: lid impact — chassis recoils (kick back, hop up) */
    83%  { transform: rotateX(-12.9deg) translateY(-1.2px); animation-timing-function: cubic-bezier(.35,0,.5,1); }
    88%  { transform: rotateX(-11.5deg) translateY(1.4px);  animation-timing-function: cubic-bezier(.5,0,.5,1); }
    /* E: settle (88-100%) */
    93%  { transform: rotateX(-12deg)   translateY(0.6px); animation-timing-function: cubic-bezier(.5,0,.5,1); }
    100% { transform: rotateX(-12deg)   translateY(1px); }
  }

  /* The lid pivots on the hinge. The 15-78% span is ONE cubic-bezier so the
   * acceleration is monotonic — that's what (1 - cos θ) torque buildup actually
   * looks like. One pronounced magnetic rebound, then settle. */
  @keyframes sd-lid-fold {
    /* A: hands find grip — tiny jostle (0-15%) */
    0%   { transform: rotateX(0deg);     animation-timing-function: cubic-bezier(.45,0,.55,1); }
    5%   { transform: rotateX(-1.4deg);  animation-timing-function: cubic-bezier(.4,0,.6,.7); }
    10%  { transform: rotateX(-0.5deg);  animation-timing-function: cubic-bezier(.5,0,.7,.4); }
    15%  { transform: rotateX(-3deg);    animation-timing-function: cubic-bezier(.55,0,.78,.12); /* strong ease-in — gravity buildup */ }
    /* B+C: single long arc, 3° → 86° over 63% of timeline */
    78%  { transform: rotateX(-86deg);   animation-timing-function: cubic-bezier(.3,0,.35,1); /* brakes engaging */ }
    /* D: magnetic snap + single elastic rebound (78-91%) */
    83%  { transform: rotateX(-89.8deg); animation-timing-function: cubic-bezier(.4,0,.2,1); /* peak compression */ }
    88%  { transform: rotateX(-87.4deg); animation-timing-function: cubic-bezier(.35,0,.5,1); /* rebound peak */ }
    91%  { transform: rotateX(-89.3deg); animation-timing-function: cubic-bezier(.5,0,.5,1); /* re-grab */ }
    /* E: spring settle (91-100%) */
    96%  { transform: rotateX(-88.5deg); animation-timing-function: cubic-bezier(.5,0,.5,1); }
    100% { transform: rotateX(-88.8deg); }
  }

  /* Screen glare sweeps across as lid falls — a bright diagonal band */
  @keyframes sd-glare-sweep {
    0%   { opacity:0;   transform: translateX(-100%) skewX(-15deg); }
    18%  { opacity:0;   transform: translateX(-100%) skewX(-15deg); }
    42%  { opacity:0.55;transform: translateX(0%)    skewX(-15deg); }
    65%  { opacity:0.3; transform: translateX(60%)   skewX(-15deg); }
    80%  { opacity:0;   transform: translateX(120%)  skewX(-15deg); }
    100% { opacity:0;   transform: translateX(120%)  skewX(-15deg); }
  }

  /* Screen darkens as lid closes (ambient light cut-off) */
  @keyframes sd-screen-dim {
    0%   { background: rgba(0,0,0,0);    }
    18%  { background: rgba(0,0,0,0);    }
    45%  { background: rgba(0,0,0,0.18); }
    72%  { background: rgba(0,0,0,0.55); }
    100% { background: rgba(0,0,0,0.92); }
  }

  /* Base ambient-occlusion shadow — grows under lid as it descends */
  @keyframes sd-base-ao {
    0%   { opacity:0;    filter: blur(8px); }
    18%  { opacity:0.04; filter: blur(7px); }
    45%  { opacity:0.18; filter: blur(6px); }
    72%  { opacity:0.55; filter: blur(4px); }
    92%  { opacity:0.78; filter: blur(2.5px); }
    100% { opacity:0.82; filter: blur(2px); }
  }

  /* Hinge crease deepens as lid closes — micro-detail for depth */
  @keyframes sd-hinge-shade {
    0%   { opacity:0.2; }
    45%  { opacity:0.35; }
    100% { opacity:0.75; }
  }

  /* Lid "wings" — extension panels on each side of the lid that fade in late
   * in the close so the folded silhouette matches the base width.
   * Hidden during the open phase (would look like extra screen-side panels). */
  @keyframes sd-lid-wing-reveal {
    0%, 68% { opacity: 0; }
    82%     { opacity: 0.6; }
    100%    { opacity: 1; }
  }

  /* Ground shadow shrinks + sharpens as laptop lowers */
  @keyframes sd-ground-shadow {
    0%   { box-shadow: 0 32px 60px -8px rgba(0,0,0,0.42), 0 12px 22px -4px rgba(0,0,0,0.26); transform:scaleX(1);    opacity:1; }
    45%  { box-shadow: 0 22px 38px -6px rgba(0,0,0,0.34), 0 8px  14px -3px rgba(0,0,0,0.20); transform:scaleX(0.94); }
    78%  { box-shadow: 0 10px 20px -3px rgba(0,0,0,0.22), 0 4px   8px -2px rgba(0,0,0,0.14); transform:scaleX(0.86); }
    100% { box-shadow: 0  4px  9px -2px rgba(0,0,0,0.14), 0 1px   3px  0px rgba(0,0,0,0.10); transform:scaleX(0.80); opacity:0.85; }
  }

  /* Continues from sd-laptop-body's end-state (rotateX -12deg, translateY 1px)
   * so the chassis doesn't snap back when we swap class names. */
  @keyframes sd-laptop-fadeout {
    0%   { opacity:1;   transform: rotateX(-12deg) translateY(1px)  scale(1);    filter: blur(0); }
    55%  { opacity:0.45;transform: rotateX(-12deg) translateY(13px) scale(0.97); filter: blur(1.5px); }
    100% { opacity:0;   transform: rotateX(-12deg) translateY(26px) scale(0.94); filter: blur(3px); }
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
   *  PHONE ARRIVAL — quartic gravity, mass on landing
   *  Acceleration with easeInQuart, compress 1.03→0.985
   *  on impact, two diminishing bounces, then settle.
   * ═══════════════════════════════════════════════════
   */
  @keyframes sd-phone-fall {
    0%   { opacity:0; transform: translateY(-160px) scale(0.80) rotateX(14deg); filter:blur(10px); animation-timing-function: cubic-bezier(.86,0,.96,.2); /* easeInQuart */ }
    18%  { opacity:0.85; filter:blur(6px); }
    36%  { opacity:1;    filter:blur(2px); }
    /* impact */
    50%  { transform: translateY(18px) scale(1.03) rotateX(-4deg) scaleY(0.97); filter:blur(0); animation-timing-function: cubic-bezier(.4,1.6,.5,1); }
    /* first bounce */
    62%  { transform: translateY(-12px) scale(0.985) rotateX(2.5deg) scaleY(1.012); animation-timing-function: cubic-bezier(.4,0,.6,1); }
    72%  { transform: translateY(6px)   scale(1.008) rotateX(-1.2deg) scaleY(0.994); animation-timing-function: cubic-bezier(.3,1.4,.5,1); }
    /* second bounce */
    82%  { transform: translateY(-3px)  scale(0.997) rotateX(0.6deg) scaleY(1.003); }
    90%  { transform: translateY(1.2px) scale(1.001) rotateX(-0.2deg); }
    96%  { transform: translateY(-0.4px) scale(1); }
    100% { transform: translateY(0)     scale(1) rotateX(0deg) scaleY(1); opacity:1; filter:blur(0); }
  }

  /* The phone's own cast shadow — blooms exactly at landing */
  @keyframes sd-phone-shadow {
    0%,36% { opacity:0;    transform: scaleX(0.4) scaleY(0.25) translateY(22px); filter: blur(14px); }
    50%    { opacity:0.55; transform: scaleX(1.10) scaleY(1.15) translateY(0px); filter: blur(7px); }
    62%    { opacity:0.32; transform: scaleX(0.93) scaleY(0.88) translateY(3px); filter: blur(9px); }
    72%    { opacity:0.40; transform: scaleX(1.02) scaleY(1.02) translateY(0px); filter: blur(7px); }
    100%   { opacity:0.32; transform: scaleX(1)    scaleY(1)   translateY(0);   filter: blur(8px); }
  }

  /* Motion-blur ghost — faint copy trailing above the phone */
  @keyframes sd-phone-blur-ghost {
    0%   { opacity:0.55; transform:translateY(-44px) scaleX(0.92) scaleY(1.05); filter:blur(7px); }
    30%  { opacity:0.30; transform:translateY(-22px) scaleX(0.95) scaleY(1.02); filter:blur(5px); }
    55%  { opacity:0.12; transform:translateY(-8px)  scaleX(0.98); filter:blur(3px); }
    80%  { opacity:0.03; transform:translateY(-2px)  scaleX(1);    filter:blur(1px); }
    100% { opacity:0;    transform:translateY(0);    filter:blur(0); }
  }

  /* iOS keyboard rise / fall */
  @keyframes sd-kb-rise {
    0%   { opacity:0; transform: translateY(110%); }
    55%  { opacity:1; transform: translateY(-2%);  }
    78%  { transform: translateY(1%); }
    100% { opacity:1; transform: translateY(0);   }
  }
  @keyframes sd-kb-fall {
    0%   { opacity:1; transform: translateY(0); }
    100% { opacity:0; transform: translateY(110%); }
  }

  /* Key press flash — bright fill that fades */
  @keyframes sd-key-press {
    0%   { background:#e7e8ec; transform: translateY(1px) scale(0.94); box-shadow: 0 0 0 rgba(0,0,0,0); }
    40%  { background:#9aa1ad; transform: translateY(1.5px) scale(0.92); }
    100% { background:#ffffff; transform: translateY(0) scale(1); box-shadow: 0 1px 0 rgba(0,0,0,0.28); }
  }

  /* iPhone frame highlight — a soft moving sheen along the titanium rail */
  @keyframes sd-titanium-sheen {
    0%,100% { background-position: 0% 50%; }
    50%     { background-position: 100% 50%; }
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
    perspective: 1600px;
    perspective-origin: 50% 28%;
  }
  /* The entire laptop body (lid + base together) */
  .sd-laptop-body-anim {
    transform-style: preserve-3d;
    animation: sd-laptop-body 1.9s linear forwards;
  }
  /* The lid — rotates on the hinge (bottom-center origin) */
  .sd-lid-anim {
    transform-origin: center bottom;
    transform-style: preserve-3d;
    animation: sd-lid-fold 1.9s linear forwards;
  }
  /* Base receives ambient-occlusion as lid descends */
  .sd-base-ao {
    animation: sd-base-ao 1.9s linear forwards;
  }
  .sd-hinge-shade {
    animation: sd-hinge-shade 1.9s linear forwards;
  }
  /* Ground shadow under whole assembly */
  .sd-shadow-anim {
    animation: sd-ground-shadow 1.9s linear forwards;
  }
  /* Laptop fadeout after lid shuts */
  .sd-laptop-exit {
    animation: sd-laptop-fadeout 0.5s cubic-bezier(.55,.06,.68,.19) forwards;
  }

  /* Phone container — perspective for 3D body rotation */
  .sd-phone-stage {
    perspective: 1100px;
    perspective-origin: 50% 55%;
  }
  .sd-phone-fall-anim {
    animation: sd-phone-fall 1.25s cubic-bezier(.86,0,.96,.2) both;
    transform-style: preserve-3d;
    will-change: transform;
  }
  .sd-phone-ghost {
    animation: sd-phone-blur-ghost 1.0s ease-out both;
    pointer-events: none;
    position: absolute;
    top: 0; left: 0; right: 0;
  }
  /* iPhone titanium frame sheen */
  .sd-titanium {
    background: linear-gradient(135deg, #4a4d54 0%, #8e9098 22%, #c8cad0 38%, #6a6d76 55%, #9c9fa8 72%, #5a5d65 100%);
    background-size: 200% 200%;
    animation: sd-titanium-sheen 6s ease-in-out infinite;
  }
  /* Phone frame wrapper — used to apply live tilt transform */
  .sd-phone-frame {
    transition: transform 110ms cubic-bezier(.34,1.4,.64,1);
    transform-style: preserve-3d;
    will-change: transform;
  }

  /* Modal "lift-out" — card grows from its dashboard slot to center stage. */
  @keyframes sd-modal-lift-perf {
    from {
      opacity: 0;
      transform: translate(-57px, 63px) scale(0.38);
      filter: blur(1px);
    }
    60% {
      opacity: 1;
      filter: blur(0);
    }
    to {
      opacity: 1;
      transform: translate(0, 0) scale(1);
      filter: blur(0);
    }
  }
  @keyframes sd-modal-lift-twin {
    from {
      opacity: 0;
      transform: translate(115px, -22px) scale(0.38);
      filter: blur(1px);
    }
    60% {
      opacity: 1;
      filter: blur(0);
    }
    to {
      opacity: 1;
      transform: translate(0, 0) scale(1);
      filter: blur(0);
    }
  }
  /* Backdrop blur fade-in */
  @keyframes sd-backdrop-blur-in {
    from { backdrop-filter: blur(0px); -webkit-backdrop-filter: blur(0px); background: rgba(15,23,42,0); }
    to   { backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); background: rgba(15,23,42,0.35); }
  }
  @keyframes sd-modal-lift-notif {
    from {
      opacity: 0;
      transform: translate(191px, -102px) scale(0.28);
      filter: blur(1px);
    }
    60% {
      opacity: 1;
      filter: blur(0);
    }
    to {
      opacity: 1;
      transform: translate(0, 0) scale(1);
      filter: blur(0);
    }
  }
  @keyframes sd-modal-lift-confirm {
    from {
      opacity: 0;
      transform: translate(-30%, 20%) scale(0.4);
      filter: blur(2px);
    }
    60% {
      opacity: 1;
      filter: blur(0);
    }
    to {
      opacity: 1;
      transform: translate(0, 0) scale(1);
      filter: blur(0);
    }
  }
  .sd-modal-lift-perf    { animation: sd-modal-lift-perf    0.55s cubic-bezier(.34,1.35,.56,1) both; transform-origin: center; }
  .sd-modal-lift-twin    { animation: sd-modal-lift-twin    0.55s cubic-bezier(.34,1.35,.56,1) both; transform-origin: center; }
  .sd-modal-lift-notif   { animation: sd-modal-lift-notif   0.55s cubic-bezier(.34,1.35,.56,1) both; transform-origin: center; }
  .sd-modal-lift-confirm { animation: sd-modal-lift-confirm 0.55s cubic-bezier(.34,1.35,.56,1) both; transform-origin: bottom left; }
  .sd-backdrop-blur      { animation: sd-backdrop-blur-in 0.45s ease both; }

  /* Bell badge pop-in */
  @keyframes sd-bell-badge-pop {
    0%   { transform: scale(0); opacity: 0; }
    65%  { transform: scale(1.5); opacity: 1; }
    100% { transform: scale(1);   opacity: 1; }
  }
  .sd-bell-badge-pop { animation: sd-bell-badge-pop 0.35s cubic-bezier(.34,1.56,.64,1) both; transform-origin: center; }

  /* Cursor move to bell → click → fade  (1.3s total)
     Cursor starts at absolute (180, 140), bell is at approx (424, 16).
     Delta: translate(244px, -124px). */
  @keyframes sd-cursor-sequence {
    0%   { transform: translate(0, 0); opacity: 0; }
    6%   { transform: translate(0, 0); opacity: 1; }
    62%  { transform: translate(244px, -124px); opacity: 1; }
    72%  { transform: translate(244px, -124px) scale(0.78); opacity: 1; }
    82%  { transform: translate(244px, -124px) scale(1.08); opacity: 1; }
    90%  { transform: translate(244px, -124px) scale(1);    opacity: 1; }
    100% { transform: translate(244px, -124px) scale(1);    opacity: 0; }
  }
  .sd-cursor-sequence { animation: sd-cursor-sequence 1.3s ease-in-out both; }

  /* Cursor moves from bell (424,16) to View button (299,180) → click → fade.
     Starts at absolute (424,16), delta: translate(-125px, 164px).
     Delayed 700ms to let the notification modal settle first. */
  @keyframes sd-cursor-view-click {
    0%   { transform: translate(0, 0); opacity: 0; }
    6%   { opacity: 1; }
    62%  { transform: translate(-125px, 164px); opacity: 1; }
    72%  { transform: translate(-125px, 164px) scale(0.78); opacity: 1; }
    82%  { transform: translate(-125px, 164px) scale(1.08); opacity: 1; }
    90%  { transform: translate(-125px, 164px) scale(1);    opacity: 1; }
    100% { transform: translate(-125px, 164px) scale(1);    opacity: 0; }
  }
  .sd-cursor-view-click { animation: sd-cursor-view-click 1.3s ease-in-out both; animation-delay: 700ms; }

  /* View button press — fires when the cursor clicks it */
  @keyframes sd-btn-press {
    0%   { transform: scale(1);    filter: brightness(1); }
    30%  { transform: scale(0.91); filter: brightness(0.8); }
    65%  { transform: scale(1.03); filter: brightness(1.08); }
    100% { transform: scale(1);    filter: brightness(1); }
  }
  .sd-btn-view-press { animation: sd-btn-press 0.35s cubic-bezier(.34,1.4,.64,1) both; animation-delay: 1506ms; }

  /* Cursor moves from (360,120) toward Tapiwa's row at top (delta: -127px, -43px). 700ms settle delay. */
  @keyframes sd-cursor-perf-row {
    0%   { transform: translate(0, 0); opacity: 0; }
    6%   { opacity: 1; }
    62%  { transform: translate(-127px, -43px); opacity: 1; }
    72%  { transform: translate(-127px, -43px) scale(0.78); opacity: 1; }
    82%  { transform: translate(-127px, -43px) scale(1.08); opacity: 1; }
    90%  { transform: translate(-127px, -43px) scale(1);    opacity: 1; }
    100% { transform: translate(-127px, -43px) scale(1);    opacity: 0; }
  }
  .sd-cursor-perf-row { animation: sd-cursor-perf-row 1.3s ease-in-out both; animation-delay: 700ms; }

  /* Row background flash when cursor clicks Tapiwa's row */
  @keyframes sd-row-click-flash {
    0%   { background: transparent; }
    25%  { background: rgba(239, 68, 68, 0.14); }
    65%  { background: rgba(239, 68, 68, 0.06); }
    100% { background: transparent; }
  }

  /* Plan toast slides down from above into top-right corner. Delay 1200ms from twin-panel mount. */
  @keyframes sd-plan-toast-slide {
    from { opacity: 0; transform: translateY(-32px); }
    60%  { opacity: 1; }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sd-plan-toast-slide { animation: sd-plan-toast-slide 0.45s cubic-bezier(.34,1.35,.56,1) both; animation-delay: 1200ms; }

  /* Toast snaps in when plan is activated */
  @keyframes sd-toast-activated-kf {
    from { opacity: 0.7; transform: scale(0.95); }
    to   { opacity: 1;   transform: scale(1); }
  }
  .sd-toast-activated { animation: sd-toast-activated-kf 0.3s cubic-bezier(.34,1.4,.64,1) both; }

  /* Cursor slides from left (60,140) to Activate button — delta +296px, -72px. 2600ms delay. */
  @keyframes sd-cursor-activate {
    0%   { transform: translate(0, 0); opacity: 0; }
    6%   { opacity: 1; }
    62%  { transform: translate(296px, -72px); opacity: 1; }
    72%  { transform: translate(296px, -72px) scale(0.78); opacity: 1; }
    82%  { transform: translate(296px, -72px) scale(1.08); opacity: 1; }
    90%  { transform: translate(296px, -72px) scale(1);    opacity: 1; }
    100% { transform: translate(296px, -72px) scale(1);    opacity: 0; }
  }
  .sd-cursor-activate { animation: sd-cursor-activate 1.3s ease-in-out both; animation-delay: 2600ms; }

  /* Activate button press — fires at cursor click moment: 2600ms + 62%×1300ms = 3406ms */
  .sd-btn-activate-press { animation: sd-btn-press 0.35s cubic-bezier(.34,1.4,.64,1) both; animation-delay: 3406ms; }
`;

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────*/
type Scene =
  | 'idle' | 'dashboard' | 'bell-ping' | 'cursor-to-bell' | 'notification' | 'perf-glow'
  | 'perf-panel' | 'twin-panel' | 'phone'
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

  // True 3D box dimensions for both base and lid.
const W       = 496; 
const BASE_D  = 256;
const BASE_H  = 14;
const LID_H   = 272;
const LID_D   = 8;
const STAGE_W = W + 80;
const STAGE_H = 432;

  // Shared face primitives — every face is a flat W×H plane positioned in 3D.
  const FACE_BASE: React.CSSProperties = { position: 'absolute', backfaceVisibility: 'hidden', boxSizing: 'border-box' };

  return (
    <div
      className="sd-laptop-3d-stage"
      style={{
        position: 'relative',
        width: STAGE_W, height: STAGE_H,
        margin: '0 auto',
        userSelect: 'none',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        className={folding ? 'sd-laptop-body-anim' : exiting ? 'sd-laptop-exit' : undefined}
        style={{
          position: 'absolute', inset: 0,
          transformStyle: 'preserve-3d',
          transform: folding || exiting ? undefined : 'rotateX(-12deg)',
        }}
      >
        {/* Ground shadow — under the chassis on the desk */}
        <div
          className={folding ? 'sd-shadow-anim' : undefined}
          style={{
            position: 'absolute', bottom: 30, left: '8%', width: '84%', height: 22,
            borderRadius: '50%', background: 'transparent',
            boxShadow: '0 32px 60px -8px rgba(0,0,0,0.42), 0 12px 22px -4px rgba(0,0,0,0.26)',
            zIndex: -1,
          }}
        />

        {/* HINGE ANCHOR — 0-size origin point at the back-top edge of the base
            (which is also the bottom-back edge of the lid). All geometry is
            positioned in 3D relative to this point. */}
        <div style={{
          position: 'absolute',
          left: '50%', top: '50%',
          width: 0, height: 0,
          transformStyle: 'preserve-3d',
          transform: `translateY(${(BASE_D - LID_H) / 2 + 10}px)`,
        }}>

          {/* ── BASE BOX — 6 faces of a (W × BASE_H × BASE_D) rectangular solid ── */}
          <div style={{
            position: 'absolute',
            left: 0, top: 0, width: 0, height: 0,
            transformStyle: 'preserve-3d',
            transform: `translateY(${BASE_H / 2}px) translateZ(${BASE_D / 2}px)`,
          }}>
            {/* TOP — keyboard deck */}
            <div style={{
              ...FACE_BASE,
              width: W, height: BASE_D,
              left: -W / 2, top: -BASE_D / 2,
              transform: `translateY(${-BASE_H / 2}px) rotateX(90deg)`,
              background: 'linear-gradient(180deg, #2c2c31 0%, #1f1f24 55%, #16161a 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 0 40px rgba(0,0,0,0.4)',
              borderRadius: '4px 4px 6px 6px',
            }}>
              {/* Keyboard well */}
              <div aria-hidden style={{
                position: 'absolute', top: 26, left: 70, right: 70, height: 130,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.22) 100%)',
                borderRadius: 6,
                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.03)',
              }}>
                <div style={{
                  position: 'absolute', inset: 8,
                  background: 'repeating-linear-gradient(90deg, transparent 0 28px, rgba(255,255,255,0.05) 28px 29px), repeating-linear-gradient(0deg, transparent 0 18px, rgba(255,255,255,0.05) 18px 19px)',
                  borderRadius: 2,
                }} />
              </div>
              {/* Trackpad */}
              <div aria-hidden style={{
                position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
                width: 220, height: 60,
                background: 'linear-gradient(180deg, #17171b 0%, #121216 100%)',
                borderRadius: 5,
                boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.05)',
              }} />
              {/* AO from descending lid — at the hinge edge of the deck */}
              <div
                className={folding ? 'sd-base-ao' : undefined}
                aria-hidden
                style={{
                  position: 'absolute', left: '4%', right: '4%', top: 0, height: 36,
                  background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.18) 70%, transparent 100%)',
                  opacity: folding ? undefined : 0,
                  pointerEvents: 'none',
                  transformOrigin: 'top',
                }}
              />
            </div>

            {/* BOTTOM — underside (faces the desk) */}
            <div style={{
              ...FACE_BASE,
              width: W, height: BASE_D,
              left: -W / 2, top: -BASE_D / 2,
              transform: `translateY(${BASE_H / 2}px) rotateX(-90deg)`,
              background: 'linear-gradient(180deg, #08080a 0%, #050507 100%)',
            }} />

            {/* FRONT — user-facing edge of chassis */}
            <div style={{
              ...FACE_BASE,
              width: W, height: BASE_H,
              left: -W / 2, top: -BASE_H / 2,
              transform: `translateZ(${BASE_D / 2}px)`,
              background: 'linear-gradient(180deg, #25252a 0%, #16161a 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.6)',
              borderRadius: '0 0 4px 4px',
            }} />

            {/* BACK — hinge-side edge */}
            <div style={{
              ...FACE_BASE,
              width: W, height: BASE_H,
              left: -W / 2, top: -BASE_H / 2,
              transform: `translateZ(${-BASE_D / 2}px) rotateY(180deg)`,
              background: 'linear-gradient(180deg, #1a1a1e 0%, #0a0a0c 100%)',
            }} />

            {/* LEFT side */}
            <div style={{
              ...FACE_BASE,
              width: BASE_D, height: BASE_H,
              left: -BASE_D / 2, top: -BASE_H / 2,
              transform: `translateX(${-W / 2}px) rotateY(-90deg)`,
              background: 'linear-gradient(180deg, #1c1c20 0%, #0e0e12 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.5)',
            }} />

            {/* RIGHT side */}
            <div style={{
              ...FACE_BASE,
              width: BASE_D, height: BASE_H,
              left: -BASE_D / 2, top: -BASE_H / 2,
              transform: `translateX(${W / 2}px) rotateY(90deg)`,
              background: 'linear-gradient(180deg, #1c1c20 0%, #0e0e12 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.5)',
            }} />
          </div>

          {/* ── LID PIVOT — rotates around the hinge (origin point) ── */}
          <div
            className={folding ? 'sd-lid-anim' : undefined}
            style={{
              position: 'absolute',
              left: 0, top: 0, width: 0, height: 0,
              transformStyle: 'preserve-3d',
              transformOrigin: 'center center',
            }}
          >
            {/* LID BOX — center is LID_H/2 above hinge and LID_D/2 behind hinge,
                so the bottom-back edge of the lid is exactly at the pivot. */}
            <div style={{
              position: 'absolute',
              left: 0, top: 0, width: 0, height: 0,
              transformStyle: 'preserve-3d',
              transform: `translateY(${-LID_H / 2}px) translateZ(${-LID_D / 2}px)`,
            }}>
              {/* FRONT — screen */}
              <div style={{
                ...FACE_BASE,
                width: W, height: LID_H,
                left: -W / 2, top: -LID_H / 2,
                transform: `translateZ(${LID_D / 2}px)`,
                background: '#89c9e5',
                border: '15px solid #3f3f41',
                borderTop: '20px solid #3f3f41',
                borderRadius: '14px 14px 0 0',
                overflow: 'hidden',
              }}>
                {children}
                {folding && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 30, animation: 'sd-screen-dim 1.9s linear forwards', pointerEvents: 'none' }} />
                )}
                {folding && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 31, overflow: 'hidden', pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '-60%', width: '55%', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 45%, rgba(255,255,255,0.45) 55%, transparent 100%)', animation: 'sd-glare-sweep 1.9s linear forwards' }} />
                  </div>
                )}
              </div>

              {/* BACK — lid exterior with K logo */}
              <div style={{
                ...FACE_BASE,
                width: W, height: LID_H,
                left: -W / 2, top: -LID_H / 2,
                transform: `translateZ(${-LID_D / 2}px) rotateY(180deg)`,
                background: 'linear-gradient(140deg, #34343a 0%, #25252a 35%, #1c1c20 70%, #131316 100%)',
                borderRadius: '14px 14px 0 0',
                border: '15px solid #3f3f41',
                borderTop: '20px solid #3f3f41',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.45)',
                display: 'grid', placeItems: 'center',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 12,
                  background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 45%, transparent 70%)',
                  display: 'grid', placeItems: 'center',
                  color: 'rgba(255,255,255,0.18)',
                  fontWeight: 900, fontSize: 22, letterSpacing: '-0.04em',
                }}>K</div>
              </div>

              {/* TOP edge */}
              <div style={{
                ...FACE_BASE,
                width: W, height: LID_D,
                left: -W / 2, top: -LID_D / 2,
                transform: `translateY(${-LID_H / 2}px) rotateX(90deg)`,
                background: 'linear-gradient(180deg, #3f3f41 0%, #2a2a2d 100%)',
              }} />

              {/* BOTTOM edge (at hinge) */}
              <div style={{
                ...FACE_BASE,
                width: W, height: LID_D,
                left: -W / 2, top: -LID_D / 2,
                transform: `translateY(${LID_H / 2}px) rotateX(-90deg)`,
                background: 'linear-gradient(180deg, #0e0e12 0%, #050507 100%)',
              }} />

              {/* LEFT edge */}
              <div style={{
                ...FACE_BASE,
                width: LID_D, height: LID_H,
                left: -LID_D / 2, top: -LID_H / 2,
                transform: `translateX(${-W / 2}px) rotateY(-90deg)`,
                background: 'linear-gradient(90deg, #3f3f41 0%, #2a2a2d 100%)',
              }} />

              {/* RIGHT edge */}
              <div style={{
                ...FACE_BASE,
                width: LID_D, height: LID_H,
                left: -LID_D / 2, top: -LID_H / 2,
                transform: `translateX(${W / 2}px) rotateY(90deg)`,
                background: 'linear-gradient(90deg, #2a2a2d 0%, #3f3f41 100%)',
              }} />
            </div>
          </div>
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

interface DashboardProps { perfGlowing?: boolean; twinGlowing?: boolean; twinCardHidden?: boolean; perfCardHidden?: boolean; bellActive?: boolean; bellHiddenInHeader?: boolean }

const Dashboard: React.FC<DashboardProps> = ({ perfGlowing, twinGlowing, twinCardHidden, perfCardHidden, bellActive, bellHiddenInHeader }) => (
  <div style={{ width: '100%', height: '100%', background: '#1976d2', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }}>
    <div style={{ flexShrink: 0, padding: '6px 8px 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#111', display: 'grid', placeItems: 'center', color: 'white', fontSize: 7, fontWeight: 900, flexShrink: 0, position: 'relative', zIndex: 2, marginRight: -18 }}>PM</div>
            <div style={{ background: 'white', padding: '0px 22px 3px 25px', clipPath: 'polygon(0 0,100% 0,90% 100%,0 100%)', width: 90, position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: 8, fontWeight: 900, color: '#111', lineHeight: 1.2, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>MRS. MATHE</p>
              <p style={{ fontSize: 6.5, color: '#2563eb', fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap' }}>Mathematics ▾</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <div style={{ position: 'relative', background: '#e5e7eb', borderRadius: 5, width: 20, height: 20, display: 'grid', placeItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.12)', visibility: bellHiddenInHeader ? 'hidden' : undefined }}>
            <svg width="10" height="10" fill="none" stroke="#374151" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {bellActive && <div className="sd-bell-badge-pop" style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'grid', placeItems: 'center', color: 'white', fontSize: 4, fontWeight: 900 }}>1</div>}
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
          <div className={perfGlowing ? 'sd-ring-pulse' : undefined} style={{ flex: 1, background: '#f0f4f8', borderRadius: 8, padding: '8px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column', visibility: perfCardHidden ? 'hidden' : undefined }}>
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
        <div className={twinGlowing ? 'sd-ring-pulse' : undefined} style={{ background: '#f0f4f8', borderRadius: 8, padding: '6px 8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', flex: '1 1 0', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', visibility: twinCardHidden ? 'hidden' : undefined }}>
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
  <div
    className="sd-backdrop-blur"
    style={{
      position: 'absolute',
      inset: 0,
      zIndex: 10,
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      background: 'rgba(15,23,42,0.35)',
    }}
  />
);

/* ─────────────────────────────────────────────────────────────
   SCENE: Notification
───────────────────────────────────────────────────────────────*/
const SceneNotification: React.FC = () => (
  <>
    <Backdrop />
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div className="sd-modal-lift-notif" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '58%' }}>

        {/* Bell grown from header */}
        <div style={{ position: 'relative', width: 36, height: 36, borderRadius: 9, background: '#e5e7eb', display: 'grid', placeItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' }}>
          <svg width="18" height="18" fill="none" stroke="#374151" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div style={{ position: 'absolute', top: -4, right: -4, width: 13, height: 13, borderRadius: '50%', background: '#ef4444', border: '2px solid white', display: 'grid', placeItems: 'center', color: 'white', fontSize: 7, fontWeight: 900 }}>1</div>
        </div>

        {/* Notification card */}
        <div style={{ background: '#f0f4f8', borderRadius: 10, overflow: 'hidden', width: '100%', boxShadow: '0 18px 50px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.4)' }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid #e3e8ee' }}>
            <p style={{ fontWeight: 900, fontSize: 12, color: '#111' }}>Algebra Test Auto-Graded</p>
            <p style={{ fontSize: 9, color: '#6b7280', marginTop: 1 }}>38 submissions · 4 seconds</p>
          </div>
          <div className="sd-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px' }}>
            <AlertTriangle size={11} color="#d97706" />
            <p style={{ fontSize: 11, fontWeight: 700, color: '#92400e' }}>4 students flagged</p>
          </div>
        </div>

        {/* Buttons below the card */}
        <div style={{ display: 'flex', gap: 6, width: '100%' }}>
          <button style={{ flex: 1, fontSize: 9, fontWeight: 700, padding: '5px 0', borderRadius: 6, background: '#e5e7eb', color: '#6b7280', border: 'none' }}>Close</button>
          <button className="sd-btn-view-press" style={{ flex: 1, fontSize: 9, fontWeight: 700, padding: '5px 0', borderRadius: 6, background: '#2563eb', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
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
  // worst first — Tapiwa is immediately visible at the top
  { name: 'Tapiwa Moyo',    score: 38, f: true  },
  { name: 'Rudo Chikwanda', score: 44, f: false },
  { name: 'Prosper Ncube',  score: 51, f: false },
  { name: 'Blessing Dube',  score: 58, f: false },
  { name: 'Tatenda Banda',  score: 62, f: false },
  { name: 'Nyasha Mutasa',  score: 67, f: false },
  // 7th row peeks — scroll hint
  { name: 'Farai Sibanda',  score: 76, f: false },
  { name: 'Tafadzwa Nkosi', score: 83, f: false },
  { name: 'Chipo Ndlovu',   score: 92, f: false },
];

const ScenePerfPanel: React.FC = () => (
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
          <div className="custom-scrollbar" style={{ overflowY: 'auto', maxHeight: 132, paddingRight: 2 }}>
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

/* ─────────────────────────────────────────────────────────────
   SCENE: Digital twin panel
───────────────────────────────────────────────────────────────*/
const TAPIWA_ATTRS = [
  { l: 'Subst.',     v: 56 },
  { l: 'Factors',    v: 42 },
  { l: 'Quadratics', v: 32 },
  { l: 'Ineqs.',     v: 39 },
  { l: 'Linear Eqs', v: 48 },
  { l: 'Exprs.',     v: 44 },
  { l: 'Word Prbs',  v: 38 },
];

const SceneTwinPanel: React.FC<{ approved?: boolean }> = ({ approved }) => (
  <>
    <Backdrop />

    {/* Centered twin modal */}
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div
        className="sd-modal-lift-twin"
        style={{
          background: '#f0f4f8',
          borderRadius: 12,
          padding: '12px 16px',
          boxShadow: '0 18px 50px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.4)',
          display: 'flex',
          flexDirection: 'column',
          width: '62%',
          maxHeight: '88%',
          overflow: 'hidden',
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#111', textAlign: 'center', marginBottom: 8, letterSpacing: '0.04em' }}>
          Student Development
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#111', display: 'grid', placeItems: 'center', color: 'white', fontSize: 10, fontWeight: 900, flexShrink: 0 }}>TM</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#111', lineHeight: 1.1 }}>
              Moyo <span style={{ fontWeight: 400, color: '#6b7280' }}>Tapiwa</span>
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, color: '#dc2626' }}>43</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#9ca3af' }}>OVR</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 8, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Form 3</p>
            <p style={{ fontSize: 8, color: '#ef4444', fontWeight: 900, textTransform: 'uppercase', marginTop: 2 }}>Below threshold</p>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, fontWeight: 700, color: '#9ca3af', marginBottom: 3 }}>
            <span>Algebra: 38%</span><span>Target: 71%</span>
          </div>
          <div style={{ background: '#e5e7eb', borderRadius: 99, height: 5, overflow: 'hidden' }}>
            <div className="sd-grow-bar" style={{ width: '38%', background: '#ef4444', height: 5, borderRadius: 99 }} />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: 'auto auto',
          alignContent: 'center',
          gap: '3px 0',
          padding: '7px 0',
          borderTop: '1px solid #e3e8ee',
          borderBottom: '1px solid #e3e8ee',
        }}>
          {TAPIWA_ATTRS.map((a, i) => (
            <p key={`n-${a.l}`} className="sd-fade-up" style={{
              fontSize: 6, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase',
              textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word', margin: 0,
              animationDelay: `${i * 60}ms`,
            }}>{a.l}</p>
          ))}
          {TAPIWA_ATTRS.map((a, i) => (
            <p key={`v-${a.l}`} className="sd-fade-up" style={{
              fontSize: 10, fontWeight: 900, color: '#ef4444',
              textAlign: 'center', margin: 0,
              opacity: a.l === 'Quadratics' ? 0.65 : 1,
              animationDelay: `${i * 60 + 80}ms`,
              textShadow: '0 0 10px rgba(239,68,68,0.35)',
            }}>{a.v}%</p>
          ))}
        </div>
      </div>
    </div>

    {/* Plan toast — top-right, slides in 1200ms after twin-panel mounts */}
    {!approved ? (
      <div
        className="sd-plan-toast-slide"
        style={{
          position: 'absolute', top: 10, right: 10, width: 200, zIndex: 22,
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.3)',
        }}
      >
        <div style={{ background: '#2563eb', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <AlertTriangle size={10} color="rgba(255,255,255,0.85)" />
          <p style={{ color: 'white', fontWeight: 900, fontSize: 10 }}>KundAI Plan Ready</p>
        </div>
        <div style={{ background: '#f0f4f8', padding: '7px 12px' }}>
          <p style={{ fontSize: 9, color: '#374151', marginBottom: 5 }}>14 steps · Algebra focus · Quadratics 32%</p>
          <button
            className="sd-btn-activate-press"
            style={{ width: '100%', fontSize: 9, fontWeight: 700, padding: '5px 0', borderRadius: 5, background: '#2563eb', color: 'white', border: 'none', cursor: 'default' }}
          >
            Activate Plan
          </button>
        </div>
      </div>
    ) : (
      <div
        className="sd-toast-activated"
        style={{
          position: 'absolute', top: 10, right: 10, width: 200, zIndex: 22,
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.3)',
        }}
      >
        <div style={{ background: '#059669', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <CheckCircle size={10} color="white" />
          <p style={{ color: 'white', fontWeight: 900, fontSize: 10 }}>Plan Activated</p>
        </div>
        <div style={{ background: '#f0fdf4', padding: '7px 12px' }}>
          <p style={{ fontSize: 9, color: '#059669', fontWeight: 700 }}>14-step Algebra plan · first checkpoint in 3 days</p>
        </div>
      </div>
    )}
  </>
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
  partial?: boolean;
}

const WA_MESSAGES: Omit<WaMessage, 'typed' | 'done'>[] = [
  { id: 1, from: 'kundai',  text: 'Hie Tapiwa! 👋', time: '16:42 AM' },
  { id: 2, from: 'kundai',  text: "Your teacher flagged your Algebra score — 38% on the test. I've been through your paper and I can see exactly where things broke down. 📊", time: '16:42 AM' },
  { id: 3, from: 'kundai',  text: "MISSION BRIEFING\n\nAgent Tapiwa, I've built you a 14-step Algebra plan. We're starting with Quadratics — you scored 32% there and it's your biggest gap right now.", time: '16:42 AM' },
  { id: 4, from: 'kundai',  text: 'Your mission should you choose to accept it:\n\n✅ Quadratics — 5 sessions\n✅ Factorisation — 4 sessions\n✅ Linear equations — 5 sessions\n\nThis message will self destruct in 5..4..3.. just kidding😄', time: '16:43 AM' },
  { id: 5, from: 'tapiwa',  text: "Mission accepted. Let's go! 🔥", time: '16:43 AM' },
  { id: 6, from: 'kundai', text: "Let's go back to Question 4. You had to factorise x² + 5x + 6.\n\nYou wrote (x+2)(x+4) — right shape, close thinking. But let's check it:\n\n(x+2)(x+4) = x² + 4x + 2x + 8 = x² + 6x + 8\n\nSee it? You got +8 instead of +6. The numbers 2 and 4 multiply to 8, not 6.\n\nHere's the rule: to factorise x² + bx + c, you need two numbers that do both jobs:\n\n✅ multiply to c (the last number)\n✅ add to b (the middle number)\n\nFor x² + 5x + 6 — try 1 and 6: 1×6 = 6 ✓ but 1+6 = 7 ✗\n\nNow you try. What pair works? 🎯", time: '16:44 AM' },
  { id: 7, from: 'tapiwa', text: 'WAIT i picked the wrong pair 😭 its 2 and 3 innit', time: '16:44 AM', partial: true },
];

/* ── iOS Keyboard layout ──
 * Each key carries an x_norm (-1 left → +1 right) and y_norm (-1 top → +1 bottom).
 * Pressing a key tilts the iPhone in real 3D — rotateY follows x_norm
 * (press left → right edge rotates toward viewer, exposing the right side),
 * rotateX follows y_norm (press bottom → bottom edge rotates away, top toward viewer).
 */
const KB_ROWS: string[][] = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['z','x','c','v','b','n','m'],
];

// Tilt magnitudes — tuned to feel weighty but not seasick
const TILT_RY_MAX = 9;   // degrees on Y axis (left/right keys)
const TILT_RX_MAX = 6.5; // degrees on X axis (top/bottom row)

interface KeyPress { row: number; col: number; key: string; ts: number; }

type KbMode = 'abc' | 'emoji';

// 6×8 emoji grid Tapiwa would pick from — 🔥 sits in the middle-right
const EMOJI_GRID: string[][] = [
  ['😀','😂','🥰','😍','😘','🤔','😎','😅'],
  ['😢','😭','😡','😱','🤯','🙄','😴','🤤'],
  ['👍','👎','👏','🙏','💪','🔥','✨','💯'],
  ['❤️','💛','💚','💙','💜','🎉','🚀','⚡'],
];

// Locate an emoji in the grid (return null if absent so we can fall back gracefully)
function findEmojiCoords(emoji: string): { row: number; col: number } | null {
  for (let r = 0; r < EMOJI_GRID.length; r++) {
    const c = EMOJI_GRID[r].indexOf(emoji);
    if (c >= 0) return { row: r, col: c };
  }
  return null;
}

// Detect whether a character is an emoji / symbol (rather than a typeable Latin char)
function isEmojiLike(ch: string): boolean {
  // Anything outside basic ASCII is treated as a picker glyph
  return [...ch].some(cp => (cp.codePointAt(0) ?? 0) > 127);
}

const PhoneMockup: React.FC<{ started: boolean; onComplete?: () => void }> = ({ started, onComplete }) => {
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [status, setStatus] = useState('Your academic assistant');
  const [showTyping, setShowTyping] = useState(false);
  const [kbActive, setKbActive] = useState(false);           // keyboard visible
  const [kbMode, setKbMode] = useState<KbMode>('abc');       // QWERTY or emoji picker
  const [kbDraft, setKbDraft] = useState('');                // text appearing in the input bar as Tapiwa types
  const [pressedKey, setPressedKey] = useState<KeyPress | null>(null);
  const [pressedEmoji, setPressedEmoji] = useState<{ row: number; col: number; ts: number } | null>(null);
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const seqRef = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Find the keyboard coords for a given character
  const findKeyCoords = (ch: string): { row: number; col: number; key: string } | null => {
    const lower = ch.toLowerCase();
    for (let r = 0; r < KB_ROWS.length; r++) {
      const idx = KB_ROWS[r].indexOf(lower);
      if (idx >= 0) return { row: r, col: idx, key: KB_ROWS[r][idx] };
    }
    if (lower === ' ') return { row: 3, col: 4, key: ' ' };          // space — bottom center
    if (lower === '!' || lower === '.' || lower === '?' || lower === "'") return { row: 3, col: 7, key: lower }; // right-bottom punctuation key
    return null;
  };

  // Normalize a key's (row,col) to (-1..+1) per axis for tilt math
  const tiltFor = (kp: { row: number; col: number; key: string } | null): { rx: number; ry: number } => {
    if (!kp) return { rx: 0, ry: 0 };
    if (kp.row >= KB_ROWS.length) {
      // bottom row (space/punct) — strong downward tilt
      const xNorm = kp.col === 4 ? 0 : (kp.col > 4 ? 0.7 : -0.7);
      return { rx: TILT_RX_MAX, ry: -xNorm * TILT_RY_MAX };
    }
    const row = KB_ROWS[kp.row];
    const mid = (row.length - 1) / 2;
    const xNorm = (kp.col - mid) / mid;       // -1 .. +1
    const yNorm = (kp.row / (KB_ROWS.length - 1)) * 2 - 1; // -1 (top row q-p) .. +1 (bottom row z-m)
    // Press LEFT → right edge toward viewer → rotateY NEGATIVE (in CSS, negative rotateY brings right edge forward)
    const ry = -xNorm * TILT_RY_MAX;
    // Press BOTTOM → bottom edge tilts away → rotateX POSITIVE (top toward viewer)
    const rx = yNorm * TILT_RX_MAX;
    return { rx, ry };
  };

  // ── Main scripted sequence ──
  useEffect(() => {
    if (!started || seqRef.current) return;
    seqRef.current = true;
    let cursor = 0;
    let cancelled = false;

    const sleep = (ms: number) => new Promise<void>(res => setTimeout(() => !cancelled && res(), ms));

    const typeKundai = (msgId: number, fullText: string) => new Promise<void>(resolve => {
      // Original char-by-char typing into the chat bubble (KundAI side)
      let i = 0;
      const iv = setInterval(() => {
        if (cancelled) { clearInterval(iv); resolve(); return; }
        i++;
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, typed: fullText.slice(0, i), done: i >= fullText.length } : m));
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        if (i >= fullText.length) { clearInterval(iv); resolve(); }
      }, 16);
    });

    // Tapiwa typing on the iOS keyboard — each keystroke tilts the phone in real 3D.
    // Iterating with Array.from() so multi-codepoint emoji (🔥, ❤️) count as one glyph.
    const typeTapiwaOnKeyboard = async (fullText: string) => {
      setKbActive(true);
      setKbMode('abc');
      setKbDraft('');
      await sleep(520); // keyboard rise — give it time to settle visually

      const glyphs = Array.from(fullText);
      for (let i = 0; i < glyphs.length; i++) {
        if (cancelled) return;
        const ch = glyphs[i];

        if (isEmojiLike(ch)) {
          // ── Switch to emoji picker ──
          // Brief "press the 😊 key" tap on the QWERTY layout first
          setKbMode('abc');
          // simulate tapping the globe/emoji switcher (bottom-left area) → tilt
          setTilt({ rx: TILT_RX_MAX * 0.85, ry: TILT_RY_MAX * 0.55 });
          await sleep(180);
          setKbMode('emoji');
          await sleep(260); // emoji picker transition
          // Find emoji in grid (fall back to row 2 col 5 — where 🔥 sits — if not found)
          const ec = findEmojiCoords(ch) ?? { row: 2, col: 5 };
          // Compute tilt the same way as letter keys: center the grid, normalize, apply
          const midC = (EMOJI_GRID[0].length - 1) / 2;
          const xN = (ec.col - midC) / midC;                                  // -1..+1
          const yN = (ec.row / (EMOJI_GRID.length - 1)) * 2 - 1;              // -1..+1
          const tiltTarget = { rx: yN * TILT_RX_MAX, ry: -xN * TILT_RY_MAX };
          setTilt(tiltTarget);
          setPressedEmoji({ row: ec.row, col: ec.col, ts: Date.now() });
          await sleep(160); // hover before tap
          // Tap registers — append the emoji to the draft
          setKbDraft(prev => prev + ch);
          await sleep(280); // savour the tap, hold the tilt
          setTilt({ rx: tiltTarget.rx * 0.4, ry: tiltTarget.ry * 0.4 });
          setPressedEmoji(null);
          await sleep(120);
          // If more chars follow, switch back to QWERTY; otherwise stay in emoji
          if (i < glyphs.length - 1 && !isEmojiLike(glyphs[i + 1])) {
            setKbMode('abc');
            await sleep(220);
          }
          continue;
        }

        // ── Normal letter / punctuation keystroke ──
        const kp = findKeyCoords(ch);
        const tiltTarget = tiltFor(kp);
        setTilt(tiltTarget);
        if (kp) setPressedKey({ ...kp, ts: Date.now() });
        setKbDraft(prev => prev + ch);

        // Per-keystroke pacing — real student typing, ~5 chars/sec base with variance
        let wait = 145 + Math.random() * 95;          // 145–240ms baseline
        if (ch === ' ') wait += 70;                   // brief breath on space
        if (/[.!?,]/.test(ch)) wait += 240;           // longer pause after punctuation
        if (ch.toLowerCase() === 'i' && i > 0 && glyphs[i - 1].toLowerCase() === 'm') wait += 60; // micro-pause mid-word
        await sleep(wait);
        // Ease the tilt about a third of the way back — keeps the phone moving but not jittery
        setTilt({ rx: tiltTarget.rx * 0.32, ry: tiltTarget.ry * 0.32 });
        await sleep(85);
      }

      // ── Read-over pause before sending ──
      setPressedKey(null);
      setPressedEmoji(null);
      await sleep(620);
      // "Send" tap — small forward + right tilt (send button sits bottom-right)
      setTilt({ rx: TILT_RX_MAX * 0.7, ry: -TILT_RY_MAX * 0.55 });
      await sleep(220);
      setTilt({ rx: 0, ry: 0 });
      setKbMode('abc');
      setKbDraft('');
      setKbActive(false);
      await sleep(320); // keyboard fall
    };

    const runNext = async () => {
      if (cancelled) return;
      if (cursor >= WA_MESSAGES.length) {
        setStatus('online'); setShowTyping(false); onComplete?.(); return;
      }
      const cfg = WA_MESSAGES[cursor++];

      if (cfg.from === 'tapiwa') {
        setStatus('online');
        setShowTyping(false);

        if (cfg.partial) {
          // Tapiwa starts typing but never sends — story ends here with keyboard open
          setKbActive(true);
          setKbMode('abc');
          setKbDraft('');
          await sleep(480);
          for (const ch of Array.from(cfg.text)) {
            if (cancelled) return;
            const kp = findKeyCoords(ch);
            const tiltTarget = tiltFor(kp);
            setTilt(tiltTarget);
            if (kp) setPressedKey({ ...kp, ts: Date.now() });
            setKbDraft(prev => prev + ch);
            await sleep(155 + Math.random() * 85);
            setTilt({ rx: tiltTarget.rx * 0.32, ry: tiltTarget.ry * 0.32 });
            await sleep(80);
          }
          // Keyboard and draft stay visible — call onComplete to trigger the restart chain
          onComplete?.();
          return;
        }

        // Normal Tapiwa message — full type-and-send
        await typeTapiwaOnKeyboard(cfg.text);
        if (cancelled) return;
        setMessages(prev => [...prev, { ...cfg, typed: cfg.text, done: true }]);
        await sleep(500);
      } else {
        // KundAI side: typing indicator + character-by-character bubble fill
        setStatus('typing...'); setShowTyping(true);
        await sleep(1100);
        if (cancelled) return;
        setShowTyping(false);
        setMessages(prev => [...prev, { ...cfg, typed: '', done: false }]);
        await sleep(80);
        await typeKundai(cfg.id, cfg.text);
        await sleep(700);
      }
      runNext();
    };

    setTimeout(() => { if (!cancelled) runNext(); }, 400);
    return () => { cancelled = true; };
  }, [started, onComplete]);

  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [messages, showTyping, kbDraft]);

  // Apply tilt as inline transform on the phone frame
  const tiltTransform = `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`;

  // ── iPhone 15 Pro geometry — a real 3D box, not a flat rectangle ──
  const PHONE_W = 218;
  const PHONE_H = 442;
  const PHONE_D = 14;     // physical thickness (the side band the user actually sees on tilt)
  const FRAME = 4;        // titanium rail thickness on the front bezel
  const RAD = 38;         // corner radius of the front face
  const SCREEN_W = PHONE_W - FRAME * 2;
  const SCREEN_H = PHONE_H - FRAME * 2;
  const HALF_D = PHONE_D / 2;
  const HALF_W = PHONE_W / 2;
  const HALF_H = PHONE_H / 2;

  // Reusable titanium rail gradient — what every side face shows
  const RAIL_LIGHT = 'linear-gradient(180deg, #4d5057 0%, #9da0a8 18%, #d1d3d8 42%, #6a6d76 60%, #3d4047 100%)';
  const RAIL_TOP   = 'linear-gradient(90deg, #4d5057 0%, #9da0a8 18%, #d1d3d8 42%, #6a6d76 60%, #3d4047 100%)';

  return (
    /* 3D stage: outer perspective + drop-in animation */
    <div className="sd-phone-stage" style={{ fontFamily: 'system-ui, sans-serif', position: 'relative', width: PHONE_W + 12, margin: '0 auto' }}>
      {/* Motion-blur ghost — silhouette trailing above the falling phone */}
      <div className="sd-phone-ghost" aria-hidden>
        <div style={{ width: PHONE_W, margin: '0 auto', height: PHONE_H, borderRadius: RAD, background: 'linear-gradient(180deg, #2a2a30 0%, #1a1a20 100%)', opacity: 0.55, boxShadow: '0 30px 50px rgba(0,0,0,0.25)' }} />
      </div>
      {/* Phone body — drop-in animation wraps the live-tilt frame */}
      <div className="sd-phone-fall-anim" style={{ position: 'relative' }}>
        {/* Live-tilt frame — receives keystroke-driven rotateX/rotateY */}
        <div
          className="sd-phone-frame"
          style={{
            width: PHONE_W,
            height: PHONE_H,
            margin: '0 auto',
            position: 'relative',
            transform: tiltTransform,
            transformOrigin: '50% 50%',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* ═══ 3D BOX ═══ All six faces live here. Each face is centered on the cube
              centre and then translated/rotated to its position. preserve-3d on every
              ancestor is what makes the sides actually visible when the phone tilts. */}
          <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>

            {/* TOP edge — trimmed away from the corner-radius zones so the rounded
                front face doesn't reveal sharp rail corners poking through */}
            <div aria-hidden style={{
              position: 'absolute', left: '50%', top: '50%',
              width: PHONE_W - RAD * 2, height: PHONE_D,
              transform: `translate(-50%, -50%) rotateX(90deg) translateZ(${HALF_H}px)`,
              background: RAIL_TOP,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.45)',
            }}>
              {/* Mic pinhole */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 4, height: 2, background: '#0a0a0c', borderRadius: 1 }} />
            </div>

            {/* BOTTOM edge — speaker grille + USB-C, trimmed away from corners */}
            <div aria-hidden style={{
              position: 'absolute', left: '50%', top: '50%',
              width: PHONE_W - RAD * 2, height: PHONE_D,
              transform: `translate(-50%, -50%) rotateX(-90deg) translateZ(${HALF_H}px)`,
              background: RAIL_TOP,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18,
            }}>
              {/* Speaker grille (left) */}
              <div style={{ display: 'flex', gap: 3 }}>
                {[0,1,2,3,4].map(i => <span key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#0a0a0c' }} />)}
              </div>
              {/* USB-C port */}
              <div style={{ width: 22, height: 6, borderRadius: 3, background: '#0a0a0c', boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.8)' }} />
              {/* Speaker grille (right) */}
              <div style={{ display: 'flex', gap: 3 }}>
                {[0,1,2,3,4].map(i => <span key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#0a0a0c' }} />)}
              </div>
            </div>

            {/* LEFT rail — Action button + Volume up + Volume down sit on this face.
                Trimmed away from top/bottom corner-radius zones */}
            <div aria-hidden style={{
              position: 'absolute', left: '50%', top: '50%',
              width: PHONE_D, height: PHONE_H - RAD * 2,
              transform: `translate(-50%, -50%) rotateY(-90deg) translateZ(${HALF_W}px)`,
              background: RAIL_LIGHT,
              boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.30), inset -1px 0 0 rgba(0,0,0,0.40)',
              transformStyle: 'preserve-3d',
            }}>
              {/* Action button — protrudes OUTWARD from this face via translateZ.
                  Positions are relative to the trimmed rail (which starts RAD=38 down). */}
              <div style={{
                position: 'absolute', top: 12, left: '50%',
                width: 8, height: 18, borderRadius: 1.5,
                transform: 'translateX(-50%) translateZ(1.5px)',
                background: 'linear-gradient(180deg, #2a2c32 0%, #6b6e76 50%, #babbc1 100%)',
                boxShadow: '0 1px 1px rgba(0,0,0,0.5)',
              }} />
              {/* Volume up */}
              <div style={{
                position: 'absolute', top: 46, left: '50%',
                width: 8, height: 32, borderRadius: 2,
                transform: 'translateX(-50%) translateZ(1.5px)',
                background: 'linear-gradient(180deg, #2a2c32 0%, #6b6e76 50%, #babbc1 100%)',
                boxShadow: '0 1px 1px rgba(0,0,0,0.5)',
              }} />
              {/* Volume down */}
              <div style={{
                position: 'absolute', top: 88, left: '50%',
                width: 8, height: 32, borderRadius: 2,
                transform: 'translateX(-50%) translateZ(1.5px)',
                background: 'linear-gradient(180deg, #2a2c32 0%, #6b6e76 50%, #babbc1 100%)',
                boxShadow: '0 1px 1px rgba(0,0,0,0.5)',
              }} />
            </div>

            {/* RIGHT rail — Power button, trimmed away from top/bottom corners */}
            <div aria-hidden style={{
              position: 'absolute', left: '50%', top: '50%',
              width: PHONE_D, height: PHONE_H - RAD * 2,
              transform: `translate(-50%, -50%) rotateY(90deg) translateZ(${HALF_W}px)`,
              background: RAIL_LIGHT,
              boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.30), inset -1px 0 0 rgba(0,0,0,0.40)',
              transformStyle: 'preserve-3d',
            }}>
              <div style={{
                position: 'absolute', top: 62, left: '50%',
                width: 8, height: 54, borderRadius: 2,
                transform: 'translateX(-50%) translateZ(1.5px)',
                background: 'linear-gradient(180deg, #2a2c32 0%, #6b6e76 50%, #babbc1 100%)',
                boxShadow: '0 1px 1px rgba(0,0,0,0.5)',
              }} />
            </div>

            {/* BACK face — natural titanium back with camera bump */}
            <div aria-hidden style={{
              position: 'absolute', left: '50%', top: '50%',
              width: PHONE_W, height: PHONE_H, borderRadius: RAD,
              transform: `translate(-50%, -50%) rotateY(180deg) translateZ(${HALF_D}px)`,
              background: 'linear-gradient(155deg, #6c6f76 0%, #4a4d54 30%, #3a3d44 60%, #2a2d34 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.4), inset 0 0 30px rgba(0,0,0,0.45)',
              transformStyle: 'preserve-3d',
            }}>
              {/* Camera plateau */}
              <div style={{ position: 'absolute', top: 16, left: 16, width: 68, height: 68, borderRadius: 22, background: 'linear-gradient(145deg, #555861 0%, #34373d 80%)', boxShadow: '0 3px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10)', transform: 'translateZ(1px)' }}>
                {[ {t:8,l:8}, {t:8,l:32}, {t:32,l:8} ].map((p, idx) => (
                  <div key={idx} style={{ position: 'absolute', top: p.t, left: p.l, width: 22, height: 22, borderRadius: '50%', background: 'radial-gradient(circle, #2a3a4a 0%, #0a0d14 60%, #000 100%)', boxShadow: 'inset 0 0 4px rgba(120,170,220,0.4), 0 1px 2px rgba(0,0,0,0.6)' }}>
                    <div style={{ position: 'absolute', top: 5, left: 5, width: 6, height: 6, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)' }} />
                  </div>
                ))}
                {/* LiDAR */}
                <div style={{ position: 'absolute', top: 36, left: 38, width: 14, height: 14, borderRadius: '50%', background: '#1a1a1d', border: '1px solid #2a2d34' }} />
                {/* Flash */}
                <div style={{ position: 'absolute', top: 8, left: 50, width: 12, height: 12, borderRadius: '50%', background: 'radial-gradient(circle, #f7f7f0 0%, #d4d4c8 70%)' }} />
              </div>
              {/* Apple logo */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 38, fontWeight: 100, color: 'rgba(255,255,255,0.12)' }}>K</div>
              {/* MagSafe ring (subtle) */}
              <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', width: 90, height: 90, borderRadius: '50%', border: '0.5px solid rgba(255,255,255,0.04)' }} />
            </div>

            {/* FRONT face — the titanium chassis + the OLED screen.
                NOTE: no preserve-3d here. Its children (chassis / screen / island /
                home indicator) are flat overlays and must stack by source order so
                the screen paints OVER the titanium. */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              width: PHONE_W, height: PHONE_H,
              transform: `translate(-50%, -50%) translateZ(${HALF_D}px)`,
            }}>
              {/* Titanium chassis */}
              <div
                className="sd-titanium"
                style={{
                  position: 'absolute', inset: 0, borderRadius: RAD,
                  boxShadow:
                    /* outer cast */
                    '0 22px 38px -10px rgba(0,0,0,0.45), 0 8px 18px -4px rgba(0,0,0,0.30),' +
                    /* polished edge highlights — fake the rounded titanium edge */
                    'inset 0 0 0 1px rgba(255,255,255,0.18),' +
                    'inset 0 1.5px 0 rgba(255,255,255,0.35),' +
                    'inset 0 -1.5px 0 rgba(0,0,0,0.35),' +
                    'inset 1.5px 0 0 rgba(255,255,255,0.10),' +
                    'inset -1.5px 0 0 rgba(0,0,0,0.18)',
                }}
              />

              {/* OLED screen — painted over the chassis via source order */}
              <div
                style={{
                  position: 'absolute',
                  top: FRAME, left: FRAME, width: SCREEN_W, height: SCREEN_H,
                  borderRadius: RAD - FRAME,
                  background: '#000',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 0 0 1px #000, inset 0 0 12px rgba(0,0,0,0.6)',
                }}
              >
            {/* Inner WhatsApp UI */}
            <div style={{ width: '100%', height: '100%', background: '#e5ddd5', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* iOS status bar */}
              <div style={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', background: '#075e54', color: 'white', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                <span>9:41</span>
                <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
                  {/* signal */}
                  <span style={{ display: 'inline-flex', gap: 1, alignItems: 'flex-end' }}>
                    {[3, 5, 7, 9].map(h => <span key={h} style={{ width: 2, height: h, background: 'white', borderRadius: 0.5 }} />)}
                  </span>
                  {/* battery */}
                  <span style={{ display: 'inline-block', width: 16, height: 8, border: '1px solid white', borderRadius: 2, position: 'relative', padding: 1 }}>
                    <span style={{ display: 'block', width: '78%', height: '100%', background: 'white', borderRadius: 0.5 }} />
                    <span style={{ position: 'absolute', right: -2, top: 2, width: 1, height: 4, background: 'white', borderRadius: 0.5 }} />
                  </span>
                </span>
              </div>
              {/* WhatsApp header */}
              <div style={{ background: '#075e54', padding: '5px 10px 7px', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#25D366', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#075e54' }}>K</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'white', margin: 0 }}>KundAI</p>
                  <p style={{ fontSize: 8, color: 'rgba(255,255,255,.75)', margin: 0 }}>{status}</p>
                </div>
              </div>
              {/* Message body */}
              <div ref={bodyRef} style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', scrollbarWidth: 'none' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 8, background: 'rgba(0,0,0,.1)', color: '#555', padding: '2px 8px', borderRadius: 12 }}>Today</span>
                </div>
                {messages.map(msg => (
                  <div key={msg.id} className="sd-msg-pop" style={{ display: 'flex', justifyContent: msg.from === 'tapiwa' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '82%' }}>
                      <div style={{ background: msg.from === 'tapiwa' ? '#dcf8c6' : 'white', borderRadius: msg.from === 'tapiwa' ? '8px 0 8px 8px' : '0 8px 8px 8px', padding: '6px 8px', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)' }}>
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
                    <div style={{ background: 'white', borderRadius: '0 8px 8px 8px', padding: '7px 10px', display: 'flex', gap: 3, alignItems: 'center', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)' }}>
                      <span className="sd-typing-dot" /><span className="sd-typing-dot" /><span className="sd-typing-dot" />
                    </div>
                  </div>
                )}
              </div>
              {/* Input bar — shows the live draft as Tapiwa types.
                  Sits in the flex column ABOVE the keyboard so it stays visible. */}
              <div style={{ background: '#f0f0f0', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, borderTop: '.5px solid #d0d0d0', zIndex: 11, position: 'relative' }}>
                <div style={{ flex: 1, background: 'white', borderRadius: 16, padding: '4px 10px', minHeight: 18, overflow: 'hidden' }}>
                  {kbActive && kbDraft ? (
                    <p style={{ fontSize: 9, color: '#111', margin: 0, lineHeight: 1.3, wordBreak: 'break-word' }}>{kbDraft}<span className="sd-blink-cur" /></p>
                  ) : (
                    <p style={{ fontSize: 9, color: '#aaa', margin: 0 }}>Type a message</p>
                  )}
                </div>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: kbActive && kbDraft ? '#25D366' : '#c7cad1', display: 'grid', placeItems: 'center', transition: 'background .2s' }}>
                  {kbActive && kbDraft ? (
                    <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  ) : (
                    <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                  )}
                </div>
              </div>
              {/* iOS keyboard — natural flex item that slides up from below */}
              {kbActive && (
                <IOSKeyboard pressedKey={pressedKey} mode={kbMode} pressedEmoji={pressedEmoji} />
              )}
            </div>

            {/* Dynamic Island — black pill at the top */}
            <div aria-hidden style={{
              position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
              width: 78, height: 18, borderRadius: 10,
              background: '#000',
              boxShadow: '0 0 0 0.5px rgba(255,255,255,0.05), inset 0 0 6px rgba(0,0,0,0.6)',
              zIndex: 5,
            }}>
              {/* tiny camera lens */}
              <div style={{ position: 'absolute', top: 5, right: 12, width: 7, height: 7, borderRadius: '50%', background: 'radial-gradient(circle, #1a3045 0%, #050c14 70%, #000 100%)', boxShadow: 'inset 0 0 2px rgba(60,140,200,0.6)' }} />
            </div>

            {/* Subtle screen reflection — fixed sheen, doesn't tilt with phone for a contrast cue */}
            <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.04) 100%)' }} />
              </div>

              {/* Home indicator — sits on the front face, just above the bottom rail */}
              <div aria-hidden style={{ position: 'absolute', bottom: FRAME + 4, left: '50%', transform: 'translateX(-50%)', width: 70, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.85)', zIndex: 6 }} />
            </div>{/* /FRONT face */}
          </div>{/* /3D BOX */}

          {/* Phone's own drop-shadow — blooms exactly on landing.
              Sits outside the cube so the floor shadow stays flat (doesn't tilt with rails). */}
          <div aria-hidden style={{ position: 'absolute', bottom: -26, left: '8%', width: '84%', height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.32)', filter: 'blur(10px)', animation: 'sd-phone-shadow 1.25s cubic-bezier(.23,1,.32,1) both' }} />
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   iOS KEYBOARD — slides up while Tapiwa is typing.
   Each pressed key flashes; the parent phone tilts via state.
   Mode 'emoji' renders an emoji picker grid instead of QWERTY.
───────────────────────────────────────────────────────────────*/
const IOSKeyboard: React.FC<{
  pressedKey: KeyPress | null;
  mode: KbMode;
  pressedEmoji: { row: number; col: number; ts: number } | null;
}> = ({ pressedKey, mode, pressedEmoji }) => {
  return (
    <div
      style={{
        background: '#cfd2d8',
        padding: '5px 3px 7px',
        flexShrink: 0,
        animation: 'sd-kb-rise 0.32s cubic-bezier(.34,1.4,.64,1) both',
        boxShadow: '0 -1px 0 rgba(0,0,0,0.18)',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {mode === 'emoji' ? (
        <>
          {/* Top tab strip — recent / smileys / animals / etc. */}
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 6px 4px', borderBottom: '0.5px solid rgba(0,0,0,0.12)' }}>
            {['🕐','😀','🐶','🍔','⚽','💡','🔣','🏁'].map((g, idx) => (
              <span key={idx} style={{ fontSize: 11, opacity: idx === 1 ? 1 : 0.45 }}>{g}</span>
            ))}
          </div>
          {EMOJI_GRID.map((row, rIdx) => (
            <div key={rIdx} style={{ display: 'flex', justifyContent: 'space-around', padding: '3px 4px' }}>
              {row.map((emoji, cIdx) => {
                const isPressed = pressedEmoji && pressedEmoji.row === rIdx && pressedEmoji.col === cIdx;
                return (
                  <div
                    key={cIdx + '-' + (pressedEmoji?.ts ?? 0) + '-' + isPressed}
                    style={{
                      width: 20, height: 20, borderRadius: 4,
                      display: 'grid', placeItems: 'center',
                      fontSize: 13,
                      background: isPressed ? 'rgba(149,154,168,0.55)' : 'transparent',
                      transform: isPressed ? 'scale(1.35)' : 'scale(1)',
                      transition: 'transform 120ms cubic-bezier(.34,1.4,.64,1), background 120ms',
                      filter: isPressed ? 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))' : undefined,
                    }}
                  >
                    {emoji}
                  </div>
                );
              })}
            </div>
          ))}
          {/* Bottom bar in emoji mode: ABC | search | backspace */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 4px 0' }}>
            <KeyCap label="ABC" wide gray />
            <div style={{ flex: 1, height: 22, borderRadius: 4.5, background: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', padding: '0 6px', fontSize: 8, color: '#666' }}>🔍 Search Emoji</div>
            <KeyCap label="⌫" gray />
          </div>
        </>
      ) : (
        <>
          {KB_ROWS.map((row, rIdx) => {
            const isBottomLetters = rIdx === 2;
            const indent = rIdx === 1 ? 9 : 0;
            return (
              <div key={rIdx} style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 4, paddingLeft: indent, paddingRight: indent }}>
                {isBottomLetters && <KeyCap label="⇧" wide />}
                {row.map((ch, cIdx) => {
                  const isPressed = pressedKey && pressedKey.row === rIdx && pressedKey.col === cIdx;
                  return <KeyCap key={ch} label={ch.toUpperCase()} pressed={!!isPressed} ts={pressedKey?.ts} />;
                })}
                {isBottomLetters && <KeyCap label="⌫" wide />}
              </div>
            );
          })}
          {/* Bottom row: 123 / emoji / space / return */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 3, paddingLeft: 2, paddingRight: 2 }}>
            <KeyCap label="123" wide gray />
            <KeyCap label="🙂" gray />
            <div
              style={{
                flex: 1, height: 22, borderRadius: 4.5,
                background: pressedKey && pressedKey.row >= KB_ROWS.length ? '#9aa1ad' : 'white',
                boxShadow: '0 1px 0 rgba(0,0,0,0.28)',
                display: 'grid', placeItems: 'center',
                fontSize: 9, fontWeight: 500, color: '#222',
                transition: 'background 90ms',
              }}
            >
              space
            </div>
            <KeyCap label="return" wide gray />
          </div>
        </>
      )}
      <div style={{ height: 4 }} />
    </div>
  );
};

const KeyCap: React.FC<{ label: string; wide?: boolean; gray?: boolean; pressed?: boolean; ts?: number }> = ({ label, wide, gray, pressed, ts }) => (
  <div
    key={ts ?? 0}
    style={{
      width: wide ? 22 : 16,
      height: 22,
      borderRadius: 4.5,
      background: gray ? '#a4adbb' : 'white',
      boxShadow: '0 1px 0 rgba(0,0,0,0.28)',
      display: 'grid',
      placeItems: 'center',
      fontSize: label.length > 1 ? 8 : 10,
      fontWeight: 500,
      color: '#222',
      animation: pressed ? 'sd-key-press 130ms ease-out' : undefined,
    }}
  >
    {label}
  </div>
);

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
    // Stage 1: 5-phase 3D lid fold — ~1900ms total. We trigger the exit fade
    // right after the magnetic-seal bounce so the spring settle blends into the sink.
    setSwapPhase('folding');
    after(1750, () => {
      // Stage 1b: lid fully shut — assembly sinks + fades
      setSwapPhase('exit');
      after(420, () => {
        // Stage 2: flash burst at the exact moment of disappearance
        setSwapPhase('flash');
        after(140, () => {
          // Stage 3: iPhone drops in with elastic landing — 1250ms
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
    after(3000,  () => setScene('bell-ping'));        // badge pops onto bell
    after(4200,  () => setScene('cursor-to-bell'));   // cursor moves to bell & clicks
    after(5500,  () => setScene('notification'));     // notification modal opens
    after(8700,  () => setScene('perf-glow'));
    after(10100, () => setScene('perf-panel'));       // perf modal: cursor clicks Tapiwa at ~1506ms
    after(12300, () => setScene('twin-panel'));       // twin lifts; toast slides in at +1200ms
    after(16300, () => setTwinApproved(true));        // cursor clicks Activate at +3406ms; approve at +4000ms
    after(18300, triggerSwap);
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
   CURSOR OVERLAY
───────────────────────────────────────────────────────────────*/
const CursorSVG = () => (
  <svg width="13" height="16" viewBox="0 0 13 16" fill="none">
    <path d="M1 1L1 14L4.5 10.5L7 15.5L9 14.5L6.5 9.5L11 9.5L1 1Z" fill="#111827" stroke="white" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);

const CursorOverlay: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none', overflow: 'hidden' }}>
    <div className="sd-cursor-sequence" style={{ position: 'absolute', left: 180, top: 140 }}>
      <CursorSVG />
    </div>
  </div>
);

const CursorViewOverlay: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 25, pointerEvents: 'none', overflow: 'hidden' }}>
    <div className="sd-cursor-view-click" style={{ position: 'absolute', left: 424, top: 16 }}>
      <CursorSVG />
    </div>
  </div>
);

const CursorPerfRowOverlay: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 25, pointerEvents: 'none', overflow: 'hidden' }}>
    <div className="sd-cursor-perf-row" style={{ position: 'absolute', left: 360, top: 120 }}>
      <CursorSVG />
    </div>
  </div>
);

const CursorActivateOverlay: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 25, pointerEvents: 'none', overflow: 'hidden' }}>
    <div className="sd-cursor-activate" style={{ position: 'absolute', left: 60, top: 140 }}>
      <CursorSVG />
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   SCREEN CONTENT
───────────────────────────────────────────────────────────────*/
const ScreenContent: React.FC<{ scene: Scene; twinApproved: boolean }> = ({ scene, twinApproved }) => (
  <>
    <Dashboard
      perfGlowing={scene === 'perf-glow'}
      twinGlowing={scene === 'twin-panel'}
      twinCardHidden={scene === 'twin-panel'}
      perfCardHidden={scene === 'perf-panel'}
      bellActive={scene === 'bell-ping' || scene === 'cursor-to-bell'}
      bellHiddenInHeader={scene === 'notification'}
    />
    {scene === 'cursor-to-bell'              && <CursorOverlay />}
    {scene === 'notification'                && <SceneNotification />}
    {scene === 'notification'                && <CursorViewOverlay />}
    {scene === 'perf-panel'                  && <ScenePerfPanel />}
    {scene === 'perf-panel'                  && <CursorPerfRowOverlay />}
    {scene === 'twin-panel'                  && <SceneTwinPanel approved={twinApproved} />}
    {scene === 'twin-panel' && !twinApproved && <CursorActivateOverlay />}
    {(scene === 'outcome' || scene === 'fading') && <SceneOutcome />}
  </>
);

/* ─────────────────────────────────────────────────────────────
   STEP STRIP
───────────────────────────────────────────────────────────────*/
const NARRATION_STEPS: { text: string; scenes: Set<Scene> }[] = [
  {
    text: 'Assessment submissions that go through KundAI are automatically graded',
    scenes: new Set<Scene>(['dashboard', 'bell-ping', 'cursor-to-bell', 'notification']),
  },
  {
    text: "KundAI detects the knowledge gaps from the student's answers",
    scenes: new Set<Scene>(['perf-glow', 'perf-panel']),
  },
  {
    text: 'KundAI prepares a student development plan to tackle the gaps',
    scenes: new Set<Scene>(['twin-panel']),
  },
  {
    text: 'KundAI teaches the student on WhatsApp addressing all gaps detected',
    scenes: new Set<Scene>(['phone', 'outcome', 'fading']),
  },
];

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

  // Laptop is visible during normal laptop scenes AND throughout the fold (folding → exit → flash)
  const isLaptopScene = !['phone', 'outcome', 'fading'].includes(scene) && scene !== 'idle';
  const showLaptopHtml = isLaptopScene || swapPhase === 'folding' || swapPhase === 'exit' || swapPhase === 'flash';
  // Phone is visible once swap starts or scene is phone/outcome
  const showPhone = swapPhase === 'phone-in' || swapPhase === 'flash' || scene === 'phone' || scene === 'outcome' || scene === 'fading';

  const activeNarrationIdx = NARRATION_STEPS.findIndex(s => s.scenes.has(scene));

  return (
    <section
      ref={sectionRef}
      id="how"
      className="relative bg-white/70 backdrop-blur-sm border-y border-gray-200/70 min-h-[calc(100vh-3.5rem)] flex flex-col scroll-mt-14"
    >
      <style>{STORY_CSS}</style>

      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgb(148 163 184 / .25) 1px, transparent 1.2px)', backgroundSize: '24px 24px' }}
      />

      <div className="relative w-full max-w-6xl mx-auto px-6 py-10 grid grid-cols-3 gap-8 items-stretch flex-1">

        {/* ── LEFT (1/3): header + narration ── */}
        <div className="col-span-1 flex flex-col">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">How it works</p>
            <h2 className="text-3xl font-black tracking-tighter text-gray-900">From insight to action — instantly.</h2>
            <p className="mt-3 text-gray-600 text-sm">Kundai spots a gap, builds a plan, and the student gets the brief — right on their phone.</p>
          </div>

          {/* Narration slot (vertically centered in remaining space) */}
          <div className="flex-1 flex flex-col justify-center mt-8">
            {scene !== 'idle' && (
              <div>
                {NARRATION_STEPS.map((step, idx) => {
                  const isPast   = activeNarrationIdx > idx;
                  const isActive = activeNarrationIdx === idx;
                  return (
                    <div key={idx} className="flex gap-4 pb-7 last:pb-0">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div
                          className="rounded-full transition-all duration-300"
                          style={{
                            width: isActive ? 10 : 7,
                            height: isActive ? 10 : 7,
                            marginTop: 3,
                            flexShrink: 0,
                            background: isActive ? '#2563eb' : isPast ? '#93c5fd' : '#d1d5db',
                            boxShadow: isActive ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none',
                          }}
                        />
                        {idx < NARRATION_STEPS.length - 1 && (
                          <div style={{ width: 1.5, flex: 1, minHeight: 20, marginTop: 4, background: isPast ? '#93c5fd' : '#e5e7eb', transition: 'background 0.3s' }} />
                        )}
                      </div>
                      <p
                        className="text-sm leading-snug transition-all duration-300"
                        style={{
                          color: isActive ? '#111827' : isPast ? '#9ca3af' : '#d1d5db',
                          fontWeight: isActive ? 700 : isPast ? 500 : 400,
                        }}
                      >
                        {step.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT (2/3): stage ── */}
        <div className="col-span-2 flex items-center justify-center">
          {scene !== 'idle' && (
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>

              {/* LAPTOP */}
              {showLaptopHtml && (
                <div style={{
                  position: showPhone ? 'absolute' : 'relative',
                  width: '100%',
                  height: 360,           // crop to actual visible laptop extent
                  paddingTop: 50,        // absorb lid that juts above stage bbox
                  boxSizing: 'border-box',
                  overflow: 'visible',   // let fold-down animation spill if it needs to
                  opacity: swapPhase === 'flash' ? 0 : 1,
                  transition: swapPhase === 'flash' ? 'opacity 0.08s ease' : 'none',
                }}>
                  <LaptopShell foldPhase={swapPhase === 'folding' ? 'folding' : swapPhase === 'exit' ? 'exit' : 'idle'}>
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
        </div>
      </div>
    </section>
  );
};

export default StoryDemo;