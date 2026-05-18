import React from 'react';
import type { KeyPress, KbMode } from '../types';
import { KB_ROWS, EMOJI_GRID } from './phone.constants';
import { KeyCap } from './KeyCap';

interface IOSKeyboardProps {
  pressedKey: KeyPress | null;
  mode: KbMode;
  pressedEmoji: { row: number; col: number; ts: number } | null;
}

export const IOSKeyboard: React.FC<IOSKeyboardProps> = ({ pressedKey, mode, pressedEmoji }) => {
  return (
    <div
      style={{
        background: '#cfd2d8',
        padding: '5px 3px 7px',
        flexShrink: 0,
        animation: 'sd-kb-rise 0.32s cubic-bezier(.34,1.4,.64,1) both',
        boxShadow: '0 -1px 0 rgba(0,0,0,0.18)',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {mode === 'emoji' ? (
        <>
          {/* Top tab strip — recent / smileys / animals / etc. */}
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 6px 4px', borderBottom: '0.5px solid rgba(0,0,0,0.12)' }}>
            {['🕐','😀','🐶','🍔','⚽','💡','🔣','🏁'].map((g, idx) => (
              <span key={idx} style={{ fontSize: 11, opacity: idx === 1 ? 1 : 0.45 }}>{g}</span>
            ))}
          </div>
          {EMOJI_GRID.map((row, rIdx) => (
            <div key={rIdx} style={{ display: 'flex', justifyContent: 'space-around', padding: '3px 4px' }}>
              {row.map((emoji, cIdx) => {
                const isPressed = pressedEmoji && pressedEmoji.row === rIdx && pressedEmoji.col === cIdx;
                return (
                  <div
                    key={cIdx + '-' + (pressedEmoji?.ts ?? 0) + '-' + isPressed}
                    style={{
                      width: 20, height: 20, borderRadius: 4,
                      display: 'grid', placeItems: 'center',
                      fontSize: 13,
                      background: isPressed ? 'rgba(149,154,168,0.55)' : 'transparent',
                      transform: isPressed ? 'scale(1.35)' : 'scale(1)',
                      transition: 'transform 120ms cubic-bezier(.34,1.4,.64,1), background 120ms',
                      filter: isPressed ? 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))' : undefined,
                    }}
                  >
                    {emoji}
                  </div>
                );
              })}
            </div>
          ))}
          {/* Bottom bar in emoji mode: ABC | search | backspace */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 4px 0' }}>
            <KeyCap label="ABC" wide gray />
            <div style={{ flex: 1, height: 22, borderRadius: 4.5, background: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', padding: '0 6px', fontSize: 8, color: '#666' }}>🔍 Search Emoji</div>
            <KeyCap label="⌫" gray />
          </div>
        </>
      ) : (
        <>
          {KB_ROWS.map((row, rIdx) => {
            const isBottomLetters = rIdx === 2;
            const indent = rIdx === 1 ? 9 : 0;
            return (
              <div key={rIdx} style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 4, paddingLeft: indent, paddingRight: indent }}>
                {isBottomLetters && <KeyCap label="⇧" wide />}
                {row.map((ch, cIdx) => {
                  const isPressed = pressedKey && pressedKey.row === rIdx && pressedKey.col === cIdx;
                  return <KeyCap key={ch} label={ch.toUpperCase()} pressed={!!isPressed} ts={pressedKey?.ts} />;
                })}
                {isBottomLetters && <KeyCap label="⌫" wide />}
              </div>
            );
          })}
          {/* Bottom row: 123 / emoji / space / return */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 3, paddingLeft: 2, paddingRight: 2 }}>
            <KeyCap label="123" wide gray />
            <KeyCap label="🙂" gray />
            <div
              style={{
                flex: 1, height: 22, borderRadius: 4.5,
                background: pressedKey && pressedKey.row >= KB_ROWS.length ? '#9aa1ad' : 'white',
                boxShadow: '0 1px 0 rgba(0,0,0,0.28)',
                display: 'grid', placeItems: 'center',
                fontSize: 9, fontWeight: 500, color: '#222',
                transition: 'background 90ms',
              }}
            >
              space
            </div>
            <KeyCap label="return" wide gray />
          </div>
        </>
      )}
      <div style={{ height: 4 }} />
    </div>
  );
};
