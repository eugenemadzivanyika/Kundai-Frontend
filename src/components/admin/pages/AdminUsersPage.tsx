import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Upload,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { adminService, authService, classService, subjectService, userService } from '../../../services/api';
import { User } from '../../../types';
import AdminSectionHeader from '../components/AdminSectionHeader';
import { useToast } from '../../ui/use-toast';
import AdminConfirmDialog from '../components/AdminConfirmDialog';
import BulkStudentUpload from '../components/BulkStudentUpload';
import TeacherFormModal, { TeacherFormData } from './TeacherFormModal';
import StudentFormModal, { StudentFormData } from './StudentFormModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { AdminRoleCode } from '../types';

type PageTab = 'students' | 'teachers' | 'admins';

type RoleLike = string | { code?: string; name?: string };

const normalizeRoles = (roles: unknown): string[] => {
  if (!Array.isArray(roles)) return [];
  return (roles as RoleLike[])
    .map((r) => (typeof r === 'string' ? r : r?.code || r?.name || ''))
    .filter((r): r is string => Boolean(r));
};

const getRoleFromUser = (user: User): AdminRoleCode => {
  const roles = normalizeRoles(user.roles);
  return (roles.find((r) => ['admin', 'teacher', 'student'].includes(r)) || 'student') as AdminRoleCode;
};

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) =>
  active ? (
    <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Active</span>
  ) : (
    <span className="inline-flex items-center text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Inactive</span>
  );

const TableSkeleton = () => (
  <div className="space-y-2 p-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex gap-3">
        {Array.from({ length: 5 }).map((__, j) => (
          <div key={j} className="h-8 flex-1 rounded bg-slate-200 animate-pulse" />
        ))}
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Admin/Staff form (simple, inline)
// ---------------------------------------------------------------------------

type AdminFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
  active: boolean;
};

const defaultAdminForm: AdminFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  username: '',
  password: '',
  active: true,
};

interface AdminFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  user?: User | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: AdminFormState) => void;
}

