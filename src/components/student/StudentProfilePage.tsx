import React, { useEffect, useRef, useState } from 'react';
import {
  Camera, Save, User, Shield, Users, Heart,
  AlertCircle, Loader2,
} from 'lucide-react';
import { profileService } from '../../services/profileService';
import { authService } from '../../services/api';
import { resolveAssetUrl } from '../../services/apiClient';
import type { Profile, ProfileUpdate, StudentProfileData } from '../../types/profile';

interface StudentProfilePageProps {
  onAvatarUpdated?: (url: string) => void;
}

const Field: React.FC<{
  label: string;
  value?: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
}> = ({ label, value = '', onChange, type = 'text', disabled }) => (
  <label className="block text-sm font-semibold text-slate-600">
    {label}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
    />
  </label>
);

const SelectField: React.FC<{
  label: string;
  value?: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}> = ({ label, value = '', onChange, options }) => (
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

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
    <div className="flex items-center gap-2 mb-5">
      <span className="text-blue-600">{icon}</span>
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  </div>
);

const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ onAvatarUpdated }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Partial<ProfileUpdate>>({});
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    profileService.getMyProfile().then((p) => {
      setProfile(p);
      const sp = p.studentProfile ?? {};
      setForm({ firstName: p.firstName, lastName: p.lastName, phoneNumber: p.phoneNumber, ...sp });
      if (p.avatarUrl) setAvatarPreview(resolveAssetUrl(p.avatarUrl));
    }).finally(() => setLoading(false));
  }, []);

  const set = (field: keyof ProfileUpdate) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('Image must be 2 MB or smaller.'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      if (avatarFile) {
        setAvatarSaving(true);
        const { avatarUrl } = await profileService.uploadAvatar(avatarFile);
        setAvatarFile(null);
        const cached = authService.getCurrentUser();
        if (cached) localStorage.setItem('user', JSON.stringify({ ...cached, avatarUrl }));
        setProfile((prev) => prev ? { ...prev, avatarUrl } : prev);
        onAvatarUpdated?.(avatarUrl);
        setAvatarSaving(false);
      }
      const updated = await profileService.updateMyProfile(form);
      setProfile(updated);
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
    : '';

  const sp = form as StudentProfileData;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading profile…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Avatar + name banner */}
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

      {/* Personal Information */}
      <Section icon={<User size={18} />} title="Personal Information">
        <Field label="First name" value={form.firstName} onChange={set('firstName')} />
        <Field label="Last name" value={form.lastName} onChange={set('lastName')} />
        <Field label="Email" value={profile?.email} onChange={() => {}} disabled />
        <Field label="Phone number" value={form.phoneNumber} onChange={set('phoneNumber')} />
        <SelectField label="Gender" value={sp.gender} onChange={set('gender')}
          options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]} />
        <Field label="Date of birth" value={sp.dateOfBirth?.slice(0, 10)} onChange={set('dateOfBirth')} type="date" />
        <Field label="Nationality" value={sp.nationality} onChange={set('nationality')} />
        <Field label="Religion" value={sp.religion} onChange={set('religion')} />
        <div className="sm:col-span-2">
          <Field label="Home address" value={sp.homeAddress} onChange={set('homeAddress')} />
        </div>
      </Section>

      {/* School & Health Details */}
      <Section icon={<Heart size={18} />} title="School & Health Details">
        <SelectField label="Boarding status" value={sp.boardingStatus} onChange={set('boardingStatus')}
          options={[{ value: 'Day Scholar', label: 'Day Scholar' }, { value: 'Boarder', label: 'Boarder' }]} />
        <SelectField label="Transport mode" value={sp.transportMode} onChange={set('transportMode')}
          options={[
            { value: 'School Bus', label: 'School Bus' },
            { value: 'Public Transport', label: 'Public Transport' },
            { value: 'Private Car', label: 'Private Car' },
            { value: 'Walk', label: 'Walk' },
          ]} />
        <Field label="Blood type" value={sp.bloodType} onChange={set('bloodType')} />
        <Field label="Medical conditions" value={sp.medicalConditions} onChange={set('medicalConditions')} />
        <Field label="Special needs" value={sp.specialNeeds} onChange={set('specialNeeds')} />
      </Section>

      {/* Guardian / Parent */}
      <Section icon={<Shield size={18} />} title="Guardian / Parent">
        <Field label="Guardian name" value={sp.guardianName} onChange={set('guardianName')} />
        <Field label="Relationship" value={sp.guardianRelationship} onChange={set('guardianRelationship')} />
        <Field label="Phone" value={sp.guardianPhone} onChange={set('guardianPhone')} />
        <Field label="Email" value={sp.guardianEmail} onChange={set('guardianEmail')} />
        <Field label="Occupation" value={sp.guardianOccupation} onChange={set('guardianOccupation')} />
        <div className="sm:col-span-2">
          <Field label="Guardian address" value={sp.guardianAddress} onChange={set('guardianAddress')} />
        </div>
      </Section>

      {/* Second Guardian */}
      <Section icon={<Users size={18} />} title="Second Guardian">
        <Field label="Name" value={sp.secondGuardianName} onChange={set('secondGuardianName')} />
        <Field label="Phone" value={sp.secondGuardianPhone} onChange={set('secondGuardianPhone')} />
        <Field label="Relationship" value={sp.secondGuardianRelationship} onChange={set('secondGuardianRelationship')} />
      </Section>

      {/* Feedback + Save */}
      <div className="flex items-center justify-between pb-8">
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

export default StudentProfilePage;
