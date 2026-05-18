import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Backdrop } from '../Backdrop';

export const SceneNotification: React.FC = () => (
  <>
    <Backdrop />
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div className="sd-modal-lift-notif" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '58%' }}>

        {/* Bell grown from header */}
        <div style={{ position: 'relative', width: 36, height: 36, borderRadius: 9, background: '#e5e7eb', display: 'grid', placeItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' }}>
          <svg width="18" height="18" fill="none" stroke="#374151" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div style={{ position: 'absolute', top: -4, right: -4, width: 13, height: 13, borderRadius: '50%', background: '#ef4444', border: '2px solid white', display: 'grid', placeItems: 'center', color: 'white', fontSize: 7, fontWeight: 900 }}>1</div>
        </div>

        {/* Notification card */}
        <div style={{ background: '#f0f4f8', borderRadius: 10, overflow: 'hidden', width: '100%', boxShadow: '0 18px 50px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.4)' }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid #e3e8ee' }}>
            <p style={{ fontWeight: 900, fontSize: 12, color: '#111' }}>Algebra Test Auto-Graded</p>
            <p style={{ fontSize: 9, color: '#6b7280', marginTop: 1 }}>38 submissions · 4 seconds</p>
          </div>
          <div className="sd-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px' }}>
            <AlertTriangle size={11} color="#d97706" />
            <p style={{ fontSize: 11, fontWeight: 700, color: '#92400e' }}>4 students flagged</p>
          </div>
        </div>

        {/* Buttons below the card */}
        <div style={{ display: 'flex', gap: 6, width: '100%' }}>
          <button style={{ flex: 1, fontSize: 9, fontWeight: 700, padding: '5px 0', borderRadius: 6, background: '#e5e7eb', color: '#6b7280', border: 'none' }}>Close</button>
          <button className="sd-btn-view-press" style={{ flex: 1, fontSize: 9, fontWeight: 700, padding: '5px 0', borderRadius: 6, background: '#2563eb', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            View <ChevronRight size={9} />
          </button>
        </div>

      </div>
    </div>
  </>
);
