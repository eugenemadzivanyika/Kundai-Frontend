import { RosterEntry } from '../mobile-ocr.api';

interface PageEntry { pageId: string; thumbUrl: string; }

interface Props {
  student: RosterEntry | null;
  pages: PageEntry[];
  totalStudents: number;
  submittedCount: number;
  onNextStudent: () => void;
  onViewGallery: () => void;
}

const BLUE = '#2563eb';
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000/api';
const FILE_BASE = API_URL.replace('/api', '');

export function StudentDoneScreen({ student, pages, totalStudents, submittedCount, onNextStudent, onViewGallery }: Props) {
  const initials = student ? student.name.split(' ').map(n => n[0]).join('') : '?';

  return (
    <div style={{ height: '100%', background: '#f1f5f9', display: 'flex', flexDirection: 'column', fontFamily: "'Inter Tight', system-ui, sans-serif" }}>
      <div style={{ position: 'relative', padding: '60px 20px 0', textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: 30, background: '#16a34a', display: 'inline-grid', placeItems: 'center', boxShadow: '0 6px 18px rgba(22,163,74,.35), 0 0 0 6px rgba(22,163,74,.1)', marginBottom: 12 }}>
          <span style={{ color: '#fff', fontSize: 28, lineHeight: 1 }}>✓</span>
        </div>
        <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.15em', textTransform: 'uppercase', color: '#15803d', margin: 0 }}>Submission saved</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '4px 0 0', lineHeight: 1.15 }}>
          {student ? `${student.name.split(' ')[0]}'s` : "Anonymous"} work is on the web.
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0' }}>{pages.length} pages uploaded</p>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: '#0f172a', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 10, flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{student?.name ?? 'Anonymous'}</p>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{pages.length} pages</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {pages.slice(0, 6).map((p, i) => (
              <div key={i} style={{ aspectRatio: '3/4', background: '#f1f5f9', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                <img src={`${FILE_BASE}${p.thumbUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: 7, background: '#16a34a', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 9 }}>✓</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', margin: 0 }}>Class progress</p>
            <p style={{ fontSize: 11, fontWeight: 800, color: BLUE, margin: 0 }}>{submittedCount} / {totalStudents}</p>
          </div>
          <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0}%`, background: BLUE, borderRadius: 3 }} />
          </div>
          <p style={{ fontSize: 11, color: '#64748b', margin: '8px 0 0' }}>{totalStudents - submittedCount} students still to shoot</p>
        </div>
      </div>

      <div style={{ marginTop: 'auto', padding: '0 20px 44px' }}>
        <button onClick={onNextStudent} style={{ width: '100%', background: BLUE, color: '#fff', fontWeight: 700, fontSize: 16, padding: 14, border: 0, borderRadius: 14, boxShadow: `0 4px 14px ${BLUE}40` }}>
          Next student →
        </button>
        <button onClick={onViewGallery} style={{ width: '100%', background: '#fff', color: '#0f172a', fontWeight: 600, fontSize: 14, padding: 12, border: '1px solid #e2e8f0', borderRadius: 14, marginTop: 8 }}>
          See full batch
        </button>
      </div>
    </div>
  );
}
