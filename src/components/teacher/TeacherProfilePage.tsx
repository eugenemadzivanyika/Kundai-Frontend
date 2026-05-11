// src/components/teacher/TeacherProfilePage.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Camera, Save, User, Phone, MapPin, Briefcase,
  AlertCircle, ShieldAlert, Users,
} from 'lucide-react';
import { profileService } from '../../services/profileService';
import type { Profile, ProfileUpdate, TeacherProfileData } from '../../types/profile';
import { authService } from '../../services/api';
import { resolveAssetUrl } from '../../services/apiClient';

// ─── Shared input component ──────────────────────────────────────────────────
interface FieldProps {
  label: string;
  value?: string | number;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
}

const Field: React.FC<FieldProps> = ({ label, value = '', onChange, type = 'text', disabled }) => (
  <label className="block text-sm font-semibold text-slate-600">
    {label}
    <input
      type={type}
      value={value as string}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
    />
  </label>
);

interface SelectProps {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

const SelectField: React.FC<SelectProps> = ({ label, value = '', onChange, options }) => (
  <label className="block text-sm font-semibold text-slate-600">
    {label}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">— select —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </label>
);

// ─── Section wrapper ─────────────────────────────────────────────────────────
const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
    <div className="flex items-center gap-2 mb-5">
      <span className="text-blue-600">{icon}</span>
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────
const TeacherProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Partial<ProfileUpdate>>({});
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    profileService.getMyProfile().then((p) => {
      setProfile(p);
      const tp = p.teacherProfile ?? {};
      setForm({
        firstName: p.firstName,
        lastName: p.lastName,
        phoneNumber: p.phoneNumber,
        ...tp,
      });
      if (p.avatarUrl) setAvatarPreview(resolveAssetUrl(p.avatarUrl));
    });
  }, []);

  const set = (field: keyof ProfileUpdate) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be 2 MB or smaller.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      // Upload avatar first if one is pending
      if (avatarFile) {
        setAvatarSaving(true);
        const { avatarUrl } = await profileService.uploadAvatar(avatarFile);
        setAvatarFile(null);
        // Update cached user so Header picks it up immediately
        const cached = authService.getCurrentUser();
        if (cached) localStorage.setItem('user', JSON.stringify({ ...cached, avatarUrl }));
        setAvatarSaving(false);
      }

      const updated = await profileService.updateMyProfile(form);
      setProfile(updated);

      // Refresh cached user name for Header
      const cached = authService.getCurrentUser();
      if (cached) {
        localStorage.setItem('user', JSON.stringify({
          ...cached,
          firstName: updated.firstName,
          lastName: updated.lastName,
        }));
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
      setAvatarSaving(false);
    }
  };

  const initials = profile
    ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase()
    : '…';

  const tp = (form as TeacherProfileData);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* ── Avatar + name banner ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-6">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-full border-2 border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center text-2xl font-bold text-slate-500 hover:opacity-80 transition-opacity"
          >
            {avatarPreview
              ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              : initials}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 shadow hover:bg-blue-700"
          >
            <Camera size={13} />
          </button>
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="text-xl font-bold text-slate-800">{profile?.firstName} {profile?.lastName}</p>
          <p className="text-sm text-slate-500">{profile?.email}</p>
          <p className="text-xs text-slate-400 mt-1">Click avatar to change · JPG or PNG · max 2 MB</p>
        </div>
      </div>

      {/* ── Personal Info ── */}
      <Section icon={<User size={18} />} title="Personal Information">
        <Field label="First name" value={form.firstName} onChange={set('firstName')} />
        <Field label="Last name" value={form.lastName} onChange={set('lastName')} />
        <Field label="Email" value={profile?.email} onChange={() => {}} disabled />
        <Field label="Phone number" value={form.phoneNumber} onChange={set('phoneNumber')} />
        <SelectField label="Gender" value={tp.gender} onChange={set('gender')}
          options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]} />
        <Field label="Date of birth" value={tp.dateOfBirth?.slice(0, 10)} onChange={set('dateOfBirth')} type="date" />
        <Field label="National ID" value={tp.nationalId} onChange={set('nationalId')} />
        <SelectField label="Marital status" value={tp.maritalStatus} onChange={set('maritalStatus')}
          options={[
            { value: 'Single', label: 'Single' }, { value: 'Married', label: 'Married' },
            { value: 'Divorced', label: 'Divorced' }, { value: 'Widowed', label: 'Widowed' },
          ]} />
        <div className="sm:col-span-2">
          <Field label="Home address" value={tp.homeAddress} onChange={set('homeAddress')} />
        </div>
      </Section>

      {/* ── Professional Details ── */}
      <Section icon={<Briefcase size={18} />} title="Professional Details">
        <Field label="Staff number" value={tp.staffNumber} onChange={set('staffNumber')} />
        <Field label="Teaching council reg. no." value={tp.teachingCouncilRegNumber} onChange={set('teachingCouncilRegNumber')} />
        <SelectField label="Employment type" value={tp.employmentType} onChange={set('employmentType')}
          options={[
            { value: 'Permanent', label: 'Permanent' }, { value: 'Temporary', label: 'Temporary' },
            { value: 'Relief', label: 'Relief' }, { value: 'Contract', label: 'Contract' },
          ]} />
        <Field label="Position" value={tp.position} onChange={set('position')} />
        <Field label="Department" value={tp.department} onChange={set('department')} />
        <Field label="Qualifications" value={tp.qualifications} onChange={set('qualifications')} />
        <Field label="Teaching certificate" value={tp.teachingCertificate} onChange={set('teachingCertificate')} />
        <Field label="Years of experience" value={tp.yearsOfExperience?.toString()} onChange={(v) => set('yearsOfExperience')(v)} type="number" />
        <Field label="Employment start date" value={tp.employmentStartDate?.slice(0, 10)} onChange={set('employmentStartDate')} type="date" />
      </Section>

      {/* ── Emergency Contact ── */}
      <Section icon={<ShieldAlert size={18} />} title="Emergency Contact">
        <Field label="Contact name" value={tp.emergencyContactName} onChange={set('emergencyContactName')} />
        <Field label="Contact phone" value={tp.emergencyContactPhone} onChange={set('emergencyContactPhone')} />
        <Field label="Relationship" value={tp.emergencyContactRelationship} onChange={set('emergencyContactRelationship')} />
      </Section>

      {/* ── Family ── */}
      <Section icon={<Users size={18} />} title="Family">
        <Field label="Spouse name" value={tp.spouseName} onChange={set('spouseName')} />
        <Field label="Spouse phone" value={tp.spousePhone} onChange={set('spousePhone')} />
        <Field label="Number of dependants" value={tp.numberOfDependants?.toString()} onChange={(v) => set('numberOfDependants')(v)} type="number" />
      </Section>

      {/* ── Feedback + Save ── */}
      <div className="flex items-center justify-between">
        <div>
          {error && (
            <p className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle size={14} /> {error}
            </p>
          )}
          {success && <p className="text-sm text-green-600">Profile saved successfully.</p>}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <Save size={15} />
          {avatarSaving ? 'Uploading avatar…' : saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
};

export default TeacherProfilePage;
