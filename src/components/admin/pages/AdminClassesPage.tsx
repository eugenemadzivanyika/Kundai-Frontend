import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookOpen, GraduationCap, Loader2, Pencil, Plus, RefreshCw, Trash2, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService, classService, schoolService, subjectService, userService } from '../../../services/api';
import { ClassItem, ClassSubject } from '../../../services/classService';
import { SchoolItem } from '../../../services/schoolService';
import { User } from '../../../types';
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

interface ClassFormState {
  schoolId: string;
  code: string;
  name: string;
  gradeLevel: string;
  academicYear: string;
  homeroomTeacherId: string;
}

const defaultForm: ClassFormState = {
  schoolId: '',
  code: '',
  name: '',
  gradeLevel: '',
  academicYear: '',
  homeroomTeacherId: '',
};

type RoleLike = string | { code?: string; name?: string };

const hasTeacherRole = (roles: unknown): boolean => {
  if (!Array.isArray(roles)) {
    return false;
  }
  return (roles as RoleLike[]).some((role) => {
    if (typeof role === 'string') {
      return role === 'teacher';
    }
    return role.code === 'teacher' || role.name === 'teacher';
  });
};

const teacherDisplayName = (teacher?: User | null): string => {
  if (!teacher) {
    return '-';
  }
  const fullName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
  return fullName || teacher.email || teacher.id || teacher._id;
};

const buildAcademicYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let year = currentYear - 2; year <= currentYear + 4; year += 1) {
    years.push(`${year}`);
  }
  return years;
};

const ClassTableSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="grid grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((__, colIndex) => (
          <div key={colIndex} className="h-9 rounded bg-slate-200 animate-pulse" />
        ))}
      </div>
    ))}
  </div>
);

interface ClassSubjectsPanelProps {
  classId: string;
  className: string;
  onClose: () => void;
}