const AdminFormModal: React.FC<AdminFormModalProps> = ({ open, mode, user, saving, onClose, onSubmit }) => {
  const [form, setForm] = useState<AdminFormState>(defaultAdminForm);

  useEffect(() => {
    if (!open) return;
    setForm(
      mode === 'edit' && user
        ? {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            username: user.username || '',
            password: '',
            active: user.active !== false,
          }
        : defaultAdminForm
    );
  }, [open, mode, user]);

  const set = <K extends keyof AdminFormState>(k: K, v: AdminFormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const inputCls = 'border rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Admin / Staff' : 'Edit Admin / Staff'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Add a new admin or staff account.' : 'Update admin or staff details.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className={labelCls}>First Name *</label>
            <input className={inputCls} placeholder="First name" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Last Name *</label>
            <input className={inputCls} placeholder="Last name" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input type="email" className={inputCls} placeholder="Email address" value={form.email} onChange={(e) => set('email', e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Phone Number</label>
            <input className={inputCls} placeholder="Phone number" value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Username</label>
            <input className={inputCls} placeholder="Username (optional)" value={form.username} onChange={(e) => set('username', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>{mode === 'create' ? 'Password *' : 'New Password'}</label>
            <input type="password" className={inputCls} placeholder={mode === 'create' ? 'Password' : 'Leave blank to keep current'} value={form.password} onChange={(e) => set('password', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
              Active account
            </label>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-5 py-2 rounded-md text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-md text-sm disabled:opacity-60">
              {saving ? 'Saving...' : mode === 'create' ? 'Create Admin' : 'Save Changes'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Student Subjects Panel
// ---------------------------------------------------------------------------

interface StudentSubjectsPanelProps {
  user: User;
  onClose: () => void;
}

const StudentSubjectsPanel: React.FC<StudentSubjectsPanelProps> = ({ user, onClose }) => {
  const sp = user.studentProfile as any;
  const studentId: string = sp?._id || '';
  const classGroup = sp?.classGroup;
  const classId: string =
    classGroup && typeof classGroup === 'object' ? classGroup._id : (classGroup as string) || 'direct';

  const [studentData, setStudentData] = useState<any>(null);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [addSearch, setAddSearch] = useState('');
  const { toast } = useToast();

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  const loadData = async () => {
    setLoading(true);
    try {
      const [fresh, subjects] = await Promise.all([
        adminService.getStudent(studentId),
        subjectService.getSubjects(),
      ]);
      setStudentData(fresh);
      setAllSubjects(Array.isArray(subjects) ? subjects : []);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load student subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (studentId) loadData(); }, [studentId]);

  const enrolledCourses: { _id: string; name: string; code: string }[] = studentData?.courses || [];
  const manualIds = new Set<string>((studentData?.manualEnrollments || []).map((m: any) => m?.toString?.() ?? m));
  const enrolledIds = new Set(enrolledCourses.map((c) => c._id.toString()));

  const availableSubjects = allSubjects.filter((s) => {
    const id = s._id || s.id;
    if (enrolledIds.has(id)) return false;
    if (!addSearch.trim()) return true;
    const q = addSearch.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);
  });

  const handleAdd = async () => {
    if (!selectedCourseId) return;
    setMutating('add');
    try {
      await classService.enrollStudentInSubject(classId, studentId, selectedCourseId);
      await loadData();
      setSelectedCourseId('');
      setAddSearch('');
      const name = allSubjects.find((s) => (s._id || s.id) === selectedCourseId)?.name || 'Subject';
      toast.success(`${name} added to ${fullName}.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add subject');
    } finally {
      setMutating(null);
    }
  };

  const handleRemove = async (course: { _id: string; name: string }, force = false) => {
    const isClassSubject = !manualIds.has(course._id.toString());
    if (isClassSubject && !force) return;
    setMutating(course._id);
    try {
      await classService.unenrollStudentFromSubject(classId, studentId, course._id);
      await loadData();
      toast.success(`${course.name} removed from ${fullName}.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove subject');
    } finally {
      setMutating(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md shadow-xl flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Subjects — {fullName}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {classGroup && typeof classGroup === 'object' ? classGroup.name : 'No class assigned'}
            </p>
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
                  Enrolled subjects <span className="text-gray-400">({enrolledCourses.length})</span>
                </h3>
                {enrolledCourses.length === 0 ? (
                  <p className="text-sm text-gray-400">Not enrolled in any subjects.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {enrolledCourses.map((course) => {
                      const isManual = manualIds.has(course._id.toString());
                      const isBusy = mutating === course._id;
                      return (
                        <li key={course._id} className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-800">
                              <span className="font-mono text-xs text-gray-400 mr-1.5">{course.code}</span>
                              {course.name}
                            </span>
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                              isManual
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-teal-100 text-teal-700'
                            }`}>
                              {isManual ? 'Manual' : 'Via class'}
                            </span>
                          </div>
                          {isManual ? (
                            <button
                              disabled={!!mutating}
                              onClick={() => handleRemove(course)}
                              title="Remove this subject"
                              className="text-red-500 hover:text-red-700 disabled:opacity-40 shrink-0"
                            >
                              {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          ) : (
                            <div className="flex gap-1 shrink-0">
                              <span
                                className="text-xs text-gray-400 cursor-help"
                                title="Remove this subject from the class to unenroll all students, or use Force Remove to unenroll this student only"
                              >
                                Via class
                              </span>
                              <button
                                disabled={!!mutating}
                                onClick={() => handleRemove(course, true)}
                                title="Force remove: unenrolls this student only, class unchanged"
                                className="text-xs text-red-500 hover:text-red-700 underline disabled:opacity-40"
                              >
                                {isBusy ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Force'}
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Add a subject</h3>
                <input
                  className="border rounded-md px-3 py-2 text-sm w-full mb-2"
                  placeholder="Search subjects…"
                  value={addSearch}
                  onChange={(e) => { setAddSearch(e.target.value); setSelectedCourseId(''); }}
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
                  disabled={!selectedCourseId || !!mutating}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md disabled:opacity-50 w-full justify-center"
                >
                  {mutating === 'add' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Subject (Manual)
                </button>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Hierarchical student view — All → Form N → Class name
// ---------------------------------------------------------------------------

const FORM_LEVELS = [1, 2, 3, 4, 5, 6];

interface StudentHierarchyViewProps {
  students: User[];
  onEdit: (u: User) => void;
  onDelete: (u: User) => void;
  onViewSubjects: (u: User) => void;
}

const StudentHierarchyView: React.FC<StudentHierarchyViewProps> = ({ students, onEdit, onDelete, onViewSubjects }) => {
  const [expandedForms, setExpandedForms] = useState<Set<number>>(new Set());
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  const toggleForm = (form: number) =>
    setExpandedForms((prev) => {
      const next = new Set(prev);
      next.has(form) ? next.delete(form) : next.add(form);
      return next;
    });

  const toggleClass = (key: string) =>
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // Group students: form → className → [User]
  const grouped = useMemo(() => {
    const map = new Map<number, Map<string, User[]>>();
    for (const u of students) {
      const sp = u.studentProfile as any;
      const form = Number(sp?.form ?? 0) || 0;
      const cg = sp?.classGroup;
      const className =
        cg && typeof cg === 'object' ? (cg.name as string) : 'Unassigned';
      if (!map.has(form)) map.set(form, new Map());
      const formMap = map.get(form)!;
      if (!formMap.has(className)) formMap.set(className, []);
      formMap.get(className)!.push(u);
    }
    return map;
  }, [students]);

  const unassignedForm = grouped.get(0);
  const formsWithStudents = FORM_LEVELS.filter((f) => grouped.has(f));

  if (students.length === 0) {
    return <p className="py-8 text-center text-gray-400 text-sm">No students found.</p>;
  }

  const StudentRow: React.FC<{ u: User }> = ({ u }) => {
    const sp = u.studentProfile as any;
    const cg = sp?.classGroup;
    const className = cg && typeof cg === 'object' ? (cg.name as string) : '—';
    return (
      <tr className="border-b last:border-0 hover:bg-gray-50 text-sm">
        <td className="py-2 px-3 font-medium">{`${u.firstName} ${u.lastName}`.trim()}</td>
        <td className="py-2 px-3 text-gray-500">{u.email}</td>
        <td className="py-2 px-3 text-gray-500">{className}</td>
        <td className="py-2 px-3">{sp?.gender || '—'}</td>
        <td className="py-2 px-3">
          {sp?.guardianName ? (
            <div>
              <div className="font-medium text-xs">{sp.guardianName}</div>
              <div className="text-xs text-gray-400">{sp.guardianPhone || '—'}</div>
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="py-2 px-3"><StatusBadge active={u.active !== false} /></td>
        <td className="py-2 px-3">
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => onEdit(u)}
              className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white rounded px-2.5 py-1 text-xs">
              <UserCog className="w-3 h-3" /> Edit
            </button>
            <button onClick={() => onViewSubjects(u)}
              className="inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white rounded px-2.5 py-1 text-xs">
              <BookOpen className="w-3 h-3" /> Subjects
            </button>
            <button onClick={() => onDelete(u)}
              className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded px-2.5 py-1 text-xs">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const ClassTable: React.FC<{ classUsers: User[] }> = ({ classUsers }) => (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="text-left border-b text-gray-500 bg-gray-50/60">
          <th className="py-1.5 px-3 font-medium text-xs">Name</th>
          <th className="py-1.5 px-3 font-medium text-xs">Email</th>
          <th className="py-1.5 px-3 font-medium text-xs">Class</th>
          <th className="py-1.5 px-3 font-medium text-xs">Gender</th>
          <th className="py-1.5 px-3 font-medium text-xs">Guardian</th>
          <th className="py-1.5 px-3 font-medium text-xs">Status</th>
          <th className="py-1.5 px-3 font-medium text-xs">Actions</th>
        </tr>
      </thead>
      <tbody>
        {classUsers.map((u) => <StudentRow key={u._id} u={u} />)}
      </tbody>
    </table>
  );

  const renderFormSection = (form: number) => {
    const classMap = grouped.get(form);
    if (!classMap) return null;
    const totalInForm = [...classMap.values()].reduce((s, arr) => s + arr.length, 0);
    const isFormOpen = expandedForms.has(form);
    const classes = [...classMap.entries()].sort(([a], [b]) => a.localeCompare(b));

    return (
      <div key={form} className="border border-gray-200 rounded-lg overflow-hidden mb-2">
        {/* Form header */}
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 bg-teal-50 hover:bg-teal-100 transition-colors text-left"
          onClick={() => toggleForm(form)}
        >
          <div className="flex items-center gap-2">
            {isFormOpen ? <ChevronDown className="w-4 h-4 text-teal-700" /> : <ChevronRight className="w-4 h-4 text-teal-700" />}
            <span className="font-semibold text-teal-800 text-sm">Form {form}</span>
            <span className="text-xs bg-teal-600 text-white rounded-full px-2 py-0.5">{totalInForm}</span>
          </div>
          <span className="text-xs text-teal-600">{classes.length} class{classes.length !== 1 ? 'es' : ''}</span>
        </button>

        {/* Classes within this form */}
        {isFormOpen && (
          <div className="divide-y divide-gray-100">
            {classes.map(([className, classUsers]) => {
              const classKey = `${form}-${className}`;
              const isClassOpen = expandedClasses.has(classKey);
              return (
                <div key={classKey}>
                  {/* Class sub-header */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-6 py-2.5 bg-white hover:bg-gray-50 transition-colors text-left"
                    onClick={() => toggleClass(classKey)}
                  >
                    <div className="flex items-center gap-2">
                      {isClassOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                      <span className="font-medium text-gray-700 text-sm">{className}</span>
                      <span className="text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5">{classUsers.length}</span>
                    </div>
                  </button>
                  {isClassOpen && (
                    <div className="overflow-x-auto border-t border-gray-100">
                      <ClassTable classUsers={classUsers} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {/* Summary bar */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 flex-wrap">
        <span className="font-medium text-gray-700">{students.length} student{students.length !== 1 ? 's' : ''} total</span>
        {formsWithStudents.map((f) => {
          const count = [...(grouped.get(f)?.values() ?? [])].reduce((s, a) => s + a.length, 0);
          return (
            <span key={f} className="bg-teal-50 border border-teal-200 text-teal-700 rounded px-2 py-0.5">
              Form {f}: {count}
            </span>
          );
        })}
      </div>

      {formsWithStudents.map(renderFormSection)}

      {/* Unassigned students (form = 0 or no profile) */}
      {unassignedForm && unassignedForm.size > 0 && (
        <div className="border border-amber-200 rounded-lg overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
            onClick={() => toggleForm(0)}
          >
            {expandedForms.has(0) ? <ChevronDown className="w-4 h-4 text-amber-700" /> : <ChevronRight className="w-4 h-4 text-amber-700" />}
            <span className="font-semibold text-amber-800 text-sm">Unassigned</span>
            <span className="text-xs bg-amber-500 text-white rounded-full px-2 py-0.5">
              {[...unassignedForm.values()].reduce((s, a) => s + a.length, 0)}
            </span>
          </button>
          {expandedForms.has(0) && (
            <div className="overflow-x-auto border-t border-amber-100">
              <ClassTable classUsers={[...unassignedForm.values()].flat()} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const AdminUsersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<PageTab>('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Bulk upload
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Modal state
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [subjectsPanelUser, setSubjectsPanelUser] = useState<User | null>(null);

  const classNameParam = searchParams.get('className') || '';
  const classIdParam = searchParams.get('classId') || undefined;

  const currentUser = authService.getCurrentUser();
  const isAdmin = !!currentUser?.isAdmin || currentUser?.role === 'admin';

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers(classIdParam ? { classId: classIdParam } : undefined);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin, classIdParam]);

  const filterByRole = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (role: AdminRoleCode) =>
      users.filter((u) => {
        if (!normalizeRoles(u.roles).includes(role)) return false;
        const matchSearch =
          !term ||
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
          (u.email || '').toLowerCase().includes(term) ||
          (u.phoneNumber || '').toLowerCase().includes(term);
        const active = u.active !== false;
        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && active) ||
          (statusFilter === 'inactive' && !active);
        return matchSearch && matchStatus;
      });
  }, [users, searchTerm, statusFilter]);

  const studentUsers = useMemo(() => filterByRole('student'), [filterByRole]);
  const teacherUsers = useMemo(() => filterByRole('teacher'), [filterByRole]);
  const adminUsers = useMemo(() => filterByRole('admin'), [filterByRole]);

  const openCreate = () => {
    setFormMode('create');
    setEditingUser(null);
    if (activeTab === 'students') setStudentModalOpen(true);
    else if (activeTab === 'teachers') setTeacherModalOpen(true);
    else setAdminModalOpen(true);
  };

  const openEdit = (user: User) => {
    setFormMode('edit');
    setEditingUser(user);
    const role = getRoleFromUser(user);
    if (role === 'student') setStudentModalOpen(true);
    else if (role === 'teacher') setTeacherModalOpen(true);
    else setAdminModalOpen(true);
  };

  const handleStudentSubmit = async (data: StudentFormData) => {
    setSaving(true);
    try {
      const payload = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phoneNumber: data.phoneNumber.trim(),
        username: data.username.trim() || undefined,
        password: data.password || undefined,
        roleCodes: ['student'],
        active: data.active,
        form: Number(data.form),
        classGroupId: data.classGroupId || undefined,
        gender: data.gender || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        homeAddress: data.homeAddress || undefined,
        nationality: data.nationality || undefined,
        religion: data.religion || undefined,
        bloodType: data.bloodType || undefined,
        medicalConditions: data.medicalConditions || undefined,
        specialNeeds: data.specialNeeds || undefined,
        studentRegNumber: data.studentRegNumber || undefined,
        boardingStatus: data.boardingStatus || undefined,
        transportMode: data.transportMode || undefined,
        guardianName: data.guardianName || undefined,
        guardianRelationship: data.guardianRelationship || undefined,
        guardianPhone: data.guardianPhone || undefined,
        guardianEmail: data.guardianEmail || undefined,
        guardianAddress: data.guardianAddress || undefined,
        guardianOccupation: data.guardianOccupation || undefined,
        secondGuardianName: data.secondGuardianName || undefined,
        secondGuardianPhone: data.secondGuardianPhone || undefined,
        secondGuardianRelationship: data.secondGuardianRelationship || undefined,
        previousSchool: data.previousSchool || undefined,
        admissionDate: data.admissionDate || undefined,
      };

      if (formMode === 'create') {
        if (!data.password) { toast.error('Password is required.'); setSaving(false); return; }
        await userService.createUser({ ...payload, password: data.password });
        toast.success('Student created successfully.');
      } else if (editingUser) {
        await userService.updateUser(editingUser.id ?? editingUser._id, payload);
        toast.success('Student updated successfully.');
      }
      setStudentModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const handleTeacherSubmit = async (data: TeacherFormData) => {
    setSaving(true);
    try {
      const payload = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phoneNumber: data.phoneNumber.trim(),
        username: data.username.trim() || undefined,
        password: data.password || undefined,
        roleCodes: ['teacher'],
        active: data.active,
        gender: data.gender || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        nationalId: data.nationalId || undefined,
        maritalStatus: data.maritalStatus || undefined,
        homeAddress: data.homeAddress || undefined,
        spouseName: data.spouseName || undefined,
        spousePhone: data.spousePhone || undefined,
        numberOfDependants: data.numberOfDependants ? Number(data.numberOfDependants) : undefined,
        emergencyContactName: data.emergencyContactName || undefined,
        emergencyContactPhone: data.emergencyContactPhone || undefined,
        emergencyContactRelationship: data.emergencyContactRelationship || undefined,
        qualifications: data.qualifications || undefined,
        teachingCertificate: data.teachingCertificate || undefined,
        yearsOfExperience: data.yearsOfExperience ? Number(data.yearsOfExperience) : undefined,
        department: data.department || undefined,
        staffNumber: data.staffNumber || undefined,
        teachingCouncilRegNumber: data.teachingCouncilRegNumber || undefined,
        employmentType: data.employmentType || undefined,
        position: data.position || undefined,
        employmentStartDate: data.employmentStartDate || undefined,
        classTeacherOf: data.classTeacherOf || undefined,
        subjectAssignments: data.subjectAssignments.filter((sa) => sa.subject),
      };

      if (formMode === 'create') {
        if (!data.password) { toast.error('Password is required.'); setSaving(false); return; }
        await userService.createUser({ ...payload, password: data.password });
        toast.success('Teacher created successfully.');
      } else if (editingUser) {
        await userService.updateUser(editingUser.id ?? editingUser._id, payload);
        toast.success('Teacher updated successfully.');
      }
      setTeacherModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save teacher');
    } finally {
      setSaving(false);
    }
  };

  const handleAdminSubmit = async (data: AdminFormState) => {
    setSaving(true);
    try {
      if (formMode === 'create') {
        if (!data.password) { toast.error('Password is required.'); setSaving(false); return; }
        await userService.createUser({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim().toLowerCase(),
          phoneNumber: data.phoneNumber.trim(),
          username: data.username.trim() || undefined,
          password: data.password,
          roleCodes: ['admin'],
          active: data.active,
        });
        toast.success('Admin created successfully.');
      } else if (editingUser) {
        await userService.updateUser(editingUser.id ?? editingUser._id, {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim().toLowerCase(),
          phoneNumber: data.phoneNumber.trim(),
          username: data.username.trim() || undefined,
          password: data.password.trim() || undefined,
          active: data.active,
        });
        toast.success('Admin updated successfully.');
      }
      setAdminModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save admin');
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async () => {
    if (!userToDelete) return;
    setSaving(true);
    try {
      await userService.deleteUser(userToDelete.id ?? userToDelete._id);
      toast.success('User deleted.');
      setUserToDelete(null);
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete user');
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

  const TAB_CONFIG: { id: PageTab; label: string; icon: React.ReactNode; count: number; color: string }[] = [
    { id: 'students', label: 'Students', icon: <GraduationCap className="w-4 h-4" />, count: studentUsers.length, color: 'teal' },
    { id: 'teachers', label: 'Teachers', icon: <BookOpen className="w-4 h-4" />, count: teacherUsers.length, color: 'blue' },
    { id: 'admins', label: 'Admins / Staff', icon: <Users className="w-4 h-4" />, count: adminUsers.length, color: 'indigo' },
  ];

  return (
    <div className="space-y-4 mt-4">
      <AdminSectionHeader
        title="User Management"
        description="Manage students, teachers, and admin accounts for your school."
        icon={Shield}
      />

      <div className="bg-white rounded-lg shadow-md">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">User Records</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadUsers}
              disabled={loading}
              className="inline-flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {activeTab === 'students' && (
              <button
                onClick={() => setShowBulkUpload(true)}
                className="inline-flex items-center gap-2 text-sm border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md"
              >
                <Upload className="w-4 h-4" />
                Bulk Upload
              </button>
            )}
            <button
              onClick={openCreate}
              className={`inline-flex items-center gap-2 text-sm text-white px-3 py-2 rounded-md ${
                activeTab === 'students'
                  ? 'bg-teal-600 hover:bg-teal-700'
                  : activeTab === 'teachers'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'students' ? 'Add Student' : activeTab === 'teachers' ? 'Add Teacher' : 'Add Admin'}
            </button>
          </div>
        </div>

        {/* Bulk upload panel */}
        {showBulkUpload && (
          <div className="p-4 border-b">
            <BulkStudentUpload
              onComplete={(count) => {
                setShowBulkUpload(false);
                loadUsers();
                toast.success(`${count} student${count !== 1 ? 's' : ''} added successfully.`);
              }}
              onCancel={() => setShowBulkUpload(false)}
            />
          </div>
        )}

        {/* Class filter banner */}
        {classNameParam && (
          <div className="flex items-center gap-2 mx-4 mt-3 px-3 py-2 bg-teal-50 border border-teal-200 rounded-md text-sm text-teal-800">
            <span>Filtered by class: <strong>{classNameParam}</strong></span>
            <button
              type="button"
              onClick={() => setSearchParams((p) => { p.delete('classId'); p.delete('className'); p.delete('role'); return p; })}
              className="ml-auto text-teal-600 hover:text-teal-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search & filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border-b">
          <input
            className="border rounded-md px-3 py-2 text-sm"
            placeholder="Search name, email or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-4">
          {TAB_CONFIG.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? t.id === 'students'
                    ? 'border-teal-600 text-teal-700'
                    : t.id === 'teachers'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon}
              {t.label}
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table area */}
        <div className="p-4">
          {loading ? (
            <TableSkeleton />
          ) : (
            <>
              {/* STUDENTS — hierarchical Form → Class view */}
              {activeTab === 'students' && (
                <StudentHierarchyView
                  students={studentUsers}
                  onEdit={openEdit}
                  onDelete={(u) => setUserToDelete(u)}
                  onViewSubjects={(u) => setSubjectsPanelUser(u)}
                />
              )}

              {/* TEACHERS TABLE */}
              {activeTab === 'teachers' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b text-gray-600">
                        <th className="py-2 px-3 font-medium">Name</th>
                        <th className="py-2 px-3 font-medium">Email</th>
                        <th className="py-2 px-3 font-medium">Phone</th>
                        <th className="py-2 px-3 font-medium">Department</th>
                        <th className="py-2 px-3 font-medium">Class Teacher Of</th>
                        <th className="py-2 px-3 font-medium">Subjects</th>
                        <th className="py-2 px-3 font-medium">Status</th>
                        <th className="py-2 px-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherUsers.map((u) => {
                        const tp = u.teacherProfile;
                        const classTeacher =
                          tp?.classTeacherOf && typeof tp.classTeacherOf === 'object'
                            ? tp.classTeacherOf.name
                            : '—';
                        const subjects = (tp?.subjectAssignments || [])
                          .map((sa) =>
                            typeof sa.subject === 'object' ? sa.subject.name : sa.subjectName || ''
                          )
                          .filter((s): s is string => Boolean(s));
                        return (
                          <tr key={u._id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-2 px-3 font-medium">{`${u.firstName} ${u.lastName}`.trim()}</td>
                            <td className="py-2 px-3 text-gray-600">{u.email}</td>
                            <td className="py-2 px-3">{u.phoneNumber || '—'}</td>
                            <td className="py-2 px-3">{tp?.department || '—'}</td>
                            <td className="py-2 px-3">{classTeacher}</td>
                            <td className="py-2 px-3">
                              {subjects.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {subjects.map((s, i) => (
                                    <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">{s}</span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <StatusBadge active={u.active !== false} />
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEdit(u)}
                                  className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs"
                                >
                                  <UserCog className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  onClick={() => setUserToDelete(u)}
                                  className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1 text-xs"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {teacherUsers.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-400 text-sm">No teachers found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ADMINS TABLE */}
              {activeTab === 'admins' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b text-gray-600">
                        <th className="py-2 px-3 font-medium">Name</th>
                        <th className="py-2 px-3 font-medium">Email</th>
                        <th className="py-2 px-3 font-medium">Phone</th>
                        <th className="py-2 px-3 font-medium">Username</th>
                        <th className="py-2 px-3 font-medium">Status</th>
                        <th className="py-2 px-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((u) => (
                        <tr key={u._id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium">{`${u.firstName} ${u.lastName}`.trim()}</td>
                          <td className="py-2 px-3 text-gray-600">{u.email}</td>
                          <td className="py-2 px-3">{u.phoneNumber || '—'}</td>
                          <td className="py-2 px-3">{u.username || '—'}</td>
                          <td className="py-2 px-3">
                            <StatusBadge active={u.active !== false} />
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEdit(u)}
                                className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-1 text-xs"
                              >
                                <UserCog className="w-3 h-3" /> Edit
                              </button>
                              <button
                                onClick={() => setUserToDelete(u)}
                                className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1 text-xs"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {adminUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">No admins found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Role-specific Modals */}
      <StudentFormModal
        open={studentModalOpen}
        mode={formMode}
        user={editingUser}
        saving={saving}
        onClose={() => setStudentModalOpen(false)}
        onSubmit={handleStudentSubmit}
      />

      <TeacherFormModal
        open={teacherModalOpen}
        mode={formMode}
        user={editingUser}
        saving={saving}
        onClose={() => setTeacherModalOpen(false)}
        onSubmit={handleTeacherSubmit}
      />

      <AdminFormModal
        open={adminModalOpen}
        mode={formMode}
        user={editingUser}
        saving={saving}
        onClose={() => setAdminModalOpen(false)}
        onSubmit={handleAdminSubmit}
      />

      <AdminConfirmDialog
        open={!!userToDelete}
        title="Delete User"
        description={`Delete "${userToDelete?.firstName} ${userToDelete?.lastName}" (${userToDelete?.email})? This action cannot be undone.`}
        confirmLabel="Delete"
        busy={saving}
        onConfirm={removeUser}
        onOpenChange={(open) => { if (!open) setUserToDelete(null); }}
      />

      {subjectsPanelUser && (
        <StudentSubjectsPanel
          user={subjectsPanelUser}
          onClose={() => setSubjectsPanelUser(null)}
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
