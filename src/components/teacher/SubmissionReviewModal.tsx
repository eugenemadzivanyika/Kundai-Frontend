import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { submissionService, assessmentService } from '../../services/api';
import { toast } from 'sonner';

interface SubmissionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  onReviewComplete: () => void;
  allSubmissionIds?: string[];
  onSwitchSubmission?: (id: string) => void;
}

const fmtDate = (v: string) =>
  new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtTime = (v: string) =>
  new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function getConfidenceStyle(c: number) {
  const pct = (c ?? 0) * 100;
  if (pct >= 80) return { color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0', label: 'High',     stroke: '#10b981' };
  if (pct >= 60) return { color: '#92400e', bg: '#fffbeb', border: '#fcd34d', label: 'Moderate', stroke: '#f59e0b' };
  return             { color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', label: 'Low',      stroke: '#ef4444' };
}
function scoreColor(pct: number) {
  if (pct >= 60) return '#10b981';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
}

// ── Compact confidence arc ────────────────────────────────────────────────
const ConfidenceArc: React.FC<{ value: number }> = ({ value }) => {
  const pct = Math.round((value ?? 0) * 100);
  const cs = getConfidenceStyle(value ?? 0);
  const half = Math.PI * 28;
  const fill = (pct / 100) * half;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Confidence</div>
      <svg width={70} height={42} viewBox="0 0 70 42">
        <path d="M7 36 A28 28 0 0 1 63 36" fill="none" stroke="#e2e8f0" strokeWidth={7} strokeLinecap="round" />
        <path d="M7 36 A28 28 0 0 1 63 36" fill="none" stroke={cs.stroke} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={`${fill} ${half}`} />
        <text x="35" y="34" textAnchor="middle" fontSize="12" fontWeight="800" fill={cs.color}>{pct}%</text>
      </svg>
      <span style={{ fontSize: 9, fontWeight: 700, color: cs.color, background: cs.bg, border: `1px solid ${cs.border}`, padding: '1px 7px', borderRadius: 20, marginTop: -2 }}>
        {cs.label}
      </span>
    </div>
  );
};

// ── Compact score donut ───────────────────────────────────────────────────
const ScoreDonut: React.FC<{ score: number; total: number }> = ({ score, total }) => {
  const pct = total > 0 ? score / total : 0;
  const r = 27, stroke = 7;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = scoreColor(pct * 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>AI Score</div>
      <div style={{ position: 'relative', width: 70, height: 70 }}>
        <svg width={70} height={70} viewBox="0 0 70 70">
          <circle cx="35" cy="35" r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 35 35)" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 500 }}>/{total}</span>
        </div>
      </div>
    </div>
  );
};

// ── Slim score bar ────────────────────────────────────────────────────────
const QuestionScoreBar: React.FC<{ score: number; max: number }> = ({ score, max }) => {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const color = scoreColor(pct);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 38, textAlign: 'right' }}>{score}/{max}</span>
    </div>
  );
};

// ── Tab button ────────────────────────────────────────────────────────────
const Tab: React.FC<{ label: string; active: boolean; onClick: () => void; count?: number | null }> = ({ label, active, onClick, count }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px',
    border: 'none', borderBottom: `2.5px solid ${active ? '#2563eb' : 'transparent'}`,
    background: 'none', color: active ? '#2563eb' : '#64748b',
    fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer',
    transition: 'all 0.12s', whiteSpace: 'nowrap',
  }}>
    {label}
    {count != null && (
      <span style={{ fontSize: 9, fontWeight: 700, background: active ? '#dbeafe' : '#f1f5f9', color: active ? '#2563eb' : '#94a3b8', padding: '1px 5px', borderRadius: 8 }}>
        {count}
      </span>
    )}
  </button>
);

