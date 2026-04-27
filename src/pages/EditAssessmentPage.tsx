import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Save, ArrowLeft, Sparkles, X, ChevronLeft, ChevronRight, Check, ChevronDown } from 'lucide-react';
import { assessmentService, courseService, aiService } from '../services/api';
import { Question } from '../types';

interface RawQPart {
  text?: string; type?: string; options?: string[];
  correctAnswer?: string; maxPoints?: number;
}
interface RawQ {
  _id?: string; text?: string; questionType?: string;
  options?: string[]; correctAnswer?: string;
  maxPoints?: number; primaryAttributeId?: string; tags?: string[];
  parts?: RawQPart[];
}
interface RawA {
  name?: string; type?: string; difficulty?: string; totalPoints?: number;
  status?: string; dueDate?: string | Date;
  questions?: RawQ[];
  course?: { _id?: string } | string;
  courseId?: string;
}

type QType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

interface EditPart {
  text: string;
  type: QType;
  options: string[];
  correctAnswer: string;
  maxPoints: number;
}

interface EditQuestion {
  _id?: string;
  text: string;
  type: QType;
  options: string[];
  correctAnswer: string;
  maxPoints: number;
  primaryAttributeId: string;
  tags: string[];
  parts: EditPart[];
}

const EMPTY_PART = (): EditPart => ({
  text: '', type: 'short_answer', options: [], correctAnswer: '', maxPoints: 1,
});

const EMPTY_QUESTION = (): EditQuestion => ({
  text: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', maxPoints: 1, primaryAttributeId: '', tags: [], parts: [],
});

const TYPE_META: Record<QType, { label: string; short: string; chipCls: string }> = {
  multiple_choice: { label: 'Multiple choice', short: 'MC',  chipCls: 'bg-violet-100 text-violet-700' },
  true_false:      { label: 'True / False',    short: 'T/F', chipCls: 'bg-amber-100 text-amber-700' },
  short_answer:    { label: 'Short answer',    short: 'SA',  chipCls: 'bg-emerald-100 text-emerald-700' },
  essay:           { label: 'Essay',           short: 'ES',  chipCls: 'bg-pink-100 text-pink-700' },
};

