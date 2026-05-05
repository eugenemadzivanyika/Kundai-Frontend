import React, { useEffect, useState } from 'react';
import { X, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { User } from '../../../types';
import { classService, ClassItem } from '../../../services/classService';
import { subjectService } from '../../../services/subjectService';

type TabId = 'account' | 'personal' | 'teaching';

export type TeacherFormData = {
  // Account
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
  active: boolean;
  // Personal
  gender: string;
  dateOfBirth: string;
  nationalId: string;
  maritalStatus: string;
  homeAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  // Professional
  qualifications: string;
  teachingCertificate: string;
  yearsOfExperience: string;
  department: string;
  classTeacherOf: string;
  subjectAssignments: { subject: string; subjectName: string; classes: string[] }[];
};

const defaultTeacherForm: TeacherFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  username: '',
  password: '',
  active: true,
  gender: '',
  dateOfBirth: '',
  nationalId: '',
  maritalStatus: '',
  homeAddress: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
  qualifications: '',
  teachingCertificate: '',
  yearsOfExperience: '',
  department: '',
  classTeacherOf: '',
  subjectAssignments: [],
};

function fromUser(user: User): TeacherFormData {
  const tp = user.teacherProfile;
  const classTeacherOfId =
    tp?.classTeacherOf && typeof tp.classTeacherOf === 'object'
      ? tp.classTeacherOf._id
      : (tp?.classTeacherOf as string) || '';

  return {
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    username: user.username || '',
    password: '',
    active: user.active !== false,
    gender: tp?.gender || '',
    dateOfBirth: tp?.dateOfBirth ? String(tp.dateOfBirth).substring(0, 10) : '',
    nationalId: tp?.nationalId || '',
    maritalStatus: tp?.maritalStatus || '',
    homeAddress: tp?.homeAddress || '',
    emergencyContactName: tp?.emergencyContactName || '',
    emergencyContactPhone: tp?.emergencyContactPhone || '',
    emergencyContactRelationship: tp?.emergencyContactRelationship || '',
    qualifications: tp?.qualifications || '',
    teachingCertificate: tp?.teachingCertificate || '',
    yearsOfExperience: String(tp?.yearsOfExperience ?? ''),
    department: tp?.department || '',
    classTeacherOf: classTeacherOfId,
    subjectAssignments: (tp?.subjectAssignments || []).map((sa) => ({
      subject: typeof sa.subject === 'object' ? sa.subject._id : sa.subject || '',
      subjectName: typeof sa.subject === 'object' ? sa.subject.name : sa.subjectName || '',
      classes: (sa.classes || []).map((c) =>
        typeof c === 'object' ? c._id : c
      ),
    })),
  };
}

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  user?: User | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: TeacherFormData) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'personal', label: 'Personal Details' },
  { id: 'teaching', label: 'Teaching Assignments' },
];

const inputCls = 'border rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';
const sectionCls = 'grid grid-cols-1 md:grid-cols-2 gap-4';

