import React from 'react';

// ── Inline SVG helper ─────────────────────────────────────────────────────────
const Ico: React.FC<{ d: string | string[]; size?: number; color?: string }> = ({ d, size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const I = {
  folder:   ['M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'],
  upload:   ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M17 8l-5-5-5 5','M12 3v12'],
  doc:      ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
  img:      ['M21 15l-5-5L5 20','M3 3h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z','M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'],
  video:    ['M23 7l-7 5 7 5V7z','M1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z'],
  file:     ['M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z','M13 2v7h7'],
  check:    ['M20 6L9 17l-5-5'],
  target:   ['M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2','M12 6a6 6 0 1 0 0 12A6 6 0 0 0 12 6','M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4'],
  award:    ['M12 15l-3.09 6.26L12 18.77l3.09 2.49L12 15z','M8.21 13.89L7 23l5-3 5 3-1.21-9.12','M12 2a7 7 0 1 0 0 14A7 7 0 0 0 12 2z'],
};

const TYPE_META: Record<string, { color: string; bg: string; border: string }> = {
  document: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  image:    { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  video:    { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  other:    { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};
const typeMeta = (t: string) => TYPE_META[t] || TYPE_META.other;
const typeIcon = (t: string) => t === 'document' ? I.doc : t === 'image' ? I.img : t === 'video' ? I.video : I.file;

const fmtDate = (iso: string) => {
  const d = new Date(iso), now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

interface RecentUpload {
  _id: string;
  name: string;
  type: string;
  createdAt: string;
  course: { _id: string; name: string; code?: string };
  uploadedBy: { _id: string; firstName: string; lastName: string };
}

interface SidebarProps {
  onUploadClick: () => void;
  onCreateAssignment: () => void;
  recentUploads: RecentUpload[];
}

const Sidebar: React.FC<SidebarProps> = ({ onUploadClick, onCreateAssignment, recentUploads }) => {
  const actions = [
    { label: 'Create Assignment', icon: I.check,  onClick: onCreateAssignment },
    { label: 'Mark Assignment',   icon: I.award,  onClick: () => {} },
    { label: 'Dev Plans',         icon: I.target, onClick: () => {} },
  ];

  return (
    <div style={{
      width: 200, flexShrink: 0, borderRight: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column', background: 'white', overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <style>{`
        .sb-scrollbar::-webkit-scrollbar { width: 4px; }
        .sb-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sb-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        .sb-upload-btn:hover { background: #1d4ed8 !important; }
        .sb-action-btn:hover { background: #f1f5f9 !important; }
      `}</style>

      {/* Brand */}
      <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ico d={I.folder} size={14} color="#2563eb" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Resources</span>
        </div>
      </div>

      {/* Upload CTA */}
      <div style={{ padding: '10px 12px', flexShrink: 0 }}>
        <button
          onClick={onUploadClick}
          className="sb-upload-btn"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 9,
            fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
            transition: 'background 0.15s', cursor: 'pointer',
          }}
        >
          <Ico d={I.upload} size={13} color="white" /> Upload Resource
        </button>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '0 10px 4px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        {actions.map(({ label, icon, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="sb-action-btn"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 8px', borderRadius: 8, border: 'none', background: 'none',
              fontSize: 11, fontWeight: 600, color: '#475569', cursor: 'pointer',
              textAlign: 'left', transition: 'background 0.12s',
            }}
          >
            <Ico d={icon} size={13} color="#64748b" />
            {label}
          </button>
        ))}
      </div>

      {/* Recent uploads */}
      <div className="sb-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        <div style={{ padding: '8px 14px 4px', fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Recent Uploads
        </div>
        {recentUploads.length === 0 && (
          <p style={{ padding: '4px 14px', fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>No uploads yet.</p>
        )}
        {recentUploads.slice(0, 6).map(r => {
          const m = typeMeta(r.type);
          return (
            <div key={r._id} style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f8fafc' }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7, background: m.bg, border: `1px solid ${m.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Ico d={typeIcon(r.type)} size={12} color={m.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.name}
                </div>
                <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 1 }}>
                  {r.course.code || r.course.name} · {fmtDate(r.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;