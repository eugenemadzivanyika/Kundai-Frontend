import React from 'react';
import type { LaptopShellProps, FoldPhase } from '../types';

export const LaptopShell: React.FC<LaptopShellProps> = ({ children, foldPhase = 'idle' }) => {
  const folding = foldPhase === 'folding';
  const exiting = foldPhase === 'exit';

  const W       = 496;
  const BASE_D  = 256;
  const BASE_H  = 14;
  const LID_H   = 272;
  const LID_D   = 8;
  const STAGE_W = W + 80;
  const STAGE_H = 432;

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
                  <div style={{ position: 'absolute', inset: 0, zIndex: 30, animation: 'sd-screen-dim 1.75s linear forwards', pointerEvents: 'none' }} />
                )}
                {folding && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 31, overflow: 'hidden', pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '-60%', width: '55%', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 45%, rgba(255,255,255,0.45) 55%, transparent 100%)', animation: 'sd-glare-sweep 1.75s linear forwards' }} />
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

              {/* TOP edge — trimmed by corner-radius (14px) on both sides */}
              <div style={{
                ...FACE_BASE,
                width: W - 28, height: LID_D,
                left: -(W - 28) / 2, top: -LID_D / 2,
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
                width: LID_D, height: LID_H - 14,
                left: -LID_D / 2, top: -(LID_H - 14) / 2 + 7,
                transform: `translateX(${-W / 2}px) rotateY(-90deg)`,
                background: 'linear-gradient(90deg, #3f3f41 0%, #2a2a2d 100%)',
              }} />

              {/* RIGHT edge */}
              <div style={{
                ...FACE_BASE,
                width: LID_D, height: LID_H - 14,
                left: -LID_D / 2, top: -(LID_H - 14) / 2 + 7,
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
