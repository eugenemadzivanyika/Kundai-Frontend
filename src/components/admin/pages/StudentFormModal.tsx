import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { User } from '../../../types';
import { classService, ClassItem } from '../../../services/classService';

type TabId = 'account' | 'personal' | 'guardian' | 'health';

export type StudentFormData = {
  // Account
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
  active: boolean;
  // Academic / Personal
  form: string;
  classGroupId: string;
  gender: string;
  dateOfBirth: string;
  homeAddress: string;
  nationality: string;
  religion: string;
  previousSchool: string;
  admissionDate: string;
  studentRegNumber: string;
  boardingStatus: string;
  transportMode: string;
  // Guardian 1
  guardianName: string;
  guardianRelationship: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianAddress: string;
  guardianOccupation: string;
  // Guardian 2
  secondGuardianName: string;
  secondGuardianPhone: string;
  secondGuardianRelationship: string;
  // Health
  bloodType: string;
  medicalConditions: string;
  specialNeeds: string;
};

const defaultStudentForm: StudentFormData = {
  firstName: '', lastName: '', email: '', phoneNumber: '', username: '', password: '', active: true,
  form: '1', classGroupId: '', gender: '', dateOfBirth: '', homeAddress: '',
  nationality: 'Zimbabwean', religion: '', previousSchool: '', admissionDate: '',
  studentRegNumber: '', boardingStatus: '', transportMode: '',
  guardianName: '', guardianRelationship: '', guardianPhone: '', guardianEmail: '',
  guardianAddress: '', guardianOccupation: '',
  secondGuardianName: '', secondGuardianPhone: '', secondGuardianRelationship: '',
  bloodType: '', medicalConditions: '', specialNeeds: '',
};

function fromUser(user: User): StudentFormData {
  const sp = user.studentProfile as any;
  const classGroupId =
    sp?.classGroup && typeof sp.classGroup === 'object'
      ? sp.classGroup._id
      : (sp?.classGroup as string) || '';
  return {
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    username: user.username || '',
    password: '',
    active: user.active !== false,
    form: String(sp?.form ?? 1),
    classGroupId,
    gender: sp?.gender || '',
    dateOfBirth: sp?.dateOfBirth ? String(sp.dateOfBirth).substring(0, 10) : '',
    homeAddress: sp?.homeAddress || '',
    nationality: sp?.nationality || 'Zimbabwean',
    religion: sp?.religion || '',
    previousSchool: sp?.previousSchool || '',
    admissionDate: sp?.admissionDate ? String(sp.admissionDate).substring(0, 10) : '',
    studentRegNumber: sp?.studentRegNumber || '',
    boardingStatus: sp?.boardingStatus || '',
    transportMode: sp?.transportMode || '',
    guardianName: sp?.guardianName || '',
    guardianRelationship: sp?.guardianRelationship || '',
    guardianPhone: sp?.guardianPhone || '',
    guardianEmail: sp?.guardianEmail || '',
    guardianAddress: sp?.guardianAddress || '',
    guardianOccupation: sp?.guardianOccupation || '',
    secondGuardianName: sp?.secondGuardianName || '',
    secondGuardianPhone: sp?.secondGuardianPhone || '',
    secondGuardianRelationship: sp?.secondGuardianRelationship || '',
    bloodType: sp?.bloodType || '',
    medicalConditions: sp?.medicalConditions || '',
    specialNeeds: sp?.specialNeeds || '',
  };
}

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  user?: User | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: StudentFormData) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'personal', label: 'Personal & Academic' },
  { id: 'guardian', label: 'Parent / Guardian' },
  { id: 'health', label: 'Health & School Info' },
];

const FORM_LEVELS = [1, 2, 3, 4, 5, 6];

const inputCls = 'border rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-teal-500';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';
const sectionCls = 'grid grid-cols-1 md:grid-cols-2 gap-4';
const subheadCls = 'text-sm font-semibold text-gray-700 mb-3 mt-1 border-b pb-1';

