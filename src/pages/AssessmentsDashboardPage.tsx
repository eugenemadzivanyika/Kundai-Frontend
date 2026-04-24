import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Plus, Search, Filter } from 'lucide-react';
import { assessmentService, courseService } from '../services/api';
import { Course, Assessment } from '../types';
import TablePagination from '../components/ui/TablePagination';
import { useClientPagination } from '../hooks/useClientPagination';
import { AIAssessmentModal } from '../components/assessments/AIAssessmentModal';

// ── Type colour pills ──────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  test:     { bg: '#ede9fe', text: '#6d28d9' },
  exam:     { bg: '#fee2e2', text: '#991b1b' },
  exercise: { bg: '#dbeafe', text: '#1e40af' },
  homework: { bg: '#fef9c3', text: '#78350f' },
  'D-Plan': { bg: '#dcfce7', text: '#166534' },
  'd-plan': { bg: '#dcfce7', text: '#166534' },
};

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { dot: string; text: string; label: string }> = {
  published: { dot: '#10b981', text: '#065f46', label: 'Published' },
  draft:     { dot: '#f59e0b', text: '#78350f', label: 'Draft' },
  archived:  { dot: '#94a3b8', text: '#475569', label: 'Archived' },
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ── Performance summary cell ───────────────────────────────────────────────
function StatsSummary({ row }: { row: any }) {
  if (!row.submitted) {
    return <span className="text-xs italic text-slate-400">Not submitted yet</span>;
  }
  const passRate = Math.round(row.passRate ?? 0);
  const barColor = passRate >= 75 ? '#10b981' : passRate >= 50 ? '#f59e0b' : '#ef4444';
  const markingPct = row.submitted > 0 ? Math.round((row.marked / row.submitted) * 100) : 0;

  return (
    <div className="flex items-center gap-3.5">
      {/* Submitted */}
      <div className="text-center">
        <div className="text-[13px] font-bold text-slate-700 leading-none">{row.submitted}</div>
        <div className="text-[10px] text-slate-400 mt-0.5">submitted</div>
      </div>

      {/* Marking progress */}
      <div style={{ width: 56 }}>
        <div className="flex justify-between mb-0.5">
          <span className="text-[10px] text-slate-400">Marked</span>
          <span className="text-[10px] font-semibold text-slate-600">{markingPct}%</span>
        </div>
        <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${markingPct}%` }} />
        </div>
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-slate-200" />

      {/* Pass rate */}
      <div style={{ width: 72 }}>
        <div className="flex justify-between mb-0.5">
          <span className="text-[10px] text-slate-400">Pass rate</span>
          <span className="text-[10px] font-bold" style={{ color: barColor }}>{passRate}%</span>
        </div>
        <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${passRate}%`, background: barColor }} />
        </div>
      </div>

      {/* Avg score */}
      <div className="text-center">
        <div className="text-[13px] font-bold text-slate-700 leading-none">{(row.averageScore ?? 0).toFixed(1)}</div>
        <div className="text-[10px] text-slate-400 mt-0.5">avg score</div>
      </div>

      {/* Pass / fail pills */}
      <div className="flex gap-1">
        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#ecfdf5', color: '#065f46' }}>
          {row.passed ?? 0} ✓
        </span>
        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#fef2f2', color: '#991b1b' }}>
          {row.failed ?? 0} ✗
        </span>
      </div>
    </div>
  );
}

