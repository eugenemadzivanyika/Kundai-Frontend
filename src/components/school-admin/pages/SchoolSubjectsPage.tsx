import React, { useCallback, useEffect, useRef, useState } from 'react';
import { subjectService } from '../../../services/api';
import { SubjectRow } from '../types/schoolAdmin';

const inputStyle: React.CSSProperties = {
  padding: '8px 10px', background: 'var(--paper-shade)', border: '1px solid var(--rule)',
  borderRadius: 5, color: 'var(--ink-1)', fontFamily: 'inherit', fontSize: 13,
  outline: 'none', width: '100%', boxSizing: 'border-box',
};

const FORM_OPTIONS = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];
const EXAM_BOARDS = ['ZIMSEC', 'CAMBRIDGE'];

interface SubjectForm {
  code: string;
  name: string;
  examBoardCode: string;
  description: string;
  grades: string[];
}

const BLANK_SUBJECT: SubjectForm = { code: '', name: '', examBoardCode: 'ZIMSEC', description: '', grades: [] };

function SubjectFormModal({
  open,
  editSubject,
  onClose,
  onSaved,
}: {
  open: boolean;
  editSubject?: SubjectRow | null;
  onClose: () => void;
  onSaved: (subject: any) => void;
}) {
  const [form, setForm] = useState<SubjectForm>(BLANK_SUBJECT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!editSubject;

  useEffect(() => {
    if (open) {
      if (editSubject) {
        setForm({
          code: editSubject.code,
          name: editSubject.name,
          examBoardCode: editSubject.examBoardCode || 'ZIMSEC',
          description: editSubject.description || '',
          grades: editSubject.grades || [],
        });
      } else {
        setForm(BLANK_SUBJECT);
      }
      setError('');
    }
  }, [open, editSubject]);

  const toggleGrade = (g: string) => setForm(f => ({ ...f, grades: f.grades.includes(g) ? f.grades.filter(x => x !== g) : [...f.grades, g] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) { setError('Subject code and name are required.'); return; }
    setSaving(true);
    setError('');
    try {
      let result: any;
      if (isEdit) {
        result = await subjectService.updateSubject(editSubject!.id, { ...form });
      } else {
        result = await subjectService.createSubject({ ...form });
      }
      onSaved(result);
      onClose();
    } catch (err: any) {
      setError(err.message ?? `Failed to ${isEdit ? 'update' : 'create'} subject`);
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
            <h2 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>{isEdit ? 'Edit subject' : 'Add subject'}</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>{isEdit ? "Update this subject's details" : "Create a new subject for your school's curriculum"}</p>
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
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create subject'}
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractQueued, setExtractQueued] = useState(false);
  const [confirmReextract, setConfirmReextract] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [extractError, setExtractError] = useState('');

  const topicCount: number = subject.topicCount ?? 0;
  const hasSyllabus = !!subject.syllabusFile?.url;
  const hasTopics = topicCount > 0;

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const stopPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopPoll();
    setUploading(true);
    setUploadError('');
    try {
      const updated = await subjectService.uploadSyllabus(subject.id, file);
      onUploaded({ ...subject, syllabusFile: updated.syllabusFile });
      setExtractQueued(false);
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const doExtract = async () => {
    setConfirmReextract(false);
    setExtracting(true);
    stopPoll();
    setExtractQueued(false);
    setExtractError('');
    try {
      await subjectService.extractAttributes(subject.id);
      setExtractQueued(true);
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const subs: any[] = await subjectService.getSubjects();
          const updated = subs.find(s => s.id === subject.id);
          if (updated && (updated.topicCount ?? 0) > 0) {
            stopPoll();
            setExtractQueued(false);
            onUploaded(updated);
          } else if (attempts >= 20) {
            stopPoll();
            setExtractQueued(false);
            setExtractError('Extraction is taking longer than expected — refresh the page to check results.');
          }
        } catch { /* poll silently */ }
      }, 15_000);
    } catch (err: any) {
      setExtractError(err.message ?? 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const handleExtractClick = () => {
    if (hasTopics && !extractQueued) {
      setConfirmReextract(true);
    } else {
      doExtract();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {hasSyllabus ? (
          <>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--forest)', fontWeight: 600 }}>
              <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 5l-6 6-3-3" /></svg>
              {subject.syllabusFile.name}
            </span>
            <button onClick={() => inputRef.current?.click()} style={{ padding: '3px 9px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 4, cursor: 'pointer', fontSize: 11, color: 'var(--ink-3)', fontFamily: 'inherit' }}>Replace</button>

            {hasTopics && !extractQueued && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'var(--forest-soft)', color: 'var(--forest)' }}>
                <svg width={10} height={10} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 5l-6 6-3-3" /></svg>
                {topicCount} topic{topicCount !== 1 ? 's' : ''} extracted
              </span>
            )}

            <button
              onClick={handleExtractClick}
              disabled={extracting || extractQueued}
              style={{ padding: '3px 9px', background: 'var(--plum-soft)', border: '1px solid color-mix(in srgb, var(--plum) 25%, transparent)', borderRadius: 4, cursor: (extracting || extractQueued) ? 'not-allowed' : 'pointer', fontSize: 11, color: 'var(--plum)', fontWeight: 600, fontFamily: 'inherit', opacity: (extracting || extractQueued) ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              {(extracting || extractQueued) && (
                <svg width={10} height={10} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.05 3.05l2.12 2.12M10.83 10.83l2.12 2.12M3.05 12.95l2.12-2.12M10.83 5.17l2.12-2.12" />
                </svg>
              )}
              {extracting ? 'Starting…' : extractQueued ? 'Extracting…' : hasTopics ? '↺ Re-extract' : '✨ Extract topics'}
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

      {confirmReextract && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--gold-soft)', border: '1px solid color-mix(in srgb, var(--gold) 35%, transparent)', borderRadius: 5, fontSize: 11.5 }}>
          <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="var(--gold-deep)" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1l7 14H1L8 1zM8 6v4M8 11.5v.5" /></svg>
          <span style={{ color: 'var(--gold-deep)' }}>This will replace the existing {topicCount} topic{topicCount !== 1 ? 's' : ''}. Continue?</span>
          <button onClick={doExtract} style={{ padding: '2px 10px', background: 'var(--gold-deep)', color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>Re-extract</button>
          <button onClick={() => setConfirmReextract(false)} style={{ padding: '2px 8px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 4, cursor: 'pointer', fontSize: 11, color: 'var(--ink-2)', fontFamily: 'inherit' }}>Cancel</button>
        </div>
      )}

      {extractError && <span style={{ fontSize: 11, color: 'var(--terracotta)' }}>{extractError}</span>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function SubjectDetailPanel({ subject }: { subject: SubjectRow }) {
  const teachers = subject.teachersList ?? [];
  const classes = subject.classGroupsList ?? [];

  if (teachers.length === 0 && classes.length === 0) {
    return (
      <div style={{ padding: '12px 16px 12px 48px', background: 'var(--paper-shade)', borderTop: '1px solid var(--rule-soft)', fontSize: 12, color: 'var(--ink-3)' }}>
        No teachers or classes assigned yet.
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 16px 12px 48px', background: 'var(--paper-shade)', borderTop: '1px solid var(--rule-soft)', display: 'flex', gap: 32 }}>
      {teachers.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Teachers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {teachers.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-1)' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--plum-soft)', color: 'var(--plum)', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                  {`${t.firstName[0] ?? ''}${t.lastName[0] ?? ''}`.toUpperCase()}
                </div>
                {`${t.firstName} ${t.lastName}`.trim()}
              </div>
            ))}
          </div>
        </div>
      )}
      {classes.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Classes enrolled</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {classes.map(c => (
              <span key={c.id} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'var(--forest-soft)', color: 'var(--forest)' }}>{c.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const SchoolSubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<SubjectRow | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const subs = await subjectService.getSubjects();
      setSubjects(subs);
    } catch (err: any) {
      setLoadError(err.message ?? 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete subject "${name}"? This will unenroll all students from this subject. This cannot be undone.`)) return;
    setDeleteError(null);
    try {
      await subjectService.deleteSubject(id);
      setSubjects(s => s.filter(x => x.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err: any) {
      setDeleteError(err.message ?? 'Failed to delete subject');
    }
  };

  const handleSubjectSaved = (updated: any) => {
    setSubjects(s => {
      const idx = s.findIndex(x => x.id === updated.id);
      if (idx >= 0) {
        const copy = [...s];
        copy[idx] = { ...s[idx], ...updated };
        return copy;
      }
      return [updated, ...s];
    });
  };

  const openAdd = () => { setEditSubject(null); setModalOpen(true); };
  const openEdit = (s: SubjectRow) => { setEditSubject(s); setModalOpen(true); };

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
          onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--forest)', color: '#fbf8f1', border: 0, borderRadius: 5, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit' }}>
          <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
          Add subject
        </button>
      </div>

      {deleteError && (
        <div style={{ padding: '12px 16px', background: 'var(--terracotta-soft)', border: '1px solid color-mix(in srgb, var(--terracotta) 25%, transparent)', borderRadius: 7, color: 'var(--terracotta)', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><strong>Error</strong> — {deleteError}</span>
          <button onClick={() => setDeleteError(null)} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--terracotta)', fontSize: 16, lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
      )}

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

        {loadError ? (
          <div style={{ padding: '20px 24px', background: 'var(--terracotta-soft)', border: '1px solid color-mix(in srgb, var(--terracotta) 25%, transparent)', borderRadius: 7, color: 'var(--terracotta)', fontSize: 13, margin: 16 }}>
            <strong>Failed to load</strong> — {loadError}
            <button onClick={load} style={{ marginLeft: 16, padding: '4px 12px', background: 'var(--terracotta)', color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Retry</button>
          </div>
        ) : loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            {q ? 'No subjects match your search.' : 'No subjects yet. Click "Add subject" to create the first one.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['', 'Code', 'Name', 'Exam Board', 'Form levels', 'Syllabus', 'Status', ''].map((h, i) => (
                  <th key={i} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--rule-soft)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const isExpanded = expandedId === s.id;
                const hasDetail = (s.teachersList?.length ?? 0) > 0 || (s.classGroupsList?.length ?? 0) > 0;
                return (
                  <React.Fragment key={s.id}>
                    <tr
                      style={{ borderBottom: (!isExpanded && i < filtered.length - 1) ? '1px solid var(--rule-soft)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-shade)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      {/* Expand toggle */}
                      <td style={{ padding: '12px 8px 12px 16px', width: 28 }}>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : s.id)}
                          title={isExpanded ? 'Hide detail' : 'Show teachers & classes'}
                          style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--ink-3)', padding: 2, lineHeight: 0, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                          <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4l4 4-4 4" /></svg>
                        </button>
                      </td>
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
                        <SyllabusUploadRow subject={s} onUploaded={updated => setSubjects(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x))} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: s.active !== false ? 'var(--forest)' : 'var(--terracotta)', fontWeight: 600 }}>
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', display: 'inline-block' }} />
                          {s.active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => openEdit(s)}
                            style={{ padding: '3px 10px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 4, cursor: 'pointer', fontSize: 11.5, color: 'var(--ink-2)', fontFamily: 'inherit', fontWeight: 600 }}>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            style={{ padding: '3px 10px', background: 'transparent', border: '1px solid color-mix(in srgb, var(--terracotta) 40%, transparent)', borderRadius: 4, cursor: 'pointer', fontSize: 11.5, color: 'var(--terracotta)', fontFamily: 'inherit', fontWeight: 600 }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} style={{ padding: 0, borderBottom: i < filtered.length - 1 ? '1px solid var(--rule-soft)' : 'none' }}>
                          <SubjectDetailPanel subject={s} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <SubjectFormModal
        open={modalOpen}
        editSubject={editSubject}
        onClose={() => setModalOpen(false)}
        onSaved={handleSubjectSaved}
      />
    </div>
  );
};

export default SchoolSubjectsPage;
