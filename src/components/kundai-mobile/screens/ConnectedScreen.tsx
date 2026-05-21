import { PairResult } from '../mobile-ocr.api';

interface Props {
  assessment: PairResult['assessment'];
  connected: boolean;
  onStart: () => void;
  onDisconnect: () => void;
}

const BLUE = '#2563eb';

export function ConnectedScreen({ assessment, connected, onStart, onDisconnect }: Props) {
  const initial = assessment.name.charAt(0).toUpperCase();
  return (
    <div style={{ height: '100%', background: '#f1f5f9', display: 'flex', flexDirection: 'column', fontFamily: "'Inter Tight', system-ui, sans-serif" }}>
      <div style={{ padding: '60px 20px 0' }}>
        <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.15em', textTransform: 'uppercase', color: BLUE, margin: 0 }}>✓ Connected</p>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '4px 0 0', lineHeight: 1.1 }}>You're paired.</h1>
        <p style={{ fontSize: 14, color: '#475569', margin: '8px 0 0' }}>Shoot one student's work, save, then move to the next.</p>
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: BLUE, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, fontSize: 15 }}>{initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', color: '#64748b', margin: 0 }}>Assessment</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assessment.name}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', color: '#94a3b8', margin: 0 }}>Groups</p><p style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>{assessment.targetGroups}</p></div>
          </div>
        </div>

        <div style={{ marginTop: 14, background: connected ? '#dcfce7' : '#fef9c3', border: `1px solid ${connected ? '#86efac' : '#fde047'}`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: connected ? '#16a34a' : '#ca8a04', boxShadow: connected ? '0 0 8px #16a34a' : 'none' }} />
          <p style={{ fontSize: 12, fontWeight: 700, color: connected ? '#15803d' : '#92400e', margin: 0 }}>
            {connected ? 'Live sync · pages upload as you shoot' : 'Connecting…'}
          </p>
        </div>
      </div>

      <div style={{ marginTop: 'auto', padding: '0 20px 44px' }}>
        <button
          onClick={onStart}
          style={{ width: '100%', background: BLUE, color: '#fff', fontWeight: 700, fontSize: 16, padding: 14, border: 0, borderRadius: 14, boxShadow: `0 4px 14px ${BLUE}40` }}
        >
          Start with first student
        </button>
        <button onClick={onDisconnect} style={{ width: '100%', background: 'transparent', color: '#64748b', fontSize: 13, padding: 12, border: 0, marginTop: 4 }}>
          Disconnect
        </button>
      </div>
    </div>
  );
}
