import React, { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Gauge, ListChecks, ToggleLeft, AlignLeft, Code2, FileText } from 'lucide-react';
import { Course } from '@/types';
import { getQuestionTypeLabel } from '@/utils/questionTypeLabel';

type Difficulty = 'easy' | 'medium' | 'hard';
type MathPaperType = 'paper1' | 'paper2' | 'both';

export interface QuestionTypeDistribution {
  multiple_choice: number;
  true_false: number;
  short_answer: number;
  essay: number;
}

interface ConfigStepProps {
  formData: {
    difficulty: Difficulty;
    questionTypeDistribution: QuestionTypeDistribution;
    mathPaperType?: MathPaperType | null;
  };
  selectedCourse?: Course | null;
  onSelectChange: (name: string, value: string) => void;
  onDistributionChange: (dist: QuestionTypeDistribution) => void;
  onMathPaperTypeChange?: (type: MathPaperType) => void;
}

// ── Difficulty config ────────────────────────────────────────────────────────
const DIFFICULTIES: {
  value: Difficulty;
  label: string;
  sublabel: string;
  border: string;
  bg: string;
  text: string;
  dot: string;
}[] = [
  { value: 'easy',   label: 'Easy',   sublabel: 'Recall & comprehension',  border: 'border-emerald-400', bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
  { value: 'medium', label: 'Medium', sublabel: 'Application & analysis',  border: 'border-amber-400',   bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500'   },
  { value: 'hard',   label: 'Hard',   sublabel: 'Synthesis & evaluation',  border: 'border-red-400',     bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500'     },
];

// ── Question type config ──────────────────────────────────────────────────────
const Q_TYPES: {
  key: keyof QuestionTypeDistribution;
  label: string;
  short: string;
  icon: React.ReactNode;
  colour: string;
  track: string;
}[] = [
  { key: 'multiple_choice', label: 'Multiple Choice', short: 'MCQ',   icon: <ListChecks className="w-4 h-4" />, colour: 'text-blue-600',   track: 'accent-blue-500'    },
  { key: 'true_false',      label: 'True / False',    short: 'T/F',   icon: <ToggleLeft className="w-4 h-4" />, colour: 'text-emerald-600',track: 'accent-emerald-500' },
  { key: 'short_answer',    label: 'Short Answer / Show Working', short: 'Short', icon: <AlignLeft className="w-4 h-4" />, colour: 'text-purple-600', track: 'accent-purple-500'  },
  { key: 'essay',           label: 'Essay / Long',    short: 'Essay', icon: <Code2 className="w-4 h-4" />,      colour: 'text-orange-600', track: 'accent-orange-500'  },
];

const COLOUR_MAP: Record<keyof QuestionTypeDistribution, string> = {
  multiple_choice: 'bg-blue-500',
  true_false:      'bg-emerald-500',
  short_answer:    'bg-purple-500',
  essay:           'bg-orange-500',
};

// ── Paper type distributions ──────────────────────────────────────────────────
// Based on ZIMSEC Maths Syllabus B (MoPSE 2024-2030):
//   Paper 1 — ~30 short structured questions, no calculator, 100 marks
//   Paper 2 — Section A: 5 short questions (52 marks) + Section B: 4 of 7 long questions (48 marks)
const PAPER_DISTRIBUTIONS: Record<MathPaperType, QuestionTypeDistribution> = {
  paper1: { multiple_choice: 0, true_false: 0, short_answer: 100, essay: 0  },
  paper2: { multiple_choice: 0, true_false: 0, short_answer: 50,  essay: 50 },
  both:   { multiple_choice: 0, true_false: 0, short_answer: 50,  essay: 50 },
};

const PAPER_TYPES: {
  value: MathPaperType;
  label: string;
  sublabel: string;
  tag: string;
  border: string;
  bg: string;
  text: string;
  tagBg: string;
}[] = [
  {
    value: 'paper1',
    label: 'Paper 1 Style',
    sublabel: 'Short, direct questions — concise recall & application, no calculator context',
    tag: 'Short Structured',
    border: 'border-blue-400',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    tagBg: 'bg-blue-100 text-blue-700',
  },
  {
    value: 'paper2',
    label: 'Paper 2 Style',
    sublabel: 'Multi-step questions requiring full working — structured and extended responses',
    tag: 'Short + Long Working',
    border: 'border-purple-400',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    tagBg: 'bg-purple-100 text-purple-700',
  },
  {
    value: 'both',
    label: 'Both Styles',
    sublabel: 'Mix of concise direct questions and extended multi-step working questions',
    tag: 'Mixed Style',
    border: 'border-indigo-400',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    tagBg: 'bg-indigo-100 text-indigo-700',
  },
];

function isMaths(course?: Course | null) {
  if (!course) return false;
  const haystack = `${course.name} ${course.code}`.toLowerCase();
  return haystack.includes('math');
}

function clamp(n: number) { return Math.max(0, Math.min(100, n)); }

export function ConfigStep({
  formData,
  selectedCourse,
  onSelectChange,
  onDistributionChange,
  onMathPaperTypeChange,
}: ConfigStepProps) {
  const dist  = formData.questionTypeDistribution;
  const total = Object.values(dist).reduce((a, b) => a + b, 0);
  const mathsCourse = isMaths(selectedCourse);

  const handleSliderChange = useCallback(
    (key: keyof QuestionTypeDistribution, rawVal: number) => {
      const next   = clamp(rawVal);
      const others = Q_TYPES.map((t) => t.key).filter((k) => k !== key);
      const prevOthers = others.reduce((s, k) => s + dist[k], 0);
      const remaining  = clamp(100 - next);

      const newDist: QuestionTypeDistribution = { ...dist, [key]: next };

      if (prevOthers === 0) {
        const share = Math.floor(remaining / others.length);
        others.forEach((k) => (newDist[k] = share));
        newDist[others[0]] += remaining - share * others.length;
      } else {
        let runningSum = 0;
        others.forEach((k, i) => {
          if (i < others.length - 1) {
            const scaled = Math.round((dist[k] / prevOthers) * remaining);
            newDist[k] = clamp(scaled);
            runningSum += newDist[k];
          } else {
            newDist[k] = clamp(remaining - runningSum);
          }
        });
      }

      onDistributionChange(newDist);
    },
    [dist, onDistributionChange]
  );

  const handlePaperTypeSelect = (type: MathPaperType) => {
    onMathPaperTypeChange?.(type);
    // For 'both', only reset to 50/50 if coming from a different type
    if (type !== 'both' || formData.mathPaperType !== 'both') {
      onDistributionChange(PAPER_DISTRIBUTIONS[type]);
    }
  };

  const segments = Q_TYPES.map((t) => ({ ...t, pct: dist[t.key] })).filter((s) => s.pct > 0);

  return (
    <div className="grid grid-cols-2 gap-8 h-full">

      {/* ── LEFT: Difficulty ── */}
      <div className="flex flex-col gap-4">
        <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5" /> Difficulty Level
        </Label>

        <div className="flex flex-col gap-2.5">
          {DIFFICULTIES.map(({ value, label, sublabel, border, bg, text, dot }) => {
            const sel = formData.difficulty === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onSelectChange('difficulty', value)}
                className={`
                  relative flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left
                  transition-all duration-150 focus:outline-none
                  ${sel
                    ? `${border} ${bg} shadow-[0_0_0_3px_rgba(0,0,0,0.04)]`
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                  }
                `}
              >
                <span className={`w-3 h-3 rounded-full shrink-0 ${sel ? dot : 'bg-gray-200'}`} />
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${sel ? text : 'text-gray-700'}`}>{label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>
                </div>
                {sel && (
                  <span className={`ml-auto shrink-0 text-[10px] font-black uppercase tracking-wider ${text}`}>
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Bloom's Alignment</p>
          <div className="space-y-1.5 text-[11px] text-gray-500">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />Easy — remember, understand</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />Medium — apply, analyse</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />Hard — evaluate, create</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Paper type (maths) OR question mix (other subjects) ── */}
      <div className="flex flex-col gap-4">

        {mathsCourse ? (
          <>
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Question Style
            </Label>

            <div className="flex flex-col gap-2.5">
              {PAPER_TYPES.map(({ value, label, sublabel, border, bg, text }) => {
                const sel = formData.mathPaperType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handlePaperTypeSelect(value)}
                    className={`
                      relative flex items-start gap-3 px-3.5 py-3 rounded-xl border-2 text-left w-full
                      transition-all duration-150 focus:outline-none
                      ${sel
                        ? `${border} ${bg} shadow-[0_0_0_3px_rgba(0,0,0,0.04)]`
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${sel ? border.replace('border-', 'bg-') : 'bg-gray-200'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-bold ${sel ? text : 'text-gray-700'}`}>{label}</p>
                        {sel && <span className={`text-[10px] font-black uppercase tracking-wider shrink-0 ${text}`}>Selected</span>}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{sublabel}</p>

                      {/* Split control — inline inside the Both Styles card */}
                      {sel && value === 'both' && (
                        <div className="mt-2.5 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                          <div className="w-full h-2 rounded-full overflow-hidden flex">
                            <div className="bg-blue-400 transition-all duration-150" style={{ width: `${dist.short_answer}%` }} />
                            <div className="bg-purple-400 transition-all duration-150" style={{ width: `${dist.essay}%` }} />
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={90}
                            step={5}
                            value={dist.short_answer}
                            onChange={(e) => {
                              const p1 = Number(e.target.value);
                              onDistributionChange({ multiple_choice: 0, true_false: 0, short_answer: p1, essay: 100 - p1 });
                            }}
                            className="w-full h-1 rounded-full appearance-none cursor-pointer accent-indigo-500"
                          />
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-blue-500">P1 — {dist.short_answer}%</span>
                            <span className="text-purple-500">P2 — {dist.essay}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-3 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Question Style Guide</p>
              <div className="space-y-1.5 text-[11px] text-gray-500">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />Paper 1 style — direct, short answers, no multi-step working</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />Paper 2 style — structured working, multi-step solutions</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />Marks & question count are set by you, not the paper format</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Question Type Mix
              </Label>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${total === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                {total}% / 100%
              </span>
            </div>

            <div className="w-full h-3 rounded-full overflow-hidden flex">
              {total === 0 ? (
                <div className="flex-1 bg-gray-100" />
              ) : (
                segments.map((s) => (
                  <div
                    key={s.key}
                    style={{ width: `${s.pct}%` }}
                    className={`${COLOUR_MAP[s.key]} transition-all duration-300`}
                    title={`${getQuestionTypeLabel(s.key, formData.mathPaperType)}: ${s.pct}%`}
                  />
                ))
              )}
            </div>

            <div className="flex flex-col gap-4 flex-1">
              {Q_TYPES.map(({ key, icon, colour, track }) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1.5 ${colour}`}>
                      {icon}
                      <span className="text-xs font-semibold text-gray-700">
                        {getQuestionTypeLabel(key, formData.mathPaperType)}
                      </span>
                    </div>
                    <span className="text-sm font-black text-gray-800 tabular-nums w-10 text-right">
                      {dist[key]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={dist[key]}
                    onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                    className={`w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-100 ${track}`}
                  />
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Quick Presets</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '100% MCQ',     dist: { multiple_choice: 100, true_false: 0, short_answer: 0,   essay: 0  } },
                  { label: '50/50 MCQ+SA', dist: { multiple_choice: 50,  true_false: 0, short_answer: 50,  essay: 0  } },
                  { label: 'Mixed',        dist: { multiple_choice: 40,  true_false: 20, short_answer: 30, essay: 10 } },
                  { label: '100% SA',      dist: { multiple_choice: 0,   true_false: 0, short_answer: 100, essay: 0  } },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onDistributionChange(preset.dist as QuestionTypeDistribution)}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
