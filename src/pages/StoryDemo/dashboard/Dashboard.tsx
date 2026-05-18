import React from 'react';
import type { DashboardProps } from '../types';

const NAV_TABS = [
  { label: 'Home',        active: true,  d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { label: 'Classroom',   active: false, d: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z' },
  { label: 'Assessments', active: false, d: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 3h6v4H9z M9 12h6 M9 16h4' },
  { label: 'Staffroom',   active: false, d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6' },
  { label: 'Calendar',    active: false, d: 'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18' },
  { label: 'Analytics',   active: false, d: 'M18 20V10 M12 20V4 M6 20v-6' },
];

const STAFF = [
  { i: 'JD', n: 'John Dube',       t: '10:25' },
  { i: 'DG', n: 'David Gumbo',     t: '09:55' },
  { i: 'TS', n: 'Thembani Shumba', t: '08:17' },
  { i: 'TM', n: 'Thabani Moyo',    t: '07:48' },
];

const PERF_STUDENTS = [
  { n: 'Chipo Ndlovu',  s: 92, f: false },
  { n: 'Farai Sibanda', s: 81, f: false },
  { n: 'Tatenda Banda', s: 64, f: false },
  { n: 'Tapiwa Moyo',   s: 38, f: true  },
];

const TWIN_ATTRS = [
  { l: 'Real Numbers', v: 10 }, { l: 'Sets', v: 10 },
  { l: 'Financial Mat.', v: 10 }, { l: 'Graphs', v: 10 },
  { l: 'Algebra', v: 10 }, { l: 'Geometry', v: 10 },
  { l: 'Statistics', v: 10 },
];

const CAL_DAYS = [
  { d: 'Sat', n: '16', active: true },
  { d: 'Sun', n: '17' }, { d: 'Mon', n: '18' }, { d: 'Tue', n: '19' },
  { d: 'Wed', n: '20' }, { d: 'Thu', n: '21' }, { d: 'Fri', n: '22' },
];

export const Dashboard: React.FC<DashboardProps> = ({ perfGlowing, twinGlowing, twinCardHidden, perfCardHidden, bellActive, bellHiddenInHeader }) => (
  <div style={{ width: '100%', height: '100%', background: '#1976d2', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }}>
    <div style={{ flexShrink: 0, padding: '6px 8px 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#111', display: 'grid', placeItems: 'center', color: 'white', fontSize: 7, fontWeight: 900, flexShrink: 0, position: 'relative', zIndex: 2, marginRight: -18 }}>PM</div>
            <div style={{ background: 'white', padding: '0px 22px 3px 25px', clipPath: 'polygon(0 0,100% 0,90% 100%,0 100%)', width: 90, position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: 8, fontWeight: 900, color: '#111', lineHeight: 1.2, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>MRS. MATHE</p>
              <p style={{ fontSize: 6.5, color: '#2563eb', fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap' }}>Mathematics ▾</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <div style={{ position: 'relative', background: '#e5e7eb', borderRadius: 5, width: 20, height: 20, display: 'grid', placeItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.12)', visibility: bellHiddenInHeader ? 'hidden' : undefined }}>
            <svg width="10" height="10" fill="none" stroke="#374151" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {bellActive && <div className="sd-bell-badge-pop" style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'grid', placeItems: 'center', color: 'white', fontSize: 4, fontWeight: 900 }}>1</div>}
          </div>
          <div style={{ background: '#e5e7eb', borderRadius: 5, width: 20, height: 20, display: 'grid', placeItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' }}>
            <svg width="10" height="10" fill="none" stroke="#374151" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        {NAV_TABS.map(t => (
          <div key={t.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 5, background: t.active ? '#2563eb' : '#e5e7eb', boxShadow: t.active ? '0 2px 4px rgba(37,99,235,0.3)' : '0 1px 2px rgba(0,0,0,0.08)', fontSize: 6, fontWeight: 900, color: t.active ? 'white' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            <svg width="8" height="8" fill="none" stroke={t.active ? 'white' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={t.d} /></svg>
            {t.label}
          </div>
        ))}
      </div>
    </div>
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 6, minHeight: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
        <div style={{ background: '#f0f4f8', borderRadius: 8, padding: '8px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', flex: '2 1 0', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <p style={{ fontSize: 11, fontWeight: 900, color: '#111' }}>May 2026</p>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'black', display: 'grid', placeItems: 'center', color: 'white', fontSize: 9, fontWeight: 700 }}>+</div>
          </div>
          <div style={{ display: 'flex', gap: 2, marginBottom: 3 }}>
            {CAL_DAYS.map(d => (<div key={d.n} style={{ flex: d.active ? 2 : 1, textAlign: 'center', fontSize: 6, fontWeight: 700, color: '#9ca3af', paddingBottom: 2 }}>{d.d[0]}</div>))}
          </div>
          <div style={{ display: 'flex', gap: 2, flex: 1 }}>
            {CAL_DAYS.map(d => (
              <div key={d.n} style={{ flex: d.active ? 2 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 0', borderRadius: 5, background: d.active ? '#1565c0' : 'transparent' }}>
                <span style={{ fontSize: d.active ? 12 : 9, fontWeight: d.active ? 900 : 700, color: d.active ? 'white' : '#4b5563', lineHeight: 1 }}>{d.n}</span>
                {d.active && <p style={{ fontSize: 5, color: 'rgba(255,255,255,0.75)', marginTop: 2, textAlign: 'center', lineHeight: 1.2 }}>No upcoming<br />events today.</p>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flex: '3 1 0', minHeight: 0 }}>
          <div style={{ flex: 1, background: '#f0f4f8', borderRadius: 8, padding: '8px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: '#111', marginBottom: 6 }}>Staff Room</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden', flex: 1 }}>
              {STAFF.map(s => (
                <div key={s.i} style={{ display: 'flex', alignItems: 'center', gap: 5, paddingBottom: 4, borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#111', display: 'grid', placeItems: 'center', color: 'white', fontSize: 6, fontWeight: 900, flexShrink: 0 }}>{s.i}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 7, fontWeight: 700, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.n}</p>
                    <p style={{ fontSize: 6, color: '#9ca3af', fontStyle: 'italic' }}>"Sir, I have a question..."</p>
                  </div>
                  <span style={{ fontSize: 6, color: '#9ca3af', flexShrink: 0 }}>{s.t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={perfGlowing ? 'sd-ring-pulse' : undefined} style={{ flex: 1, background: '#f0f4f8', borderRadius: 8, padding: '8px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column', visibility: perfCardHidden ? 'hidden' : undefined }}>
            <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: '#111', marginBottom: 6 }}>Performance</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden', flex: 1 }}>
              {PERF_STUDENTS.map(st => (
                <div key={st.n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4, borderBottom: '1px solid #f3f4f6' }}>
                  <p style={{ fontSize: 8, fontWeight: st.f ? 900 : 500, color: st.f ? '#dc2626' : '#374151' }}>{st.n}</p>
                  <span style={{ fontSize: 8, fontWeight: 700, color: st.f ? '#dc2626' : '#374151' }}>{st.s}%</span>
                </div>
              ))}
              <p style={{ fontSize: 7, color: '#9ca3af', fontStyle: 'italic', marginTop: 2 }}>No assessments found for this course</p>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
        <div className={twinGlowing ? 'sd-ring-pulse' : undefined} style={{ background: '#f0f4f8', borderRadius: 8, padding: '6px 8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', flex: '1 1 0', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', visibility: twinCardHidden ? 'hidden' : undefined }}>
          <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', color: '#111', textAlign: 'center', marginBottom: 4, flexShrink: 0 }}>Student Development</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#111', display: 'grid', placeItems: 'center', color: 'white', fontSize: 8, fontWeight: 900, flexShrink: 0 }}>LM</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#111', lineHeight: 1.1 }}>Mavhuku <span style={{ fontWeight: 400, color: '#6b7280' }}>Leeroy</span></p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1, color: '#111' }}>10</span>
                <span style={{ fontSize: 7, fontWeight: 700, color: '#9ca3af' }}>OVR</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 6.5, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Form 3</p>
              <p style={{ fontSize: 6.5, color: '#3b82f6', fontWeight: 900, textTransform: 'uppercase', marginTop: 2 }}>0 Plans</p>
              <p style={{ fontSize: 6.5, color: '#10b981', fontWeight: 900, textTransform: 'uppercase' }}>None Active</p>
            </div>
          </div>
          <div style={{ marginBottom: 4, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 6, fontWeight: 700, color: '#9ca3af', marginBottom: 2 }}>
              <span>Current: 10%</span><span>Potential: 90%</span>
            </div>
            <div style={{ background: '#e5e7eb', borderRadius: 99, height: 4, overflow: 'hidden' }}>
              <div style={{ width: '11%', background: '#22c55e', height: 4, borderRadius: 99 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'auto auto', flex: 1, minHeight: 0, alignContent: 'center', gap: '2px 0' }}>
            {TWIN_ATTRS.map(a => (<p key={`n-${a.l}`} style={{ fontSize: 5, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word', margin: 0 }}>{a.l}</p>))}
            {TWIN_ATTRS.map(a => (<p key={`v-${a.l}`} style={{ fontSize: 8, fontWeight: 900, color: '#ef4444', textAlign: 'center', margin: 0 }}>{a.v}%</p>))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flex: '1 1 0', minHeight: 0 }}>
          {[{ l: 'RESOURCES', s: 'Syllabus & Materials' }, { l: 'GRADING', s: 'Review Submissions' }].map(b => (
            <div key={b.l} style={{ flex: 1, background: '#f0f4f8', borderRadius: 8, padding: 10, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 0 }}>
              <p style={{ fontSize: 9, fontWeight: 900, color: '#111', textTransform: 'uppercase' }}>{b.l}</p>
              <p style={{ fontSize: 7, color: '#9ca3af' }}>{b.s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
