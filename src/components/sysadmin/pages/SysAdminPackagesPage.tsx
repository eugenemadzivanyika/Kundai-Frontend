import React, { useEffect, useState } from 'react';
import { Package, Plus, Edit2, Trash2, X, CheckCircle, XCircle, SlidersHorizontal } from 'lucide-react';
import { sysAdminService, SubscriptionPackage } from '../../../services/sysAdminService';
import { useToast } from '../../ui/use-toast';

// ── Types ────────────────────────────────────────────────────────────────────

interface PricingTier {
  max: number | null; // null = unlimited (last tier)
  label: string;
  rate: number;
}

interface PricingRules {
  tiers: PricingTier[];
  monthlyPremiumPct: number; // e.g. 8 = +8%
  annualDiscountPct: number; // e.g. 7 = -7%
}

// ── Constants ────────────────────────────────────────────────────────────────

const BILLING_LABELS: Record<string, string> = { monthly: 'Monthly', termly: 'Per Term', annually: 'Annual' };

const DEFAULT_PRICING_RULES: PricingRules = {
  tiers: [
    { max: 499,  label: '< 500',       rate: 0.80 },
    { max: 999,  label: '500 – 999',   rate: 0.65 },
    { max: 2499, label: '1,000 – 2,499', rate: 0.55 },
    { max: 4999, label: '2,500 – 4,999', rate: 0.50 },
    { max: null, label: '5,000+',      rate: 0.45 },
  ],
  monthlyPremiumPct: 8,
  annualDiscountPct: 7,
};

const EMPTY_FORM = {
  name: '',
  type: 'prepaid' as 'prepaid' | 'custom',
  studentLimit: '',
  pricePerStudent: '',
  billingCycle: 'termly' as 'monthly' | 'termly' | 'annually',
  features: '',
  sortOrder: '0',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function activeTier(seats: number, rules: PricingRules): PricingTier {
  return rules.tiers.find(t => t.max === null || seats <= t.max) ?? rules.tiers[rules.tiers.length - 1];
}

function computeTotal(seats: number, billing: string, rules: PricingRules): number {
  const tier = activeTier(seats, rules);
  const termly = Math.round(seats * tier.rate);
  if (billing === 'monthly') return Math.round(seats * tier.rate / 3 * (1 + rules.monthlyPremiumPct / 100));
  if (billing === 'annually') return Math.round(termly * 3 * (1 - rules.annualDiscountPct / 100));
  return termly;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PackageCard({ p, onEdit, onToggle, onDelete }: {
  p: SubscriptionPackage;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const totalPrice = (p.pricePerStudent * p.studentLimit).toFixed(2);
  return (
    <div className={`bg-slate-800 rounded-lg border ${p.isActive ? 'border-slate-700' : 'border-slate-700/40 opacity-60'} p-5 flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-bold text-base">{p.name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.type === 'prepaid' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber-500/20 text-amber-300'}`}>
            {p.type === 'prepaid' ? 'Prepaid' : 'Custom'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToggle} className="text-slate-400 hover:text-yellow-400 p-1 transition-colors" title={p.isActive ? 'Deactivate' : 'Activate'}>
            {p.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
          </button>
          <button onClick={onEdit} className="text-slate-400 hover:text-white p-1 transition-colors"><Edit2 size={14} /></button>
          <button onClick={onDelete} className="text-slate-400 hover:text-red-400 p-1 transition-colors"><Trash2 size={14} /></button>
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
        <span className="text-emerald-300 font-bold text-base">${totalPrice}</span>
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
  );
}

// ── Pricing Rules Modal ───────────────────────────────────────────────────────

function PricingRulesModal({ rules, onSave, onClose }: {
  rules: PricingRules;
  onSave: (r: PricingRules) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<PricingRules>(JSON.parse(JSON.stringify(rules)));

  const updateTierRate = (i: number, val: string) => {
    setDraft(d => {
      const tiers = [...d.tiers];
      tiers[i] = { ...tiers[i], rate: parseFloat(val) || 0 };
      return { ...d, tiers };
    });
  };

  const updateTierMax = (i: number, val: string) => {
    setDraft(d => {
      const tiers = [...d.tiers];
      const parsed = parseInt(val);
      tiers[i] = { ...tiers[i], max: isNaN(parsed) ? null : parsed };
      return { ...d, tiers };
    });
  };

  const updateTierLabel = (i: number, val: string) => {
    setDraft(d => {
      const tiers = [...d.tiers];
      tiers[i] = { ...tiers[i], label: val };
      return { ...d, tiers };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-white font-semibold">Edit Pricing Rules</h2>
            <p className="text-slate-400 text-xs mt-0.5">Changes apply to the custom builder quote. Existing packages are unaffected.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Tier table */}
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Volume tiers — price per student / term</p>
            <div className="space-y-2">
              {draft.tiers.map((tier, i) => (
                <div key={i} className="grid grid-cols-[1fr_120px_100px] gap-2 items-center">
                  <input
                    value={tier.label}
                    onChange={e => updateTierLabel(i, e.target.value)}
                    placeholder="Label (e.g. < 500)"
                    className="bg-slate-700 border border-slate-600 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="relative">
                    <input
                      type="number"
                      value={tier.max ?? ''}
                      onChange={e => updateTierMax(i, e.target.value)}
                      placeholder={i === draft.tiers.length - 1 ? 'unlimited' : 'max students'}
                      disabled={i === draft.tiers.length - 1}
                      className="w-full bg-slate-700 border border-slate-600 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tier.rate}
                      onChange={e => updateTierRate(i, e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 text-emerald-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-slate-500 text-xs mt-2">The last tier has no upper limit (unlimited). Max column is disabled for it.</p>
          </div>

          {/* Billing modifiers */}
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Billing cycle modifiers</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Monthly premium (%)</label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 text-xs">+</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={draft.monthlyPremiumPct}
                    onChange={e => setDraft(d => ({ ...d, monthlyPremiumPct: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-700 border border-slate-600 text-amber-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <span className="text-slate-500 text-xs">%</span>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Annual discount (%)</label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 text-xs">−</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={draft.annualDiscountPct}
                    onChange={e => setDraft(d => ({ ...d, annualDiscountPct: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-700 border border-slate-600 text-emerald-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <span className="text-slate-500 text-xs">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700">
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm px-4 py-2 rounded-md border border-slate-600 hover:border-slate-500 transition-colors">Cancel</button>
          <button onClick={() => { onSave(draft); onClose(); }} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
            Apply rules
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Custom Package Builder ────────────────────────────────────────────────────

function CustomBuilder({ rules, onSaveAsPackage }: {
  rules: PricingRules;
  onSaveAsPackage: (seats: number, rate: number, billing: string) => void;
}) {
  const [seats, setSeats] = useState(10);
  const [billing, setBilling] = useState<'monthly' | 'termly' | 'annually'>('termly');

  const tier = activeTier(seats, rules);
  const total = computeTotal(seats, billing, rules);
  const termlyTotal = Math.round(seats * tier.rate);
  const annualized = billing === 'annually' ? total : billing === 'termly' ? total * 3 : total * 12;

  const sliderPct = ((seats - 10) / (10000 - 10)) * 100;

  const billingLabel = billing === 'monthly' ? 'month' : billing === 'termly' ? 'term' : 'year';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 rounded-full">Custom · District tier</span>
      </div>
      <h3 className="text-white font-bold text-lg mt-2">Custom package builder</h3>
      <p className="text-slate-400 text-sm mt-0.5">Quote a school based on the number of students they need to accommodate.</p>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        {/* Left: controls */}
        <div className="space-y-5">
          {/* Seat slider */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Students to accommodate</label>
              <span className="text-white font-bold text-xl tabular-nums">{seats.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={10}
              max={10000}
              step={10}
              value={seats}
              onChange={e => setSeats(parseInt(e.target.value))}
              style={{
                width: '100%',
                appearance: 'none',
                WebkitAppearance: 'none',
                height: 6,
                background: `linear-gradient(90deg, #34d399 ${sliderPct}%, #1e293b ${sliderPct}%)`,
                borderRadius: 999,
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <div className="flex justify-between mt-1.5 text-xs text-slate-500">
              <span>10</span><span>2,500</span><span>5,000</span><span>10,000</span>
            </div>
          </div>

          {/* Billing toggle */}
          <div>
            <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Billing cycle</label>
            <div className="inline-flex bg-slate-900 border border-slate-700 rounded-lg p-1 gap-0.5">
              {([
                ['monthly', 'Monthly', `+${rules.monthlyPremiumPct}%`],
                ['termly', 'Termly', '—'],
                ['annually', 'Annually', `-${rules.annualDiscountPct}%`],
              ] as const).map(([k, label, badge]) => (
                <button
                  key={k}
                  onClick={() => setBilling(k)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    billing === k ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                  <span className={`text-[10px] ${
                    billing === k
                      ? k === 'annually' ? 'text-emerald-400' : k === 'monthly' ? 'text-amber-400' : 'text-slate-500'
                      : 'text-slate-600'
                  }`}>{badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tiered pricing table */}
          <div className="bg-slate-900 border border-slate-700/60 rounded-lg p-4">
            <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold mb-3">Volume tiers</p>
            <div className="space-y-1.5 font-mono text-xs">
              {rules.tiers.map((t, i) => {
                const active = tier === t;
                return (
                  <div key={i} className={`flex justify-between transition-colors ${active ? 'text-white font-bold' : 'text-slate-500 font-medium'}`}>
                    <span>{t.label} students</span>
                    <span className={active ? 'text-emerald-400' : 'text-slate-600'}>${t.rate.toFixed(2)}/student</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: live quote */}
        <div
          className="rounded-xl p-5 flex flex-col"
          style={{
            background: 'linear-gradient(180deg, rgba(16,185,129,0.10) 0%, #1e293b 100%)',
            border: '1px solid rgba(52,211,153,0.30)',
          }}
        >
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Live quote</p>
          <p className="text-white font-extrabold tabular-nums mt-1" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            ${total.toLocaleString()}
          </p>
          <p className="text-slate-400 text-xs mt-1">USD · per {billingLabel}</p>

          <div className="mt-4 pt-4 border-t space-y-2 text-sm flex-1" style={{ borderColor: 'rgba(52,211,153,0.20)' }}>
            <div className="flex justify-between text-slate-400">
              <span>Per student</span>
              <span className="text-slate-200 font-semibold tabular-nums">${tier.rate.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Students</span>
              <span className="text-slate-200 font-semibold tabular-nums">{seats.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Termly base</span>
              <span className="text-slate-200 font-semibold tabular-nums">${termlyTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Annualized</span>
              <span className="text-slate-200 font-semibold tabular-nums">${annualized.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => onSaveAsPackage(seats, tier.rate, billing)}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            <Plus size={14} /> Save as package
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

const SysAdminPackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPackage | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pricingRules, setPricingRules] = useState<PricingRules>(DEFAULT_PRICING_RULES);
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

  const prefillFromBuilder = (seats: number, rate: number, billing: string) => {
    setEditing(null);
    setForm({
      name: `Custom ${seats.toLocaleString()} seats`,
      type: 'custom',
      studentLimit: String(seats),
      pricePerStudent: String(rate),
      billingCycle: billing as any,
      features: 'Volume pricing, Custom contract, Dedicated support',
      sortOrder: '99',
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

  return (
    <div className="space-y-5 mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-emerald-400" />
          <div>
            <h1 className="text-white text-lg font-bold">Packages & pricing</h1>
            <p className="text-slate-400 text-xs">{packages.length} package{packages.length !== 1 ? 's' : ''} defined · custom builder below</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowPricingModal(true)}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm font-medium px-3 py-2 rounded-md border border-slate-600 hover:border-slate-500 transition-colors"
          >
            <SlidersHorizontal size={14} /> Edit pricing rules
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors"
          >
            <Plus size={14} /> New package
          </button>
        </div>
      </div>

      {/* Package cards */}
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
            <PackageCard
              key={p._id}
              p={p}
              onEdit={() => openEdit(p)}
              onToggle={() => handleToggle(p)}
              onDelete={() => handleDelete(p)}
            />
          ))}
        </div>
      )}

      {/* Custom builder */}
      <CustomBuilder rules={pricingRules} onSaveAsPackage={prefillFromBuilder} />

      {/* ── Pricing rules modal ── */}
      {showPricingModal && (
        <PricingRulesModal
          rules={pricingRules}
          onSave={setPricingRules}
          onClose={() => setShowPricingModal(false)}
        />
      )}

      {/* ── New / Edit package modal ── */}
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
                  <input type="number" min="10" value={form.studentLimit} onChange={(e) => setForm((f) => ({ ...f, studentLimit: e.target.value }))}
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