// ── Row actions (hover-reveal + kebab) ────────────────────────────────────
function RowActions({ row, onView, onEdit, onAnalysis }: {
  row: any;
  onView: () => void;
  onEdit: () => void;
  onAnalysis: () => void;
}) {
  const [kebabOpen, setKebabOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!kebabOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setKebabOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [kebabOpen]);

  const canMark = row.submitted > 0 && row.marked < row.submitted;

  return (
    <div ref={ref} className="row-actions flex items-center gap-1 justify-end">
      {/* Inline quick actions */}
      {[
        { label: 'View', onClick: onView, style: { color: '#475569' } },
        { label: 'Edit', onClick: onEdit, style: { color: '#475569' } },
        { label: 'Analysis', onClick: onAnalysis, style: { color: '#6366f1' } },
      ].map(({ label, onClick, style }) => (
        <button
          key={label}
          onClick={onClick}
          style={{
            padding: '4px 9px', borderRadius: 6,
            border: '1.5px solid #e2e8f0', background: 'white',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 4,
            transition: 'all 0.1s', ...style,
          }}
        >
          {label}
        </button>
      ))}

      {/* Mark button — highlighted when there are unmarked submissions */}
      {row.status === 'published' && (
        <button
          style={{
            padding: '4px 9px', borderRadius: 6,
            border: `1.5px solid ${canMark ? '#f59e0b' : '#e2e8f0'}`,
            background: canMark ? '#fffbeb' : 'white',
            fontSize: 11, fontWeight: 600,
            color: canMark ? '#92400e' : '#475569',
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.1s',
          }}
        >
          Mark{canMark ? ` (${row.submitted - row.marked})` : ''}
        </button>
      )}

      {/* Kebab overflow */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setKebabOpen(o => !o)}
          style={{
            width: 26, height: 26, borderRadius: 6,
            border: '1.5px solid #e2e8f0', background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#94a3b8', cursor: 'pointer',
          }}
        >
          ⋮
        </button>
        {kebabOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 50,
            background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10,
            padding: 4, minWidth: 150,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          }}>
            <button
              className="kebab-item"
              onClick={() => { onAnalysis(); setKebabOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 7, border: 'none', background: 'none', fontSize: 13, color: '#334155', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Grading dashboard
            </button>
            <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 7, border: 'none', background: 'none', fontSize: 13, color: '#ef4444', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Archive
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Compact stats bar ─────────────────────────────────────────────────────
function CompactStats({ rows }: { rows: any[] }) {
  const published = rows.filter(r => r.status === 'published').length;
  const drafts    = rows.filter(r => r.status === 'draft').length;
  const totalSub  = rows.reduce((s, r) => s + (r.submitted ?? 0), 0);
  const withSubs  = rows.filter(r => r.submitted > 0);
  const avgPass   = withSubs.length
    ? Math.round(withSubs.reduce((s, r) => s + (r.passRate ?? 0), 0) / withSubs.length)
    : 0;
  const passColor = avgPass >= 75 ? '#10b981' : avgPass >= 50 ? '#f59e0b' : '#ef4444';

  const stats = [
    { label: 'Total',       value: rows.length,  color: '#6366f1' },
    { label: 'Published',   value: published,     color: '#10b981' },
    { label: 'Drafts',      value: drafts,        color: '#f59e0b' },
    { label: 'Submissions', value: totalSub,      color: '#2563eb' },
    { label: 'Avg pass',    value: `${avgPass}%`, color: passColor },
  ];

  return (
    <div className="flex items-stretch gap-1.5">
      {stats.map((s, i) => (
        <React.Fragment key={s.label}>
          {i > 0 && <div className="w-px bg-slate-200 self-stretch" />}
          <div className="px-2.5 flex flex-col justify-center">
            <div className="text-[15px] font-bold leading-none" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium whitespace-nowrap">{s.label}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
const AssessmentsDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [courses, setCourses]               = useState<Course[]>([]);
  const [rows, setRows]                     = useState<any[]>([]);
  const [loading, setLoading]               = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [selectedType, setSelectedType]     = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const [error, setError]                   = useState<string | null>(null);
  const [modalOpen, setModalOpen]           = useState(false);

  useEffect(() => {
    courseService.getTeachingCourses()
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    assessmentService.getAssessmentsOverview({
      courseId: selectedCourseId !== 'all' ? selectedCourseId : undefined,
      status:   selectedStatus  !== 'all' ? selectedStatus   : undefined,
    })
      .then((data) => { if (active) setRows(data); })
      .catch(() => { if (active) { setRows([]); setError('Failed to load assessment overview.'); } })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [selectedCourseId, selectedStatus]);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (selectedType !== 'all') {
      result = result.filter((r) => (r.type || '').toLowerCase() === selectedType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((r) => (r.name || '').toLowerCase().includes(q));
    }
    return result;
  }, [rows, selectedType, searchQuery]);

  const {
    currentPage, pageSize, totalPages, totalItems,
    paginatedItems: paginatedRows, rangeStart, rangeEnd,
    setCurrentPage, setPageSize,
  } = useClientPagination(filteredRows, {
    initialPageSize: 10,
    resetKey: `${selectedCourseId}|${selectedType}|${selectedStatus}|${searchQuery}|${filteredRows.length}`,
  });

  const reloadRows = () => {
    setRows([]);
    setLoading(true);
    assessmentService.getAssessmentsOverview({
      courseId: selectedCourseId !== 'all' ? selectedCourseId : undefined,
      status:   selectedStatus  !== 'all' ? selectedStatus   : undefined,
    })
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <>
      {/* Scoped hover styles */}
      <style>{`
        .assess-row .row-actions { opacity: 0; transition: opacity 0.15s; pointer-events: none; }
        .assess-row:hover { background: #f8fafc; }
        .assess-row:hover .row-actions { opacity: 1; pointer-events: auto; }
        .assess-row .row-actions button:hover { background: #f1f5f9 !important; }
      `}</style>

      <div className="flex flex-col h-[calc(100vh-160px)] p-3 overflow-hidden gap-2">

        {/* ── Compact stats bar + action buttons ── */}
        <div className="shrink-0 flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
          <CompactStats rows={rows} />
          <div className="ml-auto flex gap-1.5">
            <button
              onClick={() => navigate('/grading')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5" /> Grading
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Assessment
            </button>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="shrink-0 flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
          {error && (
            <div className="w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {error}
            </div>
          )}

          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assessments…"
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
          </div>

          {/* Course */}
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          >
            <option value="all">All courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          {/* Type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          >
            <option value="all">All types</option>
            <option value="exercise">Exercise</option>
            <option value="test">Test</option>
            <option value="exam">Exam</option>
            <option value="homework">Homework</option>
            <option value="d-plan">D-Plan</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="h-3 w-3" />
            <span><strong className="text-slate-600">{filteredRows.length}</strong> assessments</span>
          </div>
        </div>

        {/* ── Table card ── */}
        <div className="flex flex-col flex-1 min-h-0 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">

          {/* Scrollable table */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 900 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                  {['Assessment', 'Type', 'Status', 'Course', 'Due date', 'Performance', ''].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '8px 16px',
                        fontSize: 11, fontWeight: 700,
                        color: '#94a3b8',
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                        textAlign: i >= 5 ? 'right' : 'left',
                        whiteSpace: 'nowrap',
                        position: 'sticky', top: 0, zIndex: 10,
                        background: '#f8fafc',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {[60, 40, 40, 50, 40, 80, 30].map((w, j) => (
                        <td key={j} style={{ padding: '13px 16px' }}>
                          <div className="animate-pulse" style={{ height: 12, borderRadius: 6, background: '#e2e8f0', width: `${w}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                      No assessments match your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => {
                    const sc = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.draft;
                    const tc = TYPE_COLORS[(row.type || '').toLowerCase()] ?? { bg: '#f1f5f9', text: '#475569' };
                    return (
                      <tr key={row._id} className="assess-row" style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}>
                        {/* Name */}
                        <td style={{ padding: '9px 16px', maxWidth: 220 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row.name}
                          </div>
                        </td>

                        {/* Type pill */}
                        <td style={{ padding: '9px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: tc.bg, color: tc.text, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                            {row.type || '—'}
                          </span>
                        </td>

                        {/* Status dot */}
                        <td style={{ padding: '9px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: sc.dot }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: sc.text }}>{sc.label}</span>
                          </div>
                        </td>

                        {/* Course chip */}
                        <td style={{ padding: '9px 16px' }}>
                          <span style={{ fontSize: 12, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                            {row.courseName ?? '—'}
                          </span>
                        </td>

                        {/* Due date */}
                        <td style={{ padding: '9px 16px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                          {formatDate(row.dueDate)}
                        </td>

                        {/* Performance summary */}
                        <td style={{ padding: '9px 16px', minWidth: 340 }}>
                          <StatsSummary row={row} />
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '9px 16px', textAlign: 'right', minWidth: 240 }}>
                          <RowActions
                            row={row}
                            onView={() => navigate(`/teacher/assessments/${row._id}`)}
                            onEdit={() => navigate(`/teacher/assessments/${row._id}/edit`)}
                            onAnalysis={() => navigate(`/teacher/assessments/analysis?assessmentId=${row._id}`)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="shrink-0 border-t border-slate-200">
            <TablePagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </div>

      <AIAssessmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        courseId={selectedCourseId !== 'all' ? selectedCourseId : ''}
        onAssessmentCreated={(_: Assessment) => {
          setModalOpen(false);
          reloadRows();
        }}
      />
    </>
  );
};

export default AssessmentsDashboardPage;