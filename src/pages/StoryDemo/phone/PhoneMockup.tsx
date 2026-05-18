import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { WaMessage, KbMode, KeyPress } from '../types';
import { WA_MESSAGES, KB_ROWS, TILT_RY_MAX, TILT_RX_MAX, EMOJI_GRID } from './phone.constants';
import { findEmojiCoords, isEmojiLike } from './phone.utils';
import { IOSKeyboard } from './IOSKeyboard';

interface PhoneMockupProps {
  started: boolean;
  preWake?: boolean;
  onComplete?: () => void;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({ started, preWake, onComplete }) => {
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [status, setStatus] = useState('Your academic assistant');
  const [showTyping, setShowTyping] = useState(false);
  const [kbActive, setKbActive] = useState(false);
  const [kbMode, setKbMode] = useState<KbMode>('abc');
  const [kbDraft, setKbDraft] = useState('');
  const [pressedKey, setPressedKey] = useState<KeyPress | null>(null);
  const [pressedEmoji, setPressedEmoji] = useState<{ row: number; col: number; ts: number } | null>(null);
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const [screenOn, setScreenOn] = useState(false);
  const seqRef = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const findKeyCoords = (ch: string): { row: number; col: number; key: string } | null => {
    const lower = ch.toLowerCase();
    for (let r = 0; r < KB_ROWS.length; r++) {
      const idx = KB_ROWS[r].indexOf(lower);
      if (idx >= 0) return { row: r, col: idx, key: KB_ROWS[r][idx] };
    }
    if (lower === ' ') return { row: 3, col: 4, key: ' ' };
    if (lower === '!' || lower === '.' || lower === '?' || lower === "'") return { row: 3, col: 7, key: lower };
    return null;
  };

  const tiltFor = (kp: { row: number; col: number; key: string } | null): { rx: number; ry: number } => {
    if (!kp) return { rx: 0, ry: 0 };
    if (kp.row >= KB_ROWS.length) {
      const xNorm = kp.col === 4 ? 0 : (kp.col > 4 ? 0.7 : -0.7);
      return { rx: TILT_RX_MAX, ry: -xNorm * TILT_RY_MAX };
    }
    const row = KB_ROWS[kp.row];
    const mid = (row.length - 1) / 2;
    const xNorm = (kp.col - mid) / mid;
    const yNorm = (kp.row / (KB_ROWS.length - 1)) * 2 - 1;
    const ry = -xNorm * TILT_RY_MAX;
    const rx = yNorm * TILT_RX_MAX;
    return { rx, ry };
  };

  useEffect(() => {
    if (!started || seqRef.current) return;
    seqRef.current = true;
    setScreenOn(true);
    let cursor = 0;
    let cancelled = false;

    const sleep = (ms: number) => new Promise<void>(res => setTimeout(() => !cancelled && res(), ms));

    const typeKundai = (msgId: number, fullText: string) => new Promise<void>(resolve => {
      let i = 0;
      const iv = setInterval(() => {
        if (cancelled) { clearInterval(iv); resolve(); return; }
        i++;
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, typed: fullText.slice(0, i), done: i >= fullText.length } : m));
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        if (i >= fullText.length) { clearInterval(iv); resolve(); }
      }, 16);
    });

