import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../../services/api';
import { classService, ClassItem } from '../../../services/classService';
import BulkStudentUpload from '../../admin/components/BulkStudentUpload';
import { fetchData } from '../../../services/apiClient';

function Avatar({ name, size = 30 }: { name: string; size?: number }) {
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

interface AddStudentForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  form: string;
  classGroupId: string;
  gender: string;
  guardianName: string;
  guardianPhone: string;
}

const BLANK_STUDENT: AddStudentForm = {
  firstName: '', lastName: '', email: '', password: '', form: '1',
  classGroupId: '', gender: '', guardianName: '', guardianPhone: '',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 10px', background: 'var(--paper-shade)', border: '1px solid var(--rule)',
  borderRadius: 5, color: 'var(--ink-1)', fontFamily: 'inherit', fontSize: 13,
  outline: 'none', width: '100%', boxSizing: 'border-box',
};

function AddStudentDrawer({ open, classes, onClose, onSaved }: { open: boolean; classes: ClassItem[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<AddStudentForm>(BLANK_STUDENT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (open) { setForm(BLANK_STUDENT); setError(''); } }, [open]);

  const set = (k: keyof AddStudentForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('First name, last name, email, and password are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await fetchData('/admin/users', {
        method: 'POST',
        body: JSON.stringify({ ...form, role: 'student', form: parseInt(form.form) || 1 }),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create student');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, zIndex: 50, background: 'var(--paper)', borderLeft: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--rule-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>Add student</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>Create a single student account</p>
          </div>
          <button onClick={onClose} style={{ padding: 6, background: 'transparent', border: '1px solid var(--rule)', borderRadius: 5, cursor: 'pointer', color: 'var(--ink-2)', lineHeight: 0 }}>
            <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l12 12M14 2L2 14" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {([['First name', 'firstName', 'Chiedza'], ['Last name', 'lastName', 'Sibanda']] as [string, keyof AddStudentForm, string][]).map(([label, key, ph]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label} <span style={{ color: 'var(--terracotta)' }}>*</span></label>
                <input style={inputStyle} value={form[key] as string} onChange={e => set(key, e.target.value)} placeholder={ph} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email <span style={{ color: 'var(--terracotta)' }}>*</span></label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="student@school.ac.zw" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password <span style={{ color: 'var(--terracotta)' }}>*</span></label>
            <input style={inputStyle} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" autoComplete="new-password" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Form</label>
              <select style={inputStyle} value={form.form} onChange={e => set('form', e.target.value)}>
                {[1,2,3,4,5,6].map(f => <option key={f} value={f}>Form {f}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Class</label>
              <select style={inputStyle} value={form.classGroupId} onChange={e => set('classGroupId', e.target.value)}>
                <option value="">— select class —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gender</label>
              <select style={inputStyle} value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">— select —</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Guardian name</label>
              <input style={inputStyle} value={form.guardianName} onChange={e => set('guardianName', e.target.value)} placeholder="Mr. Sibanda" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Guardian phone</label>
            <input style={inputStyle} value={form.guardianPhone} onChange={e => set('guardianPhone', e.target.value)} placeholder="+263 77…" />
          </div>
          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--terracotta-soft)', border: '1px solid color-mix(in srgb, var(--terracotta) 25%, transparent)', borderRadius: 5, color: 'var(--terracotta)', fontSize: 12.5 }}>{error}</div>
          )}
        </form>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--rule-soft)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 5, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSubmit as any} disabled={saving} style={{ padding: '8px 20px', background: saving ? 'var(--forest-soft)' : 'var(--forest)', color: saving ? 'var(--forest)' : '#fbf8f1', border: 0, borderRadius: 5, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
            {saving ? 'Creating…' : 'Create student'}
          </button>
        </div>
      </div>
    </>
  );
}

const SchoolStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [formFilter, setFormFilter] = useState('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allUsers, allClasses] = await Promise.all([
        adminService.getUsers(),
        classService.getClasses(),
      ]);
      setStudents(allUsers.filter((u: any) => u.roles?.includes('student') || u.role === 'student'));
      setClasses(allClasses);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = students.filter(s => {
    const name = `${s.firstName ?? ''} ${s.lastName ?? ''}`.toLowerCase();
    const matchQ = !q || name.includes(q.toLowerCase()) || (s.email ?? '').toLowerCase().includes(q.toLowerCase());
    const form = s.studentProfile?.form;
    const matchForm = formFilter === 'all' || String(form) === formFilter;
    return matchQ && matchForm;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.02em' }}>Students</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>
            {students.length} on roll · {students.filter(s => s.active !== false).length} active
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setBulkOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 5, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', fontFamily: 'inherit' }}>
            <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 10V3M5 6l3-3 3 3M3 12h10" /></svg>
            Bulk import (CSV)
          </button>
          <button
            onClick={() => setAddOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--forest)', color: '#fbf8f1', border: 0, borderRadius: 5, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit' }}>
            <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
            Add student
          </button>
        </div>
      </div>

      {/* Table card */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--rule-soft)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 340 }}>
            <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }}>
              <circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" />
            </svg>
            <input placeholder="Search by name or email…" value={q} onChange={e => { setQ(e.target.value); setPage(0); }} style={{ width: '100%', padding: '7px 10px 7px 30px', background: 'var(--paper-shade)', border: '1px solid var(--rule)', borderRadius: 5, color: 'var(--ink-1)', fontFamily: 'inherit', fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'inline-flex', background: 'var(--paper-shade)', border: '1px solid var(--rule)', borderRadius: 5, padding: 2 }}>
            {([['all','All'],['1','F1'],['2','F2'],['3','F3'],['4','F4'],['5','F5'],['6','F6']] as [string,string][]).map(([k,l]) => (
              <button key={k} onClick={() => { setFormFilter(k); setPage(0); }} style={{ border: 0, padding: '5px 9px', borderRadius: 4, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', background: formFilter === k ? 'var(--paper)' : 'transparent', color: formFilter === k ? 'var(--ink-1)' : 'var(--ink-3)', fontFamily: 'inherit', boxShadow: formFilter === k ? '0 1px 0 var(--rule)' : 'none' }}>{l}</button>
            ))}
          </div>
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)', marginLeft: 'auto' }}>{filtered.length} student{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            {q || formFilter !== 'all' ? 'No students match your filters.' : 'No students yet. Add students individually or use bulk import.'}
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><Th>Student</Th><Th>Student ID</Th><Th>Form</Th><Th>Class</Th><Th>Status</Th></tr></thead>
              <tbody>
                {paginated.map((s, i) => {
                  const name = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || s.email;
                  const sp = s.studentProfile ?? {};
                  const active = s.active !== false;
                  const classGroup = classes.find(c => c.id === sp.classGroup?._id || c.id === sp.classGroup);
                  return (
                    <tr key={s.id || i}
                      style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--rule-soft)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-shade)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={name} size={30} />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--ink-1)' }}>{name}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.email}</div>
                          </div>
                        </div>
                      </Td>
                      <Td mono dim>{sp.id || '—'}</Td>
                      <Td dim>{sp.form ? `Form ${sp.form}` : '—'}</Td>
                      <Td dim>{classGroup?.name ?? sp.classGroup?.name ?? '—'}</Td>
                      <Td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: active ? 'var(--forest)' : 'var(--terracotta)', fontWeight: 600 }}>
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', display: 'inline-block' }} />
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length > PAGE_SIZE && (
              <div style={{ padding: '10px 16px', fontSize: 11.5, color: 'var(--ink-3)', borderTop: '1px solid var(--rule-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '4px 12px', border: '1px solid var(--rule)', borderRadius: 4, background: 'transparent', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: 12, color: 'var(--ink-2)', fontFamily: 'inherit' }}>← Prev</button>
                <span>Page {page + 1} of {Math.ceil(filtered.length / PAGE_SIZE)}</span>
                <button disabled={(page + 1) * PAGE_SIZE >= filtered.length} onClick={() => setPage(p => p + 1)} style={{ padding: '4px 12px', border: '1px solid var(--rule)', borderRadius: 4, background: 'transparent', cursor: (page + 1) * PAGE_SIZE >= filtered.length ? 'not-allowed' : 'pointer', fontSize: 12, color: 'var(--ink-2)', fontFamily: 'inherit' }}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      <AddStudentDrawer open={addOpen} classes={classes} onClose={() => setAddOpen(false)} onSaved={load} />

      {/* Bulk upload modal */}
      {bulkOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--paper)', borderRadius: 8, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
            <BulkStudentUpload
              onComplete={count => { if (count > 0) load(); setBulkOpen(false); }}
              onCancel={() => setBulkOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolStudentsPage;
