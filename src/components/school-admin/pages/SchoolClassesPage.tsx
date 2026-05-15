import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classService, ClassItem } from '../../../services/classService';
import { adminService } from '../../../services/api';
import { useToast } from '../../ui/use-toast';

const inputStyle: React.CSSProperties = {
  padding: '8px 10px', background: 'var(--paper-shade)', border: '1px solid var(--rule)',
  borderRadius: 5, color: 'var(--ink-1)', fontFamily: 'inherit', fontSize: 13,
  outline: 'none', width: '100%', boxSizing: 'border-box',
};

interface CreateClassForm {
  gradeLevel: string;
  stream: string;
  homeroomTeacherId: string;
}

function CreateClassModal({ open, teachers, onClose, onCreated }: {
  open: boolean;
  teachers: any[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CreateClassForm>({ gradeLevel: 'Form 1', stream: '', homeroomTeacherId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setForm({ gradeLevel: 'Form 1', stream: '', homeroomTeacherId: '' }); setError(''); }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stream = form.stream.trim();
    if (!form.gradeLevel || !stream) { setError('Grade level and stream are required.'); return; }
    setSaving(true);
    setError('');
    try {
      await classService.createClass({
        code: stream,
        gradeLevel: form.gradeLevel,
        academicYear: String(new Date().getFullYear()),
        homeroomTeacherId: form.homeroomTeacherId || undefined,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create class');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 420, background: 'var(--paper)', borderRadius: 8, border: '1px solid var(--rule)', zIndex: 50, boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--rule-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>New class</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>Create a class group for a form level and stream</p>
          </div>
          <button onClick={onClose} style={{ padding: 6, background: 'transparent', border: '1px solid var(--rule)', borderRadius: 5, cursor: 'pointer', color: 'var(--ink-2)', lineHeight: 0 }}>
            <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l12 12M14 2L2 14" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Form level <span style={{ color: 'var(--terracotta)' }}>*</span></label>
            <select style={inputStyle} value={form.gradeLevel} onChange={e => setForm(f => ({ ...f, gradeLevel: e.target.value }))}>
              {[1,2,3,4,5,6].map(n => <option key={n} value={`Form ${n}`}>Form {n}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stream / Section <span style={{ color: 'var(--terracotta)' }}>*</span></label>
            <input
              style={inputStyle}
              placeholder="e.g. A, B, Lions, 1, 2…"
              value={form.stream}
              onChange={e => setForm(f => ({ ...f, stream: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Form / Class teacher</label>
            <select style={inputStyle} value={form.homeroomTeacherId} onChange={e => setForm(f => ({ ...f, homeroomTeacherId: e.target.value }))}>
              <option value="">— select teacher —</option>
              {teachers.map((t: any) => {
                const name = `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim();
                return <option key={t.id} value={t.id}>{name}</option>;
              })}
            </select>
          </div>
          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--terracotta-soft)', borderRadius: 5, color: 'var(--terracotta)', fontSize: 12.5, border: '1px solid color-mix(in srgb, var(--terracotta) 25%, transparent)' }}>{error}</div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 5, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', fontFamily: 'inherit' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '8px 20px', background: saving ? 'var(--forest-soft)' : 'var(--forest)', color: saving ? 'var(--forest)' : '#fbf8f1', border: 0, borderRadius: 5, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
              {saving ? 'Creating…' : 'Create class'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function ClassCard({
  cls,
  teachers,
  onDelete,
  onUpdated,
}: {
  cls: ClassItem;
  teachers: any[];
  onDelete: (id: string) => void;
  onUpdated: () => void;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const formNum = parseInt(cls.gradeLevel?.replace('Form ', '') ?? '');
  const level = Number.isFinite(formNum) && formNum >= 5 ? 'A-Level' : 'O-Level';
  const levelTone = level === 'O-Level' ? 'forest' : 'plum';
  const teacher = cls.homeroomTeacher ? `${cls.homeroomTeacher.firstName ?? ''} ${cls.homeroomTeacher.lastName ?? ''}`.trim() : null;

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState(cls.homeroomTeacher?.id ?? '');
  const [assigning, setAssigning] = useState(false);

  const handleAssignTeacher = async () => {
    setAssigning(true);
    try {
      await classService.updateClass(cls.id, {
        homeroomTeacherId: selectedTeacherId || undefined,
        clearHomeroomTeacher: !selectedTeacherId,
      });
      toast.success('Form teacher updated.');
      setAssignOpen(false);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update teacher');
    } finally {
      setAssigning(false);
    }
  };

  const studentCount = cls.studentCount ?? 0;
  const subjectCount = cls.courses?.length ?? 0;

  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 6, padding: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.015em' }}>{cls.name}</div>
          {cls.academicYear && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Year {cls.academicYear}</div>}
        </div>
        <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `var(--${levelTone}-soft)`, color: `var(--${levelTone})` }}>{level}</span>
      </div>

      {/* Form teacher row */}
      {!assignOpen ? (
        teacher ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--paper-shade)', borderRadius: 5, marginBottom: 12 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--plum-soft)', color: 'var(--plum)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {teacher.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Form teacher</div>
              <div style={{ fontSize: 12, color: 'var(--ink-1)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teacher}</div>
            </div>
            <button
              onClick={() => { setSelectedTeacherId(cls.homeroomTeacher?.id ?? ''); setAssignOpen(true); }}
              style={{ padding: '2px 7px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 4, cursor: 'pointer', fontSize: 10.5, color: 'var(--ink-3)', fontFamily: 'inherit', flexShrink: 0 }}>
              Change
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--gold-soft)', borderRadius: 5, marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, color: 'var(--gold-deep)', fontWeight: 600, flex: 1 }}>No form teacher assigned</span>
            <button
              onClick={() => { setSelectedTeacherId(''); setAssignOpen(true); }}
              style={{ padding: '2px 7px', background: 'var(--gold-deep)', border: 0, borderRadius: 4, cursor: 'pointer', fontSize: 10.5, color: '#fff', fontFamily: 'inherit', fontWeight: 600, flexShrink: 0 }}>
              Assign
            </button>
          </div>
        )
      ) : (
        <div style={{ padding: '8px 10px', background: 'var(--paper-shade)', border: '1px solid var(--rule-soft)', borderRadius: 5, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select
            style={{ ...inputStyle, fontSize: 12 }}
            value={selectedTeacherId}
            onChange={e => setSelectedTeacherId(e.target.value)}
          >
            <option value="">— no teacher —</option>
            {teachers.map((t: any) => (
              <option key={t.id} value={t.id}>{`${t.firstName ?? ''} ${t.lastName ?? ''}`.trim()}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleAssignTeacher}
              disabled={assigning}
              style={{ flex: 1, padding: '5px 0', background: 'var(--forest)', color: '#fbf8f1', border: 0, borderRadius: 4, cursor: assigning ? 'not-allowed' : 'pointer', fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit' }}>
              {assigning ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setAssignOpen(false)}
              style={{ padding: '5px 10px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 4, cursor: 'pointer', fontSize: 11.5, color: 'var(--ink-2)', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats — clickable for drill-down */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 10, borderTop: '1px solid var(--rule-soft)' }}>
        <button
          onClick={() => studentCount > 0 ? navigate(`/admin/students?classId=${cls.id}`) : undefined}
          title={studentCount === 0 ? 'No students yet' : `View ${studentCount} students`}
          style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: studentCount > 0 ? 'pointer' : 'default' }}>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Students</div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700, color: studentCount > 0 ? 'var(--forest)' : 'var(--ink-1)', marginTop: 2, fontFeatureSettings: "'tnum' 1", textDecoration: studentCount > 0 ? 'underline' : 'none', textDecorationStyle: 'dotted', textUnderlineOffset: 2 }}>{studentCount}</div>
        </button>
        <button
          onClick={() => subjectCount > 0 ? navigate(`/admin/subjects?classId=${cls.id}`) : undefined}
          title={subjectCount === 0 ? 'No subjects yet' : `View ${subjectCount} subjects`}
          style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: subjectCount > 0 ? 'pointer' : 'default' }}>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subjects</div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700, color: subjectCount > 0 ? 'var(--plum)' : 'var(--ink-1)', marginTop: 2, fontFeatureSettings: "'tnum' 1", textDecoration: subjectCount > 0 ? 'underline' : 'none', textDecorationStyle: 'dotted', textUnderlineOffset: 2 }}>{subjectCount}</div>
        </button>
      </div>

      <button
        onClick={() => onDelete(cls.id)}
        style={{ position: 'absolute', top: 10, right: 10, padding: '2px 6px', background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--ink-3)', fontSize: 11, borderRadius: 4 }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--terracotta)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--ink-3)')}>
        ✕
      </button>
    </div>
  );
}

const SchoolClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [cls, users] = await Promise.all([
        classService.getClasses(),
        adminService.getUsers(),
      ]);
      setClasses(cls);
      setTeachers((users as { id: string; firstName: string; lastName: string; roles?: string[]; role?: string }[]).filter(u => u.roles?.includes('teacher') || u.role === 'teacher'));
    } catch (err: any) {
      setLoadError(err.message ?? 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    const cls = classes.find(c => c.id === id);
    if (!window.confirm(`Delete class "${cls?.name}"? Students will be detached, and any courses linked only to this class will lose their class assignment. This cannot be undone.`)) return;
    setDeleteError(null);
    try {
      await classService.deleteClass(id);
      await load();
    } catch (err: any) {
      setDeleteError(err.message ?? 'Failed to delete class');
    }
  };

  const oLevel = classes.filter(c => {
    const f = parseInt(c.gradeLevel?.replace('Form ', '') ?? '');
    return Number.isFinite(f) && f >= 1 && f <= 4;
  });
  const aLevel = classes.filter(c => {
    const f = parseInt(c.gradeLevel?.replace('Form ', '') ?? '');
    return Number.isFinite(f) && f >= 5;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.02em' }}>Classes</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>
            {classes.length} class group{classes.length !== 1 ? 's' : ''} · {oLevel.length} O-Level · {aLevel.length} A-Level
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--forest)', color: '#fbf8f1', border: 0, borderRadius: 5, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit' }}>
          <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
          New class
        </button>
      </div>

      {deleteError && (
        <div style={{ padding: '12px 16px', background: 'var(--terracotta-soft)', border: '1px solid color-mix(in srgb, var(--terracotta) 25%, transparent)', borderRadius: 7, color: 'var(--terracotta)', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><strong>Error</strong> — {deleteError}</span>
          <button onClick={() => setDeleteError(null)} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--terracotta)', fontSize: 16, lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
      )}

      {loadError ? (
        <div style={{ padding: '20px 24px', background: 'var(--terracotta-soft)', border: '1px solid color-mix(in srgb, var(--terracotta) 25%, transparent)', borderRadius: 7, color: 'var(--terracotta)', fontSize: 13 }}>
          <strong>Failed to load</strong> — {loadError}
          <button onClick={load} style={{ marginLeft: 16, padding: '4px 12px', background: 'var(--terracotta)', color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Retry</button>
        </div>
      ) : loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>
      ) : classes.length === 0 ? (
        <div style={{ padding: '48px 20px', textAlign: 'center', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, color: 'var(--ink-3)', fontSize: 13 }}>
          No classes yet. Click "New class" to create your first class group.
        </div>
      ) : (
        <>
          {oLevel.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 17, fontWeight: 700, color: 'var(--ink-1)' }}>O-Level</h2>
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Form 1–4 · {oLevel.length} class{oLevel.length !== 1 ? 'es' : ''} · {oLevel.reduce((a, c) => a + (c.studentCount ?? 0), 0)} students</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {oLevel.map(c => <ClassCard key={c.id} cls={c} teachers={teachers} onDelete={handleDelete} onUpdated={load} />)}
              </div>
            </div>
          )}
          {aLevel.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 17, fontWeight: 700, color: 'var(--ink-1)' }}>A-Level</h2>
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Form 5–6 · {aLevel.length} class{aLevel.length !== 1 ? 'es' : ''} · {aLevel.reduce((a, c) => a + (c.studentCount ?? 0), 0)} students</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {aLevel.map(c => <ClassCard key={c.id} cls={c} teachers={teachers} onDelete={handleDelete} onUpdated={load} />)}
              </div>
            </div>
          )}
          {oLevel.length === 0 && aLevel.length === 0 && classes.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {classes.map(c => <ClassCard key={c.id} cls={c} teachers={teachers} onDelete={handleDelete} onUpdated={load} />)}
            </div>
          )}
        </>
      )}

      <CreateClassModal open={createOpen} teachers={teachers} onClose={() => setCreateOpen(false)} onCreated={load} />
    </div>
  );
};

export default SchoolClassesPage;