    const typeTapiwaOnKeyboard = async (fullText: string) => {
      setKbActive(true);
      setKbMode('abc');
      setKbDraft('');
      await sleep(520);

      const glyphs = Array.from(fullText);
      for (let i = 0; i < glyphs.length; i++) {
        if (cancelled) return;
        const ch = glyphs[i];

        if (isEmojiLike(ch)) {
          setKbMode('abc');
          setTilt({ rx: TILT_RX_MAX * 0.85, ry: TILT_RY_MAX * 0.55 });
          await sleep(180);
          setKbMode('emoji');
          await sleep(260);
          const ec = findEmojiCoords(ch) ?? { row: 2, col: 5 };
          const midC = (EMOJI_GRID[0].length - 1) / 2;
          const xN = (ec.col - midC) / midC;
          const yN = (ec.row / (EMOJI_GRID.length - 1)) * 2 - 1;
          const tiltTarget = { rx: yN * TILT_RX_MAX, ry: -xN * TILT_RY_MAX };
          setTilt(tiltTarget);
          setPressedEmoji({ row: ec.row, col: ec.col, ts: Date.now() });
          await sleep(160);
          setKbDraft(prev => prev + ch);
          await sleep(280);
          setTilt({ rx: tiltTarget.rx * 0.4, ry: tiltTarget.ry * 0.4 });
          setPressedEmoji(null);
          await sleep(120);
          if (i < glyphs.length - 1 && !isEmojiLike(glyphs[i + 1])) {
            setKbMode('abc');
            await sleep(220);
          }
          continue;
        }

        const kp = findKeyCoords(ch);
        const tiltTarget = tiltFor(kp);
        setTilt(tiltTarget);
        if (kp) setPressedKey({ ...kp, ts: Date.now() });
        setKbDraft(prev => prev + ch);

        let wait = 145 + Math.random() * 95;
        if (ch === ' ') wait += 70;
        if (/[.!?,]/.test(ch)) wait += 240;
        if (ch.toLowerCase() === 'i' && i > 0 && glyphs[i - 1].toLowerCase() === 'm') wait += 60;
        await sleep(wait);
        setTilt({ rx: tiltTarget.rx * 0.32, ry: tiltTarget.ry * 0.32 });
        await sleep(85);
      }

      setPressedKey(null);
      setPressedEmoji(null);
      await sleep(620);
      setTilt({ rx: TILT_RX_MAX * 0.7, ry: -TILT_RY_MAX * 0.55 });
      await sleep(220);
      setTilt({ rx: 0, ry: 0 });
      setKbMode('abc');
      setKbDraft('');
      setKbActive(false);
      await sleep(320);
    };

    const runNext = async () => {
      if (cancelled) return;
      if (cursor >= WA_MESSAGES.length) {
        setStatus('online'); setShowTyping(false); onComplete?.(); return;
      }
      const cfg = WA_MESSAGES[cursor++];

      if (cfg.from === 'tapiwa') {
        setStatus('online');
        setShowTyping(false);

        if (cfg.partial) {
          setKbActive(true);
          setKbMode('abc');
          setKbDraft('');
          await sleep(480);
          for (const ch of Array.from(cfg.text)) {
            if (cancelled) return;
            const kp = findKeyCoords(ch);
            const tiltTarget = tiltFor(kp);
            setTilt(tiltTarget);
            if (kp) setPressedKey({ ...kp, ts: Date.now() });
            setKbDraft(prev => prev + ch);
            await sleep(155 + Math.random() * 85);
            setTilt({ rx: tiltTarget.rx * 0.32, ry: tiltTarget.ry * 0.32 });
            await sleep(80);
          }
          onComplete?.();
          return;
        }

        await typeTapiwaOnKeyboard(cfg.text);
        if (cancelled) return;
        setMessages(prev => [...prev, { ...cfg, typed: cfg.text, done: true }]);
        await sleep(500);
      } else {
        setStatus('typing...'); setShowTyping(true);
        await sleep(1100);
        if (cancelled) return;
        setShowTyping(false);
        setMessages(prev => [...prev, { ...cfg, typed: '', done: false }]);
        await sleep(80);
        await typeKundai(cfg.id, cfg.text);
        await sleep(700);
      }
      runNext();
    };