// ── CoT step card ─────────────────────────────────────────────────────────
const CoTStep: React.FC<{ step: any; index: number }> = ({ step, index }) => {
  const [expanded, setExpanded] = useState(true);
  const pct = step.maxScore > 0 ? (step.score / step.maxScore) * 100 : 0;
  const color = scoreColor(pct);
  const hasGap = step.gaps && step.gaps !== 'None' && step.gaps !== 'none';
  return (
    <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
      <button onClick={() => setExpanded(e => !e)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
        borderBottom: expanded ? '1px solid #f1f5f9' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: '#0f172a', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            Q{step.question ?? index + 1}
          </div>
          <div style={{ textAlign: 'left', minWidth: 160 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Question {step.question ?? index + 1}</div>
            <QuestionScoreBar score={step.score} max={step.maxScore ?? 0} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasGap && <span style={{ fontSize: 10, fontWeight: 600, background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5', padding: '2px 7px', borderRadius: 20 }}>Gap</span>}
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, border: `1.5px solid ${color}33`,
            background: color === '#10b981' ? '#ecfdf5' : color === '#f59e0b' ? '#fffbeb' : '#fef2f2', color }}>
            {step.score}/{step.maxScore ?? '?'} pts
          </span>
          <span style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1 }}>{expanded ? '−' : '+'}</span>
        </div>
      </button>
      {expanded && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ padding: '10px 14px', borderRight: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>AI Analysis</div>
              <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>"{step.analysis}"</p>
            </div>
            <div style={{ padding: '10px 14px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Model Comparison</div>
              <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, margin: 0 }}>{step.comparison}</p>
            </div>
          </div>
          <div style={{ padding: '10px 14px', background: '#fffbeb', borderLeft: '3px solid #f59e0b' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Evaluation</div>
            <p style={{ fontSize: 12, color: '#78350f', lineHeight: 1.6, margin: 0 }}>{step.evaluation}</p>
            {hasGap && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 10px' }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', flexShrink: 0, marginTop: 1 }}>⚠ Gap</span>
                <p style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 1.5, margin: 0 }}>{step.gaps}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── AI Analysis Tab ────────────────────────────────────────────────────────
const AIAnalysisTab: React.FC<{ result: any; cot: any[] }> = ({ result, cot }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <div style={{ background: '#0f172a', color: 'white', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700 }}>
        Chain of Thought Reasoning
      </div>
      {cot.length > 0 && <span style={{ fontSize: 11, color: '#94a3b8' }}>{cot.length} question{cot.length !== 1 ? 's' : ''} analysed</span>}
    </div>
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {cot.length > 0
        ? cot.map((step: any, i: number) => <CoTStep key={i} step={step} index={i} />)
        : (
          <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: 20, flex: 1 }}>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>
              {result.aiGradingSuggestion?.chainOfThought || 'No AI analysis available for this submission.'}
            </p>
          </div>
        )
      }
    </div>
  </div>
);

// ── Cognitive Profile Tab ─────────────────────────────────────────────────
const CognitiveProfileTab: React.FC<{ profile: any }> = ({ profile }) => {
  if (!profile) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
      No cognitive profile available for this submission.
    </div>
  );
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexShrink: 0 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Strengths · {profile.strengths?.length ?? 0}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(profile.strengths ?? []).map((s: any, i: number) => (
              <div key={i} style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 8, padding: '8px 10px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#065f46' }}>{s.attributeName || s.attributeId}</span>
                </div>
                <p style={{ fontSize: 11, color: '#14532d', lineHeight: 1.5, margin: 0 }}>{s.evidence}</p>
              </div>
            ))}
            {(!profile.strengths || profile.strengths.length === 0) && (
              <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No strengths identified.</p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexShrink: 0 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Deficiencies · {profile.deficiencies?.length ?? 0}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(profile.deficiencies ?? []).map((d: any, i: number) => (
              <div key={i} style={{ background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 8, padding: '8px 10px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#991b1b' }}>{d.attributeName || d.attributeId}</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#7f1d1d', display: 'block', marginBottom: 2 }}>{d.misconception}</span>
                <p style={{ fontSize: 11, color: '#7f1d1d', lineHeight: 1.5, margin: 0 }}>{d.failedLogic}</p>
              </div>
            ))}
            {(!profile.deficiencies || profile.deficiencies.length === 0) && (
              <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No deficiencies identified.</p>
            )}
          </div>
        </div>
      </div>
      {profile.suggestedTutorApproach && (
        <div style={{ flexShrink: 0, background: '#faf5ff', border: '1.5px solid #e9d5ff', borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Suggested Tutor Approach</div>
            <p style={{ fontSize: 11, color: '#4c1d95', lineHeight: 1.6, margin: 0 }}>{profile.suggestedTutorApproach}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Raw Submission Tab ─────────────────────────────────────────────────────
const RawSubmissionTab: React.FC<{ submission: any }> = ({ submission }) => (
  <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
    {(submission?.answers ?? []).map((ans: any, i: number) => (
      <div key={i} style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: '#0f172a', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>Q{i + 1}</div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>Question {i + 1}</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 20 }}>Max {ans.questionId?.maxPoints ?? '?'} pts</span>
        </div>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Question</div>
          <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, borderLeft: '3px solid #2563eb', paddingLeft: 10, margin: 0 }}>{ans.questionId?.text}</p>
        </div>
        <div style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Student answer</div>
          <div style={{ background: '#0f172a', borderRadius: 8, padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: '#e2e8f0', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {ans.studentAnswer}
          </div>
        </div>
      </div>
    ))}
    {!submission?.answers?.length && (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>No submission content available.</div>
    )}
  </div>
);

// ── AI Feedback Tab ───────────────────────────────────────────────────────
const AIFeedbackTab: React.FC<{ result: any }> = ({ result }) => {
  const feedback = result.aiGradingSuggestion?.overallFeedback;
  const misconceptions: string[] = result.aiGradingSuggestion?.misconceptionsFound ?? [];
  const cot = Array.isArray(result.aiGradingSuggestion?.chainOfThought) ? result.aiGradingSuggestion.chainOfThought : [];
  const gaps = cot.filter((s: any) => s.gaps && s.gaps !== 'None' && s.gaps !== 'none');

  if (!feedback && misconceptions.length === 0) {
    return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>No overall AI feedback available.</div>;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {[
          { label: 'Analysed', value: cot.length, color: '#0f172a', bg: 'white', border: '#e2e8f0' },
          { label: 'Gaps', value: gaps.length, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
          { label: 'Misconceptions', value: misconceptions.length, color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} style={{ flex: 1, background: bg, border: `1.5px solid ${border}`, borderRadius: 9, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.3 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Main content row */}
      <div style={{ flex: 1, display: 'flex', gap: 10, minHeight: 0 }}>
        {feedback && (
          <div style={{ flex: 3, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              <div style={{ width: 3, height: 15, background: '#2563eb', borderRadius: 2 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Overall Assessment</span>
            </div>
            <div style={{ flex: 1, padding: '10px 14px', overflowY: 'auto' }}>
              <div style={{ fontSize: 32, color: '#dbeafe', lineHeight: 0.7, fontFamily: 'Georgia, serif', marginBottom: 6, userSelect: 'none' }}>"</div>
              <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.8, fontStyle: 'italic', margin: 0 }}>{feedback}</p>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 7, color: 'white', fontWeight: 800 }}>AI</span>
                </div>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>Generated by AI grading engine</span>
              </div>
            </div>
          </div>
        )}

        {(misconceptions.length > 0 || gaps.length > 0) && (
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            {misconceptions.length > 0 && (
              <div style={{ flex: 1, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <div style={{ width: 3, height: 15, background: '#ef4444', borderRadius: 2 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Misconceptions</span>
                  <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5', padding: '1px 6px', borderRadius: 8 }}>{misconceptions.length}</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {misconceptions.map((m: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 7, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '6px 9px' }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#991b1b', flexShrink: 0, minWidth: 14 }}>#{i + 1}</span>
                      <p style={{ fontSize: 11, color: '#7f1d1d', lineHeight: 1.5, margin: 0 }}>{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {gaps.length > 0 && (
              <div style={{ flex: 1, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <div style={{ width: 3, height: 15, background: '#f59e0b', borderRadius: 2 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Knowledge Gaps</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {gaps.map((s: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 7, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '6px 9px' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: '#0f172a', color: 'white', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        Q{s.question ?? i + 1}
                      </div>
                      <p style={{ fontSize: 11, color: '#78350f', lineHeight: 1.5, margin: 0 }}>{s.gaps}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Confirm Grade Tab ─────────────────────────────────────────────────────
const ConfirmGradeTab: React.FC<{
  result: any; submission: any;
  editedScore: number; setEditedScore: (v: number) => void;
  teacherFeedback: string; setTeacherFeedback: (v: string) => void;
  saving: boolean; isReleased: boolean; aiScore: number; total: number;
  onConfirm: () => void;
}> = ({ result, editedScore, setEditedScore, teacherFeedback, setTeacherFeedback, saving, isReleased, aiScore, total, onConfirm }) => {
  const pctEdit = total > 0 ? Math.round((editedScore / total) * 100) : 0;
  const pctAI   = total > 0 ? Math.round((aiScore / total) * 100) : 0;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Score row */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>AI Suggested</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#94a3b8', lineHeight: 1 }}>
            {Math.round(aiScore * 10) / 10}<span style={{ fontSize: 11, fontWeight: 500 }}> / {total}</span>
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{pctAI}%</div>
        </div>
        <div style={{ flex: 1, background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Awarded Score</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <input
              type="number" min={0} max={total} value={editedScore}
              onChange={e => setEditedScore(Math.min(total, Math.max(0, Number(e.target.value))))}
              disabled={isReleased}
              style={{ fontSize: 22, fontWeight: 800, color: '#2563eb', width: 60, border: 'none', background: 'transparent', padding: 0, lineHeight: 1, outline: 'none', fontFamily: 'inherit' }}
            />
            <span style={{ fontSize: 11, fontWeight: 500, color: '#93c5fd' }}>/ {total}</span>
          </div>
          <div style={{ fontSize: 10, color: '#2563eb', marginTop: 3, fontWeight: 600 }}>{pctEdit}%</div>
        </div>
        {editedScore !== aiScore && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: editedScore > aiScore ? '#ecfdf5' : '#fef2f2', border: `1.5px solid ${editedScore > aiScore ? '#a7f3d0' : '#fca5a5'}`, borderRadius: 10, padding: '10px 14px', gap: 1 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: editedScore > aiScore ? '#065f46' : '#991b1b' }}>
              {editedScore > aiScore ? '▲' : '▼'} {Math.abs(editedScore - aiScore)}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: editedScore > aiScore ? '#065f46' : '#991b1b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>pts adjusted</span>
          </div>
        )}
      </div>

      {/* Feedback textarea — grows to fill remaining space */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, flexShrink: 0 }}>Teacher Feedback</div>
        <textarea
          value={teacherFeedback}
          onChange={e => setTeacherFeedback(e.target.value)}
          disabled={isReleased}
          placeholder="Provide guidance to the student on their strengths, gaps, and how to improve…"
          style={{ flex: 1, width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#334155', lineHeight: 1.7, resize: 'none', background: '#fafbfc', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Release button */}
      <button
        onClick={onConfirm}
        disabled={saving || isReleased}
        style={{ flexShrink: 0, height: 40, background: isReleased ? '#10b981' : saving ? '#64748b' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: (saving || isReleased) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
      >
        {saving ? '● Releasing…' : isReleased ? '✓ Grade Released' : '↗ Confirm & Release Grade'}
      </button>

      {/* BKT notice */}
      <div style={{ flexShrink: 0, padding: '8px 12px', background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 8, fontSize: 11, color: '#4c1d95', lineHeight: 1.5 }}>
        <strong>BKT update:</strong> Releasing will update the student's Bayesian Knowledge Tracing model for <strong>{result.assessment?.name}</strong> and adjust mastery estimates across all linked knowledge components.
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const SubmissionReviewModal: React.FC<SubmissionReviewModalProps> = ({
  isOpen, onClose, submissionId, onReviewComplete,
  allSubmissionIds = [], onSwitchSubmission,
}) => {
  const [result, setResult]         = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [editedScore, setEditedScore]         = useState<number>(0);
  const [teacherFeedback, setTeacherFeedback] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'analysis' | 'profile' | 'content' | 'feedback' | 'grade'>('analysis');

  const currentIndex = allSubmissionIds.indexOf(submissionId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allSubmissionIds.length - 1;

  useEffect(() => {
    if (isOpen && submissionId) fetchData();
  }, [isOpen, submissionId]);

  // Reset tab when navigating to a different student so the teacher
  // always lands on the AI Analysis view rather than mid-way through
  // the previous student's Confirm Grade form.
  useEffect(() => {
    setActiveTab('analysis');
  }, [submissionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const currentResult = await assessmentService.getResultById(submissionId);
      setResult(currentResult);
      setEditedScore(currentResult.actualMark ?? currentResult.aiGradingSuggestion?.totalScore ?? 0);
      setTeacherFeedback(currentResult.teacherFeedback ?? '');
      if (currentResult.submission) {
        const subId = typeof currentResult.submission === 'object' ? currentResult.submission._id : currentResult.submission;
        const submissionData = await submissionService.getSubmissionReviewDetail(subId);
        setSubmission(submissionData);
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      toast.error('Failed to load grading details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmGrade = async () => {
    try {
      setSaving(true);
      const finalScores: Record<string, number> = {};
      if (submission?.answers) {
        submission.answers.forEach((ans: any) => {
          finalScores[ans.questionId._id] = editedScore / submission.answers.length;
        });
      }
      await assessmentService.confirmResult(result._id, { finalScores, teacherFeedback });
      toast.success('Grade released to student and BKT updated');
      onReviewComplete();
      onClose();
    } catch {
      toast.error('Failed to release grade');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchStudent = (dir: 'prev' | 'next') => {
    if (!onSwitchSubmission) return;
    const nextIndex = dir === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex >= 0 && nextIndex < allSubmissionIds.length) onSwitchSubmission(allSubmissionIds[nextIndex]);
  };

  if (!isOpen) return null;

  if (loading || !result) {
    return (
      <div style={{ height: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTop: '3px solid #2563eb', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Synchronizing AI Analysis…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const aiScore      = result.aiGradingSuggestion?.totalScore ?? 0;
  const total        = result.assessment?.totalPoints ?? 100;
  const isReleased   = result.status === 'Released';
  const cot          = Array.isArray(result.aiGradingSuggestion?.chainOfThought) ? result.aiGradingSuggestion.chainOfThought : [];
  const cogProfile   = result.cognitiveProfile ?? null;
  const profileCount = (cogProfile?.strengths?.length ?? 0) + (cogProfile?.deficiencies?.length ?? 0);
  const misconceptionsCount = result.aiGradingSuggestion?.misconceptionsFound?.length ?? 0;

  return (
    <div style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Top bar ── */}
      <div style={{ background: 'white', borderBottom: '1.5px solid #e2e8f0', padding: '0 20px', display: 'flex', alignItems: 'center', height: 40, flexShrink: 0 }}>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, marginRight: 14, padding: '5px 10px 5px 0', borderRight: '1.5px solid #e2e8f0' }}>
          <ArrowLeft size={13} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 10 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Grading</span>
          <span style={{ color: '#94a3b8', fontSize: 11 }}>/</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{result.assessment?.name}</span>
          <span style={{ color: '#94a3b8', fontSize: 11 }}>/</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{result.student?.firstName} {result.student?.lastName}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {result.submittedAt && <span style={{ fontSize: 10, color: '#94a3b8' }}>Submitted {fmtDate(result.submittedAt)} at {fmtTime(result.submittedAt)}</span>}
          <div style={{ width: 1, height: 16, background: '#e2e8f0' }} />
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: isReleased ? '#ecfdf5' : '#fffbeb', color: isReleased ? '#065f46' : '#92400e', border: `1.5px solid ${isReleased ? '#a7f3d0' : '#fcd34d'}` }}>
            {isReleased ? '● Released' : '● Pending Review'}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '248px 1fr', minHeight: 0, overflow: 'hidden' }}>

        {/* ── Left sidebar ── */}
        <div style={{ background: 'white', borderRight: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 14px', gap: 10 }}>

          {/* Student card */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', border: '1.5px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, color: '#2563eb' }}>
                {result.student?.firstName?.[0]}{result.student?.lastName?.[0]}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{result.student?.firstName} {result.student?.lastName}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', marginTop: 1 }}>{result.student?.id}</div>
              </div>
            </div>
          </div>

          {/* Student switcher */}
          {allSubmissionIds.length > 1 && onSwitchSubmission && (
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '5px 8px' }}>
              <button onClick={() => handleSwitchStudent('prev')} disabled={!hasPrev} style={{ width: 24, height: 24, borderRadius: 6, border: '1.5px solid #e2e8f0', background: hasPrev ? 'white' : '#f8fafc', color: hasPrev ? '#334155' : '#cbd5e1', cursor: hasPrev ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ChevronLeft size={12} />
              </button>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Student</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{currentIndex + 1} <span style={{ color: '#94a3b8', fontWeight: 400 }}>of {allSubmissionIds.length}</span></div>
              </div>
              <button onClick={() => handleSwitchStudent('next')} disabled={!hasNext} style={{ width: 24, height: 24, borderRadius: 6, border: '1.5px solid #e2e8f0', background: hasNext ? 'white' : '#f8fafc', color: hasNext ? '#334155' : '#cbd5e1', cursor: hasNext ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ChevronRight size={12} />
              </button>
            </div>
          )}

          <div style={{ height: 1, background: '#e2e8f0', flexShrink: 0 }} />

          {/* Score + Confidence — same row */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start', gap: 6, justifyContent: 'space-between' }}>
            <ScoreDonut score={Math.round(aiScore * 10) / 10} total={total} />
            <div style={{ width: 1, background: '#e2e8f0', alignSelf: 'stretch' }} />
            <ConfidenceArc value={result.aiGradingSuggestion?.confidenceScore ?? 0} />
          </div>

          <div style={{ height: 1, background: '#e2e8f0', flexShrink: 0 }} />

          {/* Per-question scores — scrollable if overflow */}
          {cot.length > 0 && (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, flexShrink: 0 }}>Per-question scores</div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {cot.map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', width: 20, flexShrink: 0 }}>Q{s.question ?? i + 1}</span>
                    <div style={{ flex: 1 }}><QuestionScoreBar score={s.score} max={s.maxScore ?? 0} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{ background: 'white', borderBottom: '1.5px solid #e2e8f0', padding: '0 16px', display: 'flex', alignItems: 'stretch', flexShrink: 0, overflowX: 'auto' }}>
            <Tab label="AI Analysis"      active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} count={cot.length || null} />
            <Tab label="Cognitive Profile" active={activeTab === 'profile'}  onClick={() => setActiveTab('profile')}  count={profileCount || null} />
            <Tab label="Raw Submission"   active={activeTab === 'content'}  onClick={() => setActiveTab('content')}  count={submission?.answers?.length ?? null} />
            <Tab label="AI Feedback"      active={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')} count={misconceptionsCount || null} />
            <Tab label="Confirm Grade"    active={activeTab === 'grade'}    onClick={() => setActiveTab('grade')} />
          </div>

          {/* Tab content — fixed height, no outer overflow, each tab manages its own scroll */}
          <div style={{ flex: 1, padding: '12px 14px', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'analysis' && <AIAnalysisTab result={result} cot={cot} />}
            {activeTab === 'profile'  && <CognitiveProfileTab profile={cogProfile} />}
            {activeTab === 'content'  && <RawSubmissionTab submission={submission} />}
            {activeTab === 'feedback' && <AIFeedbackTab result={result} />}
            {activeTab === 'grade'    && (
              <ConfirmGradeTab
                result={result} submission={submission}
                editedScore={editedScore} setEditedScore={setEditedScore}
                teacherFeedback={teacherFeedback} setTeacherFeedback={setTeacherFeedback}
                saving={saving} isReleased={isReleased}
                aiScore={aiScore} total={total}
                onConfirm={handleConfirmGrade}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionReviewModal;