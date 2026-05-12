import React, { useEffect, useState } from 'react';
import {
  Plus, Edit2, Trash2, X, Check, Package as PackageIcon,
} from 'lucide-react';
import { sysAdminService, SubscriptionPackage } from '../../../services/sysAdminService';
import { useToast } from '../../ui/use-toast';

interface PackageForm {
  name: string;
  type: 'prepaid' | 'custom';
  studentLimit: string;
  pricePerStudent: string;
  billingCycle: 'monthly' | 'termly' | 'annually';
  features: string;
  isActive: boolean;
  sortOrder: string;
}

const EMPTY_FORM: PackageForm = {
  name: '', type: 'prepaid', studentLimit: '', pricePerStudent: '',
  billingCycle: 'termly', features: '', isActive: true, sortOrder: '0',
};

const PackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPackage | null>(null);
  const [form, setForm] = useState<PackageForm>(EMPTY_FORM);
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
      features: p.features.join('\n'),
      isActive: p.isActive,
      sortOrder: String(p.sortOrder),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.studentLimit || !form.pricePerStudent) {
      toast.error('Name, student limit and price per student are required');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      studentLimit: parseInt(form.studentLimit),
      pricePerStudent: parseFloat(form.pricePerStudent),
      billingCycle: form.billingCycle,
      features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
      isActive: form.isActive,
      sortOrder: parseInt(form.sortOrder) || 0,
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

  const handleDelete = async (p: SubscriptionPackage) => {
    if (!window.confirm(`Delete package "${p.name}"? This cannot be undone.`)) return;
    try {
      await sysAdminService.deletePackage(p._id);
      toast.success('Package deleted');
      load();
    } catch {
      toast.error('Failed to delete package');
    }
  };

  const ACCENT_COLORS = ['text-sky-400', 'text-emerald-400', 'text-violet-400', 'text-amber-400'];
  const BORDER_COLORS = ['border-sky-500/30', 'border-emerald-500/40', 'border-violet-500/30', 'border-amber-500/30'];
  const BG_GRADIENTS = [
    'from-sky-500/10 to-transparent',
    'from-emerald-500/10 to-transparent',
    'from-violet-500/10 to-transparent',
    'from-amber-500/10 to-transparent',
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Packages &amp; pricing</h1>
          <p className="text-slate-400 text-sm mt-1">
            {packages.filter((p) => p.isActive).length} active packages · manage subscription plans
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={13} /> New package
        </button>
      </div>

      {/* Package cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-10 text-center text-slate-500 text-sm">
          No packages yet. Create your first package.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {packages.map((pkg, idx) => {
            const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length];
            const border = BORDER_COLORS[idx % BORDER_COLORS.length];
            const gradient = BG_GRADIENTS[idx % BG_GRADIENTS.length];
            const termlyTotal = pkg.studentLimit * pkg.pricePerStudent;
            return (
              <div
                key={pkg._id}
                className={`relative bg-gradient-to-b ${gradient} bg-slate-800 rounded-xl border ${border} p-5 flex flex-col`}
              >
                {!pkg.isActive && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-slate-700 text-slate-400 text-[10px] font-semibold rounded-full border border-slate-600">
                    Inactive
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase tracking-widest ${accent}`}>{pkg.type}</span>
                </div>
                <h3 className="text-white text-lg font-bold">{pkg.name}</h3>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className={`text-3xl font-extrabold tracking-tight ${accent}`}>
                    ${pkg.pricePerStudent.toFixed(2)}
                  </span>
                  <span className="text-slate-400 text-xs">/ student / {pkg.billingCycle === 'termly' ? 'term' : pkg.billingCycle}</span>
                </div>
                <p className={`mt-1 text-xs font-semibold ${accent}`}>
                  Up to {pkg.studentLimit.toLocaleString()} students · ${termlyTotal.toLocaleString()} max
                </p>

                <div className="my-3 border-t border-slate-700" />

                <ul className="space-y-2 flex-1">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check size={12} className={`mt-0.5 shrink-0 ${accent}`} />
                      {f}
                    </li>
                  ))}
                  {pkg.features.length === 0 && (
                    <li className="text-xs text-slate-500 italic">No features listed.</li>
                  )}
                </ul>

                <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Sort order</p>
                    <p className="text-slate-300 font-semibold text-sm">{pkg.sortOrder}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEdit(pkg)}
                      className="flex items-center gap-1 border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pkg)}
                      className="p-1.5 text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-500/40 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* All packages table */}
      {packages.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="px-5 py-4 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-white">All packages</h3>
            <p className="text-xs text-slate-500 mt-0.5">{packages.length} packages · sorted by order</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  {['Name', 'Type', 'Student limit', 'Price/student', 'Billing', 'Active', 'Order', ''].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-slate-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg._id} className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <PackageIcon size={13} className="text-slate-500" />
                        {pkg.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{pkg.type}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{pkg.studentLimit.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">${pkg.pricePerStudent.toFixed(2)}</td>
                    <td className="py-3 px-4 text-slate-400 capitalize">{pkg.billingCycle}</td>
                    <td className="py-3 px-4">
                      {pkg.isActive
                        ? <span className="flex items-center gap-1 text-emerald-400 text-xs"><Check size={11} /> Active</span>
                        : <span className="text-slate-500 text-xs">Inactive</span>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{pkg.sortOrder}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(pkg)} className="p-1 text-slate-500 hover:text-white transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(pkg)} className="p-1 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-semibold">{editing ? 'Edit Package' : 'New Package'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500">
                    <option value="prepaid">Prepaid</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Billing cycle</label>
                  <select value={form.billingCycle} onChange={(e) => setForm((f) => ({ ...f, billingCycle: e.target.value as any }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500">
                    <option value="monthly">Monthly</option>
                    <option value="termly">Termly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Student limit *</label>
                  <input type="number" value={form.studentLimit} onChange={(e) => setForm((f) => ({ ...f, studentLimit: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Price per student ($) *</label>
                  <input type="number" step="0.01" value={form.pricePerStudent} onChange={(e) => setForm((f) => ({ ...f, pricePerStudent: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Features (one per line)</label>
                <textarea rows={5} value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                  placeholder="Full AI tutor & coach&#10;Automated marking&#10;Priority support"
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Sort order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="w-4 h-4 rounded accent-emerald-500" />
                    <span className="text-slate-300 text-sm">Active / visible</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700">
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-sm px-4 py-2 rounded-lg border border-slate-600 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesPage;
