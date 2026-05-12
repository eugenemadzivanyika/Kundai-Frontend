import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Calendar, AlertCircle, TrendingDown,
  Download, RefreshCw, Plus, X, ChevronRight,
} from 'lucide-react';
import { sysAdminService, Subscription, School, SubscriptionPackage } from '../../../services/sysAdminService';
import { useToast } from '../../ui/use-toast';

type ViewFilter = 'all' | 'active' | 'trial' | 'suspended' | 'expired';

const SUB_STATUS: Record<string, string> = {
  active:    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  trial:     'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  suspended: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  expired:   'bg-red-500/20 text-red-300 border border-red-500/30',
  cancelled: 'bg-slate-600/40 text-slate-400',
};

const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewFilter>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [form, setForm] = useState({
    schoolId: '', packageId: '', studentLimit: '', billingCycle: 'termly',
    startDate: '', endDate: '', amountDue: '', paymentRef: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      sysAdminService.getSubscriptions(),
      sysAdminService.getSchools(),
      sysAdminService.getPackages(),
    ])
      .then(([subs, sch, pkgs]) => {
        setSubscriptions(subs);
        setSchools(sch);
        setPackages(pkgs);
      })
      .catch(() => toast.error('Failed to load subscriptions'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    if (!form.schoolId || !form.packageId || !form.studentLimit || !form.startDate || !form.endDate) {
      toast.error('School, package, student limit, start and end date are required');
      return;
    }
    setSaving(true);
    try {
      await sysAdminService.createSubscription({
        schoolId: form.schoolId,
        packageId: form.packageId,
        studentLimit: parseInt(form.studentLimit),
        billingCycle: form.billingCycle,
        startDate: form.startDate,
        endDate: form.endDate,
        amountDue: form.amountDue ? parseFloat(form.amountDue) : undefined,
        paymentRef: form.paymentRef,
        notes: form.notes,
      });
      toast.success('Subscription created');
      setShowCreateModal(false);
      load();
    } catch {
      toast.error('Failed to create subscription');
    } finally {
      setSaving(false);
    }
  };

  const filtered = subscriptions.filter((s) => {
    if (view === 'all') return true;
    if (view === 'expired') return s.status === 'expired' || s.status === 'cancelled';
    return s.status === view;
  });

  const counts = {
    all: subscriptions.length,
    active: subscriptions.filter((s) => s.status === 'active').length,
    trial: subscriptions.filter((s) => s.status === 'trial').length,
    suspended: subscriptions.filter((s) => s.status === 'suspended').length,
    expired: subscriptions.filter((s) => s.status === 'expired' || s.status === 'cancelled').length,
  };

  const mrr = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => {
      let m = s.amountDue;
      if (s.billingCycle === 'annually') m /= 12;
      if (s.billingCycle === 'termly') m /= 3;
      return sum + m;
    }, 0);

  const overdue = subscriptions.filter((s) => s.amountDue > 0 && s.status !== 'active');
  const renewals30d = subscriptions.filter((s) => {
    if (s.status !== 'active' && s.status !== 'trial') return false;
    const days = Math.round((new Date(s.endDate).getTime() - Date.now()) / 86_400_000);
    return days >= 0 && days <= 30;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subscriptions</h1>
          <p className="text-slate-400 text-sm mt-1">
            {subscriptions.length} subscriptions on record · {counts.active} currently active · {counts.trial} on trial
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 border border-slate-700 text-slate-400 hover:text-white bg-slate-800 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={12} /> Refresh
          </button>
          <button className="flex items-center gap-1.5 border border-slate-700 text-slate-400 hover:text-white bg-slate-800 text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
            <Download size={12} /> Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={12} /> New subscription
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Active MRR', value: `$${mrr.toFixed(0)}`, sub: `From ${counts.active} subscriptions`, icon: TrendingUp, accent: 'bg-emerald-600' },
          { label: 'Renewals next 30d', value: renewals30d.length, sub: 'Active + trial due soon', icon: Calendar, accent: 'bg-amber-600' },
          { label: 'Overdue invoices', value: overdue.length, sub: `$${overdue.reduce((s, o) => s + o.amountDue, 0).toLocaleString()} unpaid`, icon: AlertCircle, accent: 'bg-rose-600' },
          { label: 'Churned / expired', value: counts.expired, sub: 'Expired + cancelled', icon: TrendingDown, accent: 'bg-violet-600' },
        ].map(({ label, value, sub, icon: Icon, accent }) => (
          <div key={label} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-start justify-between mb-2">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</p>
              <div className={`${accent} rounded-lg p-1.5`}><Icon size={13} className="text-white" /></div>
            </div>
            <p className="text-white text-3xl font-bold">{value}</p>
            <p className="text-slate-500 text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Filter + table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">All subscriptions</h3>
            <p className="text-xs text-slate-500 mt-0.5">{subscriptions.length} on file</p>
          </div>
          <div className="flex gap-0.5 p-1 bg-slate-900 rounded-lg border border-slate-700">
            {(['all', 'active', 'trial', 'suspended', 'expired'] as ViewFilter[]).map((k) => (
              <button
                key={k}
                onClick={() => setView(k)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  view === k ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {k.charAt(0).toUpperCase() + k.slice(1)}
                <span className={`text-[10px] ${view === k ? 'text-slate-300' : 'text-slate-600'}`}>{counts[k]}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">No subscriptions match the filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  {['School', 'Package', 'Status', 'Period', 'Seats', 'Paid / Due', 'Reference', ''].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-slate-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => {
                  const school = sub.school as School | null;
                  const pkg = sub.package as SubscriptionPackage | null;
                  return (
                    <tr
                      key={sub._id}
                      className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/30 cursor-pointer transition-colors"
                      onClick={() => school && navigate(`/sys-admin/schools/${typeof school === 'string' ? school : school._id}`)}
                    >
                      <td className="py-3 px-4 text-white font-semibold">
                        {typeof school === 'string' ? school : school?.name ?? '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{pkg?.name ?? '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SUB_STATUS[sub.status] ?? ''}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {new Date(sub.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                        {' → '}
                        {new Date(sub.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{sub.studentLimit.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono">
                        <span className="text-slate-200">${sub.amountPaid.toLocaleString()}</span>
                        {sub.amountDue > 0 && <span className="text-red-400"> · ${sub.amountDue.toLocaleString()}</span>}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-xs">{sub.paymentRef || '—'}</td>
                      <td className="py-3 px-4"><ChevronRight size={14} className="text-slate-600" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create subscription modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-semibold">New Subscription</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">School *</label>
                <select value={form.schoolId} onChange={(e) => setForm((f) => ({ ...f, schoolId: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500">
                  <option value="">Select school…</option>
                  {schools.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Package *</label>
                <select value={form.packageId} onChange={(e) => setForm((f) => ({ ...f, packageId: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500">
                  <option value="">Select package…</option>
                  {packages.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              {[
                { label: 'Student limit *', key: 'studentLimit', type: 'number' },
                { label: 'Start date *', key: 'startDate', type: 'date' },
                { label: 'End date *', key: 'endDate', type: 'date' },
                { label: 'Amount due ($)', key: 'amountDue', type: 'number' },
                { label: 'Payment reference', key: 'paymentRef', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-slate-400 text-xs font-medium mb-1">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700">
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white text-sm px-4 py-2 rounded-lg border border-slate-600 transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPage;
