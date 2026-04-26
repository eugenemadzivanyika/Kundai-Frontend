import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Eye, CheckCircle } from 'lucide-react';
import { submissionService, assessmentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SubmissionReviewModal from './SubmissionReviewModal';
import { toast } from 'sonner';

interface GradingStats {
  totalSubmissions: number;
  autoGradedCount: number;
  teacherReviewedCount: number;
  averageScore: number;
  averageConfidence: number;
}

interface PendingResult {
  _id: string;
  student: {
    _id: string;
    id: string;
    firstName: string;
    lastName: string;
  };
  assessment: {
    _id: string;
    name: string;
    totalPoints: number;
    type: string;
  };
  submission: any;
  status: 'Submitted' | 'Pending AI Grading' | 'Pending Teacher Review' | 'Released';
  gradeType: 'MCQ Graded' | 'AI Suggested' | 'Manual' | 'Teacher Reviewed' | 'AI + MCQ Graded';
  aiGradingSuggestion: {
    totalScore: number;
    confidenceScore: number;
    overallFeedback: string;
  };
  actualMark?: number;
  submittedAt: string;
}

const GRADE_TYPE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  'AI Suggested':     { bg: '#f3e8ff', text: '#6d28d9', label: 'AI' },
  'AI + MCQ Graded':  { bg: '#ede9fe', text: '#5b21b6', label: 'AI + MCQ' },
  'MCQ Graded':       { bg: '#dbeafe', text: '#1e40af', label: 'MCQ' },
  'Teacher Reviewed': { bg: '#dcfce7', text: '#166534', label: 'Reviewed' },
  'Manual':           { bg: '#fef3c7', text: '#92400e', label: 'Manual' },
  'Standard':         { bg: '#f1f5f9', text: '#475569', label: 'Standard' },
};

const STATUS_BADGE: Record<string, { text: string; dot: string }> = {
  'Pending Teacher Review': { text: '#92400e', dot: '#f59e0b' },
  'Released':               { text: '#065f46', dot: '#10b981' },
  'Submitted':              { text: '#1e40af', dot: '#3b82f6' },
  'Pending AI Grading':     { text: '#6d28d9', dot: '#7c3aed' },
};

const ROW_BORDER_COLOR: Record<string, string> = {
  'Pending Teacher Review': '#f59e0b',
  'Released':               '#10b981',
  'Submitted':              '#93c5fd',
  'Pending AI Grading':     '#7c3aed',
};

const fmtDate = (v: string) =>
  new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const fmtTime = (v: string) =>
  new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ConfidenceRing: React.FC<{ value: number }> = ({ value }) => {
  const pct = Math.round(value * 100);
  const r = 14;
  const circumference = 2 * Math.PI * r;
  const stroke = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
  const dash = (pct / 100) * circumference;
  if (value === 0) return <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>;
  return (
    <svg width={36} height={36} viewBox="0 0 36 36">
      <circle cx="18" cy="18" r={r} fill="none" stroke="#f1f5f9" strokeWidth="4" />
      <circle
        cx="18" cy="18" r={r} fill="none" stroke={stroke} strokeWidth="4"
        strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
      <text x="18" y="22" textAnchor="middle" fontSize="9" fontWeight="700" fill={stroke}>
        {pct}%
      </text>
    </svg>
  );
};

