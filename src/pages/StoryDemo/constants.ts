import type { Scene } from './types';

// Stage geometry constants — used by both narration and floating toast positioning
// Stage and phone positions are all predictable and aligned.
export const ST_W = 680; // fixed stage width (px)
export const ST_H = 500; // fixed stage height (px)
export const PHONE_TOP = 76; // phone top within fixed stage
export const _PHONE_W = 218; // matches PhoneMockup PHONE_W
export const _PHONE_FR = 4; // matches PhoneMockup FRAME
export const _STATUS_H = 18; // matches PhoneMockup status bar height

// sd-phone-stage wrapper is PHONE_W+12=230, centered in ST_W
// screen left = (ST_W - 230) / 2 + 6 (margin) + FRAME
export const TOAST_L = Math.round((ST_W - (_PHONE_W + 12)) / 2) + 6 + _PHONE_FR; // 235
export const TOAST_T = PHONE_TOP + _PHONE_FR + _STATUS_H; // 98
export const TOAST_W = _PHONE_W - _PHONE_FR * 2; // 210

// Narration steps — text + scenes for each stage of the story
export const NARRATION_STEPS: { text: string; scenes: Set<Scene> }[] = [
  {
    text: 'Assessment submissions that go through KundAI are automatically graded',
    scenes: new Set<Scene>(['dashboard', 'bell-ping', 'cursor-to-bell', 'notification']),
  },
  {
    text: "KundAI detects the knowledge gaps from the student's answers",
    scenes: new Set<Scene>(['perf-glow', 'perf-panel']),
  },
  {
    text: 'KundAI prepares a student development plan to tackle the gaps',
    scenes: new Set<Scene>(['twin-panel']),
  },
  {
    text: 'KundAI teaches the student on WhatsApp addressing all gaps detected',
    scenes: new Set<Scene>(['phone', 'outcome', 'fading']),
  },
];