    setTimeout(() => { if (!cancelled) runNext(); }, 400);
    return () => { cancelled = true; };
  }, [started, onComplete]);

  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [messages, showTyping, kbDraft]);

  const tiltTransform = `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`;

  const PHONE_W = 218;
  const PHONE_H = 442;
  const PHONE_D = 14;
  const FRAME = 4;
  const RAD = 38;
  const SCREEN_W = PHONE_W - FRAME * 2;
  const SCREEN_H = PHONE_H - FRAME * 2;
  const HALF_D = PHONE_D / 2;
  const HALF_W = PHONE_W / 2;
  const HALF_H = PHONE_H / 2;

  const RAIL_LIGHT = 'linear-gradient(180deg, #4d5057 0%, #9da0a8 18%, #d1d3d8 42%, #6a6d76 60%, #3d4047 100%)';
  const RAIL_TOP   = 'linear-gradient(90deg, #4d5057 0%, #9da0a8 18%, #d1d3d8 42%, #6a6d76 60%, #3d4047 100%)';

  return (
    <div className="sd-phone-stage" style={{ fontFamily: 'system-ui, sans-serif', position: 'relative', width: PHONE_W + 12, margin: '0 auto' }}>
      {/* Motion-blur ghost */}
      <div className="sd-phone-ghost" aria-hidden>
        <div style={{ width: PHONE_W, margin: '0 auto', height: PHONE_H, borderRadius: RAD, background: 'linear-gradient(180deg, #2a2a30 0%, #1a1a20 100%)', opacity: 0.55, boxShadow: '0 30px 50px rgba(0,0,0,0.25)' }} />
      </div>
      {/* Phone body */}
      <div className="sd-phone-fall-anim" style={{ position: 'relative' }}>
        {/* Live-tilt frame */}
        <div
          className="sd-phone-frame"
          style={{
            width: PHONE_W,
            height: PHONE_H,
            margin: '0 auto',
            position: 'relative',
            transform: tiltTransform,
            transformOrigin: '50% 50%',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* 3D BOX */}
          <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>

            {/* TOP edge */}
            <div aria-hidden style={{
              position: 'absolute', left: '50%', top: '50%',
              width: PHONE_W - RAD * 2, height: PHONE_D,
              transform: `translate(-50%, -50%) rotateX(90deg) translateZ(${HALF_H}px)`,
              background: RAIL_TOP,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.45)',
            }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 4, height: 2, background: '#0a0a0c', borderRadius: 1 }} />
            </div>

            {/* BOTTOM edge */}
            <div aria-hidden style={{
              position: 'absolute', left: '50%', top: '50%',
              width: PHONE_W - RAD * 2, height: PHONE_D,
              transform: `translate(-50%, -50%) rotateX(-90deg) translateZ(${HALF_H}px)`,
              background: RAIL_TOP,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18,
            }}>
              <div style={{ display: 'flex', gap: 3 }}>
                {[0,1,2,3,4].map(i => <span key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#0a0a0c' }} />)}
              </div>
              <div style={{ width: 22, height: 6, borderRadius: 3, background: '#0a0a0c', boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.8)' }} />
              <div style={{ display: 'flex', gap: 3 }}>
                {[0,1,2,3,4].map(i => <span key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#0a0a0c' }} />)}
              </div>
            </div>

            {/* LEFT rail */}
            <div aria-hidden style={{
              position: 'absolute', left: '50%', top: '50%',
              width: PHONE_D, height: PHONE_H - RAD * 2,
              transform: `translate(-50%, -50%) rotateY(-90deg) translateZ(${HALF_W}px)`,
              background: RAIL_LIGHT,
              boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.30), inset -1px 0 0 rgba(0,0,0,0.40)',
              transformStyle: 'preserve-3d',
            }}>
              <div style={{
                position: 'absolute', top: 12, left: '50%',
                width: 8, height: 18, borderRadius: 1.5,
                transform: 'translateX(-50%) translateZ(1.5px)',
                background: 'linear-gradient(180deg, #2a2c32 0%, #6b6e76 50%, #babbc1 100%)',
                boxShadow: '0 1px 1px rgba(0,0,0,0.5)',
              }} />
              <div style={{
                position: 'absolute', top: 46, left: '50%',
                width: 8, height: 32, borderRadius: 2,
                transform: 'translateX(-50%) translateZ(1.5px)',
                background: 'linear-gradient(180deg, #2a2c32 0%, #6b6e76 50%, #babbc1 100%)',
                boxShadow: '0 1px 1px rgba(0,0,0,0.5)',
              }} />
              <div style={{
                position: 'absolute', top: 88, left: '50%',
                width: 8, height: 32, borderRadius: 2,
                transform: 'translateX(-50%) translateZ(1.5px)',
                background: 'linear-gradient(180deg, #2a2c32 0%, #6b6e76 50%, #babbc1 100%)',
                boxShadow: '0 1px 1px rgba(0,0,0,0.5)',
              }} />
            </div>

            {/* RIGHT rail */}
            <div aria-hidden style={{
              position: 'absolute', left: '50%', top: '50%',
              width: PHONE_D, height: PHONE_H - RAD * 2,
              transform: `translate(-50%, -50%) rotateY(90deg) translateZ(${HALF_W}px)`,
              background: RAIL_LIGHT,
              boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.30), inset -1px 0 0 rgba(0,0,0,0.40)',
              transformStyle: 'preserve-3d',
            }}>
              <div style={{
                position: 'absolute', top: 62, left: '50%',
                width: 8, height: 54, borderRadius: 2,
                transform: 'translateX(-50%) translateZ(1.5px)',
                background: 'linear-gradient(180deg, #2a2c32 0%, #6b6e76 50%, #babbc1 100%)',
                boxShadow: '0 1px 1px rgba(0,0,0,0.5)',
              }} />
            </div>

            {/* BACK face */}
            <div aria-hidden style={{
              position: 'absolute', left: '50%', top: '50%',
              width: PHONE_W, height: PHONE_H, borderRadius: RAD,
              transform: `translate(-50%, -50%) rotateY(180deg) translateZ(${HALF_D}px)`,
              background: 'linear-gradient(155deg, #6c6f76 0%, #4a4d54 30%, #3a3d44 60%, #2a2d34 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.4), inset 0 0 30px rgba(0,0,0,0.45)',
              transformStyle: 'preserve-3d',
            }}>
              <div style={{ position: 'absolute', top: 16, left: 16, width: 68, height: 68, borderRadius: 22, background: 'linear-gradient(145deg, #555861 0%, #34373d 80%)', boxShadow: '0 3px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10)', transform: 'translateZ(1px)' }}>
                {[ {t:8,l:8}, {t:8,l:32}, {t:32,l:8} ].map((p, idx) => (
                  <div key={idx} style={{ position: 'absolute', top: p.t, left: p.l, width: 22, height: 22, borderRadius: '50%', background: 'radial-gradient(circle, #2a3a4a 0%, #0a0d14 60%, #000 100%)', boxShadow: 'inset 0 0 4px rgba(120,170,220,0.4), 0 1px 2px rgba(0,0,0,0.6)' }}>
                    <div style={{ position: 'absolute', top: 5, left: 5, width: 6, height: 6, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)' }} />
                  </div>
                ))}
                <div style={{ position: 'absolute', top: 36, left: 38, width: 14, height: 14, borderRadius: '50%', background: '#1a1a1d', border: '1px solid #2a2d34' }} />
                <div style={{ position: 'absolute', top: 8, left: 50, width: 12, height: 12, borderRadius: '50%', background: 'radial-gradient(circle, #f7f7f0 0%, #d4d4c8 70%)' }} />
              </div>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 38, fontWeight: 100, color: 'rgba(255,255,255,0.12)' }}>K</div>
              <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', width: 90, height: 90, borderRadius: '50%', border: '0.5px solid rgba(255,255,255,0.04)' }} />
            </div>

            {/* FRONT face */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              width: PHONE_W, height: PHONE_H,
              transform: `translate(-50%, -50%) translateZ(${HALF_D}px)`,
            }}>
              {/* Titanium chassis */}
              <div
                className="sd-titanium"
                style={{
                  position: 'absolute', inset: 0, borderRadius: RAD,
                  boxShadow:
                    '0 22px 38px -10px rgba(0,0,0,0.45), 0 8px 18px -4px rgba(0,0,0,0.30),' +
                    'inset 0 0 0 1px rgba(255,255,255,0.18),' +
                    'inset 0 1.5px 0 rgba(255,255,255,0.35),' +
                    'inset 0 -1.5px 0 rgba(0,0,0,0.35),' +
                    'inset 1.5px 0 0 rgba(255,255,255,0.10),' +
                    'inset -1.5px 0 0 rgba(0,0,0,0.18)',
                }}
              />

              {/* OLED screen */}
              <div
                style={{
                  position: 'absolute',
                  top: FRAME, left: FRAME, width: SCREEN_W, height: SCREEN_H,
                  borderRadius: RAD - FRAME,
                  background: '#000',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 0 0 1px #000, inset 0 0 12px rgba(0,0,0,0.6)',
                }}
              >
            {!screenOn && (
              <div className="sd-screen-shimmer" style={{ width: '100%', height: '100%', position: 'relative' }}>
                {preWake && (
                  <div className="sd-pre-wake" aria-hidden style={{
                    position: 'absolute',
                    top: '22%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '75%', height: '45%',
                    background: 'radial-gradient(circle, rgba(96,165,250,0.52) 0%, rgba(96,165,250,0.18) 40%, transparent 70%)',
                    pointerEvents: 'none',
                  }} />
                )}
              </div>
            )}
            {screenOn && <div className="sd-screen-wake" style={{ width: '100%', height: '100%', background: '#e5ddd5', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* iOS status bar */}
              <div style={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', background: '#075e54', color: 'white', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                <span>9:41</span>
                <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
                  <span style={{ display: 'inline-flex', gap: 1, alignItems: 'flex-end' }}>
                    {[3, 5, 7, 9].map(h => <span key={h} style={{ width: 2, height: h, background: 'white', borderRadius: 0.5 }} />)}
                  </span>
                  <span style={{ display: 'inline-block', width: 16, height: 8, border: '1px solid white', borderRadius: 2, position: 'relative', padding: 1 }}>
                    <span style={{ display: 'block', width: '78%', height: '100%', background: 'white', borderRadius: 0.5 }} />
                    <span style={{ position: 'absolute', right: -2, top: 2, width: 1, height: 4, background: 'white', borderRadius: 0.5 }} />
                  </span>
                </span>
              </div>
              {/* WhatsApp header */}
              <div style={{ background: '#075e54', padding: '5px 10px 7px', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#25D366', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#075e54' }}>K</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'white', margin: 0 }}>KundAI</p>
                  <p style={{ fontSize: 8, color: 'rgba(255,255,255,.75)', margin: 0 }}>{status}</p>
                </div>
              </div>
              {/* Message body */}
              <div ref={bodyRef} style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', scrollbarWidth: 'none' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 8, background: 'rgba(0,0,0,.1)', color: '#555', padding: '2px 8px', borderRadius: 12 }}>Today</span>
                </div>
                {messages.map(msg => (
                  <div key={msg.id} className="sd-msg-pop" style={{ display: 'flex', justifyContent: msg.from === 'tapiwa' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '82%' }}>
                      <div style={{ background: msg.from === 'tapiwa' ? '#dcf8c6' : 'white', borderRadius: msg.from === 'tapiwa' ? '8px 0 8px 8px' : '0 8px 8px 8px', padding: '6px 8px', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)' }}>
                        <p style={{ fontSize: 10, color: '#111', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                          {msg.typed}{!msg.done && <span className="sd-blink-cur" />}
                        </p>
                      </div>
                      <p style={{ fontSize: 8, color: '#94a3b8', margin: '2px 3px 0', textAlign: msg.from === 'tapiwa' ? 'right' : 'left' }}>{msg.time}</p>
                    </div>
                  </div>
                ))}
                {showTyping && (
                  <div className="sd-msg-pop" style={{ display: 'flex' }}>
                    <div style={{ background: 'white', borderRadius: '0 8px 8px 8px', padding: '7px 10px', display: 'flex', gap: 3, alignItems: 'center', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)' }}>
                      <span className="sd-typing-dot" /><span className="sd-typing-dot" /><span className="sd-typing-dot" />
                    </div>
                  </div>
                )}
              </div>
              {/* Input bar */}
              <div style={{ background: '#f0f0f0', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, borderTop: '.5px solid #d0d0d0', zIndex: 11, position: 'relative' }}>
                <div style={{ flex: 1, background: 'white', borderRadius: 16, padding: '4px 10px', minHeight: 18, overflow: 'hidden' }}>
                  {kbActive && kbDraft ? (
                    <p style={{ fontSize: 9, color: '#111', margin: 0, lineHeight: 1.3, wordBreak: 'break-word' }}>{kbDraft}<span className="sd-blink-cur" /></p>
                  ) : (
                    <p style={{ fontSize: 9, color: '#aaa', margin: 0 }}>Type a message</p>
                  )}
                </div>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: kbActive && kbDraft ? '#25D366' : '#c7cad1', display: 'grid', placeItems: 'center', transition: 'background .2s' }}>
                  {kbActive && kbDraft ? (
                    <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  ) : (
                    <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                  )}
                </div>
              </div>
              {/* iOS keyboard */}
              {kbActive && (
                <IOSKeyboard pressedKey={pressedKey} mode={kbMode} pressedEmoji={pressedEmoji} />
              )}
            </div>}

            {/* Dynamic Island */}
            <div aria-hidden style={{
              position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
              width: 78, height: 18, borderRadius: 10,
              background: '#000',
              boxShadow: '0 0 0 0.5px rgba(255,255,255,0.05), inset 0 0 6px rgba(0,0,0,0.6)',
              zIndex: 5,
            }}>
              <div style={{ position: 'absolute', top: 5, right: 12, width: 7, height: 7, borderRadius: '50%', background: 'radial-gradient(circle, #1a3045 0%, #050c14 70%, #000 100%)', boxShadow: 'inset 0 0 2px rgba(60,140,200,0.6)' }} />
            </div>

            {/* Screen reflection */}
            <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.04) 100%)' }} />
              </div>

              {/* Home indicator */}
              <div aria-hidden style={{ position: 'absolute', bottom: FRAME + 4, left: '50%', transform: 'translateX(-50%)', width: 70, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.85)', zIndex: 6 }} />
            </div>
          </div>

          {/* Phone's drop-shadow */}
          <div aria-hidden style={{ position: 'absolute', bottom: -26, left: '8%', width: '84%', height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.32)', filter: 'blur(10px)', animation: 'sd-phone-shadow 1.25s cubic-bezier(.23,1,.32,1) both' }} />
        </div>
      </div>
    </div>
  );
};
