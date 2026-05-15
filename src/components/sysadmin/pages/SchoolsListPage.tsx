import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Download, ChevronRight,
  CheckCircle, XCircle, Edit2, Trash2, X, KeyRound,
} from 'lucide-react';
import { sysAdminService, School, SubscriptionPackage } from '../../../services/sysAdminService';
import { useToast } from '../../ui/use-toast';

const SUB_STATUS: Record<string, string> = {
  active:    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  trial:     'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  suspended: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  expired:   'bg-red-500/20 text-red-300 border border-red-500/30',
  cancelled: 'bg-slate-600/40 text-slate-400',
};

const DEFAULT_PASSWORD = 'Kundai@2026';

type StatusFilter = 'all' | 'active' | 'trial' | 'suspended';

const EMPTY_FORM = {
  name: '', email: '', phone: '', address: '', registrationNumber: '',
  primaryContact: { name: '', email: '', phone: '' },
  notes: '',
  // admin account (create mode only)
  adminFirstName: '', adminLastName: '', adminEmail: '',
  // trial subscription (create mode only)
  planId: '',
};

const SchoolsListPage: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      sysAdminService.getSchools(),
      sysAdminService.getPackages(),
    ])
      .then(([s, p]) => { setSchools(s); setPackages(p); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (s: School, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(s);
    setForm({
      name: s.name, email: s.email, phone: s.phone || '', address: s.address || '',
      registrationNumber: s.registrationNumber || '',
      primaryContact: { name: s.primaryContact?.name || '', email: s.primaryContact?.email || '', phone: s.primaryContact?.phone || '' },
      notes: s.notes || '',
      adminFirstName: '', adminLastName: '', adminEmail: '', planId: '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return; }
    setSaving(true);
    try {
      if (editing) {
        // Edit mode: only update school fields, not the admin account
        const { adminFirstName, adminLastName, adminEmail, planId, ...schoolFields } = form;
        await sysAdminService.updateSchool(editing._id, schoolFields);
        toast.success('School updated');
      } else {
        const adminEmail = form.adminEmail.trim() || form.primaryContact.email.trim();
        if (!adminEmail) { toast.error('An admin login email is required'); setSaving(false); return; }
        await sysAdminService.createSchool({
          ...form,
          adminFirstName: form.adminFirstName.trim() || form.primaryContact.name.split(' ')[0],
          adminLastName: form.adminLastName.trim() || form.primaryContact.name.split(' ').slice(1).join(' '),
          adminEmail,
          planId: form.planId || undefined,
        } as any);
        toast.success(`School onboarded · admin login: ${adminEmail} / ${DEFAULT_PASSWORD}`);
      }
      setShowModal(false);
      load();
    } catch {
      toast.error('Failed to save school');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: School, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await sysAdminService.updateSchool(s._id, { active: !s.active });
      toast.success(`School ${s.active ? 'deactivated' : 'activated'}`);
      load();
    } catch {
      toast.error('Failed to update school');
    }
  };

  const handleDelete = async (s: School, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Permanently delete "${s.name}"? This cannot be undone.`)) return;
    try {
      await sysAdminService.deleteSchool(s._id);
      toast.success('School deleted');
      load();
    } catch {
      toast.error('Failed to delete school');
    }
  };

  const getSubStatus = (school: School): string | undefined => {
    const sub = school.activeSubscription as any;
    return sub?.status;
  };

  const filtered = schools.filter((s) => {
    const sub = s.activeSubscription as any;
    const subStatus = sub?.status ?? '';
    if (statusFilter !== 'all' && subStatus !== statusFilter) return false;
    const q = query.toLowerCase();
    if (q && !`${s.name} ${s.email} ${s.phone ?? ''}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const counts = {
    all: schools.length,
    active: schools.filter((s) => (s.activeSubscription as any)?.status === 'active').length,
    trial: schools.filter((s) => (s.activeSubscription as any)?.status === 'trial').length,
    suspended: schools.filter((s) => (s.activeSubscription as any)?.status === 'suspended').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Schools</h1>
          <p className="text-slate-400 text-sm mt-1">
            {schools.length} schools onboarded · {counts.active} active · {counts.trial} on trial
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 border border-slate-700 text-slate-400 hover:text-white bg-slate-800 text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={13} /> Onboard school
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="flex items-center gap-3 p-3 border-b border-slate-700 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, phone…"
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg pl-8 pr-3 py-2 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-0.5 p-1 bg-slate-900 rounded-lg border border-slate-700">
            {(['all', 'active', 'trial', 'suspended'] as StatusFilter[]).map((k) => (
              <button
                key={k}
                onClick={() => setStatusFilter(k)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  statusFilter === k ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {k.charAt(0).toUpperCase() + k.slice(1)}
                <span className={`text-[10px] font-semibold ${statusFilter === k ? 'text-slate-300' : 'text-slate-600'}`}>
                  {counts[k]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">No schools match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  {['School', 'Contact', 'Subscription', 'Status', 'Onboarded', ''].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-slate-500 font-medium text-xs uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((school) => {
                  const sub = school.activeSubscription as any;
                  const subStatus = getSubStatus(school);
                  return (
                    <tr
                      key={school._id}
                      onClick={() => navigate(`/sys-admin/schools/${school._id}`)}
                      className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="text-white font-semibold">{school.name}</p>
                        {school.registrationNumber && (
                          <p className="text-slate-500 text-xs mt-0.5 font-mono">{school.registrationNumber}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-300">{school.email}</p>
                        {school.phone && <p className="text-slate-500 text-xs mt-0.5">{school.phone}</p>}
                      </td>
                      <td className="py-3 px-4">
                        {sub ? (
                          <div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SUB_STATUS[subStatus ?? ''] ?? 'bg-slate-600 text-slate-300'}`}>
                              {subStatus}
                            </span>
                            {sub.package?.name && (
                              <p className="text-slate-500 text-xs mt-0.5">{sub.package.name} · {sub.studentLimit?.toLocaleString()} seats</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">No subscription</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {school.active
                          ? <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle size={12} />Active</span>
                          : <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle size={12} />Inactive</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {new Date(school.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => handleToggleActive(school, e)}
                            title={school.active ? 'Deactivate' : 'Activate'}
                            className="p-1.5 text-slate-500 hover:text-amber-400 rounded transition-colors"
                          >
                            {school.active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                          </button>
                          <button
                            onClick={(e) => openEdit(school, e)}
                            className="p-1.5 text-slate-500 hover:text-white rounded transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(school, e)}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                          <ChevronRight size={14} className="text-slate-600 ml-1" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-700">
          <span>Showing <span className="text-slate-300 font-semibold">{filtered.length}</span> of <span className="text-slate-300 font-semibold">{schools.length}</span></span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-semibold">{editing ? 'Edit School' : 'Onboard School'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">

              {/* ── School details ── */}
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">School details</p>
              {([
                { label: 'School Name *', key: 'name', type: 'text' },
                { label: 'School Email *', key: 'email', type: 'email' },
                { label: 'Phone', key: 'phone', type: 'text' },
                { label: 'Address', key: 'address', type: 'text' },
                { label: 'Registration Number', key: 'registrationNumber', type: 'text' },
              ] as const).map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-slate-400 text-xs font-medium mb-1">{label}</label>
                  <input type={type} value={(form as any)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500" />
                </div>
              ))}

              {/* ── Primary contact ── */}
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide pt-2">Primary contact</p>
              {(['name', 'email', 'phone'] as const).map((key) => (
                <div key={key}>
                  <label className="block text-slate-400 text-xs font-medium mb-1 capitalize">Contact {key}</label>
                  <input value={form.primaryContact[key]}
                    onChange={(e) => setForm((f) => ({ ...f, primaryContact: { ...f.primaryContact, [key]: e.target.value } }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500" />
                </div>
              ))}

              {/* ── Admin account (create only) ── */}
              {!editing && (
                <>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide pt-2">Admin login account</p>
                  <p className="text-slate-500 text-xs">
                    Leave blank to use the contact email above. The account will be created with the default password shown below.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 text-xs font-medium mb-1">First name</label>
                      <input value={form.adminFirstName}
                        onChange={(e) => setForm((f) => ({ ...f, adminFirstName: e.target.value }))}
                        placeholder="From contact name if blank"
                        className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs font-medium mb-1">Last name</label>
                      <input value={form.adminLastName}
                        onChange={(e) => setForm((f) => ({ ...f, adminLastName: e.target.value }))}
                        placeholder="From contact name if blank"
                        className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-medium mb-1">Login email</label>
                    <input type="email" value={form.adminEmail}
                      onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
                      placeholder="Leave blank to use contact email"
                      className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5">
                    <KeyRound size={13} className="text-amber-400 shrink-0" />
                    <div className="flex-1 text-xs text-slate-400">
                      Default password: <span className="text-white font-mono font-semibold">{DEFAULT_PASSWORD}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Share with admin</span>
                  </div>
                </>
              )}

              {/* ── Free trial package (create only) ── */}
              {!editing && (
                <>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide pt-2">Free trial package</p>
                  <div>
                    <label className="block text-slate-400 text-xs font-medium mb-1">Start on package (optional)</label>
                    <select value={form.planId}
                      onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500">
                      <option value="">— No trial package —</option>
                      {packages.filter(p => p.isActive).map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} · {p.studentLimit.toLocaleString()} students · ${p.pricePerStudent}/student
                        </option>
                      ))}
                    </select>
                    {form.planId && (
                      <p className="text-sky-400 text-xs mt-1.5">30-day free trial will be created automatically.</p>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Notes</label>
                <textarea value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700">
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-sm px-4 py-2 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Onboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolsListPage;
