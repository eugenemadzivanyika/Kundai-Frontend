import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, Edit2, Trash2, X } from 'lucide-react';
import { sysAdminService, Subscription, School, SubscriptionPackage } from '../../../services/sysAdminService';
import { useToast } from '../../ui/use-toast';

const STATUS_OPTIONS = ['trial', 'active', 'suspended', 'expired', 'cancelled'];
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  trial: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  suspended: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  expired: 'bg-red-500/20 text-red-300 border border-red-500/30',
  cancelled: 'bg-slate-600/40 text-slate-400 border border-slate-600',
};
const BILLING_LABELS: Record<string, string> = { monthly: 'Monthly', termly: 'Per Term', annually: 'Annual' };

const today = () => new Date().toISOString().slice(0, 10);
const inOneYear = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

const EMPTY_FORM = {
  schoolId: '',
  packageId: '',
  studentLimit: '',
  billingCycle: 'monthly' as 'monthly' | 'termly' | 'annually',
  startDate: today(),
  endDate: inOneYear(),
  amountDue: '',
  paymentRef: '',
  notes: '',
  status: 'active' as string,
};

const schoolName = (s: School | string) => (typeof s === 'string' ? s : s.name);
const pkgName = (p: SubscriptionPackage | string) => (typeof p === 'string' ? p : p.name);

