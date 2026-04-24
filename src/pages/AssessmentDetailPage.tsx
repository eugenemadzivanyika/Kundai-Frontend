import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Edit2, FileText, List, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { assessmentService, courseService, submissionService } from '../services/api';
import { Assessment } from '../types';
import TablePagination from '../components/ui/TablePagination';
import { useClientPagination } from '../hooks/useClientPagination';

type DetailTab = 'questions' | 'submissions' | 'scheme';

interface ResultRecord {
  _id: string;
  student: { _id: string; firstName?: string; lastName?: string } | string;
  actualMark?: number;
  percentage?: number;
  status: string;
  gradeType?: string;
  teacherFeedback?: string;
  aiGradingSuggestion?: { totalScore?: number; overallFeedback?: string; confidenceScore?: number };
  submittedAt?: string;
}

const TYPE_META: Record<string, { label: string; bg: string; color: string }> = {
  multiple_choice: { label: 'Multiple choice', bg: '#ede9fe', color: '#6d28d9' },
  true_false:      { label: 'True / False',    bg: '#fef3c7', color: '#92400e' },
  short_answer:    { label: 'Short answer',    bg: '#dcfce7', color: '#166534' },
  essay:           { label: 'Essay',           bg: '#fce7f3', color: '#9d174d' },
};

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  published: { bg: '#ecfdf5', color: '#065f46' },
  draft:     { bg: '#fffbeb', color: '#78350f' },
  archived:  { bg: '#f1f5f9', color: '#475569' },
};

const GRADE_TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  'AI Suggested':    { bg: '#f3e8ff', color: '#6d28d9' },
  'AI + MCQ Graded': { bg: '#ede9fe', color: '#5b21b6' },
  'MCQ Graded':      { bg: '#dbeafe', color: '#1e40af' },
  'Teacher Reviewed':{ bg: '#dcfce7', color: '#166534' },
};

