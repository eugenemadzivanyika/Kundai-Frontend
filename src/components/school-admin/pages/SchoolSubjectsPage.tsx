import React, { useCallback, useEffect, useRef, useState } from 'react';
import { subjectService } from '../../../services/api';

const inputStyle: React.CSSProperties = {
  padding: '8px 10px', background: 'var(--paper-shade)', border: '1px solid var(--rule)',
  borderRadius: 5, color: 'var(--ink-1)', fontFamily: 'inherit', fontSize: 13,
  outline: 'none', width: '100%', boxSizing: 'border-box',
};

const FORM_OPTIONS = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];
const EXAM_BOARDS = ['ZIMSEC', 'CAMBRIDGE'];

interface CreateSubjectForm {
  code: string;
  name: string;
  examBoardCode: string;
  description: string;
  grades: string[];
}

const BLANK_SUBJECT: CreateSubjectForm = { code: '', name: '', examBoardCode: 'ZIMSEC', description: '', grades: [] };

function CreateSubjectModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (subject: any) => void }) {
  const [form, setForm] = useState<CreateSubjectForm>(BLANK_SUBJECT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (open) { setForm(BLANK_SUBJECT); setError(''); } }, [open]);

  const toggleGrade = (g: string) => setForm(f => ({ ...f, grades: f.grades.includes(g) ? f.grades.filter(x => x !== g) : [...f.grades, g] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) { setError('Subject code and name are required.'); return; }
    setSaving(true);
    setError('');
    try {
      const created = await subjectService.createSubject({ ...form });
      onCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create subject');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 460, background: 'var(--paper)', borderRadius: 8, border: '1px solid var(--rule)', zIndex: 50, boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--rule-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>Add subject</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>Create a new subject for your school's curriculum</p>
          </div>
          <button onClick={onClose} style={{ padding: 6, background: 'transparent', border: '1px solid var(--rule)', borderRadius: 5, cursor: 'pointer', color: 'var(--ink-2)', lineHeight: 0 }}>
            <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l12 12M14 2L2 14" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Code <span style={{ color: 'var(--terracotta)' }}>*</span></label>
              <input style={inputStyle} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="MATH" maxLength={10} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name <span style={{ color: 'var(--terracotta)' }}>*</span></label>
              <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Mathematics" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Exam board</label>
            <select style={inputStyle} value={form.examBoardCode} onChange={e => setForm(f => ({ ...f, examBoardCode: e.target.value }))}>
              {EXAM_BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</label>
            <input style={inputStyle} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Form levels</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {FORM_OPTIONS.map(g => {
                const sel = form.grades.includes(g);
                return (
                  <button key={g} type="button" onClick={() => toggleGrade(g)} style={{ padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: sel ? 'var(--forest-soft)' : 'var(--paper-shade)', color: sel ? 'var(--forest)' : 'var(--ink-3)', border: sel ? '1px solid color-mix(in srgb, var(--forest) 30%, transparent)' : '1px solid var(--rule)' }}>{g}</button>
                );
              })}
            </div>
          </div>
          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--terracotta-soft)', borderRadius: 5, color: 'var(--terracotta)', fontSize: 12.5, border: '1px solid color-mix(in srgb, var(--terracotta) 25%, transparent)' }}>{error}</div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 5, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', fontFamily: 'inherit' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '8px 20px', background: saving ? 'var(--forest-soft)' : 'var(--forest)', color: saving ? 'var(--forest)' : '#fbf8f1', border: 0, borderRadius: 5, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
              {saving ? 'Creating…' : 'Create subject'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

interface SyllabusUploadProps {
  subject: any;
  onUploaded: (updated: any) => void;
}
function SyllabusUploadRow({ subject, onUploaded }: SyllabusUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const updated = await subjectService.uploadSyllabus(subject.id, file);
      onUploaded({ ...subject, syllabusFile: updated.syllabusFile });
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleExtract = async () => {
    setExtracting(true);
    try {
      await subjectService.extractAttributes(subject.id);
      alert('Topic extraction started. You\'ll receive a notification when topics are ready.');
    } catch (err: any) {
      alert(err.message ?? 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const hasSyllabus = !!subject.syllabusFile?.url;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {hasSyllabus ? (
        <>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--forest)', fontWeight: 600 }}>
            <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 5l-6 6-3-3" /></svg>
            {subject.syllabusFile.name}
          </span>
          <button onClick={() => inputRef.current?.click()} style={{ padding: '3px 9px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 4, cursor: 'pointer', fontSize: 11, color: 'var(--ink-3)', fontFamily: 'inherit' }}>Replace</button>
          <button onClick={handleExtract} disabled={extracting} style={{ padding: '3px 9px', background: 'var(--plum-soft)', border: '1px solid color-mix(in srgb, var(--plum) 25%, transparent)', borderRadius: 4, cursor: extracting ? 'not-allowed' : 'pointer', fontSize: 11, color: 'var(--plum)', fontWeight: 600, fontFamily: 'inherit' }}>
            {extracting ? 'Starting…' : '✨ Extract topics'}
          </button>
        </>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'var(--gold-soft)', border: '1px solid color-mix(in srgb, var(--gold) 25%, transparent)', borderRadius: 4, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 11.5, color: 'var(--gold-deep)', fontWeight: 600, fontFamily: 'inherit' }}>
          <svg width={11} height={11} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 10V3M5 6l3-3 3 3M3 13h10" /></svg>
          {uploading ? 'Uploading…' : 'Upload syllabus'}
        </button>
      )}
      {uploadError && <span style={{ fontSize: 11, color: 'var(--terracotta)' }}>{uploadError}</span>}
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.odt" style={{ display: 'none' }} onChange={handleFileChange} />
    </div>
  );
}

const SchoolSubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const subs = await subjectService.getSubjects();
      setSubjects(subs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete subject "${name}"? This will unenroll all students from this subject.`)) return;
    try {
      await subjectService.deleteSubject(id);
      setSubjects(s => s.filter(x => x.id !== id));
    } catch (err: any) {
      alert(err.message ?? 'Failed to delete subject');
    }
  };

  const handleSubjectUpdated = (updated: any) => {
    setSubjects(s => s.map(x => x.id === updated.id ? updated : x));
  };

  const filtered = subjects.filter(s =>
    !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.code.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.02em' }}>Subjects</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>
            {subjects.length} subject{subjects.length !== 1 ? 's' : ''} · {subjects.filter(s => s.syllabusFile?.url).length} with syllabus uploaded
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--forest)', color: '#fbf8f1', border: 0, borderRadius: 5, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit' }}>
          <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
          Add subject
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--rule-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
            <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }}>
              <circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" />
            </svg>
            <input placeholder="Search by name or code…" value={q} onChange={e => setQ(e.target.value)} style={{ width: '100%', padding: '7px 10px 7px 30px', background: 'var(--paper-shade)', border: '1px solid var(--rule)', borderRadius: 5, color: 'var(--ink-1)', fontFamily: 'inherit', fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)', marginLeft: 'auto' }}>{filtered.length} subject{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            {q ? 'No subjects match your search.' : 'No subjects yet. Click "Add subject" to create the first one.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Code', 'Name', 'Exam Board', 'Form levels', 'Syllabus', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--rule-soft)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--rule-soft)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-shade)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>{s.code}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink-1)', fontSize: 13 }}>{s.name}</div>
                    {s.description && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{s.description}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ink-3)' }}>{s.examBoardCode || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(s.grades ?? []).slice(0, 4).map((g: string) => (
                        <span key={g} style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10.5, fontWeight: 600, background: 'var(--paper-shade)', color: 'var(--ink-2)' }}>{g}</span>
                      ))}
                      {(s.grades ?? []).length > 4 && <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>+{s.grades.length - 4}</span>}
                      {(s.grades ?? []).length === 0 && <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>—</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <SyllabusUploadRow subject={s} onUploaded={handleSubjectUpdated} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: s.active !== false ? 'var(--forest)' : 'var(--terracotta)', fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', display: 'inline-block' }} />
                      {s.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => handleDelete(s.id, s.name)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 4, cursor: 'pointer', fontSize: 11.5, color: 'var(--terracotta)', fontFamily: 'inherit' }}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateSubjectModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={s => { setSubjects(prev => [s, ...prev]); }} />
    </div>
  );
};

export default SchoolSubjectsPage;
