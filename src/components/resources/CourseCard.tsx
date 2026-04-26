import React from 'react';
import { motion } from 'framer-motion';

// ── Inline SVG helper ─────────────────────────────────────────────────────────
const Ico: React.FC<{ d: string | string[]; size?: number; color?: string }> = ({ d, size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const I_FOLDER = ['M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'];
const I_UPLOAD = ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'];

interface CourseCardProps {
  course: {
    _id: string;
    name: string;
    code?: string;
    resourceCount: number;
    documents: number;
    images: number;
    videos: number;
    others: number;
  };
  onClick: () => void;
  onUploadClick: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick, onUploadClick }) => {
  const bars = [
    { label: 'Docs',  count: course.documents, color: '#2563eb' },
    { label: 'Imgs',  count: course.images,    color: '#7c3aed' },
    { label: 'Vids',  count: course.videos,    color: '#dc2626' },
    { label: 'Other', count: course.others,    color: '#94a3b8' },
  ];
  const max = Math.max(...bars.map(b => b.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      whileHover={{ borderColor: '#93c5fd', backgroundColor: '#f8fafc' }}
      style={{
        background: 'white',
        border: '1.5px solid #e2e8f0',
        borderRadius: 11,
        padding: '12px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
            {course.name}
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginTop: 2 }}>
            {course.code || '—'}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 8, background: '#eff6ff', flexShrink: 0,
        }}>
          <Ico d={I_FOLDER} size={13} color="#2563eb" />
        </div>
      </div>

      {/* File type mini-bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {bars.map(b => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8', width: 26, textAlign: 'right', textTransform: 'uppercase', flexShrink: 0 }}>
              {b.label}
            </span>
            <div style={{ flex: 1, height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${b.count / max * 100}%`,
                background: b.color,
                borderRadius: 99,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', width: 14, textAlign: 'left', flexShrink: 0 }}>
              {b.count}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#2563eb',
          background: '#eff6ff', border: '1px solid #bfdbfe',
          padding: '2px 8px', borderRadius: 20,
        }}>
          {course.resourceCount} files
        </span>
        <button
          onClick={e => { e.stopPropagation(); onUploadClick(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800,
            color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 6, padding: '3px 8px', textTransform: 'uppercase',
            letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.12s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e2e8f0'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; }}
        >
          <Ico d={I_UPLOAD} size={10} /> Upload
        </button>
      </div>
    </motion.div>
  );
};

export default CourseCard;