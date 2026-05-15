import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Mail, Phone, MapPin,
  Building2, Users, TrendingUp, Calendar,
  AlertCircle, CheckCircle, Package, RefreshCw,
  GraduationCap, Briefcase, BookOpen, KeyRound, CalendarPlus,
} from 'lucide-react';
import { sysAdminService, School, Subscription, SubscriptionPackage, SchoolStats } from '../../../services/sysAdminService';
import { useToast } from '../../ui/use-toast';

type Tab = 'overview' | 'subscriptions' | 'billing';

const SUB_STATUS: Record<string, string> = {
  active:    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  trial:     'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  suspended: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  expired:   'bg-red-500/20 text-red-300 border border-red-500/30',
  cancelled: 'bg-slate-600/40 text-slate-400',
};

interface KpiProps { label: string; value: string | number; sub?: string; icon: React.ElementType; accent: string; }
const Kpi: React.FC<KpiProps> = ({ label, value, sub, icon: Icon, accent }) => (
  <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
    <div className="flex items-start justify-between mb-2">
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</p>
      <div className={`${accent} rounded-lg p-1.5`}><Icon size={13} className="text-white" /></div>
    </div>
    <p className="text-white text-2xl font-bold">{value}</p>
    {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
  </div>
);

const SchoolDetailPage: React.FC = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const [school, setSchool] = useState<School | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [suspending, setSuspending] = useState(false);
  const [resettingPwd, setResettingPwd] = useState(false);
  const [extendingTrial, setExtendingTrial] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      sysAdminService.getSchool(schoolId),
      sysAdminService.getSubscriptions(),
      sysAdminService.getSchoolStats(schoolId),
    ])
      .then(([s, allSubs, st]) => {
        setSchool(s);
        setSubscriptions(allSubs.filter((sub) => {
          const schoolRef = sub.school;
          return typeof schoolRef === 'string' ? schoolRef === schoolId : (schoolRef as any)?._id === schoolId;
        }));
        setStats(st);
      })
      .catch(() => toast.error('Failed to load school details'))
      .finally(() => setLoading(false));
  }, [schoolId]);

  const handleSuspend = async () => {
    if (!school) return;
    setSuspending(true);
    try {
      await sysAdminService.updateSchool(school._id, { active: false });
      setSchool((s) => s ? { ...s, active: false } : s);
      toast.success('School suspended');
    } catch {
      toast.error('Failed to suspend school');
    } finally {
      setSuspending(false);
    }
  };

  const handleReactivate = async () => {
    if (!school) return;
    setSuspending(true);
    try {
      await sysAdminService.updateSchool(school._id, { active: true });
      setSchool((s) => s ? { ...s, active: true } : s);
      toast.success('School reactivated');
    } catch {
      toast.error('Failed to reactivate school');
    } finally {
      setSuspending(false);
    }
  };

  const handleResetPassword = async () => {
    if (!school) return;
    if (!window.confirm(`Reset admin password for "${school.name}"? The admin will receive a temporary password.`)) return;
    setResettingPwd(true);
    try {
      const result = await sysAdminService.resetAdminPassword(school._id);
      toast.success(`Password reset. Temp password: ${result.temporaryPassword} (sent to ${result.email})`);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to reset password');
    } finally {
      setResettingPwd(false);
    }
  };

  const handleExtendTrial = async () => {
    if (!school) return;
    const activeSub = school.activeSubscription as any;
    if (!activeSub) {
      toast.error('No active subscription to extend');
      return;
    }
    const daysStr = window.prompt('Extend trial by how many days?', '14');
    if (!daysStr) return;
    const days = parseInt(daysStr);
    if (isNaN(days) || days < 1) { toast.error('Enter a valid number of days'); return; }
    setExtendingTrial(true);
    try {
      await sysAdminService.extendTrial(activeSub._id, days);
      // Reload school to reflect new end date
      const updated = await sysAdminService.getSchool(school._id);
      setSchool(updated);
      toast.success(`Trial extended by ${days} day${days > 1 ? 's' : ''}`);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to extend trial');
    } finally {
      setExtendingTrial(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 bg-slate-800 rounded animate-pulse" />
        <div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">School not found.</p>
        <button onClick={() => navigate('/sys-admin/schools')} className="text-emerald-400 mt-2 text-sm hover:underline">Back to schools</button>
      </div>
    );
  }

  const activeSub = school.activeSubscription as any;
  const pkg: SubscriptionPackage | null = activeSub?.package ?? null;
  const totalPaid = subscriptions.reduce((sum, s) => sum + s.amountPaid, 0);
  const totalDue = subscriptions.reduce((sum, s) => sum + s.amountDue, 0);

  const daysUntilExpiry = activeSub?.endDate
    ? Math.round((new Date(activeSub.endDate).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <button
          onClick={() => navigate('/sys-admin/schools')}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <ChevronLeft size={14} /> Schools
        </button>
        <span className="text-slate-600">/</span>
        <span className="text-slate-300">{school.name}</span>
      </div>

      {/* School header */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 border border-slate-600 flex items-center justify-center text-xl font-bold text-white">
              {school.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-white">{school.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${school.active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                  {school.active ? 'Active' : 'Inactive'}
                </span>
                {activeSub && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${SUB_STATUS[activeSub.status] ?? ''}`}>
                    {activeSub.status}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1"><Mail size={11} /> {school.email}</span>
                {school.phone && <span className="flex items-center gap-1"><Phone size={11} /> {school.phone}</span>}
                {school.address && <span className="flex items-center gap-1"><MapPin size={11} /> {school.address}</span>}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            {school.active ? (
              <button
                onClick={handleSuspend}
                disabled={suspending}
                className="flex items-center gap-1.5 border border-amber-600/50 text-amber-400 hover:bg-amber-600/10 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                <AlertCircle size={13} /> {suspending ? 'Suspending…' : 'Suspend'}
              </button>
            ) : (
              <button
                onClick={handleReactivate}
                disabled={suspending}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                <CheckCircle size={13} /> {suspending ? 'Reactivating…' : 'Reactivate'}
              </button>
            )}
            <button
              onClick={handleResetPassword}
              disabled={resettingPwd}
              className="flex items-center gap-1.5 border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              <KeyRound size={13} /> {resettingPwd ? 'Resetting…' : 'Reset password'}
            </button>
            {activeSub && (activeSub.status === 'trial' || activeSub.status === 'expired') && (
              <button
                onClick={handleExtendTrial}
                disabled={extendingTrial}
                className="flex items-center gap-1.5 border border-sky-600/50 text-sky-400 hover:bg-sky-600/10 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                <CalendarPlus size={13} /> {extendingTrial ? 'Extending…' : 'Extend trial'}
              </button>
            )}
            <button
              onClick={() => navigate('/sys-admin/subscriptions')}
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <RefreshCw size={13} /> Manage subscription
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 flex gap-0">
        {(['overview', 'subscriptions', 'billing'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition-colors -mb-px ${
              tab === t
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Subscription KPIs */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <Kpi label="Active package" value={pkg?.name ?? '—'} sub={activeSub ? `${activeSub.studentLimit?.toLocaleString()} seats licensed` : 'No active subscription'} icon={Package} accent="bg-indigo-600" />
            <Kpi label="Subscriptions" value={subscriptions.length} sub={`${subscriptions.filter((s) => s.status === 'active').length} active`} icon={TrendingUp} accent="bg-emerald-600" />
            <Kpi label="Renews in" value={daysUntilExpiry !== null ? `${daysUntilExpiry} days` : '—'} sub={activeSub?.endDate ? new Date(activeSub.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} icon={Calendar} accent={daysUntilExpiry !== null && daysUntilExpiry <= 14 ? 'bg-amber-600' : 'bg-sky-600'} />
            <Kpi label="Onboarded" value={new Date(school.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} sub={`${Math.round((Date.now() - new Date(school.createdAt).getTime()) / 86_400_000)} days ago`} icon={Building2} accent="bg-slate-600" />
          </div>

          {/* Usage stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              <Kpi label="Teachers" value={stats.teachers} icon={Briefcase} accent="bg-cyan-700" />
              <Kpi label="Students" value={stats.students} icon={GraduationCap} accent="bg-violet-700" />
              <Kpi label="Classes" value={stats.classes} icon={BookOpen} accent="bg-amber-700" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">School information</h3>
              <div className="space-y-3 text-sm">
                {[
                  ['Email', school.email],
                  ['Phone', school.phone || '—'],
                  ['Address', school.address || '—'],
                  ['Registration No.', school.registrationNumber || '—'],
                  ['Notes', school.notes || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-4">
                    <span className="text-slate-500 w-32 shrink-0">{label}</span>
                    <span className="text-slate-200">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Primary contact</h3>
              {school.primaryContact?.name ? (
                <div className="space-y-3 text-sm">
                  {[
                    ['Name', school.primaryContact.name],
                    ['Email', school.primaryContact.email || '—'],
                    ['Phone', school.primaryContact.phone || '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-4">
                      <span className="text-slate-500 w-16 shrink-0">{label}</span>
                      <span className="text-slate-200">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No primary contact set.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions tab */}
      {tab === 'subscriptions' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <div>
              <h3 className="text-sm font-semibold text-white">Subscription history</h3>
              <p className="text-xs text-slate-500 mt-0.5">{subscriptions.length} subscriptions · {subscriptions.filter((s) => s.status === 'active').length} currently active</p>
            </div>
          </div>
          {subscriptions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No subscriptions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/60">
                    {['Package', 'Status', 'Period', 'Seats', 'Paid / Due', 'Reference'].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-slate-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => {
                    const p = sub.package as SubscriptionPackage | null;
                    return (
                      <tr key={sub._id} className="border-b border-slate-700/40 last:border-0">
                        <td className="py-3 px-4 text-white font-medium">{p?.name ?? '—'}</td>
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
                        <td className="py-3 px-4 text-slate-300 font-mono">{sub.studentLimit.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono">
                          <span className="text-slate-300">${sub.amountPaid.toLocaleString()}</span>
                          {sub.amountDue > 0 && <span className="text-red-400"> · ${sub.amountDue.toLocaleString()} due</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs font-mono">{sub.paymentRef || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Billing tab */}
      {tab === 'billing' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Kpi label="Lifetime paid" value={`$${totalPaid.toLocaleString()}`} sub={`Across ${subscriptions.length} subscriptions`} icon={TrendingUp} accent="bg-emerald-600" />
            <Kpi label="Outstanding" value={totalDue > 0 ? `$${totalDue.toLocaleString()}` : '$0'} sub={totalDue > 0 ? 'Action required' : 'All caught up'} icon={AlertCircle} accent={totalDue > 0 ? 'bg-rose-600' : 'bg-emerald-600'} />
            <Kpi label="Total subscriptions" value={subscriptions.length} sub={`${subscriptions.filter((s) => s.status === 'active').length} active`} icon={Users} accent="bg-indigo-600" />
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <div className="px-5 py-4 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-white">Payment history</h3>
            </div>
            {subscriptions.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No payment records.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/60">
                      {['Reference', 'Subscription', 'Amount', 'Status', 'Date'].map((h) => (
                        <th key={h} className="py-3 px-4 text-left text-slate-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => {
                      const p = sub.package as SubscriptionPackage | null;
                      return (
                        <tr key={sub._id} className="border-b border-slate-700/40 last:border-0">
                          <td className="py-3 px-4 font-mono text-slate-400 text-xs">{sub.paymentRef || '—'}</td>
                          <td className="py-3 px-4 text-slate-300">{p?.name ?? '—'}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-white">${sub.amountPaid.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sub.amountDue > 0 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                              {sub.amountDue > 0 ? 'Overdue' : 'Received'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-xs">
                            {new Date(sub.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolDetailPage;
