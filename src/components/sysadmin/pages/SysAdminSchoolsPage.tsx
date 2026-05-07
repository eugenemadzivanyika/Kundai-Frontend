import React, { useEffect, useState } from 'react';
import { Building2, Plus, Search, Edit2, Trash2, X, CheckCircle, XCircle } from 'lucide-react';
import { sysAdminService, School } from '../../../services/sysAdminService';
import { useToast } from '../../ui/use-toast';

const EMPTY_FORM = {
  name: '', email: '', phone: '', address: '', registrationNumber: '',
  primaryContact: { name: '', email: '', phone: '' },
  notes: '',
};

const SUB_STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-300',
  trial: 'bg-blue-500/20 text-blue-300',
  suspended: 'bg-yellow-500/20 text-yellow-300',
  expired: 'bg-red-500/20 text-red-300',
  cancelled: 'bg-slate-600/40 text-slate-400',
};

const SysAdminSchoolsPage: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    sysAdminService.getSchools()
      .then(setSchools)
      .catch(() => toast.error('Failed to load schools'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (s: School) => {
    setEditing(s);
    setForm({
      name: s.name, email: s.email, phone: s.phone || '', address: s.address || '',
      registrationNumber: s.registrationNumber || '',
      primaryContact: { name: s.primaryContact?.name || '', email: s.primaryContact?.email || '', phone: s.primaryContact?.phone || '' },
      notes: s.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await sysAdminService.updateSchool(editing._id, form);
        toast.success('School updated');
      } else {
        await sysAdminService.createSchool(form);
        toast.success('School onboarded');
      }
      setShowModal(false);
      load();
    } catch {
      toast.error('Failed to save school');
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

  const filtered = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  );

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
                  <th className="py-3 px-4 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Contact</th>
                  <th className="py-3 px-4 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Subscription</th>
                  <th className="py-3 px-4 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Status</th>
                  <th className="py-3 px-4 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Onboarded</th>
                  <th className="py-3 px-4 text-right text-slate-400 font-medium text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const sub = s.activeSubscription as any;
                  const subStatus = sub?.status as string | undefined;
                  return (
                    <tr key={s._id} className="border-b border-slate-700/50 last:border-b-0 hover:bg-slate-700/20">
                      <td className="py-3 px-4">
                        <p className="text-white font-medium">{s.name}</p>
                        {s.registrationNumber && <p className="text-slate-500 text-xs">{s.registrationNumber}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-300">{s.email}</p>
                        {s.phone && <p className="text-slate-500 text-xs">{s.phone}</p>}
                      </td>
                      <td className="py-3 px-4">
                        {sub ? (
                          <div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SUB_STATUS_BADGE[subStatus ?? ''] ?? 'bg-slate-600 text-slate-300'}`}>
                              {subStatus}
                            </span>
                            {sub.package?.name && (
                              <p className="text-slate-500 text-xs mt-0.5">{sub.package.name} · {sub.studentLimit} seats</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {s.active
                          ? <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle size={12} />Active</span>
                          : <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle size={12} />Inactive</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
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
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-semibold">{editing ? 'Edit School' : 'Onboard School'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
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
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700">
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-sm px-4 py-2 rounded-md border border-slate-600 hover:border-slate-500 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Onboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SysAdminSchoolsPage;
