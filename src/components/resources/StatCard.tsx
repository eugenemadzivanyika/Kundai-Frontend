import React from 'react';

// ── Inline SVG helper ─────────────────────────────────────────────────────────
const Ico: React.FC<{ d: string | string[]; size?: number; color?: string }> = ({ d, size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

// The new StatCard accepts SVG path strings as the icon (matching the HTML design),
// and an accent hex color for theming.
interface StatCardProps {
  // SVG path string(s) for the icon
  iconPaths: string | string[];
  value: string | number;
  label: string;
  accent: string;
}

const StatCard: React.FC<StatCardProps> = ({ iconPaths, value, label, accent }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
    background: 'white', border: '1px solid #e2e8f0', borderRadius: 9,
    fontFamily: 'Inter, system-ui, sans-serif',
  }}>
    <div style={{
      width: 28, height: 28, borderRadius: 7, background: accent + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Ico d={iconPaths} size={13} color={accent} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{
        fontSize: 13, fontWeight: 800, color: '#0f172a', lineHeight: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 9, fontWeight: 600, color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2,
      }}>
        {label}
      </div>
    </div>
  </div>
);

export default StatCard;