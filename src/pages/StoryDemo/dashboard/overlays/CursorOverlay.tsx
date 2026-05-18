import React from 'react';
import { CursorSVG } from './CursorSVG';

export const CursorOverlay: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none', overflow: 'hidden' }}>
    <div className="sd-cursor-sequence" style={{ position: 'absolute', left: 180, top: 140 }}>
      <CursorSVG />
    </div>
  </div>
);