const fmtDate = (v?: string | null) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtDT = (v?: string | null) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const studentName = (s: ResultRecord['student']) => {
  if (!s) return 'Unknown';
  if (typeof s === 'string') return s;
  return `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || s._id;
};

const AssessmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tab, setTab]               = useState<DetailTab>('questions');
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [results, setResults]       = useState<ResultRecord[]>([]);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(true);

  const [selectedResultId, setSelectedResultId] = useState('');
  const [editMark, setEditMark]         = useState(0);
  const [editFeedback, setEditFeedback] = useState('');
  const [saving, setSaving]             = useState(false);

  const [submissionDetail, setSubmissionDetail] = useState<any>(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);

  const { paginatedItems: paginatedResults, currentPage, pageSize, totalPages, totalItems, rangeStart, rangeEnd, setCurrentPage, setPageSize } =
    useClientPagination(results, { initialPageSize: 10, resetKey: `${id}|${results.length}` });

  const selectedResult = useMemo(
    () => results.find((r) => r._id === selectedResultId) ?? results[0] ?? null,
    [results, selectedResultId],
  );

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      assessmentService.getAssessmentWithQuestions(id).catch(() => assessmentService.getAssessment(id)),
      assessmentService.getResults(id).catch(() => [] as any),
    ]).then(([a, r]) => {
      setAssessment(a);
      const normalized = Array.isArray(r) ? r : [];
      setResults(normalized);
      if (normalized.length > 0) setSelectedResultId((normalized[0] as any)._id);

      const courseId = (a as any).course?._id ?? (a as any).course ?? (a as any).courseId;
      if (courseId) {
        courseService.getCourseAttributes(courseId)
          .then((attrs) => {
            const map: Record<string, string> = {};
            attrs.forEach((attr) => { map[attr._id] = attr.name; });
            setAttributes(map);
          })
          .catch(() => {});
      }
    }).catch(() => {
      toast.error('Failed to load assessment.');
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!selectedResult) return;
    setEditMark(selectedResult.actualMark ?? selectedResult.aiGradingSuggestion?.totalScore ?? 0);
    setEditFeedback(selectedResult.teacherFeedback ?? selectedResult.aiGradingSuggestion?.overallFeedback ?? '');
  }, [selectedResult]);

  useEffect(() => {
    if (!selectedResult || !id) { setSubmissionDetail(null); return; }
    const sid = typeof selectedResult.student === 'string' ? selectedResult.student : selectedResult.student?._id;
    if (!sid) { setSubmissionDetail(null); return; }

    setSubmissionLoading(true);
    submissionService.getStudentHistory(sid)
      .then((subs: any[]) => {
        const match = (subs || [])
          .filter((s) => s.assessment === id || s.assessment?._id === id)
          .sort((a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime())[0];
        if (!match) { setSubmissionDetail(null); return; }
        return submissionService.getSubmissionReviewDetail(match._id ?? match.id);
      })
      .then((d) => setSubmissionDetail(d ?? null))
      .catch(() => setSubmissionDetail(null))
      .finally(() => setSubmissionLoading(false));
  }, [selectedResult, id]);

  const saveResult = async () => {
    if (!selectedResult) return;
    setSaving(true);
    try {
      await assessmentService.updateResult(selectedResult._id, {
        actualMark: editMark,
        teacherFeedback: editFeedback,
      });
      setResults((prev) => prev.map((r) =>
        r._id === selectedResult._id ? { ...r, actualMark: editMark, teacherFeedback: editFeedback } : r,
      ));
      toast.success('Feedback saved.');
    } catch {
      toast.error('Failed to save feedback.');
    } finally {
      setSaving(false);
    }
  };

  const questions: any[] = useMemo(() => {
    const raw = (assessment as any)?.questions;
    return Array.isArray(raw) ? raw : [];
  }, [assessment]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!assessment) {
    return <div className="flex-1 p-8 text-sm text-slate-500">Assessment not found.</div>;
  }

  const a = assessment as any;
  const sc = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.draft;
  const totalPoints = a.totalPoints ?? 0;
  const pct = selectedResult ? Math.round(((selectedResult.actualMark ?? 0) / (totalPoints || 1)) * 100) : 0;
  const scoreColor = pct >= 60 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';

  const tabs = [
    { key: 'questions' as DetailTab,    label: 'Questions',       icon: <List size={13} />,     count: questions.length },
    { key: 'submissions' as DetailTab,  label: 'Submissions',     icon: <Users size={13} />,    count: results.length },
    { key: 'scheme' as DetailTab,       label: 'Marking Scheme',  icon: <FileText size={13} />, count: null },
  ];

  return (
    <div
      className="flex flex-col overflow-hidden bg-slate-50"
      style={{ height: 'calc(100vh - 160px)', padding: '12px 16px', gap: 8 }}
    >
      {/* ── Header bar ── */}
      <div className="flex-shrink-0 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5 px-3.5 py-2">
        <button
          onClick={() => navigate('/teacher/assessments')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={13} /> Assessments
        </button>
        <div className="w-px h-5 bg-slate-200 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 truncate">{a.name}</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 capitalize"
              style={{ background: sc.bg, color: sc.color }}
            >
              {a.status}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {a.type}
            {totalPoints ? ` · ${totalPoints} pts` : ''}
            {a.dueDate ? ` · Due ${fmtDate(a.dueDate)}` : ''}
            {a.difficulty ? ` · ${a.difficulty}` : ''}
          </div>
        </div>
        <button
          onClick={() => navigate(`/teacher/assessments/${id}/edit`)}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Edit2 size={13} /> Edit
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex-shrink-0 flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer"
            style={{
              background:   tab === t.key ? 'white' : 'transparent',
              border:       `1.5px solid ${tab === t.key ? '#e2e8f0' : 'transparent'}`,
              color:        tab === t.key ? '#2563eb' : '#94a3b8',
              boxShadow:    tab === t.key ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            {t.icon}
            {t.label}
            {t.count != null && (
              <span
                className="text-[10px] font-bold px-1.5 py-px rounded-full"
                style={{
                  background: tab === t.key ? '#eff6ff' : '#f1f5f9',
                  color:      tab === t.key ? '#2563eb' : '#94a3b8',
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 min-h-0 flex flex-col">

        {/* ── Questions tab ── */}
        {tab === 'questions' && (
          <div className="flex-1 min-h-0 flex gap-2.5">

            {/* Left: question list */}
            <div
              className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden flex-shrink-0"
              style={{ width: 340 }}
            >
              <div className="px-3.5 py-2.5 border-b border-slate-100 flex-shrink-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Questions ({questions.length})
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {questions.length === 0 ? (
                  <p className="text-xs text-slate-400 p-2">No questions found.</p>
                ) : (
                  questions.map((q, i) => {
                    const tm = TYPE_META[q.type] ?? TYPE_META.short_answer;
                    return (
                      <div key={q._id ?? i} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400">Q{i + 1}</span>
                          <div className="flex gap-1">
                            <span
                              className="text-[10px] font-bold px-1.5 py-px rounded-full"
                              style={{ background: tm.bg, color: tm.color }}
                            >
                              {tm.label}
                            </span>
                            <span className="text-[10px] text-slate-400 px-1.5 py-px rounded-md bg-slate-100">
                              {q.maxPoints ?? 1}pt
                            </span>
                          </div>
                        </div>
                        <p className="text-[12px] font-medium text-slate-700 leading-relaxed mb-1.5">{q.text}</p>
                        {q.options?.length > 0 && (
                          <div className="space-y-0.5">
                            {q.options.map((opt: string, oi: number) => (
                              <div
                                key={oi}
                                className="text-[11px] px-2 py-0.5 rounded"
                                style={{
                                  background:  opt === q.correctAnswer ? '#ecfdf5' : 'transparent',
                                  color:       opt === q.correctAnswer ? '#065f46' : '#64748b',
                                  fontWeight:  opt === q.correctAnswer ? 600 : 400,
                                  border:      `1px solid ${opt === q.correctAnswer ? '#bbf7d0' : 'transparent'}`,
                                }}
                              >
                                {String.fromCharCode(65 + oi)}. {opt} {opt === q.correctAnswer && '✓'}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.correctAnswer && (!q.options || q.options.length === 0) && (
                          <div
                            className="text-[11px] px-2 py-1 rounded-md leading-relaxed"
                            style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #bbf7d0' }}
                          >
                            <span className="font-bold">Model: </span>{q.correctAnswer}
                          </div>
                        )}
                        {q.primaryAttributeId && (
                          <div
                            className="mt-1.5 inline-block text-[10px] font-semibold px-2 py-px rounded-full"
                            style={{ background: '#f3e8ff', color: '#7c3aed' }}
                          >
                            {attributes[q.primaryAttributeId] ?? q.primaryAttributeId}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: student grading panel */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
              {/* Student selector header */}
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5 flex-shrink-0">
                <Users size={14} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Student Review</span>
                {results.length > 0 && (
                  <select
                    value={selectedResult?._id ?? ''}
                    onChange={(e) => setSelectedResultId(e.target.value)}
                    className="ml-auto border border-slate-200 rounded-lg text-[12px] px-2 py-1 text-slate-700 bg-white focus:outline-none focus:border-blue-500"
                  >
                    {results.map((r) => (
                      <option key={r._id} value={r._id}>{studentName(r.student)}</option>
                    ))}
                  </select>
                )}
              </div>

              {!selectedResult ? (
                <div className="flex-1 flex items-center justify-center text-sm text-slate-400">No results yet.</div>
              ) : (
                <div className="flex-1 overflow-y-auto flex flex-col">

                  {/* Score strip */}
                  <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-4 flex-shrink-0">
                    <div
                      className="text-center rounded-xl px-4 py-2.5 flex-shrink-0"
                      style={{
                        background:   scoreColor + '18',
                        border:       `1.5px solid ${scoreColor}40`,
                      }}
                    >
                      <div className="text-[22px] font-extrabold leading-none" style={{ color: scoreColor }}>
                        {selectedResult.actualMark ?? '—'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">/ {totalPoints}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-1.5 flex-wrap mb-1.5">
                        {selectedResult.gradeType && (() => {
                          const gs = GRADE_TYPE_STYLE[selectedResult.gradeType] ?? { bg: '#f1f5f9', color: '#475569' };
                          return (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: gs.bg, color: gs.color }}
                            >
                              {selectedResult.gradeType}
                            </span>
                          );
                        })()}
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: selectedResult.status === 'Released' ? '#ecfdf5' : '#fffbeb',
                            color:      selectedResult.status === 'Released' ? '#065f46' : '#92400e',
                          }}
                        >
                          {selectedResult.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">Submitted {fmtDT(selectedResult.submittedAt)}</div>
                      {(selectedResult.aiGradingSuggestion?.confidenceScore ?? 0) > 0 && (
                        <div className="text-[11px] mt-0.5" style={{ color: '#7c3aed' }}>
                          AI confidence: <b>{Math.round((selectedResult.aiGradingSuggestion!.confidenceScore ?? 0) * 100)}%</b>
                          {selectedResult.aiGradingSuggestion?.totalScore != null && (
                            <> · suggested {selectedResult.aiGradingSuggestion.totalScore}pts</>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Per-question answers */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Answers</div>
                    {submissionLoading ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                        <Loader2 className="w-3 h-3 animate-spin" /> Loading answers…
                      </div>
                    ) : submissionDetail?.answers?.length > 0 ? (
                      <div className="space-y-1.5">
                        {questions.map((q, i) => {
                          const ans = submissionDetail.answers[i];
                          const studentAnswer = ans?.studentAnswer ?? '—';
                          const isCorrect = q.options?.length > 0 ? studentAnswer === q.correctAnswer : null;
                          return (
                            <div
                              key={q._id ?? i}
                              className="flex gap-2.5 items-start px-2.5 py-2 rounded-lg"
                              style={{
                                background: isCorrect === true ? '#f0fdf4' : isCorrect === false ? '#fef2f2' : '#f8fafc',
                                border:     `1px solid ${isCorrect === true ? '#bbf7d0' : isCorrect === false ? '#fecaca' : '#e2e8f0'}`,
                              }}
                            >
                              <span className="text-[10px] font-bold text-slate-400 min-w-[20px]">Q{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] text-slate-700 leading-relaxed">{studentAnswer}</div>
                                {isCorrect === false && (
                                  <div className="text-[10px] mt-1" style={{ color: '#065f46' }}>
                                    Correct: {q.correctAnswer}
                                  </div>
                                )}
                              </div>
                              {isCorrect !== null && (
                                <div
                                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]"
                                  style={{ background: isCorrect ? '#ecfdf5' : '#fef2f2' }}
                                >
                                  {isCorrect ? '✓' : '✗'}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 py-1">No submission record found.</p>
                    )}
                  </div>

                  {/* Grade & feedback */}
                  <div className="px-4 py-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Grade & Feedback</div>
                    <div className="flex gap-2.5 mb-2.5">
                      <div style={{ width: 96 }}>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">Mark</label>
                        <input
                          type="number"
                          value={editMark}
                          onChange={(e) => setEditMark(Number(e.target.value) || 0)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-bold text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">Teacher feedback</label>
                        <textarea
                          value={editFeedback}
                          onChange={(e) => setEditFeedback(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs leading-relaxed resize-y focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                          style={{ minHeight: 80 }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      {selectedResult.status !== 'Released' && (
                        <button
                          onClick={saveResult}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          Save draft
                        </button>
                      )}
                      <button
                        onClick={saveResult}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-55 transition-colors"
                      >
                        {saving
                          ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
                          : <><Check size={13} /> {selectedResult.status === 'Released' ? 'Update' : 'Approve & Release'}</>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Submissions tab ── */}
        {tab === 'submissions' && (
          <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                All submissions ({results.length})
              </span>
              <div className="flex gap-3 text-[11px] text-slate-400">
                <span><b className="text-emerald-600">{results.filter((r) => r.status === 'Released').length}</b> released</span>
                <span><b className="text-amber-500">{results.filter((r) => r.status === 'Pending Teacher Review').length}</b> pending</span>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-400">No results yet.</div>
            ) : (
              <>
                <div className="flex-1 overflow-auto">
                  <table className="w-full" style={{ minWidth: 700, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                        {['Student', 'Submitted', 'Mark', 'Status', 'Grade type', 'Feedback', ''].map((h, i) => (
                          <th
                            key={h || i}
                            className="px-3.5 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap"
                            style={{ textAlign: i >= 6 ? 'right' : 'left' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedResults.map((r) => {
                        const rPct = Math.round(((r.actualMark ?? 0) / (totalPoints || 1)) * 100);
                        const markColor = rPct >= 60 ? '#065f46' : rPct >= 40 ? '#92400e' : '#991b1b';
                        const gt = GRADE_TYPE_STYLE[r.gradeType ?? ''] ?? { bg: '#f1f5f9', color: '#475569' };
                        const sb = r.status === 'Released'
                          ? { dot: '#10b981', color: '#065f46' }
                          : r.status === 'Pending Teacher Review'
                            ? { dot: '#f59e0b', color: '#92400e' }
                            : { dot: '#6366f1', color: '#4338ca' };
                        return (
                          <tr key={r._id} className="hover:bg-slate-50/60 transition-colors" style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td className="px-3.5 py-2.5 text-[13px] font-semibold text-slate-900">{studentName(r.student)}</td>
                            <td className="px-3.5 py-2.5 text-[12px] text-slate-500">{fmtDT(r.submittedAt)}</td>
                            <td className="px-3.5 py-2.5">
                              <span className="text-[13px] font-bold" style={{ color: markColor }}>{r.actualMark ?? '—'}</span>
                              <span className="text-[11px] text-slate-400"> / {totalPoints}</span>
                            </td>
                            <td className="px-3.5 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sb.dot }} />
                                <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: sb.color }}>{r.status}</span>
                              </div>
                            </td>
                            <td className="px-3.5 py-2.5">
                              {r.gradeType && (
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: gt.bg, color: gt.color }}
                                >
                                  {r.gradeType}
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5" style={{ maxWidth: 200 }}>
                              <span className="text-[12px] text-slate-500 truncate block">{r.teacherFeedback || '—'}</span>
                            </td>
                            <td className="px-3.5 py-2.5 text-right">
                              <button
                                onClick={() => { setSelectedResultId(r._id); setTab('questions'); }}
                                className="text-[12px] font-semibold text-blue-600 hover:text-blue-700"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  currentPage={currentPage} pageSize={pageSize} totalItems={totalItems}
                  totalPages={totalPages} rangeStart={rangeStart} rangeEnd={rangeEnd}
                  onPageChange={setCurrentPage} onPageSizeChange={setPageSize}
                />
              </>
            )}
          </div>
        )}

        {/* ── Scheme tab ── */}
        {tab === 'scheme' && (
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2.5">

            {/* Overview stat cards */}
            <div className="flex gap-2 flex-shrink-0">
              {[
                { label: 'Questions',    value: questions.length,   color: '#6366f1' },
                { label: 'Total points', value: totalPoints || '—', color: '#2563eb' },
                { label: 'Difficulty',   value: a.difficulty ?? '—', color: '#f59e0b' },
                { label: 'Due date',     value: fmtDate(a.dueDate), color: '#334155' },
              ].map((s) => (
                <div key={s.label} className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5">
                  <div className="text-base font-extrabold leading-none" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-medium">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Question breakdown table */}
            {questions.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-400">No questions to display.</div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Question breakdown</span>
                </div>
                <div className="overflow-auto">
                  <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                        {['#', 'Question', 'Type', 'Points', 'Attribute', 'Answer key'].map((h) => (
                          <th
                            key={h}
                            className="px-3.5 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wide text-left whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((q, i) => {
                        const tm = TYPE_META[q.type] ?? TYPE_META.short_answer;
                        return (
                          <tr
                            key={q._id ?? i}
                            className="hover:bg-slate-50/60 transition-colors"
                            style={{ borderBottom: '1px solid #f1f5f9' }}
                          >
                            <td className="px-3.5 py-2.5 text-[12px] font-bold text-slate-400">{i + 1}</td>
                            <td className="px-3.5 py-2.5" style={{ maxWidth: 260 }}>
                              <div className="text-[12px] font-medium text-slate-700 leading-relaxed">{q.text}</div>
                              {q.tags?.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {q.tags.map((tag: string) => (
                                    <span key={tag} className="text-[10px] px-1.5 py-px rounded-full bg-slate-100 text-slate-500">{tag}</span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5">
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: tm.bg, color: tm.color }}
                              >
                                {tm.label}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-[13px] font-bold text-slate-700">{q.maxPoints ?? 1}</td>
                            <td className="px-3.5 py-2.5">
                              {q.primaryAttributeId ? (
                                <span
                                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ color: '#7c3aed', background: '#f3e8ff' }}
                                >
                                  {attributes[q.primaryAttributeId] ?? q.primaryAttributeId}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5" style={{ maxWidth: 220 }}>
                              {q.correctAnswer ? (
                                <div
                                  className="text-[11px] px-2 py-1 rounded-md leading-relaxed overflow-hidden text-ellipsis whitespace-nowrap"
                                  style={{ color: '#065f46', background: '#f0fdf4', border: '1px solid #bbf7d0' }}
                                >
                                  {q.correctAnswer}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentDetailPage;
