import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Course } from './ResourcesDashboard';

// ── Inline SVG helper ─────────────────────────────────────────────────────────
const Ico: React.FC<{ d: string | string[]; size?: number; color?: string }> = ({
  d, size = 14, color = 'currentColor',
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const I = {
  upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'],
  x:      ['M18 6L6 18', 'M6 6l12 12'],
  alert:  ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  doc:    ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
  img:    ['M21 15l-5-5L5 20', 'M3 3h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'],
  video:  ['M23 7l-7 5 7 5V7z', 'M1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z'],
  file:   ['M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z', 'M13 2v7h7'],
};

const typeIcon = (t: string) =>
  t === 'document' ? I.doc : t === 'image' ? I.img : t === 'video' ? I.video : I.file;

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SyllabusAttribute {
  id: string;
  topic: string;
  parentUnit: string;
  resources: number;
  linked: string[];
}

export interface LinkedFile {
  _id: string;
  name: string;
  type: 'document' | 'image' | 'video' | 'other';
  size: string;
  uploadedAt?: string;
  downloads?: number;
}

interface TopicGroup {
  parentUnit: string;
  attrs: SyllabusAttribute[];
  covered: number;  // attrs with resources >= 1
  total: number;
}

interface CoverageViewProps {
  courses: Course[];
  selCourseId: string;
  onCourseChange: (courseId: string) => void;
  syllabus: Record<string, SyllabusAttribute[]>;
  filesByCourse: Record<string, LinkedFile[]>;
  onUpload: (course: Course) => void;
}

// ── Color helpers ─────────────────────────────────────────────────────────────
type StatusKey = 'missing' | 'partial' | 'good';

const STATUS_META: Record<StatusKey, {
  bg: string; border: string; text: string;
  badge: string; badgeText: string; label: string;
}> = {
  missing: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', badge: '#fee2e2', badgeText: '#991b1b', label: 'Missing'  },
  partial: { bg: '#fffbeb', border: '#fcd34d', text: '#d97706', badge: '#fef3c7', badgeText: '#92400e', label: 'Partial'  },
  good:    { bg: '#f0fdf4', border: '#86efac', text: '#16a34a', badge: '#dcfce7', badgeText: '#15803d', label: 'Complete' },
};

const getTopicStatus = (covered: number, total: number): StatusKey =>
  covered === 0 ? 'missing' : covered < total ? 'partial' : 'good';

export const LEGEND_ITEMS: [string, string][] = [
  ['#dc2626', 'Missing'],
  ['#d97706', 'Partial'],
  ['#16a34a', 'Complete'],
];

const FILE_TYPE_META: Record<string, { color: string; bg: string; border: string }> = {
  document: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  image:    { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  video:    { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  other:    { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

// ── Component ─────────────────────────────────────────────────────────────────
const CoverageView: React.FC<CoverageViewProps> = ({
  courses, selCourseId, syllabus, filesByCourse, onUpload,
}) => {
  const [filter, setFilter]     = useState<'all' | StatusKey>('all');
  const [selGroup, setSelGroup] = useState<TopicGroup | null>(null);

  const course      = courses.find(c => c._id === selCourseId);
  const courseFiles = filesByCourse[selCourseId] || [];

  // Group attrs by parentUnit
  const groups = useMemo<TopicGroup[]>(() => {
    const attrs = syllabus[selCourseId] || [];
    const map: Record<string, SyllabusAttribute[]> = {};
    for (const attr of attrs) {
      const key = attr.parentUnit || 'Uncategorized';
      (map[key] ??= []).push(attr);
    }
    return Object.entries(map).map(([parentUnit, members]) => ({
      parentUnit,
      attrs: members,
      covered: members.filter(a => a.resources >= 1).length,
      total: members.length,
    }));
  }, [selCourseId, syllabus]);

  const nMissing = groups.filter(g => getTopicStatus(g.covered, g.total) === 'missing').length;
  const nPartial = groups.filter(g => getTopicStatus(g.covered, g.total) === 'partial').length;
  const nGood    = groups.filter(g => getTopicStatus(g.covered, g.total) === 'good').length;

  const filteredGroups = groups.filter(g => {
    if (filter === 'all') return true;
    return getTopicStatus(g.covered, g.total) === filter;
  });

  const FILTERS = [
    { key: 'all',     label: `All (${groups.length})`,   color: '#64748b' },
    { key: 'missing', label: `Missing (${nMissing})`,    color: '#dc2626' },
    { key: 'partial', label: `Partial (${nPartial})`,    color: '#d97706' },
    { key: 'good',    label: `Complete (${nGood})`,      color: '#16a34a' },
  ] as const;

  // All files linked to any attribute in the selected group
  const groupLinkedFileIds = selGroup
    ? new Set(selGroup.attrs.flatMap(a => a.linked))
    : new Set<string>();
  const groupLinkedFiles = courseFiles.filter(f => groupLinkedFileIds.has(f._id));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        .cv-scrollbar::-webkit-scrollbar { width: 4px; }
        .cv-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .cv-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        .cv-card:hover { opacity: 0.92; }
      `}</style>

      {/* ── Filter bar ── */}
      <div style={{ padding: '7px 14px', borderBottom: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', gap: 6, flexShrink: 0 }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key as typeof filter); setSelGroup(null); }}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: filter === f.key ? f.color : 'white',
              color: filter === f.key ? 'white' : '#64748b',
              border: `1.5px solid ${filter === f.key ? f.color : '#e2e8f0'}`,
              cursor: 'pointer', transition: 'all 0.12s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Main: topic grid + detail panel ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Topic group grid */}
        <div className="cv-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {filteredGroups.map(group => {
              const status = getTopicStatus(group.covered, group.total);
              const m = STATUS_META[status];
              const isSelected = selGroup?.parentUnit === group.parentUnit;
              const pct = group.total > 0 ? (group.covered / group.total) * 100 : 0;
              return (
                <motion.div
                  key={group.parentUnit}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="cv-card"
                  onClick={() => setSelGroup(isSelected ? null : group)}
                  style={{
                    background: m.bg,
                    border: `1.5px solid ${isSelected ? m.text : m.border}`,
                    borderRadius: 10,
                    padding: '11px 13px',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                    boxShadow: isSelected ? `0 0 0 2px ${m.text}22` : 'none',
                  }}
                >
                  {/* Status badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, color: m.badgeText,
                      background: m.badge, border: `1px solid ${m.border}`,
                      padding: '2px 7px', borderRadius: 20,
                    }}>{m.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: m.text }}>
                      {group.covered}/{group.total}
                    </span>
                  </div>

                  {/* Topic name */}
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8, lineHeight: 1.3 }}>
                    {group.parentUnit}
                  </div>

                  {/* Coverage progress bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: m.text, borderRadius: 99, transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, color: m.text, whiteSpace: 'nowrap' }}>
                      {Math.round(pct)}%
                    </span>
                  </div>

                  {/* Attribute count hint */}
                  <div style={{ marginTop: 5, fontSize: 9, color: '#94a3b8', fontWeight: 500 }}>
                    {group.total} attribute{group.total !== 1 ? 's' : ''}
                    {group.covered > 0 && group.covered < group.total
                      ? ` · ${group.total - group.covered} need resources`
                      : group.covered === 0 ? ' · none covered yet' : ' · fully covered'}
                  </div>
                </motion.div>
              );
            })}
            {filteredGroups.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
                No topics match this filter.
              </div>
            )}
          </div>
        </div>

        {/* ── Detail panel ── */}
        <AnimatePresence>
          {selGroup && (
            <motion.div
              key="detail"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ flexShrink: 0, borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white' }}
            >
              {/* Panel header */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{selGroup.parentUnit}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                    {selGroup.covered} of {selGroup.total} attributes covered
                  </div>
                </div>
                <button
                  onClick={() => setSelGroup(null)}
                  style={{ color: '#94a3b8', padding: 2, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                >
                  <Ico d={I.x} size={14} />
                </button>
              </div>

              {/* Panel body */}
              <div className="cv-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Attributes list */}
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Attributes
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {selGroup.attrs.map(attr => {
                      const s = attr.resources >= 1 ? 'good' : 'missing';
                      const am = STATUS_META[s];
                      return (
                        <div key={attr.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                          padding: '6px 9px', background: am.bg,
                          border: `1px solid ${am.border}`, borderRadius: 7,
                        }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {attr.topic}
                          </span>
                          <span style={{ fontSize: 9, fontWeight: 800, color: am.text, flexShrink: 0 }}>
                            {attr.resources === 0 ? 'None' : `${attr.resources} file${attr.resources !== 1 ? 's' : ''}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Linked files (union across all attrs in group) */}
                {groupLinkedFiles.length > 0 && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Linked Files
                    </div>
                    {groupLinkedFiles.map(f => {
                      const ft = FILE_TYPE_META[f.type] || FILE_TYPE_META.other;
                      return (
                        <div key={f._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 8, marginBottom: 4 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: ft.bg, border: `1px solid ${ft.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Ico d={typeIcon(f.type)} size={11} color={ft.color} />
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty state */}
                {selGroup.covered === 0 && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: 14, textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                      <Ico d={I.alert} size={20} color="#dc2626" />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', marginBottom: 3 }}>No resources yet</div>
                    <div style={{ fontSize: 10, color: '#ef4444', lineHeight: 1.5 }}>
                      None of the {selGroup.total} attributes in this topic have supporting material.
                    </div>
                  </div>
                )}

                {/* Coverage summary */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Topic Coverage</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 5, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${selGroup.total > 0 ? (selGroup.covered / selGroup.total) * 100 : 0}%`,
                        background: STATUS_META[getTopicStatus(selGroup.covered, selGroup.total)].text,
                        borderRadius: 99, transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: STATUS_META[getTopicStatus(selGroup.covered, selGroup.total)].text, flexShrink: 0 }}>
                      {selGroup.covered}/{selGroup.total}
                    </span>
                  </div>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>
                    {selGroup.covered === selGroup.total
                      ? 'All attributes covered — well resourced.'
                      : `${selGroup.total - selGroup.covered} attribute${selGroup.total - selGroup.covered !== 1 ? 's' : ''} still need at least 1 resource.`}
                  </div>
                </div>
              </div>

              {/* Upload CTA */}
              {course && (
                <div style={{ padding: '12px 14px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
                  <button
                    onClick={() => onUpload(course)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '9px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 9,
                      fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget).style.background = '#1d4ed8'; }}
                    onMouseLeave={e => { (e.currentTarget).style.background = '#2563eb'; }}
                  >
                    <Ico d={I.upload} size={12} color="white" />
                    Add resource for this topic
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CoverageView;
