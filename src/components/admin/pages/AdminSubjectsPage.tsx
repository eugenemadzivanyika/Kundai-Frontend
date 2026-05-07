import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileText,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { authService, subjectService } from '../../../services/api';
import { SyllabusFile, SubjectResource } from '../../../services/subjectService';
import AdminSectionHeader from '../components/AdminSectionHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { useToast } from '../../ui/use-toast';
import AdminConfirmDialog from '../components/AdminConfirmDialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubjectRow {
  id: string;
  code: string;
  name: string;
  examBoardCode?: string;
  description?: string;
  active?: boolean;
  grades?: string[];
  teachers?: string[];
  syllabusFile: SyllabusFile | null;
  subjectResources: SubjectResource[];
}

interface SubjectFormState {
  code: string;
  name: string;
  examBoardCode: string;
  description: string;
  grades: string[];
  active: boolean;
}

type ModalTab = 'details' | 'syllabus' | 'resources';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const defaultForm: SubjectFormState = {
  code: '',
  name: '',
  examBoardCode: '',
  description: '',
  grades: [],
  active: true,
};

const EXAM_BOARD_OPTIONS = [
  { label: 'ZIMSEC', value: 'ZIMSEC' },
  { label: 'CAMBRIDGE', value: 'CAMBRIDGE' },
];

const FORM_OPTIONS = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];

const ACCEPTED_SYLLABUS = '.pdf,.doc,.docx,.odt';
const ACCEPTED_RESOURCES = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.zip';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📈';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('video')) return '🎬';
  return '📎';
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SubjectTableSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="grid grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((__, j) => (
          <div key={j} className="h-9 rounded bg-slate-200 animate-pulse" />
        ))}
      </div>
    ))}
  </div>
);

const SyllabusBadge: React.FC<{ subject: SubjectRow }> = ({ subject }) =>
  subject.syllabusFile ? (
    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Uploaded
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <AlertTriangle className="w-3 h-3" /> Missing
    </span>
  );

