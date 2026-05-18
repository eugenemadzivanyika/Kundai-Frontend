import React from 'react';
import { TrendingUp } from 'lucide-react';

export const SceneOutcome: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'white', display: 'flex', flexDirection: 'column', padding: '14px 18px', fontFamily: 'system-ui, sans-serif' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 10, borderBottom: '1px solid #f3f4f6', marginBottom: 12 }}>
      <div style={{ width: 20, height: 20, borderRadius: 5, background: '#2563eb', display: 'grid', placeItems: 'center', color: 'white', fontSize: 9, fontWeight: 900 }}>K</div>
      <span style={{ fontSize: 9, fontWeight: 700, color: '#1f2937' }}>FORM 3B · MATHEMATICS</span>
    </div>
    <div className="sd-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', whiteSpace: 'nowrap' }}>3 days later</p>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
    </div>
    <div className="sd-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f9fafb', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#111', color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>TM</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>Tapiwa Moyo</p>
        <p style={{ fontSize: 8, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>Statistics · Day 3 of 14</p>
      </div>
      <span style={{ fontSize: 8, fontWeight: 900, color: '#059669', background: '#dcfce7', padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' }}>On track</span>
    </div>
    <div className="sd-fade-up" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <p style={{ fontSize: 9, fontWeight: 900, color: '#374151', textTransform: 'uppercase' }}>Statistics score</p>
        <p style={{ fontSize: 11, fontWeight: 900, color: '#059669' }}>61%</p>
      </div>
      <div style={{ position: 'relative', width: '100%', background: '#e5e7eb', borderRadius: 99, height: 10, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '70%', width: 2, background: '#93c5fd', zIndex: 1 }} />
        <div className="sd-grow-bar" style={{ width: '61%', background: '#22c55e', height: 10, borderRadius: 99 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <p style={{ fontSize: 9, color: '#ef4444', fontWeight: 700 }}>Start: 38%</p>
        <p style={{ fontSize: 9, color: '#3b82f6', fontWeight: 700 }}>Target: 70%</p>
      </div>
    </div>
    <div className="sd-fade-up" style={{ marginTop: 'auto', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
        <TrendingUp size={12} color="#16a34a" />
        <p style={{ fontSize: 11, fontWeight: 900, color: '#14532d' }}>+23 points in 3 days</p>
      </div>
      <p style={{ fontSize: 9, color: '#166534' }}>Plan active · 11 days remaining · On track for 70%</p>
    </div>
  </div>
);
