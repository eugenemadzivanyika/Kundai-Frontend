// ── OCR Review — PageTextEditor ───────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { RenderedText } from './RenderedText';

interface PageTextEditorProps {
  text: string;
  corrected: boolean;
  onSave: (text: string) => void;
}

export function PageTextEditor({ text, corrected, onSave }: PageTextEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(text);
  const isDirty = draft !== text;

  useEffect(() => { setDraft(text); }, [text]);

  return (
    <div className="flex flex-col h-full gap-2 p-2.5">
      {/* Mode toggle */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[10px] font-extrabold">
          <button
            className={`px-3 py-1.5 transition-colors ${
              !editing ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
            onClick={() => setEditing(false)}
          >
            Preview
          </button>
          <button
            className={`px-3 py-1.5 transition-colors ${
              editing ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        </div>

        {corrected && !isDirty && (
          <div className="text-[9px] text-green-600 font-semibold">✓ Manually corrected</div>
        )}
      </div>

      {editing ? (
        <textarea
          className="flex-1 w-full rounded-xl border border-slate-200 bg-white p-4 text-[13px] text-slate-800 leading-[1.9] resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', minHeight: 260 }}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Transcribed text will appear here…"
        />
      ) : (
        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
          <RenderedText text={draft} />
        </div>
      )}

      {isDirty && editing && (
        <button
          className="w-full flex items-center justify-center gap-1 py-2 text-[10px] font-extrabold text-white rounded-lg bg-green-500 hover:bg-green-600 transition-colors flex-shrink-0"
          onClick={() => onSave(draft)}
        >
          <Check size={10} />
          Save correction
        </button>
      )}
    </div>
  );
}