// Upload drop-zone component
interface FileDropZoneProps {
  accept: string;
  uploading: boolean;
  label: string;
  hint?: string;
  onFile: (file: File) => void;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ accept, uploading, label, hint, onFile }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
        dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
      } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <Upload className="w-8 h-8 text-gray-400" />
      <p className="text-sm font-medium text-gray-700">{uploading ? 'Uploading…' : label}</p>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { onFile(f); e.target.value = ''; } }}
        disabled={uploading}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const AdminSubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [form, setForm] = useState<SubjectFormState>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<SubjectRow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab>('details');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingSyllabus, setUploadingSyllabus] = useState(false);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [extractingAttributes, setExtractingAttributes] = useState(false);
  const [lastExtractResult, setLastExtractResult] = useState(false);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectRow | null>(null);
  const [codeFilter, setCodeFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const { toast } = useToast();

  const currentUser = authService.getCurrentUser();
  const isAdmin = !!currentUser?.isAdmin || currentUser?.role === 'admin';

  const gradeOptions = useMemo(() =>
    Array.from(new Set(subjects.flatMap((s) => s.grades || []).filter(Boolean))).sort(),
    [subjects]
  );

  const teacherOptions = useMemo(() =>
    Array.from(new Set(subjects.flatMap((s) => s.teachers || []).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [subjects]
  );

  const filteredSubjects = useMemo(() => {
    const nc = codeFilter.trim().toLowerCase();
    const nn = nameFilter.trim().toLowerCase();
    return subjects
      .filter((s) => {
        const active = s.active !== false;
        return (
          (!nc || s.code.toLowerCase().includes(nc)) &&
          (!nn || s.name.toLowerCase().includes(nn)) &&
          (statusFilter === 'all' || (statusFilter === 'active' && active) || (statusFilter === 'inactive' && !active)) &&
          (gradeFilter === 'all' || (s.grades || []).includes(gradeFilter)) &&
          (teacherFilter === 'all' || (s.teachers || []).includes(teacherFilter))
        );
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [subjects, codeFilter, nameFilter, statusFilter, gradeFilter, teacherFilter]);

  const missingSyllabus = useMemo(
    () => subjects.filter((s) => s.active !== false && !s.syllabusFile).length,
    [subjects]
  );

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const data = await subjectService.getSubjects();
      const mapped = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: item.id,
        code: item.code || '',
        name: item.name || '',
        examBoardCode: item.examBoardCode || '',
        description: item.description || '',
        active: item.active !== false,
        grades: Array.isArray(item.grades) ? item.grades : [],
        teachers: Array.isArray(item.teachers) ? item.teachers : [],
        syllabusFile: item.syllabusFile || null,
        subjectResources: Array.isArray(item.subjectResources) ? item.subjectResources : [],
      }));
      setSubjects(mapped);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadSubjects();
  }, [isAdmin]);

  const onChange = <K extends keyof SubjectFormState>(key: K, value: SubjectFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openCreateModal = () => {
    setEditingId(null);
    setEditingSubject(null);
    setForm(defaultForm);
    setModalTab('details');
    setIsFormOpen(true);
  };

  const openEditModal = (subject: SubjectRow) => {
    setEditingId(subject.id);
    setEditingSubject(subject);
    setForm({
      code: subject.code,
      name: subject.name,
      examBoardCode: subject.examBoardCode || '',
      description: subject.description || '',
      grades: subject.grades || [],
      active: subject.active !== false,
    });
    setModalTab('details');
    setIsFormOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Subject code and name are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        examBoardCode: form.examBoardCode.trim() || undefined,
        description: form.description.trim() || undefined,
        grades: form.grades,
        active: form.active,
      };

      let newId = editingId;
      if (editingId) {
        await subjectService.updateSubject(editingId, payload);
        toast.success('Subject updated.');
      } else {
        const created = await subjectService.createSubject(payload);
        newId = created.id;
        toast.success('Subject created.');
      }

      await loadSubjects();

      // After create, stay open on syllabus tab with a nudge
      if (!editingId && newId) {
        const fresh = (await subjectService.getSubjects()).find((s: { id: string }) => s.id === newId);
        if (fresh) {
          setEditingId(newId);
          setEditingSubject({
            id: fresh.id,
            code: fresh.code,
            name: fresh.name,
            examBoardCode: fresh.examBoardCode || '',
            description: fresh.description || '',
            active: fresh.active !== false,
            grades: fresh.grades || [],
            teachers: fresh.teachers || [],
            syllabusFile: fresh.syllabusFile || null,
            subjectResources: fresh.subjectResources || [],
          });
          setModalTab('syllabus');
          toast.error('Syllabus not yet uploaded — please add it on the Syllabus tab.');
          return;
        }
      }

      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleSyllabusUpload = async (file: File) => {
    if (!editingId) return;
    setUploadingSyllabus(true);
    try {
      const result = await subjectService.uploadSyllabus(editingId, file);
      setSubjects((prev) =>
        prev.map((s) => s.id === editingId ? { ...s, syllabusFile: result.syllabusFile } : s)
      );
      setEditingSubject((prev) => prev ? { ...prev, syllabusFile: result.syllabusFile } : prev);
      toast.success('Syllabus uploaded successfully.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload syllabus');
    } finally {
      setUploadingSyllabus(false);
    }
  };

  const handleSyllabusDelete = async () => {
    if (!editingId) return;
    setUploadingSyllabus(true);
    try {
      await subjectService.deleteSyllabus(editingId);
      setSubjects((prev) =>
        prev.map((s) => s.id === editingId ? { ...s, syllabusFile: null } : s)
      );
      setEditingSubject((prev) => prev ? { ...prev, syllabusFile: null } : prev);
      toast.success('Syllabus removed.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove syllabus');
    } finally {
      setUploadingSyllabus(false);
    }
  };

  const handleExtractAttributes = async () => {
    if (!editingId) return;
    setExtractingAttributes(true);
    setLastExtractResult(null);
    try {
      await subjectService.extractAttributes(editingId);
      setLastExtractResult(true);
      toast.success('Extraction started — you\'ll receive a notification when the topics are ready.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start extraction');
    } finally {
      setExtractingAttributes(false);
    }
  };

  const handleResourceUpload = async (file: File) => {
    if (!editingId) return;
    setUploadingResource(true);
    try {
      const newRes = await subjectService.uploadResource(editingId, file);
      setSubjects((prev) =>
        prev.map((s) => s.id === editingId ? { ...s, subjectResources: [...s.subjectResources, newRes] } : s)
      );
      setEditingSubject((prev) =>
        prev ? { ...prev, subjectResources: [...prev.subjectResources, newRes] } : prev
      );
      toast.success('Resource uploaded.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload resource');
    } finally {
      setUploadingResource(false);
    }
  };

  const handleResourceDelete = async (resourceId: string) => {
    if (!editingId) return;
    setDeletingResourceId(resourceId);
    try {
      await subjectService.deleteResource(editingId, resourceId);
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? { ...s, subjectResources: s.subjectResources.filter((r) => r._id !== resourceId) }
            : s
        )
      );
      setEditingSubject((prev) =>
        prev ? { ...prev, subjectResources: prev.subjectResources.filter((r) => r._id !== resourceId) } : prev
      );
      toast.success('Resource removed.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove resource');
    } finally {
      setDeletingResourceId(null);
    }
  };

  const deleteSubject = async () => {
    if (!subjectToDelete) return;
    setSaving(true);
    try {
      await subjectService.deleteSubject(subjectToDelete.id);
      toast.success('Subject deleted.');
      setSubjectToDelete(null);
      await loadSubjects();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete subject');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-4">
        <div className="flex items-center gap-2 text-red-600 font-semibold mb-2">
          <AlertCircle className="w-5 h-5" /> Access Denied
        </div>
        <p className="text-gray-600">This page is available to administrators only.</p>
      </div>
    );
  }

  const MODAL_TABS: { id: ModalTab; label: string; disabled?: boolean }[] = [
    { id: 'details', label: 'Details' },
    { id: 'syllabus', label: 'Syllabus', disabled: !editingId },
    { id: 'resources', label: 'Resources', disabled: !editingId },
  ];

  return (
    <div className="space-y-4 mt-4">
      <AdminSectionHeader
        title="Subject Management"
        description="Maintain the subject catalog used by classes, plans, and assessments."
        icon={BookOpen}
      />

      {/* Global syllabus warning banner */}
      {missingSyllabus > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-800">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" />
          <span>
            <strong>{missingSyllabus} active subject{missingSyllabus > 1 ? 's are' : ' is'} missing a syllabus.</strong>
            {' '}Open each subject and upload the syllabus document on the <em>Syllabus</em> tab.
          </span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Subject Records</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadSubjects}
              disabled={loading}
              className="inline-flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md"
            >
              <Plus className="w-4 h-4" />
              Create Subject
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          <input className="border rounded-md px-3 py-2 text-sm" placeholder="Filter by code" value={codeFilter} onChange={(e) => setCodeFilter(e.target.value)} />
          <input className="border rounded-md px-3 py-2 text-sm" placeholder="Filter by name" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
          <select className="border rounded-md px-3 py-2 text-sm" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
            <option value="all">All Grades</option>
            {gradeOptions.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="border rounded-md px-3 py-2 text-sm" value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}>
            <option value="all">All Teachers</option>
            {teacherOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="border rounded-md px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <SubjectTableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b text-gray-600">
                  <th className="py-2 px-3 font-medium">Code</th>
                  <th className="py-2 px-3 font-medium">Name</th>
                  <th className="py-2 px-3 font-medium">Exam Board</th>
                  <th className="py-2 px-3 font-medium">Grades</th>
                  <th className="py-2 px-3 font-medium">Syllabus</th>
                  <th className="py-2 px-3 font-medium">Resources</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 px-3 font-mono font-medium">{subject.code || '—'}</td>
                    <td className="py-2 px-3">{subject.name || '—'}</td>
                    <td className="py-2 px-3">{subject.examBoardCode || '—'}</td>
                    <td className="py-2 px-3">{subject.grades?.length ? subject.grades.join(', ') : '—'}</td>
                    <td className="py-2 px-3">
                      <SyllabusBadge subject={subject} />
                    </td>
                    <td className="py-2 px-3">
                      {subject.subjectResources.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                          <Paperclip className="w-3 h-3" /> {subject.subjectResources.length}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">None</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {subject.active === false ? (
                        <span className="text-red-600 text-xs font-medium">Inactive</span>
                      ) : (
                        <span className="text-green-600 text-xs font-medium">Active</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(subject)}
                          className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-1 text-xs"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubjectToDelete(subject)}
                          className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1 text-xs"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSubjects.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400 text-sm">No subjects found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subject form modal */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setIsFormOpen(false); setLastExtractResult(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? `Edit Subject — ${editingSubject?.code || ''}` : 'Create Subject'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update subject details, syllabus, and resource materials.' : 'Add a new subject to the catalog.'}
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b mb-4">
            {MODAL_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={t.disabled}
                onClick={() => !t.disabled && setModalTab(t.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  modalTab === t.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
                {t.id === 'syllabus' && editingId && !editingSubject?.syllabusFile && (
                  <AlertTriangle className="inline w-3 h-3 ml-1 text-amber-500" />
                )}
              </button>
            ))}
          </div>

          {/* DETAILS TAB */}
          {modalTab === 'details' && (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subject Code *</label>
                  <input
                    className="border rounded-md px-3 py-2 text-sm w-full"
                    placeholder="e.g. MATH-F1"
                    value={form.code}
                    onChange={(e) => onChange('code', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subject Name *</label>
                  <input
                    className="border rounded-md px-3 py-2 text-sm w-full"
                    placeholder="e.g. Mathematics Form 1"
                    value={form.name}
                    onChange={(e) => onChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Exam Board</label>
                  <select
                    className="border rounded-md px-3 py-2 text-sm w-full"
                    value={form.examBoardCode}
                    onChange={(e) => onChange('examBoardCode', e.target.value)}
                  >
                    <option value="">Select exam board</option>
                    {EXAM_BOARD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => onChange('active', e.target.checked)}
                    />
                    Active subject
                  </label>
                </div>
                <div className="md:col-span-2 border rounded-md px-3 py-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">Form Levels</p>
                  <div className="grid grid-cols-3 gap-2">
                    {FORM_OPTIONS.map((fo) => (
                      <label key={fo} className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.grades.includes(fo)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...form.grades, fo]
                              : form.grades.filter((g) => g !== fo);
                            onChange('grades', updated);
                          }}
                        />
                        {fo}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea
                    className="border rounded-md px-3 py-2 text-sm w-full min-h-20"
                    placeholder="Brief description of this subject"
                    value={form.description}
                    onChange={(e) => onChange('description', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-5 py-2 rounded-md text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md text-sm disabled:opacity-60"
                >
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create & Continue'}
                </button>
              </div>
            </form>
          )}

          {/* SYLLABUS TAB */}
          {modalTab === 'syllabus' && editingId && (
            <div className="space-y-4">
              {!editingSubject?.syllabusFile ? (
                <>
                  <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-800">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" />
                    <div>
                      <p className="font-semibold">No syllabus uploaded yet</p>
                      <p className="text-xs mt-0.5">The syllabus is an important document — students and teachers rely on it for the full term. Please upload it as soon as possible.</p>
                    </div>
                  </div>
                  <FileDropZone
                    accept={ACCEPTED_SYLLABUS}
                    uploading={uploadingSyllabus}
                    label="Click or drag & drop to upload syllabus"
                    hint="PDF, Word or ODT — max 50 MB"
                    onFile={handleSyllabusUpload}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-green-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">Syllabus uploaded</p>
                      <p className="text-xs mt-0.5 truncate">{editingSubject.syllabusFile.name}</p>
                      <p className="text-xs text-green-600">{formatBytes(editingSubject.syllabusFile.size)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <a
                        href={editingSubject.syllabusFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs bg-white border border-green-300 text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-md"
                      >
                        <FileText className="w-3 h-3" /> View
                      </a>
                      <button
                        type="button"
                        disabled={uploadingSyllabus}
                        onClick={handleSyllabusDelete}
                        className="inline-flex items-center gap-1 text-xs bg-white border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md disabled:opacity-60"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500 mb-2">Upload a new file to replace the current syllabus.</p>
                    <FileDropZone
                      accept={ACCEPTED_SYLLABUS}
                      uploading={uploadingSyllabus}
                      label="Replace syllabus"
                      hint="PDF, Word or ODT — max 50 MB"
                      onFile={handleSyllabusUpload}
                    />
                  </div>
                </>
              )}
              {/* AI extraction panel — only shown when syllabus is present */}
              {editingSubject?.syllabusFile && (
                <div className="border rounded-lg p-4 bg-indigo-50 border-indigo-200 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-indigo-800">Extract Curriculum Topics</p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                      Use AI to analyse the syllabus and automatically populate curriculum topics for this subject.
                      Existing topics will be replaced.
                    </p>
                  </div>
                  {lastExtractResult && !extractingAttributes && (
                    <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-md">
                      <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" />
                      Extraction is running in the background. Check your notifications for the result.
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={extractingAttributes}
                    onClick={handleExtractAttributes}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md"
                  >
                    <RefreshCw className={`w-4 h-4 ${extractingAttributes ? 'animate-spin' : ''}`} />
                    {extractingAttributes ? 'Extracting topics…' : 'Extract Topics from Syllabus'}
                  </button>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t">
                <button type="button" onClick={() => setIsFormOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-5 py-2 rounded-md text-sm">
                  Done
                </button>
              </div>
            </div>
          )}

          {/* RESOURCES TAB */}
          {modalTab === 'resources' && editingId && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Upload supplementary materials for this subject — lesson notes, past papers, reference sheets, etc.
              </p>

              <FileDropZone
                accept={ACCEPTED_RESOURCES}
                uploading={uploadingResource}
                label="Click or drag & drop to upload a resource"
                hint="PDF, Word, PowerPoint, Excel, image, video, ZIP — max 50 MB"
                onFile={handleResourceUpload}
              />

              {editingSubject && editingSubject.subjectResources.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Uploaded files ({editingSubject.subjectResources.length})</p>
                  {editingSubject.subjectResources.map((res) => (
                    <div key={res._id} className="flex items-center gap-3 px-3 py-2 border rounded-lg bg-gray-50 hover:bg-white transition-colors">
                      <span className="text-lg shrink-0">{getFileIcon(res.mimeType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{res.name}</p>
                        <p className="text-xs text-gray-400">{formatBytes(res.size)}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                        >
                          View
                        </a>
                        <button
                          type="button"
                          disabled={deletingResourceId === res._id}
                          onClick={() => handleResourceDelete(res._id)}
                          className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200 disabled:opacity-60"
                        >
                          {deletingResourceId === res._id ? '…' : <X className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic py-2 text-center">No resources uploaded yet.</p>
              )}

              <div className="flex justify-end pt-2 border-t">
                <button type="button" onClick={() => setIsFormOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-5 py-2 rounded-md text-sm">
                  Done
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AdminConfirmDialog
        open={!!subjectToDelete}
        title="Delete Subject"
        description={`Delete subject "${subjectToDelete?.code}"? This cannot be undone.`}
        confirmLabel="Delete Subject"
        busy={saving}
        onConfirm={deleteSubject}
        onOpenChange={(open) => { if (!open) setSubjectToDelete(null); }}
      />
    </div>
  );
};

export default AdminSubjectsPage;