const StatBar: React.FC<{ stats: GradingStats; pendingCount: number }> = ({ stats, pendingCount }) => {
  const items = [
    { label: 'In queue',        value: stats.totalSubmissions,              color: '#334155' },
    { label: 'Needs review',    value: pendingCount,                        color: '#f59e0b' },
    { label: 'Released',        value: stats.teacherReviewedCount,          color: '#10b981' },
    { label: 'MCQ auto-graded', value: stats.autoGradedCount,              color: '#6366f1' },
    { label: 'Avg score',       value: `${Math.round(stats.averageScore)}%`, color: stats.averageScore >= 60 ? '#10b981' : '#ef4444' },
    { label: 'AI trust',        value: `${stats.averageConfidence}%`,      color: stats.averageConfidence >= 75 ? '#7c3aed' : '#f59e0b' },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 0,
      background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10,
      padding: '10px 20px', flexShrink: 0, flexWrap: 'wrap',
    }}>
      {items.map((s, i) => (
        <React.Fragment key={s.label}>
          {i > 0 && <div style={{ width: 1, background: '#e2e8f0', margin: '0 16px', alignSelf: 'stretch' }} />}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 58 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, fontWeight: 500, whiteSpace: 'nowrap' }}>{s.label}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

const PAGE_SIZE = 8;

const GradingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<GradingStats | null>(null);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const { selectedCourse } = useAuth();

  useEffect(() => {
    fetchData();
  }, [selectedCourse, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const courseId = selectedCourse?.id || 'all';

      const [statsData, assessments] = await Promise.all([
        submissionService.getGradingStats(courseId),
        assessmentService.getAssessmentsByCourseId(courseId)
      ]);

      setStats(statsData);

      const assessmentIds = assessments.map((a: any) => a._id);

      if (assessmentIds.length > 0) {
        const resultsArrays = await Promise.all(
          assessmentIds.map((id: string) =>
            assessmentService.getResults(id, {
              status: filterStatus === 'all' ? undefined : filterStatus
            })
          )
        );

        const flattenedResults = resultsArrays.flat();

        const uniqueResults = Array.from(
          new Map(flattenedResults.map((item: any) => [item._id, item])).values()
        );

        if (uniqueResults.length > 0) {
          console.log("🚀 [Dashboard] Sample Result Assessment Details:", {
            name: (uniqueResults[0] as any).assessment?.name,
            totalPoints: (uniqueResults[0] as any).assessment?.totalPoints,
            rawAssessmentObj: (uniqueResults[0] as any).assessment
          });
        }

        const sortedResults = (uniqueResults as any[]).sort((a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );

        setPendingSubmissions(sortedResults as PendingResult[]);
      } else {
        setPendingSubmissions([]);
      }
    } catch (error) {
      console.error('Error fetching grading data:', error);
      toast.error('Failed to load grading queue');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmission = (resultId: string) => {
    console.log("🚀 [Dashboard] Opening Modal for Result ID:", resultId);
    setSelectedSubmission(resultId);
    setShowReviewModal(true);
  };

  const filteredSubmissions = useMemo(() => {
    return pendingSubmissions.filter(submission => {
      const studentName = `${submission.student?.firstName || ''} ${submission.student?.lastName || ''}`.toLowerCase();
      const assessmentName = (submission.assessment?.name || '').toLowerCase();
      const studentId = (submission.student?.id || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return searchQuery === '' || studentName.includes(query) || assessmentName.includes(query) || studentId.includes(query);
    });
  }, [pendingSubmissions, searchQuery]);

  const pendingCount = pendingSubmissions.filter(s => s.status === 'Pending Teacher Review').length;
  const totalPages = Math.ceil(filteredSubmissions.length / PAGE_SIZE);
  const paginatedSubmissions = filteredSubmissions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'Pending Teacher Review', label: `Needs review (${pendingCount})` },
    { key: 'Released', label: 'Released' },
    { key: 'Submitted', label: 'Submitted' },
  ];

  if (loading) {
    return (
      <div className="h-[calc(100vh-160px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (showReviewModal && selectedSubmission) {
  return (
    <SubmissionReviewModal
      isOpen={true}
      onClose={() => { setShowReviewModal(false); setSelectedSubmission(null); }}
      submissionId={selectedSubmission}
      onReviewComplete={fetchData}
    />
  );
}

  return (
    <div className="h-[calc(100vh-160px)]" style={{ display: 'flex', flexDirection: 'column', padding: '14px 18px', gap: 10, fontFamily: 'Inter, system-ui, sans-serif', background: '#f8fafc', overflow: 'hidden' }}>
      <style>{`
        @keyframes fadeInRow {
          from { opacity: 0; transform: translateY(3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .grading-row { animation: fadeInRow 0.15s ease; }
        .grading-row:hover { background: #f8fafc !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => navigate('/teacher/assessments')}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8,
            border: '1.5px solid #e2e8f0', background: 'white',
            cursor: 'pointer', color: '#475569', flexShrink: 0,
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#f1f5f9')}
          onMouseOut={e => (e.currentTarget.style.background = 'white')}
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Marking Dashboard</h2>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, marginTop: 1 }}>
            Mark & Review AI-assisted marking suggestions and release results to students
          </p>
        </div>
      </div>

      {/* Stat bar */}
      {stats && <StatBar stats={stats} pendingCount={pendingCount} />}

      {/* Toolbar */}
      <div style={{
        background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10,
        padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => { setFilterStatus(f.key); setPage(1); }}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                border: '1.5px solid', cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'inherit', transition: 'all 0.12s',
                ...(filterStatus === f.key
                  ? { background: '#2563eb', color: 'white', borderColor: '#2563eb' }
                  : { background: 'white', borderColor: '#e2e8f0', color: '#475569' }),
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <div style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
            <Search size={13} />
          </div>
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search student or assessment…"
            style={{
              border: '1.5px solid #e2e8f0', borderRadius: 8,
              padding: '6px 10px 6px 28px', fontSize: 12,
              color: '#334155', width: 230, outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.12s, box-shadow 0.12s',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
          <b style={{ color: '#334155' }}>{filteredSubmissions.length}</b> results
        </span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, minHeight: 0, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 860, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                {['Student', 'Assessment', 'Score', 'AI Confidence', 'Status', 'Submitted', 'Action'].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: '9px 14px', fontSize: 10, fontWeight: 700, color: '#94a3b8',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      textAlign: i === 6 ? 'center' : 'left', whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    No submissions match your filters.
                  </td>
                </tr>
              ) : paginatedSubmissions.map((result, index) => {
                const isReleased = result.status === 'Released';
                const score = isReleased ? result.actualMark : result.aiGradingSuggestion?.totalScore;
                const pct = score != null ? Math.round((score / result.assessment?.totalPoints) * 100) : null;
                const gt = GRADE_TYPE_STYLE[result.gradeType] ?? GRADE_TYPE_STYLE['Standard'];
                const sb = STATUS_BADGE[result.status] ?? STATUS_BADGE['Submitted'];
                const borderColor = ROW_BORDER_COLOR[result.status] ?? '#e2e8f0';

                return (
                  <tr
                    key={`${result._id}-${index}`}
                    className="grading-row"
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      borderLeft: `3px solid ${borderColor}`,
                      transition: 'background 0.1s',
                    }}
                  >
                    {/* Student */}
                    <td style={{ padding: '9px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                        {result.student?.firstName} {result.student?.lastName}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', marginTop: 1 }}>
                        {result.student?.id}
                      </div>
                    </td>

                    {/* Assessment */}
                    <td style={{ padding: '9px 14px', maxWidth: 210 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {result.assessment?.name}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                        background: gt.bg, color: gt.text, display: 'inline-block', marginTop: 3,
                      }}>
                        {gt.label}
                      </span>
                    </td>

                    {/* Score */}
                    <td style={{ padding: '9px 14px' }}>
                      {score != null ? (
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 800, color: (pct ?? 0) >= 60 ? '#065f46' : '#991b1b' }}>
                            {Math.round(score)}
                          </span>
                          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}> / {result.assessment?.totalPoints}</span>
                          {!isReleased && (
                            <div style={{ fontSize: 9, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1 }}>
                              AI suggestion
                            </div>
                          )}
                        </div>
                      ) : <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>}
                    </td>

                    {/* Confidence */}
                    <td style={{ padding: '9px 14px' }}>
                      <ConfidenceRing value={result.aiGradingSuggestion?.confidenceScore || 0} />
                    </td>

                    {/* Status */}
                    <td style={{ padding: '9px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: sb.dot, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: sb.text, whiteSpace: 'nowrap' }}>
                          {result.status}
                        </span>
                      </div>
                    </td>

                    {/* Submitted */}
                    <td style={{ padding: '9px 14px' }}>
                      <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{fmtDate(result.submittedAt)}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{fmtTime(result.submittedAt)}</div>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                      {isReleased ? (
                        <button
                          onClick={() => handleReviewSubmission(result._id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: '#f8fafc', color: '#475569',
                            border: '1.5px solid #e2e8f0', borderRadius: 7,
                            padding: '5px 12px', fontSize: 12, fontWeight: 500,
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s',
                          }}
                          onMouseOver={e => (e.currentTarget.style.background = '#f1f5f9')}
                          onMouseOut={e => (e.currentTarget.style.background = '#f8fafc')}
                        >
                          <Eye size={12} /> View
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReviewSubmission(result._id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: '#2563eb', color: 'white',
                            border: 'none', borderRadius: 7,
                            padding: '5px 12px', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s',
                          }}
                          onMouseOver={e => (e.currentTarget.style.background = '#1d4ed8')}
                          onMouseOut={e => (e.currentTarget.style.background = '#2563eb')}
                        >
                          <CheckCircle size={12} /> Grade
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ borderTop: '1px solid #e2e8f0', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              Showing{' '}
              <b style={{ color: '#334155' }}>
                {Math.min((page - 1) * PAGE_SIZE + 1, filteredSubmissions.length)}–{Math.min(page * PAGE_SIZE, filteredSubmissions.length)}
              </b>
              {' '}of{' '}
              <b style={{ color: '#334155' }}>{filteredSubmissions.length}</b>
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  background: 'white', border: '1.5px solid #e2e8f0', color: '#334155',
                  cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1,
                  fontFamily: 'inherit', transition: 'all 0.12s',
                }}
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: `1.5px solid ${page === p ? '#2563eb' : '#e2e8f0'}`,
                    background: page === p ? '#eff6ff' : 'white',
                    color: page === p ? '#2563eb' : '#475569',
                    fontSize: 12, fontWeight: page === p ? 700 : 400,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s',
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  background: 'white', border: '1.5px solid #e2e8f0', color: '#334155',
                  cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1,
                  fontFamily: 'inherit', transition: 'all 0.12s',
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {showReviewModal && selectedSubmission && (
        <SubmissionReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedSubmission(null);
          }}
          submissionId={selectedSubmission}
          onReviewComplete={fetchData}
        />
      )}
    </div>
  );
};

export default GradingDashboard;
