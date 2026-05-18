import React from 'react';
import { CursorSVG } from './CursorSVG';

export const CursorActivateOverlay: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 25, pointerEvents: 'none', overflow: 'hidden' }}>
    <div className="sd-cursor-activate" style={{ position: 'absolute', left: 60, top: 140 }}>
      <CursorSVG />
    </div>
  </div>
);
