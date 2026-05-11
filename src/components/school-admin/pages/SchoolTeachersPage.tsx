import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../../services/api';
import TeacherFormDrawer from './TeacherFormDrawer';
import { fetchData } from '../../../services/apiClient';

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const TONES = ['forest', 'plum', 'sky', 'gold', 'terracotta'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const tone = TONES[h % TONES.length];
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `var(--${tone}-soft)`, color: `var(--${tone})`, display: 'grid', placeItems: 'center', fontSize: size * 0.36, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: string }) {
  const bg = tone === 'neutral' ? 'var(--paper-shade)' : `var(--${tone}-soft)`;
  const color = tone === 'neutral' ? 'var(--ink-3)' : `var(--${tone})`;
  return (
    <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: bg, color, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

const Th: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--rule-soft)', whiteSpace: 'nowrap' }}>
    {children}
  </th>
);
const Td: React.FC<{ children?: React.ReactNode; mono?: boolean; dim?: boolean }> = ({ children, mono, dim }) => (
  <td style={{ padding: '10px 16px', fontSize: 12.5, color: dim ? 'var(--ink-3)' : 'var(--ink-2)', fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit' }}>
    {children}
  </td>
);

const SchoolTeachersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const all = await adminService.getUsers();
      setUsers(all.filter((u: any) => u.roles?.includes('teacher') || u.role === 'teacher'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTeachers(); }, [loadTeachers]);

  const filtered = users.filter(u => {
    if (!q) return true;
    const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase();
    return name.includes(q.toLowerCase()) || (u.email ?? '').toLowerCase().includes(q.toLowerCase());
  });

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from the system? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await adminService.deleteUser(id);
      await loadTeachers();
    } catch (err: any) {
      alert(err.message ?? 'Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeactivate = async (id: string, active: boolean) => {
    try {
      await fetchData(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ active: !active }) });
      await loadTeachers();
    } catch (err: any) {
      alert(err.message ?? 'Failed to update user');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.02em' }}>Teachers</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>
            {users.length} staff member{users.length !== 1 ? 's' : ''} · {users.filter(u => u.active !== false).length} active
          </p>
        </div>
        <button
          onClick={() => { setEditUser(null); setDrawerOpen(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--forest)', color: '#fbf8f1', border: 0, borderRadius: 5, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit' }}
        >
          <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
          Add teacher
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Active staff',     value: users.filter(u => u.active !== false).length, accent: 'forest' },
          { label: 'Heads of dept',    value: users.filter(u => u.teacherProfile?.department).length, accent: 'plum' },
          { label: 'Total accounts',   value: users.length, accent: 'sky' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{k.label}</div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 700, color: 'var(--ink-1)', marginTop: 6, fontFeatureSettings: "'tnum' 1" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--rule-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}>
              <circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" />
            </svg>
            <input
              placeholder="Search by name or email…"
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{ width: '100%', padding: '7px 10px 7px 30px', background: 'var(--paper-shade)', border: '1px solid var(--rule)', borderRadius: 5, color: 'var(--ink-1)', fontFamily: 'inherit', fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)', marginLeft: 'auto' }}>{filtered.length} teacher{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            {q ? 'No teachers match your search.' : 'No teachers yet. Click "Add teacher" to get started.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><Th>Teacher</Th><Th>Staff No.</Th><Th>Department</Th><Th>Subjects</Th><Th>Status</Th><Th></Th></tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email;
                const tp = u.teacherProfile ?? {};
                const subjects = tp.subjectAssignments?.map((sa: any) => sa.subject?.name ?? sa.subject ?? '').filter(Boolean) ?? [];
                const active = u.active !== false;
                return (
                  <tr key={u.id || i}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--rule-soft)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-shade)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={name} size={32} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--ink-1)' }}>{name}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{u.email}</div>
                        </div>
                      </div>
                    </Td>
                    <Td mono dim>{tp.staffNumber || '—'}</Td>
                    <Td dim>{tp.department || '—'}</Td>
                    <Td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {subjects.slice(0, 3).map((s: string) => <Pill key={s} tone="neutral">{s}</Pill>)}
                        {subjects.length > 3 && <Pill tone="neutral">+{subjects.length - 3}</Pill>}
                        {subjects.length === 0 && <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>—</span>}
                      </div>
                    </Td>
                    <Td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: active ? 'var(--forest)' : 'var(--terracotta)', fontWeight: 600 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', display: 'inline-block' }} />
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => { setEditUser(u); setDrawerOpen(true); }}
                          style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 4, cursor: 'pointer', fontSize: 11.5, color: 'var(--ink-2)', fontFamily: 'inherit' }}>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeactivate(u.id, active)}
                          style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 4, cursor: 'pointer', fontSize: 11.5, color: active ? 'var(--gold-deep)' : 'var(--forest)', fontFamily: 'inherit' }}>
                          {active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, name)}
                          disabled={deleting === u.id}
                          style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 4, cursor: 'pointer', fontSize: 11.5, color: 'var(--terracotta)', fontFamily: 'inherit' }}>
                          {deleting === u.id ? '…' : 'Remove'}
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <TeacherFormDrawer
        open={drawerOpen}
        editUser={editUser}
        onClose={() => setDrawerOpen(false)}
        onSaved={loadTeachers}
      />
    </div>
  );
};

export default SchoolTeachersPage;