const ClassSubjectsPanel: React.FC<ClassSubjectsPanelProps> = ({ classId, className, onClose }) => {
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [subjects, all] = await Promise.all([
        classService.getClassSubjects(classId),
        subjectService.getSubjects(),
      ]);
      setClassSubjects(subjects);
      setAllSubjects(Array.isArray(all) ? all : []);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [classId]);

  const assignedIds = new Set(classSubjects.map((s) => s._id));

  const availableSubjects = allSubjects.filter((s) => {
    const id = s._id || s.id;
    if (assignedIds.has(id)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);
  });

  const handleAdd = async () => {
    if (!selectedCourseId) return;
    setMutating(true);
    try {
      const res = await classService.addSubjectToClass(classId, selectedCourseId);
      await loadData();
      setSelectedCourseId('');
      setSearch('');
      if (res.studentsEnrolled === 0) {
        toast.success('Subject added. No students in this class yet — students will be enrolled when assigned.');
      } else {
        const subjectName = allSubjects.find((s) => (s._id || s.id) === selectedCourseId)?.name || 'Subject';
        toast.success(`${subjectName} added — ${res.studentsEnrolled} student${res.studentsEnrolled !== 1 ? 's' : ''} enrolled automatically.`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add subject');
    } finally {
      setMutating(false);
    }
  };

  const handleRemove = async (subject: ClassSubject) => {
    setMutating(true);
    try {
      const res = await classService.removeSubjectFromClass(classId, subject._id);
      await loadData();
      toast.success(`${subject.name} removed — ${res.studentsUnenrolled} student${res.studentsUnenrolled !== 1 ? 's' : ''} unenrolled.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove subject');
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md shadow-xl flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Subjects — {className}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Assign subjects to this class. All enrolled students are updated automatically.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Assigned subjects <span className="text-gray-400">({classSubjects.length})</span>
                </h3>
                {classSubjects.length === 0 ? (
                  <p className="text-sm text-gray-400">No subjects assigned yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {classSubjects.map((s) => (
                      <li key={s._id} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                        <span className="text-sm text-gray-800">
                          <span className="font-mono text-xs text-gray-500 mr-2">{s.code}</span>
                          {s.name}
                        </span>
                        <button
                          disabled={mutating}
                          onClick={() => handleRemove(s)}
                          className="text-red-500 hover:text-red-700 disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Add a subject</h3>
                <input
                  className="border rounded-md px-3 py-2 text-sm w-full mb-2"
                  placeholder="Search subjects…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelectedCourseId(''); }}
                />
                <select
                  className="border rounded-md px-3 py-2 text-sm w-full mb-3"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                >
                  <option value="">Select a subject…</option>
                  {availableSubjects.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAdd}
                  disabled={!selectedCourseId || mutating}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md disabled:opacity-50 w-full justify-center"
                >
                  {mutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Subject
                </button>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [form, setForm] = useState<ClassFormState>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [subjectsPanelClass, setSubjectsPanelClass] = useState<ClassItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const { toast } = useToast();

  const yearOptions = useMemo(() => buildAcademicYearOptions(), []);
  const currentUser = authService.getCurrentUser();
  const isAdmin = !!currentUser?.isAdmin || currentUser?.role === 'admin';

  const gradeOptions = useMemo(() => {
    return Array.from(new Set(classes.map((item) => item.gradeLevel || '').filter(Boolean))).sort();
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    return classes
      .filter((classItem) => {
        const teacherName = teacherDisplayName((classItem.homeroomTeacher as User | null) || null).toLowerCase();

        const matchesSearch =
          !normalized ||
          classItem.name.toLowerCase().includes(normalized) ||
          teacherName.includes(normalized);
        const matchesYear = yearFilter === 'all' || (classItem.academicYear || '') === yearFilter;
        const matchesGrade = gradeFilter === 'all' || (classItem.gradeLevel || '') === gradeFilter;

        return matchesSearch && matchesYear && matchesGrade;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [classes, searchTerm, yearFilter, gradeFilter]);

  const loadReferenceData = async () => {
    const [schoolData, userData] = await Promise.all([schoolService.getSchools(), userService.getUsers()]);
    const schoolList = Array.isArray(schoolData) ? schoolData : [];
    const teacherList = (Array.isArray(userData) ? userData : []).filter((user) =>
      hasTeacherRole((user as any).roles)
    );

    setSchools(schoolList);
    setTeachers(teacherList);
    setForm((prev) => ({ ...prev, schoolId: prev.schoolId || schoolList[0]?.id || '' }));
  };

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await classService.getClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      if (!isAdmin) {
        return;
      }

      try {
        await Promise.all([loadClasses(), loadReferenceData()]);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load class management data');
      }
    };

    loadAll();
  }, [isAdmin]);

  const onChange = <K extends keyof ClassFormState>(key: K, value: ClassFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      ...defaultForm,
      schoolId: schools[0]?.id || '',
      academicYear: `${new Date().getFullYear()}`,
    });
    setIsFormOpen(true);
  };

  const openEditModal = (classItem: ClassItem) => {
    setEditingId(classItem.id);
    setForm({
      schoolId: classItem.school?.id || schools[0]?.id || '',
      code: classItem.code || '',
      name: classItem.name || '',
      gradeLevel: classItem.gradeLevel || '',
      academicYear: classItem.academicYear || `${new Date().getFullYear()}`,
      homeroomTeacherId: classItem.homeroomTeacher?.id || '',
    });
    setIsFormOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const schoolId = form.schoolId || schools[0]?.id || '';
    if (!form.code.trim() || !form.gradeLevel.trim()) {
      toast.error('Stream and form level are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        schoolId,
        code: form.code.trim(),
        name: form.name.trim(),
        gradeLevel: form.gradeLevel.trim() || undefined,
        academicYear: form.academicYear.trim() || undefined,
        homeroomTeacherId: form.homeroomTeacherId || undefined,
      };

      if (editingId) {
        await classService.updateClass(editingId, {
          ...payload,
          clearHomeroomTeacher: !form.homeroomTeacherId,
        });
        toast.success('Class updated successfully.');
      } else {
        await classService.createClass(payload);
        toast.success('Class created successfully.');
      }

      setIsFormOpen(false);
      await loadClasses();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save class');
    } finally {
      setSaving(false);
    }
  };

  const askDeleteClass = (classItem: ClassItem) => {
    setClassToDelete(classItem);
  };

  const deleteClass = async () => {
    if (!classToDelete) {
      return;
    }

    setSaving(true);
    try {
      await classService.deleteClass(classToDelete.id);
      toast.success('Class deleted successfully.');
      setClassToDelete(null);
      await loadClasses();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete class');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-4">
        <div className="flex items-center gap-2 text-red-600 font-semibold mb-2">
          <AlertCircle className="w-5 h-5" />
          Access Denied
        </div>
        <p className="text-gray-600">This page is available to administrators only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <AdminSectionHeader
        title="Class Management"
        description="Create and maintain class records and homeroom teacher assignment."
        icon={GraduationCap}
      />

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Class Records</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadClasses}
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
              Create Class
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input
            className="border rounded-md px-3 py-2 md:col-span-2"
            placeholder="Search class name or teacher"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="border rounded-md px-3 py-2"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
          >
            <option value="all">All Form Levels</option>
            {gradeOptions.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
          <select
            className="border rounded-md px-3 py-2"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="all">All Years</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <ClassTableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Class Name</th>
                  <th className="py-2 pr-4">Form Level</th>
                  <th className="py-2 pr-4">Class Teacher</th>
                  <th className="py-2 pr-4">Students</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((classItem) => (
                  <tr key={classItem.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 font-medium">
                      <span>{classItem.name || '-'}</span>
                      {classItem.courses != null && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                          {classItem.courses.length} subject{classItem.courses.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4">{classItem.gradeLevel || '-'}</td>
                    <td className="py-2 pr-4">{teacherDisplayName((classItem.homeroomTeacher as User | null) || null)}</td>
                    <td className="py-2 pr-4">
                      {classItem.studentCount != null ? classItem.studentCount : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/users?classId=${classItem.id}&className=${encodeURIComponent(classItem.name)}&role=student`)}
                          className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white rounded px-3 py-1 text-xs"
                        >
                          <Users className="w-3 h-3" />
                          Students
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubjectsPanelClass(classItem)}
                          className="inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white rounded px-3 py-1 text-xs"
                        >
                          <BookOpen className="w-3 h-3" />
                          Subjects
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(classItem)}
                          className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-1 text-xs"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => askDeleteClass(classItem)}
                          className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredClasses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">
                      No classes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Class' : 'Create Class'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update form level, stream, year, and class teacher.'
                : 'Pick a form level and stream — the class name is auto-derived.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              className="border rounded-md px-3 py-2"
              value={form.gradeLevel}
              onChange={(e) => onChange('gradeLevel', e.target.value)}
            >
              <option value="">Form level *</option>
              {['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Stream * (e.g. A, B, C)"
              value={form.code}
              onChange={(e) => onChange('code', e.target.value)}
            />
            <input
              className="border rounded-md px-3 py-2 md:col-span-2"
              placeholder="Class name (auto-derived if blank)"
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
            />
            <select
              className="border rounded-md px-3 py-2"
              value={form.academicYear}
              onChange={(e) => onChange('academicYear', e.target.value)}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              className="border rounded-md px-3 py-2"
              value={form.homeroomTeacherId}
              onChange={(e) => onChange('homeroomTeacherId', e.target.value)}
            >
              <option value="">No class teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacherDisplayName(teacher)}
                </option>
              ))}
            </select>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-5 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || schools.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Class'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AdminConfirmDialog
        open={!!classToDelete}
        title="Delete Class"
        description={`Delete class "${classToDelete?.code || ''}"? This performs a soft delete.`}
        confirmLabel="Delete Class"
        busy={saving}
        onConfirm={deleteClass}
        onOpenChange={(open) => {
          if (!open) {
            setClassToDelete(null);
          }
        }}
      />

      {subjectsPanelClass && (
        <ClassSubjectsPanel
          classId={subjectsPanelClass.id}
          className={subjectsPanelClass.name}
          onClose={() => setSubjectsPanelClass(null)}
        />
      )}
    </div>
  );
};

export default AdminClassesPage;
