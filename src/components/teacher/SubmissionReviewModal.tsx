import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { submissionService, assessmentService } from '../../services/api';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface SubmissionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  onReviewComplete: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// Confidence semicircle arc
const ConfidenceArc: React.FC<{ value: number }> = ({ value }) => {
  const pct = Math.round((value ?? 0) * 100);
  const cs = getConfidenceStyle(value ?? 0);
  const half = Math.PI * 40; // half-circumference of r=40 arc
  const fill = (pct / 100) * half;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={100} height={58} viewBox="0 0 100 58">
        <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth={10} strokeLinecap="round" />
        <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke={cs.stroke}
          strokeWidth={10} strokeLinecap="round"
          strokeDasharray={`${fill} ${half}`} />
        <text x="50" y="48" textAnchor="middle" fontSize="16" fontWeight="800" fill={cs.color}>{pct}%</text>
      </svg>
      <span style={{
        fontSize: 11, fontWeight: 700, color: cs.color,
        background: cs.bg, border: `1px solid ${cs.border}`,
        padding: '2px 10px', borderRadius: 20, marginTop: -2,
      }}>{cs.label} confidence</span>
    </div>
  );
};

// Score donut
const ScoreDonut: React.FC<{ score: number; total: number }> = ({ score, total }) => {
  const pct = total > 0 ? score / total : 0;
  const r = 42, stroke = 11;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = scoreColor(pct * 100);
  return (
    <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
      <svg width={110} height={110} viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 55 55)" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>/ {total}</span>
      </div>
    </div>
  );
};

// Question score bar
const QuestionScoreBar: React.FC<{ score: number; max: number }> = ({ score, max }) => {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const color = scoreColor(pct);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 44, textAlign: 'right' }}>{score}/{max}</span>
    </div>
  );
};

// Tab button
const Tab: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number | null;
}> = ({ label, active, onClick, count }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
    border: 'none', borderBottom: `2.5px solid ${active ? '#2563eb' : 'transparent'}`,
    background: 'none', color: active ? '#2563eb' : '#64748b',
    fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
    transition: 'all 0.12s', whiteSpace: 'nowrap',
  }}>
    {label}
    {count != null && (
      <span style={{
        fontSize: 10, fontWeight: 700,
        background: active ? '#dbeafe' : '#f1f5f9',
        color: active ? '#2563eb' : '#94a3b8',
        padding: '1px 6px', borderRadius: 10,
      }}>{count}</span>
    )}
  </button>
);

