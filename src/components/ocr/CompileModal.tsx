// ── OCR Review — CompileModal ─────────────────────────────────────────────────

import { X, Layers, AlertTriangle, Loader2, Send } from 'lucide-react';
import type { OcrPage, OcrQuestion } from './ocr.types';
import type { OcrReviewProps } from './ocr.types';
import { PALETTE } from './ocr.constants';
import { RenderedText } from './RenderedText';

interface CompileModalProps {
  pages: OcrPage[];
  mode: OcrReviewProps['mode'];
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  questions?: OcrQuestion[];
  questionAnswers: Record<string, string>;
  questionPartAnswers: Record<string, string[]>;
  onAnswerChange: (questionId: string, value: string) => void;
  onPartAnswerChange: (questionId: string, partIndex: number, value: string) => void;
}

const SUBMIT_LABEL: Record<OcrReviewProps['mode'], string> = {
  'teacher-mark':    'Submit Marks',
  'student-submit':  'Submit Assignment',
  'resource-upload': 'Save Resource',
};

export function CompileModal({
  pages,
  mode,
  submitting,
  onClose,
  onSubmit,
  questions,
  questionAnswers,
  questionPartAnswers,
  onAnswerChange,
  onPartAnswerChange,
}: CompileModalProps) {
  const submitLabel  = SUBMIT_LABEL[mode];
  const allDone      = pages.every(p => p.status === 'done' || p.status === 'error');
  const showMapping  = mode === 'student-submit' && questions && questions.length > 0;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: showMapping ? 900 : 700, maxHeight: '92vh' }}
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className={`flex-1 overflow-hidden flex ${showMapping ? 'flex-row' : 'flex-col'}`}>

          {/* OCR text review (left panel or full) */}
          <div className={`overflow-y-auto p-6 flex flex-col gap-5 ${showMapping ? 'w-1/2 border-r border-slate-100' : 'flex-1'}`}>
            {showMapping && (
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest -mb-2">
                OCR Transcript — use as reference
              </p>
            )}
            {pages.map((page, pi) => (
              <div key={page.id}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Page {pi + 1} — {page.name}
                  </span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {page.status !== 'done' ? (
                  <div className="flex items-center gap-2 py-3 px-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-700 text-xs">
                    <AlertTriangle size={13} />
                    {page.status === 'processing' ? 'Still processing…' : 'OCR failed for this page'}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {page.regions.map(region => {
                      const c    = PALETTE[region.colorIdx % PALETTE.length];
                      const text = region.correctedText ?? region.lines.map(l => l.correctedText ?? l.text).join('\n');
                      return (
                        <div
                          key={region.id}
                          className="rounded-lg px-4 py-3"
                          style={{ background: c.bg, border: `1px solid ${c.border2}`, borderLeft: `4px solid ${c.border}` }}
                        >
                          <div className="text-[9px] font-extrabold uppercase tracking-wider mb-2" style={{ color: c.text }}>
                            {region.label}
                          </div>
                          <div className="text-sm text-slate-800">
                            <RenderedText text={text} />
                          </div>
                          {region.corrected && (
                            <div className="text-[9px] text-green-600 font-semibold mt-1.5">✓ Manually corrected</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Question mapping panel (right) */}
          {showMapping && (
            <div className="w-1/2 overflow-y-auto p-6 flex flex-col gap-4">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                  Map Your Answers
                </p>
                <p className="text-[11px] text-slate-500">
                  Each question has been auto-filled from the OCR. Review and correct before submitting.
                </p>
              </div>

              {questions!.map((q, qi) => {
                const hasMultiParts = (q.parts?.length ?? 0) > 0;
                return (
                  <div key={q.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                    <div>
                      <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wide mb-0.5">
                        Question {qi + 1}
                        {hasMultiParts && (
                          <span className="ml-1.5 normal-case font-semibold text-slate-400">
                            ({q.parts!.length} parts)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-700 leading-snug line-clamp-3">{q.stem}</p>
                    </div>

                    {hasMultiParts ? (
                      <div className="space-y-2">
                        {q.parts!.map((part, pi) => (
                          <div key={pi} className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500">
                              ({String.fromCharCode(97 + pi)}) {part.text && (
                                <span className="font-normal text-slate-600">{part.text}</span>
                              )}
                            </p>
                            <textarea
                              rows={2}
                              value={questionPartAnswers[q.id]?.[pi] ?? ''}
                              onChange={e => onPartAnswerChange(q.id, pi, e.target.value)}
                              placeholder={`Answer for part (${String.fromCharCode(97 + pi)})`}
                              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        rows={3}
                        value={questionAnswers[q.id] ?? ''}
                        onChange={e => onAnswerChange(q.id, e.target.value)}
                        placeholder="Your answer"
                        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
          <p className="text-[10px] text-slate-400">
            {showMapping
              ? 'Review auto-filled answers on the right, then submit.'
              : allDone
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
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              {submitting ? 'Submitting…' : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
