import React, { useEffect, useState } from 'react';
import { classService, ClassItem } from '../../../services/classService';
import { subjectService } from '../../../services/api';
import { fetchData } from '../../../services/apiClient';
import { useToast } from '../../ui/use-toast';
import { TeacherUser } from '../types/schoolAdmin';

export interface TeacherPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: 'teacher';
  staffNumber: string;
  position: string;
  department: string;
  qualifications: string;
  teachingCertificate: string;
  yearsOfExperience: number;
  gender: 'Male' | 'Female' | 'Other' | '';
  subjectAssignments: { subject: string; classes: string[] }[];
}

interface Props {
  open: boolean;
  editUser?: TeacherUser | null;
  onClose: () => void;
  onSaved: () => void;
}

interface SubjectOption { id: string; name: string; code: string; }

const BLANK: TeacherPayload = {
  firstName: '', lastName: '', email: '', password: '', phoneNumber: '',
  role: 'teacher', staffNumber: '', position: '', department: '',
  qualifications: '', teachingCertificate: '', yearsOfExperience: 0,
  gender: '', subjectAssignments: [],
};

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}{required && <span style={{ color: 'var(--terracotta)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px', background: 'var(--paper-shade)', border: '1px solid var(--rule)',
  borderRadius: 5, color: 'var(--ink-1)', fontFamily: 'inherit', fontSize: 13,
  outline: 'none', width: '100%', boxSizing: 'border-box',
};

const TeacherFormDrawer: React.FC<Props> = ({ open, editUser, onClose, onSaved }) => {
  const { toast } = useToast();
  const [form, setForm] = useState<TeacherPayload>(BLANK);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  const isEdit = !!editUser;

  useEffect(() => {
    if (!open) return;
    setLoadError('');
    Promise.all([
      subjectService.getSubjects(),
      classService.getClasses(),
    ]).then(([subs, cls]) => {
      setSubjects(subs.map((s: any) => ({ id: s.id, name: s.name, code: s.code })));
      setClasses(cls);
    }).catch(() => setLoadError('Could not load subjects and classes. Check your connection and try again.'));
  }, [open]);

  useEffect(() => {
    if (editUser) {
      const tp = editUser.teacherProfile;
      setForm({
        firstName: editUser.firstName ?? '',
        lastName: editUser.lastName ?? '',
        email: editUser.email ?? '',
        password: '',
        phoneNumber: editUser.phoneNumber ?? '',
        role: 'teacher',
        staffNumber: tp?.staffNumber ?? '',
        position: tp?.position ?? '',
        department: tp?.department ?? '',
        qualifications: tp?.qualifications ?? '',
        teachingCertificate: tp?.teachingCertificate ?? '',
        yearsOfExperience: tp?.yearsOfExperience ?? 0,
        gender: (tp?.gender ?? '') as TeacherPayload['gender'],
        subjectAssignments: tp?.subjectAssignments?.map(sa => ({
          subject: typeof sa.subject === 'object' ? (sa.subject?._id ?? '') : sa.subject ?? '',
          classes: (sa.classes ?? []).map(c => typeof c === 'object' ? (c._id ?? '') : c),
        })) ?? [],
      });
    } else {
      setForm(BLANK);
    }
    setError('');
  }, [editUser, open]);

  const set = (key: keyof TeacherPayload, val: any) => setForm(f => ({ ...f, [key]: val }));

  const addSubjectRow = () => setForm(f => ({ ...f, subjectAssignments: [...f.subjectAssignments, { subject: '', classes: [] }] }));
  const removeSubjectRow = (i: number) => setForm(f => ({ ...f, subjectAssignments: f.subjectAssignments.filter((_, j) => j !== i) }));
  const setAssignment = (i: number, key: 'subject' | 'classes', val: any) =>
    setForm(f => ({ ...f, subjectAssignments: f.subjectAssignments.map((a, j) => j === i ? { ...a, [key]: val } : a) }));

  const toggleClass = (assignIdx: number, classId: string) => {
    const cur = form.subjectAssignments[assignIdx]?.classes ?? [];
    const next = cur.includes(classId) ? cur.filter(c => c !== classId) : [...cur, classId];
    setAssignment(assignIdx, 'classes', next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      setError('First name, last name, and email are required.');
      return;
    }
    if (!isEdit && !form.password) {
      setError('Password is required for new teachers.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        ...form,
        yearsOfExperience: Number(form.yearsOfExperience) || 0,
        subjectAssignments: form.subjectAssignments.filter((sa) => sa.subject),
      };
      if (isEdit && !payload.password) delete payload.password;
      if (isEdit) {
        await fetchData(`/admin/users/${editUser.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await fetchData('/admin/users', { method: 'POST', body: JSON.stringify(payload) });
      }
      toast.success(isEdit ? 'Teacher updated successfully.' : 'Teacher created successfully.');
      onSaved();
      onClose();
    } catch (err: any) {
      const msg: string = err.message ?? '';
      const friendly = msg.includes('enum value') && msg.includes('gender')
        ? 'Invalid gender value — please select Male, Female, or Other.'
        : msg.includes('duplicate') || msg.includes('E11000')
          ? 'A user with that email already exists.'
          : msg || 'Failed to save teacher';
      setError(friendly);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 40 }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 520, zIndex: 50,
        background: 'var(--paper)', borderLeft: '1px solid var(--rule)',
        display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--rule-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>
              {isEdit ? 'Edit teacher' : 'Add teacher'}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>
              {isEdit ? "Update this teacher’s account and profile" : 'Create a new teacher account with full details'}
            </p>
          </div>
          <button onClick={onClose} style={{ padding: 6, background: 'transparent', border: '1px solid var(--rule)', borderRadius: 5, cursor: 'pointer', color: 'var(--ink-2)', lineHeight: 0 }}>
            <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l12 12M14 2L2 14" /></svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {loadError && (
            <div style={{ padding: '10px 14px', background: 'var(--gold-soft)', border: '1px solid color-mix(in srgb, var(--gold) 25%, transparent)', borderRadius: 5, color: 'var(--gold-deep)', fontSize: 12.5 }}>{loadError}</div>
          )}

          {/* Account */}
          <section>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--rule-soft)' }}>Account details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="First name" required>
                <input style={inputStyle} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Tendai" />
              </Field>
              <Field label="Last name" required>
                <input style={inputStyle} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Mukamuri" />
              </Field>
              <Field label="Email" required>
                <input style={{ ...inputStyle }} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="teacher@school.ac.zw" />
              </Field>
              <Field label="Phone">
                <input style={inputStyle} value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} placeholder="+263 77…" />
              </Field>
              <Field label={isEdit ? 'New password (leave blank to keep)' : 'Password'} required={!isEdit}>
                <input style={inputStyle} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" autoComplete="new-password" />
              </Field>
              <Field label="Gender">
                <select style={inputStyle} value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">— select —</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
            </div>
          </section>

          {/* Professional */}
          <section>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--rule-soft)' }}>Professional details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Staff number">
                <input style={inputStyle} value={form.staffNumber} onChange={e => set('staffNumber', e.target.value)} placeholder="T-00123" />
              </Field>
              <Field label="Position">
                <input style={inputStyle} value={form.position} onChange={e => set('position', e.target.value)} placeholder="Senior Teacher" />
              </Field>
              <Field label="Department">
                <input style={inputStyle} value={form.department} onChange={e => set('department', e.target.value)} placeholder="Mathematics" />
              </Field>
              <Field label="Years of experience">
                <input style={inputStyle} type="number" min={0} max={50} value={form.yearsOfExperience} onChange={e => set('yearsOfExperience', e.target.value)} />
              </Field>
              <Field label="Qualifications">
                <input style={inputStyle} value={form.qualifications} onChange={e => set('qualifications', e.target.value)} placeholder="B.Ed Mathematics" />
              </Field>
              <Field label="Teaching certificate">
                <input style={inputStyle} value={form.teachingCertificate} onChange={e => set('teachingCertificate', e.target.value)} placeholder="ZIMCHE-2019-003" />
              </Field>
            </div>
          </section>

          {/* Teaching assignments */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--rule-soft)' }}>
              <span style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Teaching assignments</span>
              <button type="button" onClick={addSubjectRow} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--forest-soft)', color: 'var(--forest)', border: '1px solid color-mix(in srgb, var(--forest) 20%, transparent)', borderRadius: 4, cursor: 'pointer', fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit' }}>
                + Add subject
              </button>
            </div>
            {form.subjectAssignments.length === 0 && (
              <p style={{ fontSize: 12.5, color: 'var(--ink-3)', textAlign: 'center', padding: '12px 0' }}>No subjects assigned yet. Click "Add subject" above.</p>
            )}
            {form.subjectAssignments.map((assignment, i) => (
              <div key={i} style={{ background: 'var(--paper-shade)', border: '1px solid var(--rule-soft)', borderRadius: 5, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-2)' }}>Subject {i + 1}</span>
                  <button type="button" onClick={() => removeSubjectRow(i)} style={{ padding: '2px 6px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 4, cursor: 'pointer', color: 'var(--ink-3)', fontSize: 11 }}>Remove</button>
                </div>
                <select
                  style={{ ...inputStyle, marginBottom: 8 }}
                  value={assignment.subject}
                  onChange={e => setAssignment(i, 'subject', e.target.value)}
                >
                  <option value="">— select subject —</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
                </select>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Classes assigned</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {classes.map(c => {
                    const selected = assignment.classes.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleClass(i, c.id)}
                        style={{
                          padding: '3px 9px', borderRadius: 4, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          background: selected ? 'var(--forest-soft)' : 'var(--paper)',
                          color: selected ? 'var(--forest)' : 'var(--ink-3)',
                          border: selected ? '1px solid color-mix(in srgb, var(--forest) 30%, transparent)' : '1px solid var(--rule)',
                        }}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                  {classes.length === 0 && <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>No classes found</span>}
                </div>
              </div>
            ))}
          </section>

          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--terracotta-soft)', border: '1px solid color-mix(in srgb, var(--terracotta) 25%, transparent)', borderRadius: 5, color: 'var(--terracotta)', fontSize: 12.5 }}>
              {error}
            </div>
          )}

          {/* Footer inside form so Enter submits and type="submit" works */}
          <div style={{ paddingTop: 8, borderTop: '1px solid var(--rule-soft)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 5, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '8px 20px', background: saving ? 'var(--forest-soft)' : 'var(--forest)', color: saving ? 'var(--forest)' : '#fbf8f1', border: 0, borderRadius: 5, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create teacher'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default TeacherFormDrawer;
