import React, { useEffect, useState } from 'react';
import { Package, Plus, Edit2, Trash2, X, CheckCircle, XCircle } from 'lucide-react';
import { sysAdminService, SubscriptionPackage } from '../../../services/sysAdminService';
import { useToast } from '../../ui/use-toast';

const BILLING_LABELS = { monthly: 'Monthly', termly: 'Per Term', annually: 'Annual' };

const EMPTY_FORM = {
  name: '',
  type: 'prepaid' as 'prepaid' | 'custom',
  studentLimit: '',
  pricePerStudent: '',
  billingCycle: 'monthly' as 'monthly' | 'termly' | 'annually',
  features: '',
  sortOrder: '0',
};

const SysAdminPackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPackage | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    sysAdminService.getPackages()
      .then(setPackages)
      .catch(() => toast.error('Failed to load packages'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (p: SubscriptionPackage) => {
    setEditing(p);
    setForm({
      name: p.name,
      type: p.type,
      studentLimit: String(p.studentLimit),
      pricePerStudent: String(p.pricePerStudent),
      billingCycle: p.billingCycle,
      features: p.features.join(', '),
      sortOrder: String(p.sortOrder),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.studentLimit || !form.pricePerStudent) {
      toast.error('Name, student limit, and price are required');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      type: form.type,
      studentLimit: Number(form.studentLimit),
      pricePerStudent: Number(form.pricePerStudent),
      billingCycle: form.billingCycle,
      features: form.features.split(',').map((f) => f.trim()).filter(Boolean),
      sortOrder: Number(form.sortOrder),
    };
    try {
      if (editing) {
        await sysAdminService.updatePackage(editing._id, payload);
        toast.success('Package updated');
      } else {
        await sysAdminService.createPackage(payload);
        toast.success('Package created');
      }
      setShowModal(false);
      load();
    } catch {
      toast.error('Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (p: SubscriptionPackage) => {
    try {
      await sysAdminService.updatePackage(p._id, { isActive: !p.isActive });
      toast.success(`Package ${p.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch {
      toast.error('Failed to update package');
    }
  };

  const handleDelete = async (p: SubscriptionPackage) => {
    if (!window.confirm(`Delete package "${p.name}"?`)) return;
    try {
      await sysAdminService.deletePackage(p._id);
      toast.success('Package deleted');
      load();
    } catch {
      toast.error('Failed to delete package');
    }
  };

  const totalPrice = (p: SubscriptionPackage) => (p.pricePerStudent * p.studentLimit).toFixed(2);

  return (
    <div className="space-y-5 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-emerald-400" />
          <div>
            <h1 className="text-white text-lg font-bold">Subscription Packages</h1>
            <p className="text-slate-400 text-xs">Define prepaid tiers and custom pricing</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors self-start sm:self-auto"
        >
          <Plus size={14} /> New Package
        </button>
      </div>

      {/* Pricing note */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3 text-blue-300 text-xs">
        <strong>Pricing model:</strong> Prepaid packages have a fixed student cap with a set total price.
        Custom packages allow the school to choose any student count — charges are calculated as
        <em> price per student × chosen count</em>.
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-lg border border-slate-700 h-44 animate-pulse" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center text-slate-500 text-sm">
          No packages defined yet. Create your first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {packages.map((p) => (
            <div key={p._id} className={`bg-slate-800 rounded-lg border ${p.isActive ? 'border-slate-700' : 'border-slate-700/40 opacity-60'} p-5 flex flex-col gap-3`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-bold text-base">{p.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.type === 'prepaid' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {p.type === 'prepaid' ? 'Prepaid' : 'Custom'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleToggle(p)} className="text-slate-400 hover:text-yellow-400 p-1 transition-colors" title={p.isActive ? 'Deactivate' : 'Activate'}>
                    {p.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                  </button>
                  <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-white p-1 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(p)} className="text-slate-400 hover:text-red-400 p-1 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-700/50 rounded-md p-2">
                  <p className="text-slate-400">Student Limit</p>
                  <p className="text-white font-semibold text-sm">{p.studentLimit.toLocaleString()}</p>
                </div>
                <div className="bg-slate-700/50 rounded-md p-2">
                  <p className="text-slate-400">Per Student</p>
                  <p className="text-white font-semibold text-sm">${p.pricePerStudent}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{BILLING_LABELS[p.billingCycle]} total</span>
                <span className="text-emerald-300 font-bold text-base">${totalPrice(p)}</span>
              </div>

              {p.features.length > 0 && (
                <ul className="space-y-0.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-slate-300 text-xs">
                      <CheckCircle size={10} className="text-emerald-400 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-semibold">{editing ? 'Edit Package' : 'New Package'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Package Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500" />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Type *</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500">
                  <option value="prepaid">Prepaid (fixed cap)</option>
                  <option value="custom">Custom (school-set count)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Student Limit *</label>
                  <input type="number" min="1" value={form.studentLimit} onChange={(e) => setForm((f) => ({ ...f, studentLimit: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Price / Student ($) *</label>
                  <input type="number" min="0" step="0.01" value={form.pricePerStudent} onChange={(e) => setForm((f) => ({ ...f, pricePerStudent: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500" />
                </div>
              </div>

              {form.studentLimit && form.pricePerStudent && (
                <p className="text-emerald-400 text-xs font-semibold">
                  Total: ${(Number(form.studentLimit) * Number(form.pricePerStudent)).toFixed(2)} / {BILLING_LABELS[form.billingCycle].toLowerCase()}
                </p>
              )}

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Billing Cycle</label>
                <select value={form.billingCycle} onChange={(e) => setForm((f) => ({ ...f, billingCycle: e.target.value as any }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500">
                  <option value="monthly">Monthly</option>
                  <option value="termly">Per Term</option>
                  <option value="annually">Annually</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Features (comma-separated)</label>
                <input value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                  placeholder="AI Tutor, Assessments, Resources…"
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500" />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Display Order</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700">
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-sm px-4 py-2 rounded-md border border-slate-600 hover:border-slate-500 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SysAdminPackagesPage;
