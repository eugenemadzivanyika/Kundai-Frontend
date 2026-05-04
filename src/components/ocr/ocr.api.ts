// ── OCR Review — API ──────────────────────────────────────────────────────────

import type {
  OcrRegion,
  BackendOcrRegion,
  BackendOcrPage,
  OcrQuestion,
  OcrAnswerEntry,
} from './ocr.types';
import { OCR_ENDPOINT, OCR_BATCH_ENDPOINT } from './ocr.constants';

// ── Region mapping ─────────────────────────────────────────────────────────────

export function mapRegion(r: BackendOcrRegion): OcrRegion {
  return {
    id:         r.id,
    label:      r.label,
    colorIdx:   r.colorIdx,
    bounds:     r.bounds,
    corrected:  false,
    lines:      r.lines.map(l => ({
      text:       l.text,
      confidence: l.confidence,
      error:      l.confidence < 0.7 ? 'Low confidence — please review and correct' : undefined,
    })),
  };
}

// ── Region collapse ────────────────────────────────────────────────────────────

/** Merge N regions down to exactly 3 display regions by grouping adjacent buckets. */
export function collapseToThree(regions: OcrRegion[]): OcrRegion[] {
  if (regions.length <= 3) return regions;

  const sorted  = [...regions].sort((a, b) => a.bounds.y - b.bounds.y);
  const n       = sorted.length;
  const buckets = [
    sorted.slice(0,              Math.ceil(n / 3)),
    sorted.slice(Math.ceil(n / 3), Math.ceil(2 * n / 3)),
    sorted.slice(Math.ceil(2 * n / 3)),
  ].filter(b => b.length > 0);

  return buckets.map((bucket, i) => {
    const minY = Math.min(...bucket.map(r => r.bounds.y));
    const maxY = Math.max(...bucket.map(r => r.bounds.y + r.bounds.h));
    const minX = Math.min(...bucket.map(r => r.bounds.x));
    const maxX = Math.max(...bucket.map(r => r.bounds.x + r.bounds.w));
    return {
      id:        bucket[0].id,
      label:     bucket[0].label,
      colorIdx:  i,
      bounds:    { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
      lines:     bucket.flatMap(r => r.lines),
      corrected: bucket.some(r => r.corrected),
    };
  });
}

// ── OCR API call ───────────────────────────────────────────────────────────────

/**
 * Calls the single-file OCR endpoint. Used for per-page retry only.
 */
export async function runOcr(file: File): Promise<{ regions: OcrRegion[]; extraPages: BackendOcrPage[] }> {
  const fd = new FormData();
  fd.append('file', file);

  const resp = await fetch(OCR_ENDPOINT, { method: 'POST', body: fd });
  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`OCR failed (${resp.status}): ${msg}`);
  }

  const data: { pages: BackendOcrPage[] } = await resp.json();
  const pages = data.pages ?? [];

  return {
    regions:    collapseToThree(pages[0]?.regions.map(mapRegion) ?? []),
    extraPages: pages.slice(1),
  };
}

/**
 * Sends all files in one batch request. Gemini sees every page together for
 * better cross-page context. Returns one entry per input file.
 *
 * When `questions` is provided the backend runs question-aware OCR: Gemini
 * maps each answer block directly to a question ID and returns an `answers`
 * array alongside the per-file page transcriptions.
 */
export async function runOcrBatch(
  files: File[],
  questions?: OcrQuestion[],
): Promise<{ files: Array<{ pages: BackendOcrPage[] }>; answers?: OcrAnswerEntry[] }> {
  const fd = new FormData();
  files.forEach(f => fd.append('files', f));

  if (questions?.length) {
    fd.append('questions', JSON.stringify(
      questions.map((q, i) => ({
        id:     q.id,
        number: i + 1,
        parts:  q.parts ?? [],
      }))
    ));
  }

  const resp = await fetch(OCR_BATCH_ENDPOINT, { method: 'POST', body: fd });
  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`OCR batch failed (${resp.status}): ${msg}`);
  }

  return resp.json();
}