const SysAdminSubscriptionsPage: React.FC = () => {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      sysAdminService.getSubscriptions(),
      sysAdminService.getSchools(),
      sysAdminService.getPackages(),
    ])
      .then(([s, sc, pk]) => { setSubs(s); setSchools(sc); setPackages(pk); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Auto-fill amount when package + studentLimit changes
  const selectedPkg = packages.find((p) => p._id === form.packageId);
  const autoAmount = selectedPkg && form.studentLimit
    ? (selectedPkg.pricePerStudent * Number(form.studentLimit)).toFixed(2)
    : '';

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (sub: Subscription) => {
    setEditing(sub);
    const s = sub.school as School;
    const p = sub.package as SubscriptionPackage;
    setForm({
      schoolId: s._id,
      packageId: p._id,
      studentLimit: String(sub.studentLimit),
      billingCycle: sub.billingCycle,
      startDate: sub.startDate.slice(0, 10),
      endDate: sub.endDate.slice(0, 10),
      amountDue: String(sub.amountDue),
      paymentRef: sub.paymentRef || '',
      notes: sub.notes || '',
      status: sub.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.schoolId || !form.packageId || !form.studentLimit || !form.startDate || !form.endDate) {
      toast.error('School, package, student limit, and dates are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await sysAdminService.updateSubscription(editing._id, {
          packageId: form.packageId,
          studentLimit: Number(form.studentLimit),
          billingCycle: form.billingCycle,
          startDate: form.startDate,
          endDate: form.endDate,
          amountDue: form.amountDue ? Number(form.amountDue) : undefined,
          paymentRef: form.paymentRef,
          notes: form.notes,
          status: form.status as any,
        });
        toast.success('Subscription updated');
      } else {
        await sysAdminService.createSubscription({
          schoolId: form.schoolId,
          packageId: form.packageId,
          studentLimit: Number(form.studentLimit),
          billingCycle: form.billingCycle,
          startDate: form.startDate,
          endDate: form.endDate,
          amountDue: form.amountDue ? Number(form.amountDue) : undefined,
          paymentRef: form.paymentRef,
          notes: form.notes,
        });
        toast.success('Subscription created');
      }
      setShowModal(false);
      load();
    } catch {
      toast.error('Failed to save subscription');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sub: Subscription) => {
    if (!window.confirm('Delete this subscription?')) return;
    try {
      await sysAdminService.deleteSubscription(sub._id);
      toast.success('Subscription deleted');
      load();
    } catch {
      toast.error('Failed to delete subscription');
    }
  };

  const handleStatusChange = async (sub: Subscription, status: string) => {
    try {
      await sysAdminService.updateSubscription(sub._id, { status: status as any });
      toast.success('Status updated');
      load();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filtered = statusFilter ? subs.filter((s) => s.status === statusFilter) : subs;

  return (
    <div className="space-y-5 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-emerald-400" />
          <div>
            <h1 className="text-white text-lg font-bold">Subscriptions</h1>
            <p className="text-slate-400 text-xs">Manage school subscriptions and billing status</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors self-start sm:self-auto"
        >
          <Plus size={14} /> New Subscription
        </button>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {['', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white'
            }`}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No subscriptions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/40">
                  {['School', 'Package', 'Seats', 'Billing', 'Status', 'Period', 'Amount', 'Actions'].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-slate-400 font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => {
                  const isExpired = sub.status !== 'cancelled' && sub.status !== 'expired' && new Date(sub.endDate) < new Date();
                  return (
                    <tr key={sub._id} className="border-b border-slate-700/50 last:border-b-0 hover:bg-slate-700/20">
                      <td className="py-3 px-4 text-white font-medium whitespace-nowrap">{schoolName(sub.school)}</td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{pkgName(sub.package)}</td>
                      <td className="py-3 px-4 text-slate-300">{sub.studentLimit.toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{BILLING_LABELS[sub.billingCycle]}</td>
                      <td className="py-3 px-4">
                        <select
                          value={sub.status}
                          onChange={(e) => handleStatusChange(sub, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:outline-none ${STATUS_COLORS[sub.status]}`}
                        >
                          {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                        {isExpired && <p className="text-red-400 text-xs mt-0.5">Expired</p>}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(sub.startDate).toLocaleDateString()} → {new Date(sub.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        ${sub.amountDue.toLocaleString()}
                        {sub.amountPaid > 0 && (
                          <span className="text-emerald-400 text-xs block">Paid: ${sub.amountPaid}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(sub)} className="text-slate-400 hover:text-white p-1 transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(sub)} className="text-slate-400 hover:text-red-400 p-1 transition-colors"><Trash2 size={14} /></button>
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
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-semibold">{editing ? 'Edit Subscription' : 'New Subscription'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              {!editing && (
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">School *</label>
                  <select value={form.schoolId} onChange={(e) => setForm((f) => ({ ...f, schoolId: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500">
                    <option value="">Select school…</option>
                    {schools.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Package *</label>
                <select value={form.packageId} onChange={(e) => {
                  const p = packages.find((pk) => pk._id === e.target.value);
                  setForm((f) => ({
                    ...f,
                    packageId: e.target.value,
                    studentLimit: p ? String(p.studentLimit) : f.studentLimit,
                    billingCycle: p ? p.billingCycle : f.billingCycle,
                  }));
                }}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500">
                  <option value="">Select package…</option>
                  {packages.filter((p) => p.isActive).map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.type}) — {p.studentLimit} seats @ ${p.pricePerStudent}/student</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Student Limit *</label>
                  <input type="number" min="1" value={form.studentLimit} onChange={(e) => setForm((f) => ({ ...f, studentLimit: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Billing Cycle</label>
                  <select value={form.billingCycle} onChange={(e) => setForm((f) => ({ ...f, billingCycle: e.target.value as any }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500">
                    <option value="monthly">Monthly</option>
                    <option value="termly">Per Term</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
              </div>

              {autoAmount && (
                <p className="text-emerald-400 text-xs font-semibold">
                  Auto-calculated amount: ${autoAmount} ({BILLING_LABELS[form.billingCycle].toLowerCase()})
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Start Date *</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">End Date *</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Amount Due ($)</label>
                  <input type="number" min="0" step="0.01" value={form.amountDue || autoAmount} onChange={(e) => setForm((f) => ({ ...f, amountDue: e.target.value }))}
                    placeholder={autoAmount || '0'}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Payment Ref</label>
                  <input value={form.paymentRef} onChange={(e) => setForm((f) => ({ ...f, paymentRef: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500" />
                </div>
              </div>

              {editing && (
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500">
                    {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700">
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-sm px-4 py-2 rounded-md border border-slate-600 hover:border-slate-500 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SysAdminSubscriptionsPage;
