import React, { useEffect, useState } from 'react';
import { Settings, User, Globe, KeyRound, Save, Loader2 } from 'lucide-react';
import { sysAdminService, SubscriptionPackage } from '../../../services/sysAdminService';
import { authService } from '../../../services/api';
import { useToast } from '../../ui/use-toast';

// ── Shared field component ────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-slate-400 text-xs font-medium mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500 disabled:opacity-50 ${props.className ?? ''}`}
    />
  );
}

// ── Personal profile section ──────────────────────────────────────────────────

const PersonalSettings: React.FC = () => {
  const { toast } = useToast();
  const user = authService.getCurrentUser();

  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phoneNumber: (user as any)?.phoneNumber ?? '',
  });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await sysAdminService.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
      });
      toast.success('Profile updated');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!pwd.currentPassword || !pwd.newPassword) {
      toast.error('Current and new password are required');
      return;
    }
    if (pwd.newPassword !== pwd.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwd.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSavingPwd(true);
    try {
      await sysAdminService.updateProfile({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      toast.success('Password changed');
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to change password');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={15} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Profile information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First name">
            <Input value={profile.firstName} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))} />
          </Field>
          <Field label="Last name">
            <Input value={profile.lastName} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))} />
          </Field>
          <Field label="Email address">
            <Input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
          </Field>
          <Field label="Phone number">
            <Input value={profile.phoneNumber} onChange={(e) => setProfile((p) => ({ ...p, phoneNumber: e.target.value }))} />
          </Field>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save profile
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={15} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Change password</h3>
        </div>
        <div className="space-y-3 max-w-md">
          <Field label="Current password">
            <Input type="password" value={pwd.currentPassword} onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))} autoComplete="current-password" />
          </Field>
          <Field label="New password">
            <Input type="password" value={pwd.newPassword} onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))} autoComplete="new-password" />
          </Field>
          <Field label="Confirm new password">
            <Input type="password" value={pwd.confirmPassword} onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))} autoComplete="new-password" />
          </Field>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={savePassword}
            disabled={savingPwd}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            {savingPwd ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
            Change password
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Platform settings section ─────────────────────────────────────────────────

const PlatformSettingsSection: React.FC = () => {
  const { toast } = useToast();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    trialDurationDays: 30,
    defaultPackageId: '' as string,
    platformName: 'Kundai',
  });

  useEffect(() => {
    Promise.all([sysAdminService.getPlatformSettings(), sysAdminService.getPackages()])
      .then(([s, pkgs]) => {
        setPackages(pkgs);
        setForm({
          trialDurationDays: s.trialDurationDays,
          defaultPackageId: (s.defaultPackageId as any)?._id ?? s.defaultPackageId ?? '',
          platformName: s.platformName,
        });
      })
      .catch(() => toast.error('Failed to load platform settings'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await sysAdminService.updatePlatformSettings({
        trialDurationDays: form.trialDurationDays,
        defaultPackageId: form.defaultPackageId || null,
        platformName: form.platformName,
      });
      toast.success('Platform settings saved');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 animate-pulse h-48" />;
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Globe size={15} className="text-indigo-400" />
        <h3 className="text-sm font-semibold text-white">Platform settings</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <Field label="Platform name">
          <Input value={form.platformName} onChange={(e) => setForm((f) => ({ ...f, platformName: e.target.value }))} />
        </Field>
        <Field label="Trial duration (days)">
          <Input
            type="number"
            min="1"
            max="365"
            value={form.trialDurationDays}
            onChange={(e) => setForm((f) => ({ ...f, trialDurationDays: parseInt(e.target.value) || 30 }))}
          />
        </Field>
        <Field label="Default package for new schools">
          <select
            value={form.defaultPackageId}
            onChange={(e) => setForm((f) => ({ ...f, defaultPackageId: e.target.value }))}
            className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="">None (no default)</option>
            {packages.filter((p) => p.isActive).map((p) => (
              <option key={p._id} value={p._id}>{p.name} — {p.studentLimit} seats @ ${p.pricePerStudent}/student</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save settings
        </button>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'personal' | 'platform';

const SysAdminSettingsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('personal');

  return (
    <div className="space-y-5 mt-4">
      <div className="flex items-center gap-2">
        <Settings size={18} className="text-emerald-400" />
        <div>
          <h1 className="text-white text-lg font-bold">Settings</h1>
          <p className="text-slate-400 text-xs">Manage your profile and platform-wide configuration</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-slate-700 flex gap-0">
        {([
          { key: 'personal', label: 'Personal' },
          { key: 'platform', label: 'Platform' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === key ? 'border-emerald-400 text-white' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'personal' && <PersonalSettings />}
      {tab === 'platform' && <PlatformSettingsSection />}
    </div>
  );
};

export default SysAdminSettingsPage;
