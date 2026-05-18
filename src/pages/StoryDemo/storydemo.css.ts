export const STORY_CSS = `
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
    0%   { opacity:0; transform: translateY(-520px); filter:blur(14px); }
    12%  { opacity:0.7; filter:blur(6px); }
    30%  { opacity:1;   filter:blur(1px); }
    80%  { filter:blur(0); }
    100% { transform: translateY(0); opacity:1; filter:blur(0); }
  }

  /* The phone's own cast shadow — blooms as phone approaches landing */
  @keyframes sd-phone-shadow {
    0%,60% { opacity:0;    transform: scaleX(0.4) scaleY(0.25) translateY(22px); filter: blur(14px); }
    85%    { opacity:0.30; transform: scaleX(0.9)  scaleY(0.8)  translateY(4px);  filter: blur(9px); }
    100%   { opacity:0.32; transform: scaleX(1)    scaleY(1)    translateY(0);    filter: blur(8px); }
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
    animation: sd-laptop-body 1.75s linear forwards;
  }
  /* The lid — rotates on the hinge (bottom-center origin) */
  .sd-lid-anim {
    transform-origin: center bottom;
    transform-style: preserve-3d;
    animation: sd-lid-fold 1.75s linear forwards;
  }
  /* Base receives ambient-occlusion as lid descends */
  .sd-base-ao {
    animation: sd-base-ao 1.75s linear forwards;
  }
  .sd-hinge-shade {
    animation: sd-hinge-shade 1.75s linear forwards;
  }
  /* Ground shadow under whole assembly */
  .sd-shadow-anim {
    animation: sd-ground-shadow 1.75s linear forwards;
  }
  /* Laptop fadeout after lid shuts */
  .sd-laptop-exit {
    animation: sd-laptop-fadeout 1.5s cubic-bezier(.55,.06,.68,.19) forwards;
  }

  /* Phone container — perspective for 3D body rotation */
  .sd-phone-stage {
    perspective: 1100px;
    perspective-origin: 50% 55%;
  }
  .sd-phone-fall-anim {
    animation: sd-phone-fall 3s cubic-bezier(0.33, 1, 0.68, 1) both;
    transform-style: preserve-3d;
    will-change: transform;
  }
  .sd-phone-ghost {
    animation: sd-phone-blur-ghost 2.4s ease-out both;
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

  /* ── Plan bubble flies from scaled laptop (top-right) to phone screen center ── */
  @keyframes sd-plan-bubble-fly-kf {
    0%   { opacity: 0; transform: translate(187px, 102px) scale(0.8); }
    12%  { opacity: 1; transform: translate(187px, 102px) scale(1); }
    75%  { opacity: 1; transform: translate(30px, 18px) scale(1.02); }
    100% { opacity: 1; transform: translate(0, 0) scale(1); }
  }
  .sd-plan-bubble-fly { animation: sd-plan-bubble-fly-kf 2500ms cubic-bezier(.25,.46,.45,.94) both; }

  /* Toast body collapses as it morphs into WhatsApp header */
  @keyframes sd-toast-body-out-kf {
    0%   { opacity: 1; max-height: 60px; padding-top: 7px; padding-bottom: 7px; }
    55%  { opacity: 0; max-height: 60px; }
    100% { opacity: 0; max-height: 0;    padding-top: 0;   padding-bottom: 0; }
  }
  .sd-toast-body-out { animation: sd-toast-body-out-kf 420ms cubic-bezier(.5,0,.25,1) forwards; overflow: hidden; }

  /* Phone screen metallic shimmer while screen is off */
  @keyframes sd-screen-shimmer-kf {
    0%, 100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }
  }
  .sd-screen-shimmer {
    background: linear-gradient(135deg, #050507 0%, #0e1015 22%, #1c2030 45%, #0e1015 72%, #050507 100%);
    background-size: 240% 240%;
    animation: sd-screen-shimmer-kf 3s ease-in-out infinite;
  }

  /* Pre-wake glow — blue radial bloom the instant before absorption */
  @keyframes sd-pre-wake-kf {
    0%   { opacity: 0; transform: scale(0.35); }
    55%  { opacity: 0.88; transform: scale(1); }
    100% { opacity: 0;   transform: scale(1.7); }
  }
  .sd-pre-wake { animation: sd-pre-wake-kf 650ms ease-out forwards; }

  /* WhatsApp chat body slides up after screen wakes */
  @keyframes sd-chat-reveal-kf {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sd-screen-wake  { animation: sd-chat-reveal-kf 480ms cubic-bezier(.34,1.2,.5,1) both; }
`;