// ─── Sidebar Question Pill ────────────────────────────────────────────────────
const QuestionPill: React.FC<{
  q: EditQuestion; index: number; active: boolean;
  onClick: () => void; onDelete: () => void;
}> = ({ q, index, active, onClick, onDelete }) => {
  const meta = TYPE_META[q.type];
  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all border ${
        active ? 'bg-blue-50 border-blue-200' : 'border-transparent hover:bg-slate-100'
      }`}
    >
      <span className={`text-xs font-bold shrink-0 w-5 ${active ? 'text-blue-700' : 'text-slate-400'}`}>
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 truncate">
          {q.text || 'Untitled question'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {q.parts.length > 0
            ? <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">MP·{q.parts.length}</span>
            : <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${meta.chipCls}`}>{meta.short}</span>
          }
          <span className="text-[10px] text-slate-400">
            {q.parts.length > 0 ? q.parts.reduce((s, p) => s + p.maxPoints, 0) : q.maxPoints} pt{(q.parts.length > 0 ? q.parts.reduce((s, p) => s + p.maxPoints, 0) : q.maxPoints) !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 shrink-0 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

// ─── AI Generate Panel ────────────────────────────────────────────────────────
const AiGeneratePanel: React.FC<{
  courseId: string;
  assessmentName: string;
  difficulty: string;
  assessmentType: string;
  attributes: { _id: string; name: string }[];
  onAdd: (questions: EditQuestion[]) => void;
}> = ({ courseId, assessmentName, difficulty, assessmentType, attributes, onAdd }) => {
  const [open, setOpen]                   = useState(false);
  const [prompt, setPrompt]               = useState('');
  const [count, setCount]                 = useState('1');
  const [qtype, setQtype]                 = useState<'mixed' | QType>('mixed');
  const [selectedAttrIds, setSelectedAttrIds] = useState<string[]>([]);
  const [attrSearch, setAttrSearch]       = useState('');
  const [loading, setLoading]             = useState(false);

  const toggleAttr = (id: string) =>
    setSelectedAttrIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const filteredAttrs = attributes.filter((a) =>
    a.name.toLowerCase().includes(attrSearch.toLowerCase())
  );

  const generate = async () => {
    if (!courseId) { toast.error('No course linked to this assessment.'); return; }
    setLoading(true);
    try {
      const targetAttrs = selectedAttrIds.length > 0
        ? attributes.filter((a) => selectedAttrIds.includes(a._id))
        : attributes;

      const typeDistribution = qtype === 'mixed'
        ? undefined
        : { multiple_choice: 0, true_false: 0, short_answer: 0, essay: 0, [qtype]: Number(count) };

      const result = await aiService.generateQuestions({
        courseId,
        name: prompt ? `${assessmentName} — ${prompt}` : assessmentName,
        attributes: targetAttrs,
        questionCount: Number(count),
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        type: assessmentType,
        ...(typeDistribution ? { questionTypeDistribution: typeDistribution } : {}),
      });

      const rawQs: Question[] = Array.isArray(result.questions) ? result.questions : [];

      if (rawQs.length === 0) { toast.error('AI returned no questions.'); return; }

      const mapped: EditQuestion[] = rawQs.map((q: Question) => ({
        text:               q.text ?? '',
        type:               (['multiple_choice', 'true_false', 'short_answer', 'essay'].includes(q.type)
                              ? q.type : 'short_answer') as QType,
        options:            Array.isArray(q.options) ? q.options.map((o) => o.text) : (q.type === 'true_false' ? ['True', 'False'] : []),
        correctAnswer:      Array.isArray(q.correctAnswer) ? (q.correctAnswer[0] ?? '') : (q.correctAnswer ?? ''),
        maxPoints:          q.maxPoints ?? q.points ?? 1,
        parts:              Array.isArray(q.parts) ? q.parts.map((p) => ({
          text:          p.text ?? '',
          type:          (['multiple_choice', 'true_false', 'short_answer', 'essay'].includes(p.type ?? '') ? p.type : 'short_answer') as QType,
          options:       Array.isArray(p.options) ? p.options : [],
          correctAnswer: p.correctAnswer ?? '',
          maxPoints:     p.maxPoints ?? 1,
        })) : [],
        primaryAttributeId: '',
        tags:               [],
      }));

      onAdd(mapped);
      toast.success(`${mapped.length} question${mapped.length > 1 ? 's' : ''} generated!`);
      setPrompt('');
      setOpen(false);
    } catch {
      toast.error('AI generation failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shrink-0">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 border-t border-slate-200 hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-violet-600 uppercase tracking-wider">
          <Sparkles className="w-3 h-3" /> Generate with AI
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mx-2 mb-2 rounded-xl overflow-y-auto p-3" style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#1e3a5f 100%)', maxHeight: 300 }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Describe what to generate
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`e.g. "3 tricky questions on the Calvin cycle"`}
            rows={2}
            className="w-full rounded-lg text-xs resize-none focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)',
              color: 'white', padding: '8px 10px', fontFamily: 'inherit', lineHeight: 1.5,
            }}
          />

          {/* Attribute selector */}
          {attributes.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Attributes
                </p>
                {selectedAttrIds.length > 0 && (
                  <button
                    onClick={() => setSelectedAttrIds([])}
                    className="text-[10px] font-semibold"
                    style={{ color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {selectedAttrIds.length} selected — clear
                  </button>
                )}
              </div>
              <input
                value={attrSearch}
                onChange={(e) => setAttrSearch(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-md text-xs mb-1 focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.12)',
                  color: 'white', padding: '4px 8px', fontFamily: 'inherit',
                }}
              />
              <div className="flex flex-col gap-0.5" style={{ maxHeight: 80, overflowY: 'auto' }}>
                {filteredAttrs.map((a) => {
                  const sel = selectedAttrIds.includes(a._id);
                  return (
                    <button
                      key={a._id}
                      onClick={() => toggleAttr(a._id)}
                      className="flex items-center gap-2 px-2 py-1 rounded-md text-left w-full transition-colors"
                      style={{
                        background: sel ? 'rgba(139,92,246,0.2)' : 'transparent',
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      <div style={{
                        width: 13, height: 13, borderRadius: 3, flexShrink: 0,
                        border: `1.5px solid ${sel ? '#a78bfa' : 'rgba(255,255,255,0.25)'}`,
                        background: sel ? '#7c3aed' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {sel && <Check className="w-2 h-2 text-white" style={{ strokeWidth: 3.5 }} />}
                      </div>
                      <span className="text-xs truncate" style={{ color: sel ? '#c4b5fd' : 'rgba(255,255,255,0.6)', fontWeight: sel ? 600 : 400 }}>
                        {a.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Count + type row */}
          <div className="flex items-center gap-1.5 mt-2.5">
            <select
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="rounded-md text-xs focus:outline-none shrink-0"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)', color: 'white', padding: '4px 6px', fontFamily: 'inherit', width: 44 }}
            >
              {[1, 2, 3, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <select
              value={qtype}
              onChange={(e) => setQtype(e.target.value as 'mixed' | QType)}
              className="flex-1 min-w-0 rounded-md text-xs focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)', color: 'white', padding: '4px 6px', fontFamily: 'inherit' }}
            >
              <option value="mixed">Mixed types</option>
              <option value="multiple_choice">Multiple choice</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short answer</option>
              <option value="essay">Essay</option>
            </select>
          </div>

          {/* Generate button — full width */}
          <button
            onClick={generate}
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {loading
              ? <><Loader2 className="w-3 h-3 animate-spin" /><span style={{ opacity: 0.7 }}>Generating…</span></>
              : <><Sparkles className="w-3 h-3" />Generate</>}
          </button>
          {loading && (
            <p className="text-center mt-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Claude is thinking…
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Part Editor (used inside QuestionEditor for multipart questions) ─────────
const PartEditor: React.FC<{
  part: EditPart; partIndex: number;
  onChangePart: (patch: Partial<EditPart>) => void;
  onDeletePart: () => void; canDelete: boolean;
}> = ({ part, partIndex, onChangePart, onDeletePart, canDelete }) => {
  const label = String.fromCharCode(97 + partIndex);

  const handleTypeChange = (t: QType) => {
    onChangePart({
      type: t,
      options: t === 'true_false' ? ['True', 'False'] : t === 'multiple_choice' ? (part.options.length >= 2 ? part.options : ['', '', '', '']) : [],
      correctAnswer: '',
    });
  };

  const handleOptionChange = (oi: number, val: string) => {
    const opts = [...part.options];
    const old = opts[oi];
    opts[oi] = val;
    onChangePart({ options: opts, correctAnswer: part.correctAnswer === old ? val : part.correctAnswer });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      {/* Part header row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full shrink-0">({label})</span>
        <select
          value={part.type}
          onChange={(e) => handleTypeChange(e.target.value as QType)}
          className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600"
        >
          {(Object.entries(TYPE_META) as [QType, typeof TYPE_META[QType]][]).map(([v, m]) => (
            <option key={v} value={v}>{m.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400">pts</span>
          <input
            type="number" min="1" value={part.maxPoints}
            onChange={(e) => onChangePart({ maxPoints: Number(e.target.value) || 1 })}
            className="w-12 h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-center"
          />
        </div>
        {canDelete && (
          <button onClick={onDeletePart} className="ml-auto text-slate-300 hover:text-red-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Part question text */}
      <textarea
        value={part.text}
        onChange={(e) => onChangePart({ text: e.target.value })}
        placeholder={`Part (${label}) question text…`}
        rows={2}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all leading-relaxed"
      />

      {/* Part answer */}
      {part.type === 'multiple_choice' && (
        <div className="space-y-1.5">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Options — <span className="text-emerald-600 normal-case font-medium">click ✓ to mark correct</span>
          </label>
          {(part.options.length > 0 ? part.options : ['', '', '', '']).map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold border ${
                part.correctAnswer === opt && opt ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                {String.fromCharCode(65 + oi)}
              </div>
              <input
                value={opt}
                onChange={(e) => handleOptionChange(oi, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                className="flex-1 h-8 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              />
              <button
                onClick={() => onChangePart({ correctAnswer: opt })}
                className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                  part.correctAnswer === opt && opt ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                }`}
              >✓</button>
            </div>
          ))}
        </div>
      )}

      {part.type === 'true_false' && (
        <div className="flex gap-2">
          {['True', 'False'].map((v) => (
            <button
              key={v}
              onClick={() => onChangePart({ correctAnswer: v })}
              className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                part.correctAnswer === v ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >{v}</button>
          ))}
        </div>
      )}

      {(part.type === 'short_answer' || part.type === 'essay') && (
        <textarea
          value={part.correctAnswer}
          onChange={(e) => onChangePart({ correctAnswer: e.target.value })}
          placeholder="Model answer / marking guide…"
          rows={2}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
        />
      )}
    </div>
  );
};

// ─── Question Editor Panel ────────────────────────────────────────────────────
const QuestionEditor: React.FC<{
  q: EditQuestion; index: number; total: number;
  onChange: (patch: Partial<EditQuestion>) => void;
  onDelete: () => void; onPrev: () => void; onNext: () => void;
  attributes: { _id: string; name: string }[];
  assessmentName: string;
  courseId: string;
  difficulty: string;
  assessmentType: string;
}> = ({ q, index, total, onChange, onDelete, onPrev, onNext, attributes, assessmentName, courseId, difficulty, assessmentType }) => {
  const regenRef = useRef<HTMLDivElement>(null);

  const [regenOpen, setRegenOpen]           = useState(false);
  const [regenInstruction, setRegenInstruction] = useState('');
  const [regenerating, setRegenerating]     = useState(false);

  // Close regen dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (regenRef.current && !regenRef.current.contains(e.target as Node)) {
        setRegenOpen(false);
      }
    };
    if (regenOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [regenOpen]);

  const handleRegen = async () => {
    setRegenerating(true);
    try {
      const result = await aiService.regenerateQuestions({
        courseId,
        name: regenInstruction ? `${assessmentName} — ${regenInstruction}` : assessmentName,
        attributes: q.primaryAttributeId
          ? attributes.filter((a) => a._id === q.primaryAttributeId)
          : attributes,
        questionCount: 1,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        type: assessmentType,
      });

      const rawQs: Question[] = Array.isArray(result.questions) ? result.questions : [];

      if (rawQs.length === 0) { toast.error('AI returned no result.'); return; }
      const rq = rawQs[0];
      const newType = (['multiple_choice', 'true_false', 'short_answer', 'essay'].includes(rq.type)
        ? rq.type : q.type) as QType;

      onChange({
        text:          rq.text ?? q.text,
        type:          newType,
        options:       Array.isArray(rq.options)
                         ? rq.options.map((o) => (typeof o === 'string' ? o : o.text))
                         : (newType === 'true_false' ? ['True', 'False'] : q.options),
        correctAnswer: Array.isArray(rq.correctAnswer) ? (rq.correctAnswer[0] ?? '') : (rq.correctAnswer ?? ''),
        maxPoints:     rq.maxPoints ?? rq.points ?? q.maxPoints,
      });

      toast.success('Question regenerated!');
      setRegenOpen(false);
      setRegenInstruction('');
    } catch {
      toast.error('Regeneration failed. Try again.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleOptionChange = (oi: number, val: string) => {
    const opts = [...q.options];
    const old = opts[oi];
    opts[oi] = val;
    onChange({ options: opts, correctAnswer: q.correctAnswer === old ? val : q.correctAnswer });
  };

  const removeOption = (oi: number) => {
    const opts = q.options.filter((_, j) => j !== oi);
    onChange({ options: opts, correctAnswer: q.options[oi] === q.correctAnswer ? '' : q.correctAnswer });
  };

  const handleTypeChange = (t: QType) => {
    onChange({
      type: t,
      options: t === 'true_false' ? ['True', 'False'] : t === 'multiple_choice' ? (q.options.length >= 2 ? q.options : ['', '', '', '']) : [],
      correctAnswer: '',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor subheader */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
            Q{index + 1} <span className="font-normal text-blue-300">/ {total}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Type */}
          <select
            value={q.type}
            onChange={(e) => handleTypeChange(e.target.value as QType)}
            className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600"
          >
            {(Object.entries(TYPE_META) as [QType, typeof TYPE_META[QType]][]).map(([v, m]) => (
              <option key={v} value={v}>{m.label}</option>
            ))}
          </select>

          {/* Points */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">pts</span>
            {q.parts.length > 0 ? (
              <span className="w-14 h-7 inline-flex items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-xs text-slate-500 font-semibold">
                {q.parts.reduce((s, p) => s + p.maxPoints, 0)}
              </span>
            ) : (
              <input
                type="number" min="1" value={q.maxPoints}
                onChange={(e) => onChange({ maxPoints: Number(e.target.value) || 1 })}
                className="w-14 h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-center"
              />
            )}
          </div>

          {/* Attribute */}
          <select
            value={q.primaryAttributeId}
            onChange={(e) => onChange({ primaryAttributeId: e.target.value })}
            className="h-7 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600"
          >
            <option value="">Attribute…</option>
            {attributes.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            {q.primaryAttributeId && !attributes.find((a) => a._id === q.primaryAttributeId) && (
              <option value={q.primaryAttributeId}>{q.primaryAttributeId}</option>
            )}
          </select>

          {/* Regenerate with AI */}
          <div className="relative" ref={regenRef}>
            <button
              onClick={() => setRegenOpen((o) => !o)}
              disabled={regenerating}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold disabled:opacity-50 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {regenerating
                ? <><Loader2 className="w-3 h-3 animate-spin" /><span style={{ opacity: 0.7 }}>Regenerating…</span></>
                : <><Sparkles className="w-3 h-3" />Regenerate</>}
            </button>

            {regenOpen && !regenerating && (
              <div
                className="absolute right-0 z-50 w-72 rounded-xl shadow-2xl p-4"
                style={{ top: 'calc(100% + 8px)', background: 'linear-gradient(135deg,#1e1b4b,#1e3a5f)' }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Regenerate this question
                </p>
                <textarea
                  value={regenInstruction}
                  onChange={(e) => setRegenInstruction(e.target.value)}
                  placeholder='Optional: "Make it harder" or "Change to true/false"…'
                  rows={3}
                  className="w-full rounded-lg text-xs resize-none focus:outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)',
                    color: 'white', padding: '8px 10px', fontFamily: 'inherit', lineHeight: 1.5,
                  }}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => { setRegenOpen(false); setRegenInstruction(''); }}
                    className="flex-1 py-1.5 rounded-lg text-xs transition-colors"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegen}
                    className="flex-[2] inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <Sparkles className="w-3 h-3" /> Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-red-200 bg-white text-red-500 hover:bg-red-50 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>

        {/* Prev / Next */}
        <div className="flex gap-1">
          <button
            onClick={onPrev} disabled={index === 0}
            className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext} disabled={index === total - 1}
            className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Question text */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Question text
            </label>
            <textarea
              value={q.text}
              onChange={(e) => onChange({ text: e.target.value })}
              placeholder="Type your question here…"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 min-h-[100px] resize-y focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all leading-relaxed"
            />
          </div>

          {/* Answer / Parts section */}
          <div>
            {/* Multipart toggle */}
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {q.parts.length > 0 ? `Parts (${q.parts.length})` : 'Answer'}
              </label>
              <button
                onClick={() => {
                  if (q.parts.length > 0) {
                    onChange({ parts: [], correctAnswer: '' });
                  } else {
                    onChange({ parts: [EMPTY_PART()], options: [], correctAnswer: '' });
                  }
                }}
                className="text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors"
                style={q.parts.length > 0
                  ? { borderColor: '#e2e8f0', color: '#64748b' }
                  : { borderColor: '#bfdbfe', color: '#2563eb' }
                }
              >
                {q.parts.length > 0 ? 'Remove parts' : '+ Split into parts'}
              </button>
            </div>

            {q.parts.length > 0 ? (
              /* ── Multipart editor ── */
              <div className="space-y-3">
                {q.parts.map((part, pi) => (
                  <PartEditor
                    key={pi}
                    part={part}
                    partIndex={pi}
                    onChangePart={(patch) => {
                      const updated = q.parts.map((p, j) => j === pi ? { ...p, ...patch } : p);
                      onChange({ parts: updated });
                    }}
                    onDeletePart={() => onChange({ parts: q.parts.filter((_, j) => j !== pi) })}
                    canDelete={q.parts.length > 1}
                  />
                ))}
                <button
                  onClick={() => onChange({ parts: [...q.parts, EMPTY_PART()] })}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus className="w-3 h-3" /> Add part
                </button>
              </div>
            ) : (
              /* ── Single-question answer ── */
              <>
                {q.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Answer options — <span className="text-emerald-600 normal-case font-medium">click ✓ to mark correct</span>
                    </label>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold border transition-colors ${
                          q.correctAnswer === opt && opt ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + oi)}
                        </div>
                        <input
                          value={opt}
                          onChange={(e) => handleOptionChange(oi, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                          className="flex-1 h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                        />
                        <button
                          onClick={() => onChange({ correctAnswer: opt })}
                          className={`shrink-0 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                            q.correctAnswer === opt && opt ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                          }`}
                        >✓ Correct</button>
                        {q.options.length > 2 && (
                          <button onClick={() => removeOption(oi)} className="text-slate-300 hover:text-red-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => onChange({ options: [...q.options, ''] })}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                    >
                      <Plus className="w-3 h-3" /> Add option
                    </button>
                  </div>
                )}

                {q.type === 'true_false' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Correct answer</label>
                    <div className="flex gap-3">
                      {['True', 'False'].map((v) => (
                        <button
                          key={v}
                          onClick={() => onChange({ correctAnswer: v })}
                          className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                            q.correctAnswer === v ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                          }`}
                        >{v}</button>
                      ))}
                    </div>
                  </div>
                )}

                {(q.type === 'short_answer' || q.type === 'essay') && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Expected / model answer</label>
                    <textarea
                      value={q.correctAnswer}
                      onChange={(e) => onChange({ correctAnswer: e.target.value })}
                      placeholder="Enter the expected answer or marking guide…"
                      className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 resize-y focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all leading-relaxed ${q.type === 'essay' ? 'min-h-[160px]' : 'min-h-[100px]'}`}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Completion hint */}
          {q.text && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs ${
              (q.parts.length > 0 ? q.parts.every((p) => p.text && p.correctAnswer) : !!q.correctAnswer)
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              <Check className="w-3.5 h-3.5 shrink-0" />
              {q.parts.length > 0
                ? q.parts.every((p) => p.text && p.correctAnswer) ? 'All parts complete.' : 'Complete each part to finish this question.'
                : q.correctAnswer ? 'Question complete — answer marked.' : 'Add a correct answer to complete this question.'
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyEditor: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400 p-8">
    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
      <Plus className="w-7 h-7" />
    </div>
    <div className="text-center">
      <p className="font-semibold text-slate-600 text-base">No questions yet</p>
      <p className="text-sm mt-1">Add a question to get started</p>
    </div>
    <button
      onClick={onAdd}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
    >
      <Plus className="w-4 h-4" /> Add first question
    </button>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const EditAssessmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saveConfirm, setSaveConfirm] = useState<{ message: string; sub: string } | null>(null);
  const [attributes, setAttributes] = useState<{ _id: string; name: string }[]>([]);
  const [courseId, setCourseId]     = useState('');
  const [activeIdx, setActiveIdx]   = useState(0);
  const originalQuestionsRef        = useRef<string>('');

  const [form, setForm] = useState({
    name: '', type: 'Exercise', difficulty: 'medium', totalPoints: '100', status: 'draft', dueDate: '',
  });
  const [questions, setQuestions] = useState<EditQuestion[]>([]);

  const totalPts       = questions.reduce((s, q) => s + (q.parts.length > 0 ? q.parts.reduce((ps, p) => ps + p.maxPoints, 0) : (q.maxPoints || 0)), 0);
  const completedCount = questions.filter((q) =>
    q.parts.length > 0
      ? q.text && q.parts.length > 0 && q.parts.every((p) => p.text && p.correctAnswer)
      : q.text && q.correctAnswer
  ).length;

  useEffect(() => {
    if (!id) return;
    assessmentService.getAssessmentWithQuestions(id)
      .catch(() => assessmentService.getAssessment(id))
      .then((assessment) => {
        const a = assessment as unknown as RawA;
        setForm({
          name:        a.name        ?? '',
          type:        a.type        ?? 'Exercise',
          difficulty:  a.difficulty  ?? 'medium',
          totalPoints: String(a.totalPoints ?? 100),
          status:      a.status      ?? 'draft',
          dueDate:     a.dueDate ? new Date(a.dueDate).toISOString().split('T')[0] : '',
        });
        const qs: EditQuestion[] = (Array.isArray(a.questions) ? a.questions : []).map((q: RawQ) => ({
          _id:                q._id,
          text:               q.text ?? '',
          type:               (q.questionType ?? (q.options?.length ? 'multiple_choice' : 'short_answer')) as QType,
          options:            Array.isArray(q.options) ? q.options : [],
          correctAnswer:      q.correctAnswer ?? '',
          maxPoints:          q.maxPoints ?? 1,
          primaryAttributeId: q.primaryAttributeId ?? '',
          tags:               Array.isArray(q.tags) ? q.tags : [],
          parts:              Array.isArray(q.parts) ? q.parts.map((p) => ({
            text:          p.text ?? '',
            type:          (p.type as QType) ?? 'short_answer',
            options:       Array.isArray(p.options) ? p.options : [],
            correctAnswer: p.correctAnswer ?? '',
            maxPoints:     p.maxPoints ?? 1,
          })) : [],
        }));
        setQuestions(qs);
        originalQuestionsRef.current = JSON.stringify(qs);

        const cId = typeof a.course === 'object' ? (a.course?._id ?? '') : (a.course ?? a.courseId ?? '');
        setCourseId(cId);
        if (cId) {
          courseService.getCourseAttributes(cId)
            .then((attrs) => setAttributes(attrs))
            .catch(() => {});
        }
      })
      .catch(() => toast.error('Failed to load assessment.'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateQ = (i: number, patch: Partial<EditQuestion>) =>
    setQuestions((prev) => prev.map((q, idx) => idx === i ? { ...q, ...patch } : q));

  const addQ = () => {
    setQuestions((prev) => [...prev, EMPTY_QUESTION()]);
    setActiveIdx(questions.length);
  };

  const removeQ = (i: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
    setActiveIdx((prev) => Math.min(prev, Math.max(0, questions.length - 2)));
  };

  const qMaxPoints = (q: EditQuestion): number =>
    q.parts.length > 0 ? q.parts.reduce((s, p) => s + p.maxPoints, 0) : q.maxPoints;

  const buildQuestionsPayload = () =>
    questions.map((q) => ({
      _id:                q._id,
      text:               q.text,
      options:            q.parts.length > 0 ? [] : q.options.filter(Boolean),
      correctAnswer:      q.parts.length > 0 ? '' : q.correctAnswer,
      maxPoints:          qMaxPoints(q),
      primaryAttributeId: q.primaryAttributeId,
      tags:               q.tags,
      parts:              q.parts.map((p) => ({
        text:          p.text,
        type:          p.type,
        options:       p.options.filter(Boolean),
        correctAnswer: p.correctAnswer,
        maxPoints:     p.maxPoints,
      })),
    }));

  const confirm = (message: string, sub: string) => {
    setSaveConfirm({ message, sub });
    setTimeout(() => navigate('/teacher/assessments'), 2000);
  };

  const handleSave = async (newStatus?: string, fromBanner = false) => {
    if (!id) return;
    setSaving(true);
    try {
      await assessmentService.updateAssessment(id, {
        name:        form.name,
        type:        form.type as any,
        difficulty:  form.difficulty as any,
        totalPoints: Number(form.totalPoints),
        status:      (newStatus ?? form.status) as any,
        dueDate:     form.dueDate ? new Date(form.dueDate) : undefined,
        questions:   buildQuestionsPayload(),
      } as any);
      if (fromBanner) {
        confirm('Published assessment updated.', `${questions.length} question${questions.length !== 1 ? 's' : ''} saved and live.`);
      } else if (newStatus === 'published') {
        confirm('Assessment published!', 'Taking you to the dashboard…');
      } else if (newStatus === 'archived') {
        confirm('Assessment archived.', 'Taking you to the dashboard…');
      } else {
        toast.success('Draft saved.');
      }
    } catch {
      toast.error('Failed to save assessment.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsNewDraft = async () => {
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const strippedQuestions = buildQuestionsPayload().map(({ _id, ...q }) => q);
      const draftName = `${form.name} (Draft)`;
      await assessmentService.createAssessment({
        name:        draftName,
        type:        form.type as 'Exercise' | 'Test' | 'Exam' | 'Homework' | 'D-Plan',
        difficulty:  form.difficulty,
        totalPoints: Number(form.totalPoints),
        status:      'draft',
        dueDate:     form.dueDate ? new Date(form.dueDate) : undefined,
        courseId,
        questions:   strippedQuestions as unknown as Question[],
      });
      confirm('Saved as new draft.', `"${draftName}" is ready to edit. The published version is unchanged.`);
    } catch {
      toast.error('Failed to save as new draft.');
    } finally {
      setSaving(false);
    }
  };

  const hasPublishedChanges =
    form.status === 'published' &&
    JSON.stringify(questions) !== originalQuestionsRef.current;

  const statusBadge = ({
    draft:     'bg-yellow-100 text-yellow-800',
    published: 'bg-emerald-100 text-emerald-800',
    archived:  'bg-slate-100 text-slate-600',
  } as Record<string, string>)[form.status] ?? 'bg-slate-100 text-slate-600';

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeQ = questions[activeIdx] ?? null;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col overflow-hidden bg-slate-50">

      {/* ── Top Header ── */}
      <div className="shrink-0 flex items-center gap-3 px-5 bg-white border-b border-slate-200" style={{ height: 56 }}>
        <button
          onClick={() => navigate('/teacher/assessments')}
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 shrink-0" />

        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className="text-sm font-semibold text-slate-800 bg-transparent border-none outline-none min-w-[160px] max-w-[260px]"
          placeholder="Assessment name"
        />

        <div className="flex items-center gap-2">
          {[
            { field: 'type' as const, opts: ['Exercise', 'Test', 'Exam', 'Homework', 'D-Plan'] },
            { field: 'difficulty' as const, opts: ['easy', 'medium', 'hard'] },
          ].map(({ field, opts }) => (
            <select
              key={field}
              value={form[field]}
              onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
              className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600 font-medium"
            >
              {opts.map((o) => (
                <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
              ))}
            </select>
          ))}
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
            className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600"
          />
        </div>

        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${statusBadge}`}>
          {form.status}
        </span>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400"><b className="text-slate-700">{questions.length}</b> Q</span>
          <span className="text-xs text-slate-400"><b className="text-slate-700">{totalPts}</b> pts</span>
          <span className="text-xs text-slate-400">
            <b className={completedCount === questions.length && questions.length > 0 ? 'text-emerald-600' : 'text-slate-700'}>
              {completedCount}/{questions.length}
            </b> done
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save draft
          </button>
          {form.status !== 'published' && (
            <button
              onClick={() => handleSave('published')}
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> Publish
            </button>
          )}
          {form.status === 'published' && (
            <button
              onClick={() => handleSave('archived')}
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition-colors"
            >
              Archive
            </button>
          )}
        </div>
      </div>

      {/* ── Published-changes banner ── */}
      {saveConfirm ? (
        <div className="shrink-0 flex items-center gap-3 px-5 py-2.5 bg-emerald-50 border-b border-emerald-200">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-emerald-800">{saveConfirm.message}</span>
            <span className="text-xs text-emerald-600 ml-2">{saveConfirm.sub}</span>
          </div>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500 shrink-0" />
        </div>
      ) : hasPublishedChanges && (
        <div className="shrink-0 flex items-center gap-3 px-5 py-2.5 bg-amber-50 border-b border-amber-200">
          <span className="text-xs text-amber-800 font-medium flex-1">
            This published assessment has unsaved changes — choose how to save:
          </span>
          <button
            onClick={() => handleSave(undefined, true)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Update published
          </button>
          <button
            onClick={handleSaveAsNewDraft}
            disabled={saving}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg border border-amber-300 bg-white text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-60 transition-colors"
          >
            Save as new draft
          </button>
        </div>
      )}

      {/* ── Body: sidebar + editor ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Sidebar ── */}
        <div className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">

          {/* Sidebar header */}
          <div className="shrink-0 px-4 py-3 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Questions</span>
              <button onClick={addQ} className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:text-blue-700">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: questions.length ? `${(completedCount / questions.length) * 100}%` : '0%',
                  background: completedCount === questions.length && questions.length > 0 ? '#10b981' : '#2563eb',
                }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{completedCount} of {questions.length} complete</p>
          </div>

          {/* Question list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {questions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No questions yet</div>
            ) : questions.map((q, i) => (
              <QuestionPill
                key={q._id ?? i}
                q={q} index={i}
                active={i === activeIdx}
                onClick={() => setActiveIdx(i)}
                onDelete={() => removeQ(i)}
              />
            ))}
          </div>

          {/* AI Generate Panel */}
          <AiGeneratePanel
            courseId={courseId}
            assessmentName={form.name}
            difficulty={form.difficulty}
            assessmentType={form.type}
            attributes={attributes}
            onAdd={(newQs) => {
              setQuestions((prev) => {
                const updated = [...prev, ...newQs];
                setActiveIdx(updated.length - newQs.length);
                return updated;
              });
            }}
          />

          {/* Sidebar footer: total points */}
          <div className="shrink-0 border-t border-slate-200 px-4 py-3 flex items-center gap-2">
            <span className="flex-1 text-xs text-slate-400">Total points</span>
            <input
              type="number" min="1" value={form.totalPoints}
              onChange={(e) => setForm((p) => ({ ...p, totalPoints: e.target.value }))}
              className="w-16 h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-center focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {/* ── Editor panel ── */}
        <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
          {activeQ ? (
            <QuestionEditor
              q={activeQ}
              index={activeIdx}
              total={questions.length}
              onChange={(patch) => updateQ(activeIdx, patch)}
              onDelete={() => removeQ(activeIdx)}
              onPrev={() => setActiveIdx((i) => Math.max(0, i - 1))}
              onNext={() => setActiveIdx((i) => Math.min(questions.length - 1, i + 1))}
              attributes={attributes}
              assessmentName={form.name}
              courseId={courseId}
              difficulty={form.difficulty}
              assessmentType={form.type}
            />
          ) : (
            <EmptyEditor onAdd={addQ} />
          )}
        </div>
      </div>
    </div>
  );
};

export default EditAssessmentPage;
