// ── OCR Review — Constants ────────────────────────────────────────────────────

export const PALETTE = [
  { fill: 'rgba(59,130,246,0.15)',  border: '#3b82f6', text: '#1d4ed8', bg: '#eff6ff',  border2: '#bfdbfe' },
  { fill: 'rgba(16,185,129,0.15)', border: '#10b981', text: '#047857', bg: '#ecfdf5',  border2: '#a7f3d0' },
  { fill: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#b45309', bg: '#fffbeb',  border2: '#fde68a' },
  { fill: 'rgba(139,92,246,0.15)', border: '#8b5cf6', text: '#6d28d9', bg: '#f5f3ff',  border2: '#ddd6fe' },
  { fill: 'rgba(239,68,68,0.15)',  border: '#ef4444', text: '#b91c1c', bg: '#fef2f2',  border2: '#fecaca' },
  { fill: 'rgba(20,184,166,0.15)', border: '#14b8a6', text: '#0f766e', bg: '#f0fdfa',  border2: '#99f6e4' },
];

export const OCR_ENDPOINT = 'http://localhost:8000/ocr/extract';

export const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;