const TeacherFormModal: React.FC<Props> = ({ open, mode, user, saving, onClose, onSubmit }) => {
  const [tab, setTab] = useState<TabId>('account');
  const [form, setForm] = useState<TeacherFormData>(defaultTeacherForm);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    setTab('account');
    setForm(mode === 'edit' && user ? fromUser(user) : defaultTeacherForm);
  }, [open, mode, user]);

  useEffect(() => {
    if (!open) return;
    classService.getClasses().then(setClasses).catch(() => {});
    subjectService.getSubjects().then(setSubjects).catch(() => {});
  }, [open]);

  const set = <K extends keyof TeacherFormData>(key: K, value: TeacherFormData[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const addAssignment = () =>
    setForm((p) => ({
      ...p,
      subjectAssignments: [...p.subjectAssignments, { subject: '', subjectName: '', classes: [] }],
    }));

  const removeAssignment = (i: number) =>
    setForm((p) => ({
      ...p,
      subjectAssignments: p.subjectAssignments.filter((_, idx) => idx !== i),
    }));

  const updateAssignment = (i: number, field: 'subject' | 'classes', value: string | string[]) =>
    setForm((p) => {
      const updated = [...p.subjectAssignments];
      if (field === 'subject') {
        const subj = subjects.find((s) => s._id === value || s.id === value);
        updated[i] = { ...updated[i], subject: value as string, subjectName: subj?.name || '' };
      } else {
        updated[i] = { ...updated[i], classes: value as string[] };
      }
      return { ...p, subjectAssignments: updated };
    });

  const toggleClass = (assignIdx: number, classId: string) => {
    const current = form.subjectAssignments[assignIdx].classes;
    const next = current.includes(classId) ? current.filter((c) => c !== classId) : [...current, classId];
    updateAssignment(assignIdx, 'classes', next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Teacher' : 'Edit Teacher'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Add a new teacher account with profile details.' : 'Update teacher account and profile.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Bar */}
        <div className="flex border-b mb-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ACCOUNT TAB */}
          {tab === 'account' && (
            <div className={sectionCls}>
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
                <input className={inputCls} placeholder="e.g. +263 77 123 4567" value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)} />
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
            </div>
          )}

          {/* PERSONAL DETAILS TAB */}
          {tab === 'personal' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h4>
                <div className={sectionCls}>
                  <div>
                    <label className={labelCls}>Gender</label>
                    <select className={inputCls} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Date of Birth</label>
                    <input type="date" className={inputCls} value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>National ID</label>
                    <input className={inputCls} placeholder="e.g. 63-123456-A-00" value={form.nationalId} onChange={(e) => set('nationalId', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Marital Status</label>
                    <select className={inputCls} value={form.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value)}>
                      <option value="">Select status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Home Address</label>
                    <textarea className={inputCls} rows={2} placeholder="Residential address" value={form.homeAddress} onChange={(e) => set('homeAddress', e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Emergency Contact</h4>
                <div className={sectionCls}>
                  <div>
                    <label className={labelCls}>Contact Name</label>
                    <input className={inputCls} placeholder="Full name" value={form.emergencyContactName} onChange={(e) => set('emergencyContactName', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Contact Phone</label>
                    <input className={inputCls} placeholder="Phone number" value={form.emergencyContactPhone} onChange={(e) => set('emergencyContactPhone', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Relationship</label>
                    <input className={inputCls} placeholder="e.g. Spouse, Parent, Sibling" value={form.emergencyContactRelationship} onChange={(e) => set('emergencyContactRelationship', e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Professional Details</h4>
                <div className={sectionCls}>
                  <div>
                    <label className={labelCls}>Highest Qualification</label>
                    <input className={inputCls} placeholder="e.g. B.Ed, M.Ed, HND" value={form.qualifications} onChange={(e) => set('qualifications', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Teaching Certificate</label>
                    <input className={inputCls} placeholder="e.g. PGCE, Dip Ed" value={form.teachingCertificate} onChange={(e) => set('teachingCertificate', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Years of Experience</label>
                    <input type="number" min={0} className={inputCls} placeholder="0" value={form.yearsOfExperience} onChange={(e) => set('yearsOfExperience', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Department</label>
                    <input className={inputCls} placeholder="e.g. Sciences, Humanities" value={form.department} onChange={(e) => set('department', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TEACHING ASSIGNMENTS TAB */}
          {tab === 'teaching' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Class Teacher Assignment</h4>
                <p className="text-xs text-gray-500 mb-3">The class this teacher is the form/class teacher for.</p>
                <select
                  className={inputCls}
                  value={form.classTeacherOf}
                  onChange={(e) => set('classTeacherOf', e.target.value)}
                >
                  <option value="">None — not a class teacher</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">Subject Assignments</h4>
                  <button
                    type="button"
                    onClick={addAssignment}
                    className="inline-flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md"
                  >
                    <Plus className="w-3 h-3" /> Add Subject
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">For each subject, select which classes the teacher teaches it to.</p>

                {form.subjectAssignments.length === 0 && (
                  <p className="text-sm text-gray-400 italic py-2">No subject assignments added yet.</p>
                )}

                <div className="space-y-4">
                  {form.subjectAssignments.map((sa, i) => (
                    <div key={i} className="border rounded-lg p-3 bg-gray-50 relative">
                      <button
                        type="button"
                        onClick={() => removeAssignment(i)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="mb-3">
                        <label className={labelCls}>Subject</label>
                        <select
                          className={inputCls}
                          value={sa.subject}
                          onChange={(e) => updateAssignment(i, 'subject', e.target.value)}
                        >
                          <option value="">Select a subject</option>
                          {subjects.map((s) => (
                            <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Classes taught on this subject</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {classes.length === 0 && (
                            <span className="text-xs text-gray-400">No classes available</span>
                          )}
                          {classes.map((c) => {
                            const checked = sa.classes.includes(c.id);
                            return (
                              <label
                                key={c.id}
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border cursor-pointer transition-colors ${
                                  checked
                                    ? 'bg-blue-100 border-blue-400 text-blue-800'
                                    : 'bg-white border-gray-300 text-gray-600 hover:border-blue-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={checked}
                                  onChange={() => toggleClass(i, c.id)}
                                />
                                {c.name}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-5 py-2 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md text-sm disabled:opacity-60"
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create Teacher' : 'Save Changes'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherFormModal;
