import React from 'react';
import { CursorSVG } from './CursorSVG';

export const CursorViewOverlay: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 25, pointerEvents: 'none', overflow: 'hidden' }}>
    <div className="sd-cursor-view-click" style={{ position: 'absolute', left: 424, top: 16 }}>
      <CursorSVG />
    </div>
  </div>
);
