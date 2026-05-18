import React, { useRef, useState, useEffect } from 'react';
import { STORY_CSS } from './storydemo.css';
import { ST_W, ST_H, PHONE_TOP, TOAST_L, TOAST_T, TOAST_W, NARRATION_STEPS } from './constants';
import { useSequencer } from './hooks/useSequencer';
import { LaptopShell } from './laptop/LaptopShell';
import { ScreenContent } from './laptop/ScreenContent';
import { FlashBurst } from './stage/FlashBurst';
import { FloatingToast } from './stage/FloatingToast';
// Note: PhoneMockup will be imported here once created
// import { PhoneMockup } from './phone/PhoneMockup';

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

  const { scene, swapPhase, phoneStarted, restartKey, twinApproved, handlePhoneComplete, showFloatingToast, toastAbsorbing, preWakePhone } = useSequencer(visible);

  const isLaptopScene = !['phone', 'outcome', 'fading'].includes(scene) && scene !== 'idle';
  const showLaptopHtml = isLaptopScene || swapPhase === 'folding' || swapPhase === 'flash';
  const showPhone = swapPhase === 'phone-in' || swapPhase === 'flash' || scene === 'phone' || scene === 'outcome' || scene === 'fading';

  const activeNarrationIdx = NARRATION_STEPS.findIndex(s => s.scenes.has(scene));

  // PhoneMockup placeholder - will be replaced once component is created
  const PhoneMockup: React.FC<any> = () => <div>PhoneMockup coming soon</div>;

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

          {/* Narration slot */}
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

        {/* ── RIGHT (2/3): fixed-coordinate stage ── */}
        <div className="col-span-2 flex items-center justify-center">
          {scene !== 'idle' && (
            <div style={{
              position: 'relative',
              width: ST_W,
              height: ST_H,
              overflow: 'visible',
            }}>

              {/* LAPTOP — absolute at top of fixed stage */}
              {showLaptopHtml && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: 430,
                  paddingTop: 50,
                  boxSizing: 'border-box',
                  overflow: 'visible',
                  opacity: swapPhase === 'flash' ? 0 : 1,
                  transition: swapPhase === 'flash' ? 'opacity 0.08s ease' : 'none',
                }}>
                  <LaptopShell foldPhase={swapPhase === 'folding' ? 'folding' : 'idle'}>
                    <ScreenContent scene={scene} twinApproved={twinApproved} folding={swapPhase === 'folding'} />
                  </LaptopShell>
                </div>
              )}

              {/* FLASH BURST */}
              {swapPhase === 'flash' && <FlashBurst />}

              {/* PHONE — absolute at PHONE_TOP */}
              {showPhone && (
                <div style={{ position: 'absolute', top: PHONE_TOP, left: 0, right: 0 }}>
                  <PhoneMockup
                    key={restartKey}
                    started={phoneStarted}
                    preWake={preWakePhone}
                    onComplete={handlePhoneComplete}
                  />
                </div>
              )}

              {/* STAGE-LEVEL TOAST */}
              <FloatingToast
                show={showFloatingToast}
                absorbing={toastAbsorbing}
                left={TOAST_L}
                top={TOAST_T}
                width={TOAST_W}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default StoryDemo;
