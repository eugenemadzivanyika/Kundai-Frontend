interface Props {
  assessmentName: string;
  pageCount: number;
  onNewBatch: () => void;
  onDisconnect: () => void;
}

const BLUE = '#2563eb';

export function DoneScreen({ assessmentName, pageCount, onNewBatch, onDisconnect }: Props) {
  return (
    <div style={{ height: '100%', background: '#f1f5f9', display: 'flex', flexDirection: 'column', fontFamily: "'Inter Tight', system-ui, sans-serif", position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 320, height: 320, borderRadius: '50%', background: 'rgba(37,99,235,.12)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 320, height: 320, borderRadius: '50%', background: 'rgba(34,197,94,.12)', filter: 'blur(40px)' }} />
      </div>

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
        <div style={{ width: 84, height: 84, borderRadius: 42, background: '#16a34a', display: 'grid', placeItems: 'center', boxShadow: '0 8px 24px rgba(22,163,74,.35), 0 0 0 8px rgba(22,163,74,.1)', marginBottom: 24 }}>
          <span style={{ color: '#fff', fontSize: 42, lineHeight: 1 }}>✓</span>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0 }}>All pages sent</h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: '8px 0 0', maxWidth: 280, lineHeight: 1.5 }}>
          {pageCount} pages are now on the teacher's screen. They'll confirm before OCR runs.
        </p>

        <div style={{ marginTop: 28, background: '#fff', borderRadius: 16, padding: 18, width: '100%', maxWidth: 320, boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: BLUE, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>K</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assessmentName}</p>
              <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{pageCount} pages uploaded</p>
            </div>
          </div>
          <div style={{ paddingTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#16a34a', fontSize: 14 }}>☁</span>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#15803d', margin: 0 }}>Synced to your dashboard</p>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', padding: '0 20px 44px' }}>
        <button onClick={onNewBatch} style={{ width: '100%', background: BLUE, color: '#fff', fontWeight: 700, fontSize: 16, padding: 14, border: 0, borderRadius: 14, boxShadow: `0 4px 14px ${BLUE}40` }}>
          + New batch
        </button>
        <button onClick={onDisconnect} style={{ width: '100%', background: 'transparent', color: '#64748b', fontSize: 13, padding: 12, border: 0, marginTop: 4 }}>
          Disconnect
        </button>
      </div>
    </div>
  );
}