// CoT step card (collapsible)
const CoTStep: React.FC<{ step: any; index: number }> = ({ step, index }) => {
  const [expanded, setExpanded] = useState(true);
  const pct = step.maxScore > 0 ? (step.score / step.maxScore) * 100 : 0;
  const color = scoreColor(pct);
  const hasGap = step.gaps && step.gaps !== 'None' && step.gaps !== 'none';

  return (
    <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <button onClick={() => setExpanded(e => !e)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
        borderBottom: expanded ? '1.5px solid #f1f5f9' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0f172a', color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            Q{step.question ?? index + 1}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Question {step.question ?? index + 1}</div>
            <QuestionScoreBar score={step.score} max={step.maxScore ?? 0} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {hasGap && (
            <span style={{ fontSize: 11, fontWeight: 600, background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5', padding: '3px 9px', borderRadius: 20 }}>
              Gap detected
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${color}33`,
            background: color === '#10b981' ? '#ecfdf5' : color === '#f59e0b' ? '#fffbeb' : '#fef2f2', color }}>
            {step.score} / {step.maxScore ?? '?'} pts
          </span>
          <span style={{ color: '#94a3b8', fontSize: 18, lineHeight: 1 }}>{expanded ? '−' : '+'}</span>
        </div>
      </button>

      {expanded && (
        <div style={{ paddingBottom: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderBottom: '1.5px solid #f1f5f9' }}>
            <div style={{ padding: '16px 20px', borderRight: '1.5px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 4, height: 16, background: '#3b82f6', borderRadius: 2 }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Analysis</span>
              </div>
              <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.7, fontStyle: 'italic' }}>"{step.analysis}"</p>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 4, height: 16, background: '#8b5cf6', borderRadius: 2 }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Model Comparison</span>
              </div>
              <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.7 }}>{step.comparison}</p>
            </div>
          </div>
          <div style={{ padding: '14px 20px', background: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Evaluation</div>
            <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7 }}>{step.evaluation}</p>
            {hasGap && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 8, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0, marginTop: 1 }}>⚠ Gap</span>
                <p style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 1.6 }}>{step.gaps}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Cognitive Profile Tab
const CognitiveProfileTab: React.FC<{ profile: any }> = ({ profile }) => {
  if (!profile) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
      No cognitive profile available for this submission.
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Strengths */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Strengths · {profile.strengths?.length ?? 0}
            </span>
          </div>
          {(profile.strengths ?? []).map((s: any, i: number) => (
            <div key={i} style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '11px 14px' }}>
              <div style={{ marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#065f46' }}>
                  {s.attributeName || s.attributeId}
                </span>
                {s.attributeName && s.attributeName !== s.attributeId && (
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#6b7280', background: '#dcfce7', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: 4 }}>
                    {s.attributeId}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: '#14532d', lineHeight: 1.6 }}>{s.evidence}</p>
            </div>
          ))}
          {(!profile.strengths || profile.strengths.length === 0) && (
            <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No strengths identified.</p>
          )}
        </div>

        {/* Deficiencies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Deficiencies · {profile.deficiencies?.length ?? 0}
            </span>
          </div>
          {(profile.deficiencies ?? []).map((d: any, i: number) => (
            <div key={i} style={{ background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 10, padding: '11px 14px' }}>
              <div style={{ marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#991b1b' }}>
                    {d.attributeName || d.attributeId}
                  </span>
                  {d.attributeName && d.attributeName !== d.attributeId && (
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#6b7280', background: '#fee2e2', border: '1px solid #fecaca', padding: '1px 6px', borderRadius: 4 }}>
                      {d.attributeId}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#7f1d1d' }}>{d.misconception}</span>
              </div>
              <p style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 1.6 }}>{d.failedLogic}</p>
            </div>
          ))}
          {(!profile.deficiencies || profile.deficiencies.length === 0) && (
            <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No deficiencies identified.</p>
          )}
        </div>
      </div>

      {/* Tutor approach */}
      {profile.suggestedTutorApproach && (
        <div style={{ background: '#faf5ff', border: '1.5px solid #e9d5ff', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Suggested Tutor Approach
            </div>
            <p style={{ fontSize: 12, color: '#4c1d95', lineHeight: 1.7 }}>{profile.suggestedTutorApproach}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const SubmissionReviewModal: React.FC<SubmissionReviewModalProps> = ({
  isOpen,
  onClose,
  submissionId,
  onReviewComplete,
}) => {
  const [result, setResult]       = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  const [editedScore, setEditedScore]       = useState<number>(0);
  const [teacherFeedback, setTeacherFeedback] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'analysis' | 'profile' | 'content' | 'grade'>('analysis');

  useEffect(() => {
    if (isOpen && submissionId) fetchData();
  }, [isOpen, submissionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const currentResult = await assessmentService.getResultById(submissionId);
      setResult(currentResult);
      setEditedScore(currentResult.actualMark ?? currentResult.aiGradingSuggestion?.totalScore ?? 0);
      setTeacherFeedback(currentResult.teacherFeedback ?? '');

      if (currentResult.submission) {
        const subId = typeof currentResult.submission === 'object'
          ? currentResult.submission._id
          : currentResult.submission;
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

  // Guard: not open
  if (!isOpen) return null;

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading || !result) {
    return (
      <div style={{ height: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTop: '3px solid #2563eb', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Synchronizing AI Analysis…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const aiScore       = result.aiGradingSuggestion?.totalScore ?? 0;
  const total         = result.assessment?.totalPoints ?? 100;
  const pctEdit       = total > 0 ? Math.round((editedScore / total) * 100) : 0;
  const isReleased    = result.status === 'Released';
  const cot           = Array.isArray(result.aiGradingSuggestion?.chainOfThought)
    ? result.aiGradingSuggestion.chainOfThought : [];
  const cogProfile    = result.cognitiveProfile ?? null;
  const profileCount  = (cogProfile?.strengths?.length ?? 0) + (cogProfile?.deficiencies?.length ?? 0);

  return (
    <div style={{
      height: 'calc(100vh - 160px)',
      display: 'flex',
      flexDirection: 'column',
      background: '#f8fafc',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>

      {/* ── Top breadcrumb bar ── */}
      <div style={{
        background: 'white', borderBottom: '1.5px solid #e2e8f0',
        padding: '0 24px', display: 'flex', alignItems: 'center', height: 44, flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, color: '#64748b',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, marginRight: 16,
            padding: '6px 10px 6px 0', borderRight: '1.5px solid #e2e8f0',
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Grading</span>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{result.assessment?.name}</span>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
            {result.student?.firstName} {result.student?.lastName}
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {result.submittedAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94a3b8' }}>
              Submitted {fmtDate(result.submittedAt)} at {fmtTime(result.submittedAt)}
            </div>
          )}
          <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 4px' }} />
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: isReleased ? '#ecfdf5' : '#fffbeb',
            color: isReleased ? '#065f46' : '#92400e',
            border: `1.5px solid ${isReleased ? '#a7f3d0' : '#fcd34d'}`,
          }}>
            {isReleased ? '● Released' : '● Pending Review'}
          </span>
        </div>
      </div>

      {/* ── Body: sidebar + right panel ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 0, overflow: 'hidden' }}>

        {/* ── Left sidebar ── */}
        <div style={{
          background: 'white', borderRight: '1.5px solid #e2e8f0',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
          padding: '14px 16px', gap: 14,
        }}>

          {/* Student card */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', border: '1.5px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 800, color: '#2563eb' }}>
                {result.student?.firstName?.[0]}{result.student?.lastName?.[0]}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  {result.student?.firstName} {result.student?.lastName}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', marginTop: 1 }}>
                  {result.student?.id}
                </div>
              </div>
            </div>
            {result.student?.email && (
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{result.student.email}</div>
            )}
            <div style={{ fontSize: 12, fontWeight: 500, color: '#475569' }}>
              {result.assessment?.subject} {result.assessment?.subject && result.assessment?.type ? '·' : ''} {result.assessment?.type}
            </div>
          </div>

          <div style={{ height: 1, background: '#e2e8f0' }} />

          {/* Score donut */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <ScoreDonut score={Math.round(aiScore * 10) / 10} total={total} />
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>AI Suggested Score</div>
          </div>

          {/* Confidence arc */}
          <ConfidenceArc value={result.aiGradingSuggestion?.confidenceScore ?? 0} />

          <div style={{ height: 1, background: '#e2e8f0' }} />

          {/* Per-question breakdown */}
          {cot.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Per-question scores
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cot.map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', width: 22 }}>Q{s.question ?? i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <QuestionScoreBar score={s.score} max={s.maxScore ?? 0} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cot.length > 0 && <div style={{ height: 1, background: '#e2e8f0' }} />}

          {/* Misconceptions */}
          {(result.aiGradingSuggestion?.misconceptionsFound?.length ?? 0) > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Misconceptions detected
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {result.aiGradingSuggestion.misconceptionsFound.map((m: string, i: number) => (
                  <div key={i} style={{ fontSize: 11, color: '#991b1b', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, padding: '5px 9px', lineHeight: 1.4 }}>
                    {m}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(result.aiGradingSuggestion?.misconceptionsFound?.length ?? 0) > 0 && (
            <div style={{ height: 1, background: '#e2e8f0' }} />
          )}

          {/* Overall AI feedback */}
          {result.aiGradingSuggestion?.overallFeedback && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Overall AI feedback
              </div>
              <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.7, fontStyle: 'italic' }}>
                "{result.aiGradingSuggestion.overallFeedback}"
              </p>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

          {/* Tab bar */}
          <div style={{
            background: 'white', borderBottom: '1.5px solid #e2e8f0',
            padding: '0 24px', display: 'flex', alignItems: 'stretch', gap: 0, flexShrink: 0,
          }}>
            <Tab label="AI Analysis"      active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} count={cot.length || null} />
            <Tab label="Cognitive Profile" active={activeTab === 'profile'}  onClick={() => setActiveTab('profile')}  count={profileCount || null} />
            <Tab label="Raw Submission"   active={activeTab === 'content'}  onClick={() => setActiveTab('content')}  count={submission?.answers?.length ?? null} />
            <Tab label="Confirm Grade"    active={activeTab === 'grade'}    onClick={() => setActiveTab('grade')} />
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

            {/* ── AI Analysis tab ── */}
            {activeTab === 'analysis' && (
              <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{ background: '#0f172a', color: 'white', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700 }}>
                    Chain of Thought Reasoning
                  </div>
                  {cot.length > 0 && (
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{cot.length} question{cot.length !== 1 ? 's' : ''} analysed</span>
                  )}
                </div>
                {cot.length > 0 ? (
                  cot.map((step: any, i: number) => (
                    <CoTStep key={i} step={step} index={i} />
                  ))
                ) : (
                  // Fallback: non-array CoT (legacy plain text)
                  <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                      {result.aiGradingSuggestion?.chainOfThought || 'No AI analysis available for this submission.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Cognitive Profile tab ── */}
            {activeTab === 'profile' && (
              <CognitiveProfileTab profile={cogProfile} />
            )}

            {/* ── Raw Submission tab ── */}
            {activeTab === 'content' && (
              <div style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(submission?.answers ?? []).map((ans: any, i: number) => (
                  <div key={i} style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0f172a', color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          Q{i + 1}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Question {i + 1}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 20 }}>
                        Max {ans.questionId?.maxPoints ?? '?'} pts
                      </span>
                    </div>
                    <div style={{ padding: '14px 20px', borderBottom: '1.5px solid #f1f5f9', background: '#f8fafc' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Question</div>
                      <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.7, borderLeft: '3px solid #2563eb', paddingLeft: 12 }}>{ans.questionId?.text}</p>
                    </div>
                    <div style={{ padding: '14px 20px' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Student answer</div>
                      <div style={{ background: '#0f172a', borderRadius: 10, padding: '16px 18px', fontFamily: 'monospace', fontSize: 13, color: '#e2e8f0', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {ans.studentAnswer}
                      </div>
                    </div>
                  </div>
                ))}
                {!submission?.answers?.length && (
                  <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', padding: 20 }}>No submission content available.</p>
                )}
              </div>
            )}

            {/* ── Confirm Grade tab ── */}
            {activeTab === 'grade' && (
              <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Score input card */}
                <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '16px 22px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Finalize Marks</span>
                  </div>
                  <div style={{ padding: '20px 22px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                      {/* AI suggested */}
                      <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '16px 18px' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>AI Suggested</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#94a3b8', lineHeight: 1 }}>
                          {Math.round(aiScore * 10) / 10}
                          <span style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8' }}> / {total}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                          {total > 0 ? Math.round((aiScore / total) * 100) : 0}%
                        </div>
                      </div>
                      {/* Awarded score */}
                      <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 10, padding: '16px 18px' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Awarded Score</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="number" min={0} max={total} value={editedScore}
                            onChange={e => setEditedScore(Math.min(total, Math.max(0, Number(e.target.value))))}
                            disabled={isReleased}
                            style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', width: 80, border: 'none', background: 'transparent', padding: 0, lineHeight: 1, outline: 'none', fontFamily: 'inherit' }}
                          />
                          <span style={{ fontSize: 14, fontWeight: 500, color: '#93c5fd' }}>/ {total}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>{pctEdit}%</div>
                      </div>
                    </div>

                    {/* Delta indicator */}
                    {editedScore !== aiScore && (
                      <div style={{
                        marginBottom: 16, padding: '8px 14px',
                        background: editedScore > aiScore ? '#ecfdf5' : '#fef2f2',
                        border: `1px solid ${editedScore > aiScore ? '#a7f3d0' : '#fca5a5'}`,
                        borderRadius: 8, fontSize: 12, fontWeight: 600,
                        color: editedScore > aiScore ? '#065f46' : '#991b1b',
                      }}>
                        {editedScore > aiScore ? '▲' : '▼'} Score adjusted by {Math.abs(editedScore - aiScore)} pts from AI suggestion
                      </div>
                    )}

                    {/* Feedback */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Teacher Feedback</div>
                      <textarea
                        value={teacherFeedback}
                        onChange={e => setTeacherFeedback(e.target.value)}
                        disabled={isReleased}
                        placeholder="Provide guidance to the student on their strengths, gaps, and how to improve…"
                        rows={5}
                        style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#334155', lineHeight: 1.7, resize: 'vertical', background: '#fafbfc', fontFamily: 'inherit', outline: 'none' }}
                      />
                    </div>

                    <button
                      onClick={handleConfirmGrade}
                      disabled={saving || isReleased}
                      style={{
                        width: '100%', height: 48,
                        background: isReleased ? '#10b981' : saving ? '#64748b' : '#2563eb',
                        color: 'white', border: 'none', borderRadius: 10,
                        fontSize: 14, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all 0.15s', cursor: (saving || isReleased) ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {saving ? '● Releasing…' : isReleased ? '✓ Grade Released' : '↗ Confirm & Release Grade'}
                    </button>
                  </div>
                </div>

                {/* BKT notice */}
                <div style={{ padding: '12px 16px', background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 10, fontSize: 12, color: '#4c1d95', lineHeight: 1.6 }}>
                  <strong>BKT update:</strong> Releasing this grade will update the student's Bayesian Knowledge Tracing model for{' '}
                  <strong>{result.assessment?.name}</strong> and adjust their mastery estimate across all linked knowledge components.
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionReviewModal;