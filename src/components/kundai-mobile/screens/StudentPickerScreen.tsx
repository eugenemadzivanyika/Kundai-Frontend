import { useState } from 'react';
import { RosterEntry } from '../mobile-ocr.api';

interface Props {
  roster: RosterEntry[];
  onSelect: (student: RosterEntry | null) => void;
  onBack: () => void;
}

const BLUE = '#2563eb';

export function StudentPickerScreen({ roster, onSelect, onBack }: Props) {
  const [query, setQuery] = useState('');

  const filtered = roster.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
  const todo = filtered.filter(s => s.submittedPageCount === 0);
  const done = filtered.filter(s => s.submittedPageCount > 0);
  const submitted = roster.filter(s => s.submittedPageCount > 0).length;

  return (
    <div style={{ height: '100%', background: '#f1f5f9', display: 'flex', flexDirection: 'column', fontFamily: "'Inter Tight', system-ui, sans-serif" }}>
      <div style={{ padding: '60px 20px 14px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button onClick={onBack} style={{ background: 'transparent', border: 0, color: '#475569', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, padding: 0 }}>
            ← Back
          </button>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{submitted} of {roster.length} submitted</span>
        </div>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: BLUE, margin: 0 }}>Step 1 · Pick a student</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '4px 0 0', lineHeight: 1.15 }}>Whose work is next?</h1>
        <div style={{ marginTop: 12, position: 'relative' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search or type a name"
            style={{ width: '100%', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px 10px 36px', fontSize: 14, color: '#0f172a', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
          />
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        {todo.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: '#94a3b8', margin: '6px 8px 6px' }}>To do · {todo.length}</p>
            {todo.map((s, i) => {
              const initials = s.name.split(' ').map(n => n[0]).join('');
              const active = i === 0 && query === '';
              return (
                <div
                  key={s.studentId}
                  onClick={() => onSelect(s)}
                  style={{ background: active ? '#eff6ff' : '#fff', border: active ? `1.5px solid ${BLUE}` : '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 17, background: '#0f172a', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 11, flexShrink: 0 }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{s.name}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>Not submitted</p>
                  </div>
                  {active && <span style={{ color: BLUE }}>→</span>}
                </div>
              );
            })}
          </>
        )}

        {done.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: '#94a3b8', margin: '14px 8px 6px' }}>Done · {done.length}</p>
            {done.map(s => {
              const initials = s.name.split(' ').map(n => n[0]).join('');
              return (
                <div key={s.studentId} style={{ background: '#fff', borderRadius: 12, padding: '10px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12, opacity: 0.55 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 15, background: '#cbd5e1', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 10, flexShrink: 0 }}>{initials}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{s.name}</p>
                    <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{s.submittedPageCount} pages submitted</p>
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: '#16a34a', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 10 }}>✓</div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div style={{ padding: '12px 16px 44px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
        <button
          onClick={() => onSelect(todo[0] || null)}
          disabled={todo.length === 0}
          style={{ width: '100%', background: BLUE, color: '#fff', fontWeight: 700, fontSize: 15, padding: 14, border: 0, borderRadius: 14, boxShadow: `0 4px 14px ${BLUE}40`, opacity: todo.length === 0 ? 0.5 : 1 }}
        >
          {todo[0] ? `Shoot ${todo[0].name.split(' ')[0]}'s work` : 'All students done'}
        </button>
        <button onClick={() => onSelect(null)} style={{ width: '100%', background: 'transparent', color: '#64748b', fontSize: 12, padding: 10, border: 0, marginTop: 2 }}>
          Shoot anonymously — tag on web
        </button>
      </div>
    </div>
  );
}
