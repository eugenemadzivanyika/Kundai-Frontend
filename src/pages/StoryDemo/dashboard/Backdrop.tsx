import React from 'react';

export const Backdrop: React.FC = () => (
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
