import type { WaMessage } from '../types';

export const WA_MESSAGES: Omit<WaMessage, 'typed' | 'done'>[] = [
  { id: 1, from: 'kundai',  text: 'Hie Tapiwa! 👋', time: '16:42 AM' },
  { id: 2, from: 'kundai',  text: "Your teacher flagged your Algebra score — 38% on the test. I've been through your paper and I can see exactly where things broke down. 📊", time: '16:42 AM' },
  { id: 3, from: 'kundai',  text: "MISSION BRIEFING\n\nAgent Tapiwa, I've built you a 14-step Algebra plan. We're starting with Quadratics — you scored 32% there and it's your biggest gap right now.", time: '16:42 AM' },
  { id: 4, from: 'kundai',  text: 'Your mission should you choose to accept it:\n\n✅ Quadratics — 5 sessions\n✅ Factorisation — 4 sessions\n✅ Linear equations — 5 sessions\n\nThis message will self destruct in 5..4..3.. just kidding😄', time: '16:43 AM' },
  { id: 5, from: 'tapiwa',  text: "Mission accepted. Let's go! 🔥", time: '16:43 AM' },
  { id: 6, from: 'kundai', text: "Let's go back to Question 4. You had to factorise x² + 5x + 6.\n\nYou wrote (x+2)(x+4) — right shape, close thinking. But let's check it:\n\n(x+2)(x+4) = x² + 4x + 2x + 8 = x² + 6x + 8\n\nSee it? You got +8 instead of +6. The numbers 2 and 4 multiply to 8, not 6.\n\nHere's the rule: to factorise x² + bx + c, you need two numbers that do both jobs:\n\n✅ multiply to c (the last number)\n✅ add to b (the middle number)\n\nFor x² + 5x + 6 — try 1 and 6: 1×6 = 6 ✓ but 1+6 = 7 ✗\n\nNow you try. What pair works? 🎯", time: '16:44 AM' },
  { id: 7, from: 'tapiwa', text: 'WAIT i picked the wrong pair 😭 its 2 and 3 innit', time: '16:44 AM', partial: true },
];

export const KB_ROWS: string[][] = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['z','x','c','v','b','n','m'],
];

export const TILT_RY_MAX = 9;
export const TILT_RX_MAX = 6.5;

export const EMOJI_GRID: string[][] = [
  ['😀','😂','🥰','😍','😘','🤔','😎','😅'],
  ['😢','😭','😡','😱','🤯','🙄','😴','🤤'],
  ['👍','👎','👏','🙏','💪','🔥','✨','💯'],
  ['❤️','💛','💚','💙','💜','🎉','🚀','⚡'],
];
