interface PageEntry { pageId: string; thumbUrl: string; synced: boolean; }
interface StudentEntry { studentId: string | null; name: string; pages: PageEntry[]; }

interface Props {
  assessmentName: string;
  studentEntries: StudentEntry[];
  totalStudents: number;
  onNextStudent: () => void;
  onDone: () => void;
  onBack: () => void;
}

const BLUE = '#2563eb';
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000/api';
const FILE_BASE = API_URL.replace('/api', '');

export function GalleryScreen({ assessmentName, studentEntries, totalStudents, onNextStudent, onDone, onBack }: Props) {
  const submitted = studentEntries.length;

  return (
    <div style={{ height: '100%', background: '#f1f5f9', display: 'flex', flexDirection: 'column', fontFamily: "'Inter Tight', system-ui, sans-serif" }}>
      <div style={{ padding: '60px 20px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button onClick={onBack} style={{ background: 'transparent', border: 0, color: '#475569', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, padding: 0 }}>
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dcfce7', borderRadius: 12, padding: '4px 10px' }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: '#16a34a' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>SYNCED</span>
          </div>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assessmentName}</h1>
        <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>{submitted} of {totalStudents} students submitted</p>
        <div style={{ marginTop: 12, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${totalStudents > 0 ? (submitted / totalStudents) * 100 : 0}%`, background: BLUE, borderRadius: 3 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}>
        {studentEntries.map(s => {
          const initials = s.name.split(' ').map(n => n[0]).join('');
          const allSynced = s.pages.every(p => p.synced);
          return (
            <div key={s.studentId ?? 'anon'} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 14, background: '#0f172a', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 10, flexShrink: 0 }}>{initials}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{s.name}</p>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{s.pages.length} pages</p>
                </div>
                <div style={{ width: 18, height: 18, borderRadius: 9, background: allSynced ? '#16a34a' : '#facc15', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 10, flexShrink: 0 }}>
                  {allSynced ? '✓' : '…'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {s.pages.map((p, i) => (
                  <div key={i} style={{ flex: '0 0 44px', aspectRatio: '3/4', background: '#f1f5f9', borderRadius: 6, overflow: 'hidden', opacity: p.synced ? 1 : 0.45 }}>
                    <img src={`${FILE_BASE}${p.thumbUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <button onClick={onNextStudent} style={{ width: '100%', background: '#fff', border: `2px dashed ${BLUE}`, borderRadius: 12, padding: 16, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: BLUE, fontWeight: 700, fontSize: 14 }}>
          + Next student
        </button>
      </div>

      <div style={{ padding: '12px 20px 44px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
        <button onClick={onDone} style={{ width: '100%', background: BLUE, color: '#fff', fontWeight: 700, fontSize: 16, padding: 14, border: 0, borderRadius: 14, boxShadow: `0 4px 14px ${BLUE}40` }}>
          Done — review on web →
        </button>
      </div>
    </div>
  );
}
