import React from 'react';
import { CheckCircle } from 'lucide-react';

interface FloatingToastProps {
  show: boolean;
  absorbing: boolean;
  left: number;
  top: number;
  width: number;
}

export const FloatingToast: React.FC<FloatingToastProps> = ({ show, absorbing, left, top, width }) => {
  if (!show) return null;

  return (
    <div
      className={!absorbing ? 'sd-toast-orphan' : undefined}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        zIndex: 45,
        borderRadius: absorbing ? 0 : 10,
        overflow: 'hidden',
        boxShadow: absorbing
          ? 'none'
          : '0 8px 32px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.3)',
        transition: 'border-radius 420ms cubic-bezier(.5,0,.25,1), box-shadow 420ms ease-out',
        pointerEvents: 'none',
      }}
    >
      {/* Header — transforms from green plan badge → WhatsApp chat header */}
      <div style={{
        background: absorbing ? '#075e54' : '#059669',
        padding: absorbing ? '7px 10px' : '6px 12px',
        display: 'flex', alignItems: 'center', gap: absorbing ? 8 : 5,
        transition: 'background 360ms ease, padding 360ms ease, gap 360ms ease',
      }}>
        <div style={{
          width: absorbing ? 26 : 20,
          height: absorbing ? 26 : 20,
          borderRadius: '50%',
          background: '#25D366',
          color: '#075e54',
          display: 'grid', placeItems: 'center',
          fontSize: absorbing ? 11 : 9, fontWeight: 900,
          border: '1.5px solid white', flexShrink: 0,
          transition: 'width 360ms ease, height 360ms ease, font-size 360ms ease',
        }}>K</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, color: 'white', fontSize: 10, fontWeight: 900, lineHeight: 1.1 }}>KundAI</p>
          <p style={{ margin: 0, color: 'rgba(255,255,255,.82)', fontSize: 8, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {absorbing ? 'online' : 'Plan Activated · sending to Tapiwa…'}
          </p>
        </div>
        {!absorbing && <CheckCircle size={10} color="white" />}
      </div>
      {/* Body — collapses on absorption */}
      <div className={absorbing ? 'sd-toast-body-out' : undefined}
        style={{ background: '#f0fdf4', padding: '7px 12px', overflow: 'hidden' }}>
        <p style={{ fontSize: 9, color: '#059669', fontWeight: 700, margin: 0 }}>
          14-step Algebra plan · first checkpoint in 3 days
        </p>
      </div>
    </div>
  );
};
