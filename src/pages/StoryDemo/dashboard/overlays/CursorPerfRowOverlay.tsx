import React from 'react';
import { CursorSVG } from './CursorSVG';

export const CursorPerfRowOverlay: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 25, pointerEvents: 'none', overflow: 'hidden' }}>
    <div className="sd-cursor-perf-row" style={{ position: 'absolute', left: 360, top: 120 }}>
      <CursorSVG />
    </div>
  </div>
);
