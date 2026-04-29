// ── OCR Review — CompileModal ─────────────────────────────────────────────────

import { X, Layers, AlertTriangle, Loader2, Send } from 'lucide-react';
import type { OcrPage } from './ocr.types';
import type { OcrReviewProps } from './ocr.types';
import { PALETTE } from './ocr.constants';
import { RenderedText } from './RenderedText';

interface CompileModalProps {
  pages: OcrPage[];
  mode: OcrReviewProps['mode'];
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const SUBMIT_LABEL: Record<OcrReviewProps['mode'], string> = {
  'teacher-mark':   'Submit Marks',
  'student-submit': 'Submit Assignment',
  'resource-upload': 'Save Resource',
};

export function CompileModal({
  pages,
  mode,
  submitting,
  onClose,
  onSubmit,
}: CompileModalProps) {
  const submitLabel = SUBMIT_LABEL[mode];
  const allDone = pages.every(p => p.status === 'done' || p.status === 'error');

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 700, maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-blue-500" />
            <span className="text-sm font-extrabold text-slate-800">Compiled Submission</span>
            <span className="text-[10px] text-slate-400 font-medium">
              {pages.length} page{pages.length !== 1 ? 's' : ''} ·{' '}
              {pages.reduce((a, p) => a + p.regions.length, 0)} regions
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {pages.map((page, pi) => (
            <div key={page.id}>
              {/* Page divider */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Page {pi + 1} — {page.name}
                </span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {page.status !== 'done' ? (
                <div className="flex items-center gap-2 py-3 px-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-700 text-xs">
                  <AlertTriangle size={13} />
                  {page.status === 'processing'
                    ? 'Still processing…'
                    : 'OCR failed for this page'}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {page.regions.map(region => {
                    const c    = PALETTE[region.colorIdx % PALETTE.length];
                    const text =
                      region.correctedText ??
                      region.lines.map(l => l.correctedText ?? l.text).join('\n');
                    return (
                      <div
                        key={region.id}
                        className="rounded-lg px-4 py-3"
                        style={{
                          background: c.bg,
                          border:     `1px solid ${c.border2}`,
                          borderLeft: `4px solid ${c.border}`,
                        }}
                      >
                        <div
                          className="text-[9px] font-extrabold uppercase tracking-wider mb-2"
                          style={{ color: c.text }}
                        >
                          {region.label}
                        </div>
                        <div className="text-sm text-slate-800">
                          <RenderedText text={text} />
                        </div>
                        {region.corrected && (
                          <div className="text-[9px] text-green-600 font-semibold mt-1.5">
                            ✓ Manually corrected
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
          <p className="text-[10px] text-slate-400">
            {allDone
              ? 'All pages processed. Review above before submitting.'
              : 'Some pages are still processing — you can still submit what is ready.'}
          </p>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
            <button
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              onClick={onSubmit}
            >
              {submitting
                ? <Loader2 size={12} className="animate-spin" />
                : <Send size={12} />}
              {submitting ? 'Submitting…' : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}