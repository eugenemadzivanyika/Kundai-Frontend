import React from 'react';

interface KeyCapProps {
  label: string;
  wide?: boolean;
  gray?: boolean;
  pressed?: boolean;
  ts?: number;
}

export const KeyCap: React.FC<KeyCapProps> = ({ label, wide, gray, pressed, ts }) => (
  <div
    key={ts ?? 0}
    style={{
      width: wide ? 22 : 16,
      height: 22,
      borderRadius: 4.5,
      background: gray ? '#a4adbb' : 'white',
      boxShadow: '0 1px 0 rgba(0,0,0,0.28)',
      display: 'grid',
      placeItems: 'center',
      fontSize: label.length > 1 ? 8 : 10,
      fontWeight: 500,
      color: '#222',
      animation: pressed ? 'sd-key-press 130ms ease-out' : undefined,
    }}
  >
    {label}
  </div>
);
