import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { assessmentService, courseService } from '../services/api';
import { Assessment, Course } from '../types';

const BUCKETS = [
  { band: '0–39',   min: 0,  max: 39  },
  { band: '40–49',  min: 40, max: 49  },
  { band: '50–59',  min: 50, max: 59  },
  { band: '60–69',  min: 60, max: 69  },
  { band: '70–79',  min: 70, max: 79  },
  { band: '80–89',  min: 80, max: 89  },
  { band: '90–100', min: 90, max: 100 },
];

// ── Tiny SVG icon set ──────────────────────────────────────────────────────
function Icon({ name, size = 15 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    arrowLeft: <><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></>,
    trending:  <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    users:     <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    check:     <><polyline points="20 6 9 17 4 12"/></>,
    alert:     <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    target:    <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    lightbulb: <><path d="M9 21h6"/><path d="M12 3a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V17H9v-2.8C7.21 13.16 6 11.22 6 9a6 6 0 0 1 6-6z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

// ── Metric card ────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: string;
}) {
  return (
    <div style={{
      flex: 1, padding: '12px 14px', background: 'white',
      border: '1.5px solid #e2e8f0', borderRadius: 10,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: color + '1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, flexShrink: 0,
      }}>
        <Icon name={icon} size={16} />
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color, fontWeight: 600, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── SVG bar chart ──────────────────────────────────────────────────────────
function DistributionChart({ data, passRate }: { data: { band: string; count: number }[]; passRate: number }) {
  const W = 560, H = 180, PAD = { l: 36, r: 16, t: 16, b: 32 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const barW = innerW / data.length;
  const gap = barW * 0.22;

  const bandColor = (band: string) => {
    if (band.startsWith('0')) return '#fca5a5';
    if (band.startsWith('4')) return '#fdba74';
    if (band.startsWith('5')) return '#fcd34d';
    if (band.startsWith('6')) return '#86efac';
    if (band.startsWith('7')) return '#6ee7b7';
    if (band.startsWith('8')) return '#34d399';
    return '#10b981';
  };

  const yTicks = [0, Math.ceil(maxVal / 4), Math.ceil(maxVal / 2), Math.ceil((3 * maxVal) / 4), maxVal];
  const passX = PAD.l + 2 * barW; // after 40–49 band = 50% threshold

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', display: 'block' }}>
      {/* Grid lines */}
      {yTicks.map(t => {
        const y = PAD.t + innerH - (t / maxVal) * innerH;
        return (
          <g key={t}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={PAD.l - 6} y={y + 4} fontSize="9" fill="#94a3b8" textAnchor="end">{t}</text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const x = PAD.l + i * barW + gap / 2;
        const bw = barW - gap;
        const bh = maxVal > 0 ? (d.count / maxVal) * innerH : 0;
        const y = PAD.t + innerH - bh;
        return (
          <g key={d.band}>
            <rect x={x} y={y} width={bw} height={bh} rx="4" fill={bandColor(d.band)} />
            {d.count > 0 && (
              <text x={x + bw / 2} y={y - 4} fontSize="9" fontWeight="700" fill="#475569" textAnchor="middle">
                {d.count}
              </text>
            )}
            <text x={x + bw / 2} y={H - 6} fontSize="9" fill="#94a3b8" textAnchor="middle">{d.band}</text>
          </g>
        );
      })}

      {/* Pass threshold line */}
      <g>
        <line x1={passX} y1={PAD.t} x2={passX} y2={PAD.t + innerH} stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={passX + 4} y={PAD.t + 11} fontSize="9" fill="#2563eb" fontWeight="700">Pass threshold</text>
      </g>
    </svg>
  );
}

// ── Insight bullet ────────────────────────────────────────────────────────
function InsightBullet({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, marginTop: 5, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

// ── Action item ───────────────────────────────────────────────────────────
function ActionItem({ text, index }: { text: string; index: number }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div style={{
        width: 16, height: 16, borderRadius: 4,
        background: '#eff6ff', border: '1.5px solid #bfdbfe',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
      }}>
        <span style={{ fontSize: 8, fontWeight: 800, color: '#2563eb' }}>{index + 1}</span>
      </div>
      <span style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
const AssessmentAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryAssessmentId = useMemo(
    () => new URLSearchParams(location.search).get('assessmentId') ?? '',
    [location.search],
  );

  const [courses, setCourses]                           = useState<Course[]>([]);
  const [assessments, setAssessments]                   = useState<Assessment[]>([]);
  const [selectedCourseId, setSelectedCourseId]         = useState('all');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(queryAssessmentId);
  const [loading, setLoading]                           = useState(true);
  const [results, setResults]                           = useState<Array<{ actualMark?: number; totalPoints?: number }>>([]);
  const [metrics, setMetrics]                           = useState({
    attempted: 0, passed: 0, failed: 0,
    averageScore: 0, passRate: 0, highest: 0, lowest: 0,
  });

  // Load courses
  useEffect(() => {
    courseService.getTeachingCourses()
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]));
  }, []);

  // Load assessments when course changes
  useEffect(() => {
    setLoading(true);
    assessmentService.getAssessmentsByCourseId(selectedCourseId)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setAssessments(list);
        if (queryAssessmentId) {
          setSelectedAssessmentId(queryAssessmentId);
        } else if (list.length > 0) {
          setSelectedAssessmentId((list[0] as any)._id);
        }
      })
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false));
  }, [selectedCourseId, queryAssessmentId]);

  // Load results when assessment changes
  useEffect(() => {
    if (!selectedAssessmentId) return;
    setLoading(true);
    assessmentService.getResults(selectedAssessmentId)
      .then((data: any[]) => {
        const list = Array.isArray(data) ? data : [];
        const selectedA = assessments.find((a) => (a as any)._id === selectedAssessmentId) as any;
        const totalPts = Number(selectedA?.totalPoints ?? 100);
        const enriched = list.map((r) => ({ actualMark: r.actualMark ?? 0, totalPoints: totalPts }));
        setResults(enriched);

        const attempted = enriched.length;
        if (attempted === 0) {
          setMetrics({ attempted: 0, passed: 0, failed: 0, averageScore: 0, passRate: 0, highest: 0, lowest: 0 });
          return;
        }
        const pcts = enriched.map(r => totalPts > 0 ? ((r.actualMark ?? 0) / totalPts) * 100 : 0);
        const passed  = pcts.filter(p => p >= 50).length;
        const failed  = attempted - passed;
        const avg     = pcts.reduce((a, b) => a + b, 0) / attempted;
        setMetrics({
          attempted, passed, failed,
          averageScore: avg,
          passRate: Math.round((passed / attempted) * 100),
          highest: Math.max(...pcts),
          lowest:  Math.min(...pcts),
        });
      })
      .catch(() => {
        setResults([]);
        setMetrics({ attempted: 0, passed: 0, failed: 0, averageScore: 0, passRate: 0, highest: 0, lowest: 0 });
      })
      .finally(() => setLoading(false));
  }, [selectedAssessmentId, assessments]);

  const marksDistribution = useMemo(() =>
    BUCKETS.map(({ band, min, max }) => {
      const count = results.filter(({ actualMark, totalPoints }) => {
        const pct = totalPoints && totalPoints > 0
          ? ((actualMark ?? 0) / totalPoints) * 100
          : (actualMark ?? 0);
        const clamped = Math.max(0, Math.min(100, pct));
        return clamped >= min && clamped <= max;
      }).length;
      return { band, count };
    }),
  [results]);

  const selectedAssessment = useMemo(
    () => assessments.find((a) => (a as any)._id === selectedAssessmentId) as any ?? null,
    [assessments, selectedAssessmentId],
  );

  // Derived colours
  const passColor = metrics.passRate >= 75 ? '#10b981' : metrics.passRate >= 50 ? '#f59e0b' : '#ef4444';
  const avgColor  = metrics.averageScore >= 70 ? '#10b981' : metrics.averageScore >= 50 ? '#f59e0b' : '#ef4444';

  // Insights
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (metrics.passRate >= 75) strengths.push('Strong pass rate — solid class-wide understanding.');
  if (metrics.averageScore >= 70) strengths.push('Average score above 70% — good topic mastery.');
  if (metrics.highest >= 90) strengths.push(`Top performer hit ${Math.round(metrics.highest)}% — excellent ceiling.`);
  if (marksDistribution[5]?.count + marksDistribution[6]?.count > metrics.attempted * 0.4)
    strengths.push('More than 40% of students scored in the 80–100 range.');
  if (!strengths.length) strengths.push('No significant strengths detected — continue monitoring.');

  if (metrics.passRate < 50) weaknesses.push('Pass rate below 50% — significant knowledge gaps detected.');
  if (metrics.averageScore < 50) weaknesses.push('Class average below the pass threshold.');
  if (metrics.failed > 0) weaknesses.push(`${metrics.failed} student${metrics.failed > 1 ? 's' : ''} failed — targeted remediation needed.`);
  if (metrics.lowest < 40 && metrics.attempted > 0) weaknesses.push(`Lowest score is ${Math.round(metrics.lowest)}% — at-risk students identified.`);
  if (marksDistribution[0]?.count > 2) weaknesses.push(`${marksDistribution[0].count} students scored below 40%.`);
  if (!weaknesses.length) weaknesses.push('No major weaknesses identified. Review for topic-level gaps.');

  const actions: string[] = [
    metrics.failed > 0 ? `Schedule targeted remediation for ${metrics.failed} student${metrics.failed > 1 ? 's' : ''} below 50%.` : '',
    metrics.averageScore < 65 ? 'Consider a class-wide revision session on weaker concepts.' : '',
    metrics.passRate >= 75 ? 'Celebrate success and introduce stretch tasks for high performers.' : '',
    'Provide individual written feedback to borderline passes.',
    'Identify common errors in failed questions and address in next lesson.',
  ].filter(Boolean) as string[];

  // Type pill colour
  const typeColors: Record<string, { bg: string; text: string }> = {
    test:     { bg: '#ede9fe', text: '#6d28d9' },
    exam:     { bg: '#fee2e2', text: '#991b1b' },
    exercise: { bg: '#dbeafe', text: '#1e40af' },
    homework: { bg: '#fef9c3', text: '#78350f' },
    'd-plan': { bg: '#dcfce7', text: '#166534' },
  };
  const tc = typeColors[(selectedAssessment?.type ?? '').toLowerCase()] ?? { bg: '#f1f5f9', text: '#475569' };

  return (
    <div style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', padding: '12px 16px', overflow: 'hidden', gap: 8 }}>

      {/* ── Toolbar ── */}
      <div style={{
        flexShrink: 0, background: 'white', border: '1.5px solid #e2e8f0',
        borderRadius: 10, padding: '8px 12px',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        {/* Back */}
        <button
          onClick={() => navigate('/teacher/assessments')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0',
            background: 'white', fontSize: 12, fontWeight: 500, color: '#334155',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Icon name="arrowLeft" size={13} /> Assessments
        </button>

        <div style={{ width: 1, height: 24, background: '#e2e8f0', flexShrink: 0 }} />

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>Course</span>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              style={{ border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 12, padding: '5px 8px', color: '#334155', background: 'white' }}
            >
              <option value="all">All courses</option>
              {courses.map((c) => <option key={(c as any)._id} value={(c as any)._id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>Assessment</span>
            <select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              style={{ border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 12, padding: '5px 8px', color: '#334155', background: 'white', minWidth: 200 }}
            >
              {assessments.length === 0 && <option value="">No assessments</option>}
              {assessments.map((a) => <option key={(a as any)._id} value={(a as any)._id}>{a.name}</option>)}
            </select>
          </div>
        </div>

        {/* Assessment meta pills */}
        {selectedAssessment && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: tc.bg, color: tc.text, textTransform: 'capitalize' }}>
              {selectedAssessment.type}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#ecfdf5', color: '#065f46', textTransform: 'capitalize' }}>
              {selectedAssessment.status}
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              / {(selectedAssessment as any).totalPoints ?? 100} pts
            </span>
          </div>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ height: i === 0 ? 72 : 200, borderRadius: 10, background: '#e2e8f0' }} />
          ))
        ) : (
          <>
            {/* ── Metric cards ── */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <MetricCard label="Attempted"    value={metrics.attempted}                    icon="users"    color="#6366f1" />
              <MetricCard label="Passed"       value={metrics.passed}                       icon="check"    color="#10b981" sub={`${metrics.passRate}% pass rate`} />
              <MetricCard label="Failed"       value={metrics.failed}                       icon="alert"    color="#ef4444" sub={metrics.failed > 0 ? 'Needs intervention' : 'None'} />
              <MetricCard label="Average score" value={`${metrics.averageScore.toFixed(1)}%`} icon="trending" color={avgColor} />
              <MetricCard label="Highest"      value={`${Math.round(metrics.highest)}%`}   icon="target"   color="#7c3aed" />
              <MetricCard label="Lowest"       value={`${Math.round(metrics.lowest)}%`}    icon="target"   color={metrics.lowest < 40 && metrics.attempted > 0 ? '#ef4444' : '#94a3b8'} />
            </div>

            {/* ── Chart + insights row ── */}
            <div style={{ display: 'flex', gap: 10, flex: 1, minHeight: 0 }}>

              {/* Bar chart card — 60% width */}
              <div style={{
                flex: 3, padding: '16px 18px',
                background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12,
                display: 'flex', flexDirection: 'column', minHeight: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Marks Distribution</h3>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      Score bands (%) · {metrics.attempted} students
                    </p>
                  </div>
                  {/* Pass rate donut */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Pass rate</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: passColor, lineHeight: 1 }}>{metrics.passRate}%</div>
                    </div>
                    <svg viewBox="0 0 40 40" width="44" height="44">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                      <circle cx="20" cy="20" r="16" fill="none" stroke={passColor} strokeWidth="5"
                        strokeDasharray={`${(metrics.passRate / 100) * 100.53} 100.53`}
                        strokeLinecap="round" transform="rotate(-90 20 20)" />
                    </svg>
                  </div>
                </div>

                <div style={{ flex: 1, minHeight: 0 }}>
                  {results.length > 0 ? (
                    <DistributionChart data={marksDistribution} passRate={metrics.passRate} />
                  ) : (
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#94a3b8', fontSize: 13,
                      border: '1.5px dashed #e2e8f0', borderRadius: 8,
                      minHeight: 120,
                    }}>
                      No results yet for this assessment.
                    </div>
                  )}
                </div>
              </div>

              {/* Right pane — 40% width, 2 rows */}
              <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>

                {/* Row 1: Strengths + Areas of concern side by side */}
                <div style={{ flex: 1, display: 'flex', gap: 10, minHeight: 0 }}>

                  {/* Strengths */}
                  <div style={{ flex: 1, padding: '14px 16px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                        <Icon name="check" size={13} />
                      </div>
                      <h3 style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Strengths</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {strengths.map((s, i) => <InsightBullet key={i} text={s} color="#10b981" />)}
                    </div>
                  </div>

                  {/* Areas of concern */}
                  <div style={{ flex: 1, padding: '14px 16px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                        <Icon name="alert" size={13} />
                      </div>
                      <h3 style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Areas of concern</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {weaknesses.map((w, i) => <InsightBullet key={i} text={w} color="#ef4444" />)}
                    </div>
                  </div>
                </div>

                {/* Row 2: Recommended actions */}
                <div style={{ flexShrink: 0, padding: '14px 16px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                      <Icon name="lightbulb" size={13} />
                    </div>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Recommended actions</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {actions.map((a, i) => <ActionItem key={i} text={a} index={i} />)}
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssessmentAnalysisPage;