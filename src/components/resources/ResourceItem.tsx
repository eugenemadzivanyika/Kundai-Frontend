import React from 'react';
import { format } from 'date-fns';
import type { Resource } from './ResourcesView';

// ── Inline SVG helper ─────────────────────────────────────────────────────────
const Ico: React.FC<{ d: string | string[]; size?: number; color?: string }> = ({ d, size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const I = {
  doc:      ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
  img:      ['M21 15l-5-5L5 20','M3 3h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z','M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'],
  video:    ['M23 7l-7 5 7 5V7z','M1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z'],
  file:     ['M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z','M13 2v7h7'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  more:     ['M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z','M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z','M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
};

const TYPE_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  document: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'DOC' },
  image:    { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', label: 'IMG' },
  video:    { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'VID' },
  other:    { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', label: 'FILE' },
};
const typeMeta = (t: string) => TYPE_META[t] || TYPE_META.other;
const typeIcon = (t: string) => t === 'document' ? I.doc : t === 'image' ? I.img : t === 'video' ? I.video : I.file;

interface ResourceItemProps {
  resource: Omit<Resource, 'uploadedBy'> & {
    uploadedBy: string | { _id: string; firstName: string; lastName: string };
  };
  viewMode: 'grid' | 'list';
  onClick: (resource: Resource) => void;
}

const ResourceItem: React.FC<ResourceItemProps> = ({ resource, viewMode, onClick }) => {
  const m = typeMeta(resource.type);
  const handleClick = () => onClick(resource as Resource);

  // ── Grid Card ──────────────────────────────────────────────────────────────
  if (viewMode === 'grid') {
    return (
      <div
        onClick={handleClick}
        style={{
          background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 11,
          padding: '14px', cursor: 'pointer', transition: 'all 0.15s',
          display: 'flex', flexDirection: 'column', gap: 10,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = '#93c5fd';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(37,99,235,0.08)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }}
      >
        {/* Icon + menu */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: m.bg, border: `1px solid ${m.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ico d={typeIcon(resource.type)} size={18} color={m.color} />
          </div>
          <button
            onClick={e => e.stopPropagation()}
            style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}
          >
            <Ico d={I.more} size={13} color="#475569" />
          </button>
        </div>

        {/* Name */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
            {resource.name}
          </div>
          <div style={{ fontSize: 9, color: '#94a3b8' }}>
            {format(new Date(resource.lastModified), 'MMM d, yyyy')}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>{resource.formattedSize || '0 B'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Ico d={I.download} size={11} color="#94a3b8" />
            <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>{resource.downloads || 0}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── List Row ───────────────────────────────────────────────────────────────
  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderBottom: '1px solid #f1f5f9',
        cursor: 'pointer', transition: 'background 0.1s',
        fontFamily: 'Inter, system-ui, sans-serif',
        background: 'white',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#eff6ff'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'white'; }}
    >
      {/* Type icon */}
      <div style={{ width: 30, height: 30, borderRadius: 8, background: m.bg, border: `1px solid ${m.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ico d={typeIcon(resource.type)} size={14} color={m.color} />
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {resource.name}
        </div>
        <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>
          {resource.formattedSize || '0 B'} · {format(new Date(resource.lastModified), 'MMM d, yyyy')}
        </div>
      </div>

      {/* Downloads */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <Ico d={I.download} size={11} color="#94a3b8" />
        <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>{resource.downloads || 0}</span>
      </div>

      {/* Download button */}
      <button
        style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', border: 'none', cursor: 'pointer', flexShrink: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <Ico d={I.download} size={12} color="#475569" />
      </button>
    </div>
  );
};

export default ResourceItem;