import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Search, Edit2, Trash2, X, CheckCircle, XCircle,
  ChevronRight, ChevronLeft,
} from 'lucide-react';
import { sysAdminService, School, SubscriptionPackage } from '../../../services/sysAdminService';
import { useToast } from '../../ui/use-toast';

type BillingCycle = 'monthly' | 'termly' | 'annually';

const EMPTY_FORM = {
  // step 1
  name: '', email: '', phone: '', address: '', registrationNumber: '',
  primaryContact: { name: '', email: '', phone: '' },
  adminEmail: '', adminFirstName: '', adminLastName: '',
  notes: '',
  // step 2
  planId: '',
  startOnTrial: true,
  trialDays: 30,
  billingCycle: 'termly' as BillingCycle,
  studentLimit: 0,
  amountDue: 0,
  paymentRef: '',
  startDate: '',
  endDate: '',
};

const SUB_STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-300',
  trial: 'bg-blue-500/20 text-blue-300',
  suspended: 'bg-yellow-500/20 text-yellow-300',
  expired: 'bg-red-500/20 text-red-300',
  cancelled: 'bg-slate-600/40 text-slate-400',
};

function deriveEndDate(start: Date, cycle: BillingCycle): Date {
  const d = new Date(start);
  if (cycle === 'monthly')  d.setMonth(d.getMonth() + 1);
  if (cycle === 'termly')   d.setMonth(d.getMonth() + 4);
  if (cycle === 'annually') d.setFullYear(d.getFullYear() + 1);
  return d;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// ─── Status filter ───────────────────────────────────────────────────────────

const STATUS_TABS = ['all', 'active', 'trial', 'suspended'] as const;
type StatusFilter = typeof STATUS_TABS[number];

// ─── MRR helper ──────────────────────────────────────────────────────────────

function calcMRR(sub: any): number | null {
  if (!sub || sub.status === 'trial') return null;
  const amount = sub.amountPaid || 0;
  if (amount === 0) return null;
  if (sub.billingCycle === 'monthly') return amount;
  if (sub.billingCycle === 'annually') return Math.round(amount / 12);
  return Math.round(amount / 3);
}

// ─── CapacityBar ─────────────────────────────────────────────────────────────

const CapacityBar: React.FC<{ used: number; total: number }> = ({ used, total }) => {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const color = pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="w-28">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{used.toLocaleString()}</span>
        <span className="text-slate-600">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── RenewsIn ────────────────────────────────────────────────────────────────

const RenewsIn: React.FC<{ endDate?: string; status?: string }> = ({ endDate, status }) => {
  if (status === 'suspended') return <span className="text-red-400 text-xs">overdue</span>;
  if (!endDate) return <span className="text-slate-600 text-xs">—</span>;
  const days = Math.round((new Date(endDate).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return <span className="text-red-400 text-xs font-mono">−{Math.abs(days)}d</span>;
  if (days <= 14) return <span className="text-amber-400 text-xs font-mono">{days}d</span>;
  return <span className="text-slate-300 text-xs font-mono">{days}d</span>;
};

// ─── Package card ────────────────────────────────────────────────────────────

interface PackageCardProps {
  pkg: SubscriptionPackage;
  selected: boolean;
  popular: boolean;
  onSelect: () => void;
  customSeats: number;
  onCustomSeats: (n: number) => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ pkg, selected, popular, onSelect, customSeats, onCustomSeats }) => {
  const isCustom = pkg.studentLimit >= 5000;
  const seats = isCustom ? (customSeats || pkg.studentLimit) : pkg.studentLimit;
  const price = +(pkg.pricePerStudent * seats).toFixed(2);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative text-left rounded-lg border p-3 transition-all w-full ${
        selected
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-slate-600 bg-slate-700/40 hover:border-slate-500'
      }`}
    >
      {popular && (
        <span className="absolute -top-2 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          POPULAR
        </span>
      )}
      <p className="text-white text-sm font-semibold">{pkg.name}</p>
      <p className="text-slate-400 text-xs mt-0.5">
        {isCustom ? 'Custom size' : `Up to ${seats.toLocaleString()} students`}
      </p>
      <p className="text-emerald-400 text-xs mt-1 font-medium">
        ${pkg.pricePerStudent}/student/{pkg.billingCycle ?? 'term'}
      </p>
      {isCustom && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            min={1}
            placeholder="Number of seats"
            value={customSeats || ''}
            onChange={(e) => onCustomSeats(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-600 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-emerald-500"
          />
          {customSeats > 0 && (
            <p className="text-emerald-300 text-xs mt-1">${price} / {pkg.billingCycle ?? 'term'}</p>
          )}
        </div>
      )}
      {!isCustom && selected && (
        <p className="text-emerald-300 text-xs mt-1">${price} / {pkg.billingCycle ?? 'term'}</p>
      )}
    </button>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────

const SysAdminSchoolsPage: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    sysAdminService.getSchools()
      .then(setSchools)
      .catch(() => toast.error('Failed to load schools'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    sysAdminService.getPackages().then(setPackages).catch(() => {});
    sysAdminService.getPlatformSettings().then((s) => {
      setForm((f) => ({ ...f, trialDays: s.trialDurationDays ?? 30 }));
    }).catch(() => {});
    setEditing(null);
    setForm(EMPTY_FORM);
    setStep(1);
    setShowModal(true);
  };

  const openEdit = (s: School) => {
    setEditing(s);
    setForm({
      ...EMPTY_FORM,
      name: s.name, email: s.email, phone: s.phone || '', address: s.address || '',
      registrationNumber: s.registrationNumber || '',
      primaryContact: { name: s.primaryContact?.name || '', email: s.primaryContact?.email || '', phone: s.primaryContact?.phone || '' },
      notes: s.notes || '',
    });
    setStep(1);
    setShowModal(true);
  };

  // ── Derived subscription values ──────────────────────────────────────────

  const selectedPkg = packages.find((p) => p._id === form.planId) ?? null;
  const isCustomPkg = selectedPkg ? selectedPkg.studentLimit >= 5000 : false;
  const effectiveSeats = isCustomPkg ? (form.studentLimit || selectedPkg?.studentLimit || 0) : (selectedPkg?.studentLimit ?? 0);
  const calculatedAmount = selectedPkg
    ? +(selectedPkg.pricePerStudent * effectiveSeats).toFixed(2)
    : 0;

  const trialEndDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (form.trialDays || 30));
    return d;
  })();

  const autoEndDate = form.startDate
    ? deriveEndDate(new Date(form.startDate), form.billingCycle)
    : deriveEndDate(new Date(), form.billingCycle);

  // ── Validation ───────────────────────────────────────────────────────────

  const step1Valid = form.name.trim().length > 0 && form.email.trim().length > 0;
  const step2Valid =
    form.planId.length > 0 &&
    (isCustomPkg ? form.studentLimit > 0 : true) &&
    (form.startOnTrial ? true : form.paymentRef.trim().length > 0);

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (editing) {
      setSaving(true);
      try {
        await sysAdminService.updateSchool(editing._id, {
          name: form.name, email: form.email, phone: form.phone || undefined,
          address: form.address || undefined, registrationNumber: form.registrationNumber || undefined,
          primaryContact: form.primaryContact, notes: form.notes || undefined,
        });
        toast.success('School updated');
        setShowModal(false);
        load();
      } catch {
        toast.error('Failed to update school');
      } finally {
        setSaving(false);
      }
      return;
    }

    setSaving(true);
    try {
      const payload: Parameters<typeof sysAdminService.createSchool>[0] = {
        name: form.name, email: form.email,
        phone: form.phone || undefined, address: form.address || undefined,
        registrationNumber: form.registrationNumber || undefined,
        primaryContact: form.primaryContact,
        notes: form.notes || undefined,
        adminEmail: form.adminEmail || undefined,
        adminFirstName: form.adminFirstName || undefined,
        adminLastName: form.adminLastName || undefined,
        planId: form.planId || undefined,
        startOnTrial: form.startOnTrial,
        trialDays: form.startOnTrial ? form.trialDays : undefined,
        billingCycle: !form.startOnTrial ? form.billingCycle : undefined,
        studentLimit: isCustomPkg ? form.studentLimit : undefined,
        amountDue: !form.startOnTrial ? calculatedAmount : undefined,
        paymentRef: !form.startOnTrial ? form.paymentRef : undefined,
        startDate: !form.startOnTrial && form.startDate ? form.startDate : undefined,
        endDate: !form.startOnTrial ? (form.endDate || toISODate(autoEndDate)) : undefined,
      };

      await sysAdminService.createSchool(payload);
      const pkgName = selectedPkg?.name ?? '';
      const mode = form.startOnTrial ? 'trial' : 'active';
      toast.success(`School onboarded · ${form.name}${pkgName ? ` · ${pkgName}` : ''} · ${mode}`);
      setShowModal(false);
      load();
    } catch {
      toast.error('Failed to onboard school');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: School) => {
    try {
      await sysAdminService.updateSchool(s._id, { active: !s.active });
      toast.success(`School ${s.active ? 'deactivated' : 'activated'}`);
      load();
    } catch {
      toast.error('Failed to update school');
    }
  };

  const handleDelete = async (s: School) => {
    if (!window.confirm(`Permanently delete "${s.name}"? This cannot be undone.`)) return;
    try {
      await sysAdminService.deleteSchool(s._id);
      toast.success('School deleted');
      load();
    } catch {
      toast.error('Failed to delete school');
    }
  };

  const counts = {
    all:       schools.length,
    active:    schools.filter((s) => (s.activeSubscription as any)?.status === 'active').length,
    trial:     schools.filter((s) => (s.activeSubscription as any)?.status === 'trial').length,
    suspended: schools.filter((s) => (s.activeSubscription as any)?.status === 'suspended').length,
  };

  const filtered = schools.filter((s) => {
    const subStatus = (s.activeSubscription as any)?.status;
    if (statusFilter !== 'all' && subStatus !== statusFilter) return false;
    if (search && !`${s.name} ${s.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-emerald-400" />
          <div>
            <h1 className="text-white text-lg font-bold">Schools</h1>
            <p className="text-slate-400 text-xs">Onboard and manage subscribed schools</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors self-start sm:self-auto"
        >
          <Plus size={14} /> Onboard School
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search schools…"
          className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-md pl-8 pr-3 py-2 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 p-1 bg-slate-900/60 rounded-lg border border-slate-700 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
              statusFilter === tab ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab} <span className="ml-1 opacity-60">{counts[tab]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No schools found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/40">
                  <th className="py-3 px-4 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">School</th>
                  <th className="py-3 px-4 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Status</th>
                  <th className="py-3 px-4 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Package</th>
                  <th className="py-3 px-4 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Seats</th>
                  <th className="py-3 px-4 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">MRR</th>
                  <th className="py-3 px-4 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Renews</th>
                  <th className="py-3 px-4 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Onboarded</th>
                  <th className="py-3 px-4 text-right text-slate-400 font-medium text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const sub = s.activeSubscription as any;
                  const subStatus = sub?.status as string | undefined;
                  const mrr = calcMRR(sub);
                  return (
                    <tr
                      key={s._id}
                      onClick={() => navigate(`/sys-admin/schools/${s._id}`)}
                      className="border-b border-slate-700/50 last:border-b-0 hover:bg-slate-700/30 cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${s.active ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          <div>
                            <p className="text-white font-medium">{s.name}</p>
                            {s.address && <p className="text-slate-500 text-xs">{s.address}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {sub ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SUB_STATUS_BADGE[subStatus ?? ''] ?? 'bg-slate-600 text-slate-300'}`}>
                            {subStatus}
                          </span>
                        ) : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-xs">
                        {sub?.package?.name ?? <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <CapacityBar used={s.seatsUsed ?? 0} total={sub?.studentLimit ?? 0} />
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">
                        {mrr !== null ? <span className="text-slate-300">${mrr.toLocaleString()}</span> : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <RenewsIn endDate={sub?.endDate} status={subStatus} />
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(s)}
                            className="text-slate-400 hover:text-yellow-400 transition-colors p-1 rounded"
                            title={s.active ? 'Deactivate' : 'Activate'}
                          >
                            {s.active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                          </button>
                          <button
                            onClick={() => openEdit(s)}
                            className="text-slate-400 hover:text-white transition-colors p-1 rounded"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
              <div>
                <h2 className="text-white font-semibold">{editing ? 'Edit School' : 'Onboard School'}</h2>
                {!editing && (
                  <p className="text-slate-500 text-xs mt-0.5">
                    Step {step} of 2 — {step === 1 ? 'School Info' : 'Subscription Setup'}
                  </p>
                )}
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            {/* Step indicator (create only) */}
            {!editing && (
              <div className="flex px-5 pt-4 gap-2 shrink-0">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className={`h-1 flex-1 rounded-full transition-colors ${n <= step ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  />
                ))}
              </div>
            )}

            {/* Step 1 — School Info */}
            {(step === 1 || editing) && (
              <div className="p-5 space-y-3 overflow-y-auto flex-1">
                {[
                  { label: 'School Name *', key: 'name', type: 'text' },
                  { label: 'School Email *', key: 'email', type: 'email' },
                  { label: 'Phone', key: 'phone', type: 'text' },
                  { label: 'Address', key: 'address', type: 'text' },
                  { label: 'Registration Number', key: 'registrationNumber', type: 'text' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-slate-400 text-xs font-medium mb-1">{label}</label>
                    <input
                      type={type}
                      value={(form as any)[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}

                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide pt-2">Primary Contact</p>
                {[
                  { label: 'Contact Name', key: 'name' },
                  { label: 'Contact Email', key: 'email' },
                  { label: 'Contact Phone', key: 'phone' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-slate-400 text-xs font-medium mb-1">{label}</label>
                    <input
                      value={(form.primaryContact as any)[key]}
                      onChange={(e) => setForm((f) => ({ ...f, primaryContact: { ...f.primaryContact, [key]: e.target.value } }))}
                      className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}

                {!editing && (
                  <>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide pt-2">Admin Account (optional)</p>
                    {[
                      { label: 'Admin Email (login)', key: 'adminEmail' },
                      { label: 'First Name', key: 'adminFirstName' },
                      { label: 'Last Name', key: 'adminLastName' },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className="block text-slate-400 text-xs font-medium mb-1">{label}</label>
                        <input
                          value={(form as any)[key]}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    ))}
                  </>
                )}

                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 2 — Subscription Setup */}
            {step === 2 && !editing && (
              <div className="p-5 space-y-5 overflow-y-auto flex-1">
                {/* Package selector */}
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Select Package</p>
                  <div className="grid grid-cols-2 gap-2">
                    {packages.filter((p) => p.isActive).map((pkg, i) => (
                      <PackageCard
                        key={pkg._id}
                        pkg={pkg}
                        selected={form.planId === pkg._id}
                        popular={i === 1}
                        onSelect={() => setForm((f) => ({ ...f, planId: pkg._id, studentLimit: 0 }))}
                        customSeats={form.studentLimit}
                        onCustomSeats={(n) => setForm((f) => ({ ...f, studentLimit: n }))}
                      />
                    ))}
                  </div>
                  {packages.filter((p) => p.isActive).length === 0 && (
                    <p className="text-slate-500 text-sm">No active packages found. Create packages first.</p>
                  )}
                </div>

                {/* Trial / Paid toggle */}
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Activation Mode</p>
                  <div className="flex gap-3">
                    {[
                      { label: 'Start on trial', value: true },
                      { label: 'Activate now (paid)', value: false },
                    ].map(({ label, value }) => (
                      <label key={String(value)} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="startOnTrial"
                          checked={form.startOnTrial === value}
                          onChange={() => setForm((f) => ({ ...f, startOnTrial: value }))}
                          className="accent-emerald-500"
                        />
                        <span className="text-slate-300 text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Trial sub-form */}
                {form.startOnTrial && (
                  <div className="bg-slate-700/40 rounded-lg p-4 space-y-3 border border-slate-600">
                    <div>
                      <label className="block text-slate-400 text-xs font-medium mb-1">Trial Duration (days)</label>
                      <input
                        type="number"
                        min={1}
                        value={form.trialDays}
                        onChange={(e) => setForm((f) => ({ ...f, trialDays: Number(e.target.value) }))}
                        className="w-32 bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <p className="text-slate-400 text-xs">
                      Trial ends on <span className="text-white">{trialEndDate.toLocaleDateString()}</span>
                    </p>
                    {selectedPkg && effectiveSeats > 0 && (
                      <p className="text-slate-400 text-xs">
                        Amount due at conversion:{' '}
                        <span className="text-emerald-400 font-medium">${calculatedAmount} / {selectedPkg.billingCycle ?? 'term'}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Paid sub-form */}
                {!form.startOnTrial && (
                  <div className="bg-slate-700/40 rounded-lg p-4 space-y-3 border border-slate-600">
                    {/* Billing cycle */}
                    <div>
                      <p className="text-slate-400 text-xs font-medium mb-2">Billing Cycle</p>
                      <div className="flex gap-2">
                        {(['monthly', 'termly', 'annually'] as BillingCycle[]).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, billingCycle: c }))}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors capitalize ${
                              form.billingCycle === c
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-600 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calculated amount */}
                    {selectedPkg && effectiveSeats > 0 && (
                      <p className="text-slate-400 text-xs">
                        Amount:{' '}
                        <span className="text-emerald-400 font-semibold text-sm">${calculatedAmount}</span>
                        {' '}/ {form.billingCycle}
                      </p>
                    )}

                    {/* Payment reference */}
                    <div>
                      <label className="block text-slate-400 text-xs font-medium mb-1">Payment Reference *</label>
                      <input
                        value={form.paymentRef}
                        onChange={(e) => setForm((f) => ({ ...f, paymentRef: e.target.value }))}
                        placeholder="e.g. INV-2026-001"
                        className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 text-xs font-medium mb-1">Term Start</label>
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                          className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-xs font-medium mb-1">
                          Term End <span className="text-slate-600">(auto)</span>
                        </label>
                        <input
                          type="date"
                          value={form.endDate || toISODate(autoEndDate)}
                          onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                          className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700 shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm px-4 py-2 rounded-md border border-slate-600 hover:border-slate-500 transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {step === 2 && !editing && (
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-slate-400 hover:text-white text-sm px-3 py-2 rounded-md border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    <ChevronLeft size={14} /> Back to Info
                  </button>
                )}

                {(editing || step === 2) ? (
                  <button
                    onClick={handleSave}
                    disabled={saving || (step === 2 && !step2Valid) || (!!editing && !step1Valid)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                  >
                    {saving ? 'Saving…' : editing ? 'Save Changes' : 'Onboard School'}
                  </button>
                ) : (
                  <button
                    onClick={() => setStep(2)}
                    disabled={!step1Valid}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                  >
                    Next: Subscription <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SysAdminSchoolsPage;