const StudentFormModal: React.FC<Props> = ({ open, mode, user, saving, onClose, onSubmit }) => {
  const [tab, setTab] = useState<TabId>('account');
  const [form, setForm] = useState<StudentFormData>(defaultStudentForm);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  useEffect(() => {
    if (!open) return;
    setTab('account');
    setForm(mode === 'edit' && user ? fromUser(user) : defaultStudentForm);
  }, [open, mode, user]);

  useEffect(() => {
    if (!open) return;
    classService.getClasses().then(setClasses).catch(() => {});
  }, [open]);

  // Filter classes to match selected form level
  const formClasses = classes.filter((c) => {
    const cForm = (c as any).form;
    return cForm === undefined || cForm === null || String(cForm) === form.form;
  });

  const set = <K extends keyof StudentFormData>(key: K, value: StudentFormData[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Student' : 'Edit Student'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new student with full profile and guardian details.'
              : 'Update student account, profile, and guardian information.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Bar */}
        <div className="flex border-b mb-4 flex-wrap gap-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── ACCOUNT TAB ── */}
          {tab === 'account' && (
            <div className={sectionCls}>
              <div>
                <label className={labelCls}>First Name *</label>
                <input className={inputCls} placeholder="First name" value={form.firstName}
                  onChange={(e) => set('firstName', e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Last Name *</label>
                <input className={inputCls} placeholder="Last name" value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input type="email" className={inputCls} placeholder="Email address" value={form.email}
                  onChange={(e) => set('email', e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Student Phone Number</label>
                <input className={inputCls} placeholder="e.g. +263 77 123 4567" value={form.phoneNumber}
                  onChange={(e) => set('phoneNumber', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Username</label>
                <input className={inputCls} placeholder="Username (optional)" value={form.username}
                  onChange={(e) => set('username', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>{mode === 'create' ? 'Password *' : 'New Password'}</label>
                <input type="password" className={inputCls}
                  placeholder={mode === 'create' ? 'Password' : 'Leave blank to keep current'}
                  value={form.password} onChange={(e) => set('password', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
                  Active account
                </label>
              </div>
            </div>
          )}

          {/* ── PERSONAL & ACADEMIC TAB ── */}
          {tab === 'personal' && (
            <div className="space-y-5">
              <div>
                <h4 className={subheadCls}>Academic Placement</h4>
                <div className={sectionCls}>
                  <div>
                    <label className={labelCls}>Form Level *</label>
                    <select className={inputCls} value={form.form}
                      onChange={(e) => { set('form', e.target.value); set('classGroupId', ''); }}>
                      {FORM_LEVELS.map((f) => (
                        <option key={f} value={String(f)}>Form {f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Class</label>
                    <select className={inputCls} value={form.classGroupId}
                      onChange={(e) => set('classGroupId', e.target.value)}>
                      <option value="">No class assigned</option>
                      {(formClasses.length > 0 ? formClasses : classes).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Student Reg / ZIMSEC Number</label>
                    <input className={inputCls} placeholder="Ministry / ZIMSEC reg number"
                      value={form.studentRegNumber} onChange={(e) => set('studentRegNumber', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Admission Date</label>
                    <input type="date" className={inputCls} value={form.admissionDate}
                      onChange={(e) => set('admissionDate', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Boarding Status</label>
                    <select className={inputCls} value={form.boardingStatus}
                      onChange={(e) => set('boardingStatus', e.target.value)}>
                      <option value="">Select…</option>
                      <option value="Day Scholar">Day Scholar</option>
                      <option value="Boarder">Boarder</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Mode of Transport</label>
                    <select className={inputCls} value={form.transportMode}
                      onChange={(e) => set('transportMode', e.target.value)}>
                      <option value="">Select…</option>
                      <option value="Walking">Walking</option>
                      <option value="School Bus">School Bus</option>
                      <option value="Private Vehicle">Private Vehicle</option>
                      <option value="Public Transport">Public Transport</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Previous School</label>
                    <input className={inputCls} placeholder="Previous school name"
                      value={form.previousSchool} onChange={(e) => set('previousSchool', e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className={subheadCls}>Personal Information</h4>
                <div className={sectionCls}>
                  <div>
                    <label className={labelCls}>Gender</label>
                    <select className={inputCls} value={form.gender}
                      onChange={(e) => set('gender', e.target.value)}>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Date of Birth</label>
                    <input type="date" className={inputCls} value={form.dateOfBirth}
                      onChange={(e) => set('dateOfBirth', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Nationality</label>
                    <input className={inputCls} placeholder="e.g. Zimbabwean" value={form.nationality}
                      onChange={(e) => set('nationality', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Religion</label>
                    <input className={inputCls} placeholder="e.g. Christian, Muslim, Other"
                      value={form.religion} onChange={(e) => set('religion', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Home Address</label>
                    <textarea className={inputCls} rows={2} placeholder="Residential address"
                      value={form.homeAddress} onChange={(e) => set('homeAddress', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PARENT / GUARDIAN TAB ── */}
          {tab === 'guardian' && (
            <div className="space-y-5">
              <div>
                <h4 className={subheadCls}>Primary Parent / Guardian</h4>
                <div className={sectionCls}>
                  <div>
                    <label className={labelCls}>Full Name</label>
                    <input className={inputCls} placeholder="Full name" value={form.guardianName}
                      onChange={(e) => set('guardianName', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Relationship to Student</label>
                    <select className={inputCls} value={form.guardianRelationship}
                      onChange={(e) => set('guardianRelationship', e.target.value)}>
                      <option value="">Select relationship</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Relative">Relative</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number *</label>
                    <input className={inputCls} placeholder="e.g. +263 77 123 4567" value={form.guardianPhone}
                      onChange={(e) => set('guardianPhone', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Email (optional)</label>
                    <input type="email" className={inputCls} placeholder="guardian@email.com" value={form.guardianEmail}
                      onChange={(e) => set('guardianEmail', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Occupation</label>
                    <input className={inputCls} placeholder="e.g. Teacher, Nurse, Farmer"
                      value={form.guardianOccupation} onChange={(e) => set('guardianOccupation', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>&nbsp;</label>
                    {/* spacer */}
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Guardian Address (if different from student)</label>
                    <textarea className={inputCls} rows={2} placeholder="Guardian's address"
                      value={form.guardianAddress} onChange={(e) => set('guardianAddress', e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className={subheadCls}>Secondary Parent / Guardian (optional)</h4>
                <div className={sectionCls}>
                  <div>
                    <label className={labelCls}>Full Name</label>
                    <input className={inputCls} placeholder="Full name" value={form.secondGuardianName}
                      onChange={(e) => set('secondGuardianName', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Relationship</label>
                    <select className={inputCls} value={form.secondGuardianRelationship}
                      onChange={(e) => set('secondGuardianRelationship', e.target.value)}>
                      <option value="">Select relationship</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Relative">Relative</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <input className={inputCls} placeholder="e.g. +263 77 123 4567" value={form.secondGuardianPhone}
                      onChange={(e) => set('secondGuardianPhone', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── HEALTH & SCHOOL INFO TAB ── */}
          {tab === 'health' && (
            <div className="space-y-5">
              <div>
                <h4 className={subheadCls}>Medical Information</h4>
                <p className="text-xs text-gray-500 mb-3">This information is kept confidential and used only for student welfare.</p>
                <div className={sectionCls}>
                  <div>
                    <label className={labelCls}>Blood Type</label>
                    <select className={inputCls} value={form.bloodType}
                      onChange={(e) => set('bloodType', e.target.value)}>
                      <option value="">Unknown / Not specified</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Known Medical Conditions / Allergies</label>
                    <textarea className={inputCls} rows={3}
                      placeholder="e.g. Asthma, Diabetes, Peanut allergy — leave blank if none"
                      value={form.medicalConditions} onChange={(e) => set('medicalConditions', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Special Needs / Learning Support Requirements</label>
                    <textarea className={inputCls} rows={3}
                      placeholder="e.g. Visual impairment, Hearing aid user, Dyslexia — leave blank if none"
                      value={form.specialNeeds} onChange={(e) => set('specialNeeds', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t">
            <div className="flex gap-1">
              {TABS.map((t) => (
                <button key={t.id} type="button" onClick={() => setTab(t.id)}
                  className={`w-2 h-2 rounded-full transition-colors ${tab === t.id ? 'bg-teal-600' : 'bg-gray-300 hover:bg-gray-400'}`}
                  aria-label={`Go to ${t.label}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-5 py-2 rounded-md text-sm">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-5 py-2 rounded-md text-sm disabled:opacity-60">
                {saving ? 'Saving...' : mode === 'create' ? 'Create Student' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentFormModal;
