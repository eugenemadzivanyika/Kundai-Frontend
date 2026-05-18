import React from 'react';

export const FlashBurst: React.FC = () => (
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
