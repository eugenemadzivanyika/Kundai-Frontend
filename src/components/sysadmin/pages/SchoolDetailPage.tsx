import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Mail, Phone, MapPin,
  Users, TrendingUp, Calendar,
  AlertCircle, CheckCircle, Package, RefreshCw,
  GraduationCap, Briefcase, BookOpen, KeyRound, CalendarPlus, X, Plus,
  ShieldCheck, Sparkles, MessageSquare, ScanLine,
} from 'lucide-react';
import { sysAdminService, School, Subscription, SubscriptionPackage, SchoolStats } from '../../../services/sysAdminService';
import { useToast } from '../../ui/use-toast';

const SUSPENSION_REASONS = [
  { code: 'non_payment',      label: 'Non-payment — outstanding invoice' },
  { code: 'trial_expired',    label: 'Trial period ended — no conversion' },
  { code: 'policy_violation', label: 'Platform policy violation' },
  { code: 'school_request',   label: 'School requested suspension' },
  { code: 'fraud_review',     label: 'Fraud or misuse under review' },
  { code: 'other',            label: 'Other (please specify below)' },
];

interface SuspendModalProps {
  schoolName: string;
  onCancel: () => void;
  onConfirm: (reason: string, note: string) => void;
  loading: boolean;
}

const SuspendModal: React.FC<SuspendModalProps> = ({ schoolName, onCancel, onConfirm, loading }) => {
  const [reason, setReason] = useState('non_payment');
  const [note, setNote]     = useState('');

  const canConfirm = reason !== 'other' || note.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-400" />
            <h2 className="text-sm font-bold text-white">Suspend school account</h2>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-slate-400 text-sm">
            You are about to suspend <span className="text-white font-semibold">{schoolName}</span>.
            Teachers and students will be immediately locked out.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {SUSPENSION_REASONS.map((r) => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
              Note {reason === 'other' ? <span className="text-red-400">*</span> : <span className="text-slate-600">(optional)</span>}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={reason === 'other' ? 'Describe the reason for suspension…' : 'Additional context (e.g. invoice number, case ID)'}
              className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-700">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason, note)}
            disabled={loading || !canConfirm}
            className="px-4 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Suspending…' : 'Confirm suspension'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ExtendTrialModalProps {
  onCancel: () => void;
  onConfirm: (days: number) => void;
  loading: boolean;
}

const ExtendTrialModal: React.FC<ExtendTrialModalProps> = ({ onCancel, onConfirm, loading }) => {
  const [days, setDays] = useState('14');
  const parsed = parseInt(days);
  const valid = !isNaN(parsed) && parsed >= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <CalendarPlus size={16} className="text-sky-400" />
            <h2 className="text-sm font-bold text-white">Extend trial</h2>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-slate-400 text-sm">How many days should the trial be extended by?</p>
          <input
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-700">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(parsed)}
            disabled={loading || !valid}
            className="px-4 py-2 text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Extending…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

type Tab = 'overview' | 'subscriptions' | 'billing' | 'users' | 'usage';

interface BarItem { label: string; value: number; color: string; }
const RoleBarChart: React.FC<{ items: BarItem[]; max: number }> = ({ items, max }) => (
  <div className="space-y-3">
    {items.map(item => (
      <div key={item.label}>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-300 font-medium">{item.label}</span>
          <span className="text-white font-bold font-mono">{item.value.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
               style={{ width: `${(item.value / max) * 100}%`, background: item.color }} />
        </div>
      </div>
    ))}
  </div>
);

const perStudent = (total?: number, students?: number): string => {
  if (!total || !students || students === 0) return '—';
  return (total / students).toFixed(1);
};

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

interface SeatAreaChartProps { data: { month: string; count: number }[]; licensed: number; }
const SeatAreaChart: React.FC<SeatAreaChartProps> = ({ data, licensed }) => {
  if (!data.length) return <div className="h-36 flex items-center justify-center text-slate-500 text-sm">No history data</div>;
  const W = 440, H = 140;
  const PAD = { top: 16, right: 16, bottom: 28, left: 36 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(licensed || 0, ...data.map((d) => d.count), 1);
  const xS = (i: number) => data.length <= 1 ? PAD.left + cW / 2 : PAD.left + (i / (data.length - 1)) * cW;
  const yS = (v: number) => PAD.top + cH - (v / maxVal) * cH;
  const pts = data.map((d, i) => [xS(i), yS(d.count)] as [number, number]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${(PAD.top + cH).toFixed(1)} L${pts[0][0].toFixed(1)},${(PAD.top + cH).toFixed(1)} Z`;
  const limitY = licensed > 0 ? yS(licensed) : null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
      <path d={area} fill="#7dd3fc" fillOpacity={0.25} />
      <path d={line} fill="none" stroke="#38bdf8" strokeWidth={1.5} strokeLinejoin="round" />
      {limitY !== null && (
        <>
          <line x1={PAD.left} y1={limitY} x2={PAD.left + cW} y2={limitY} stroke="#64748b" strokeWidth={1} strokeDasharray="4 3" />
          <text x={PAD.left + cW} y={limitY - 3} textAnchor="end" fill="#64748b" fontSize={8}>Seat limit</text>
        </>
      )}
      {data.map((d, i) => i % 2 === 0 ? (
        <text key={i} x={xS(i)} y={H - 4} textAnchor="middle" fill="#475569" fontSize={8}>{d.month}</text>
      ) : null)}
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.5} fill="#38bdf8" />)}
    </svg>
  );
};

const SchoolDetailPage: React.FC = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const [school, setSchool] = useState<School | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [suspending, setSuspending] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [resettingPwd, setResettingPwd] = useState(false);
  const [extendingTrial, setExtendingTrial] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      sysAdminService.getSchool(schoolId),
      sysAdminService.getSchoolSubscriptions(schoolId),
      sysAdminService.getSchoolStats(schoolId),
    ])
      .then(([s, subs, st]) => {
        setSchool(s);
        setSubscriptions(subs);
        setStats(st);
      })
      .catch(() => toast.error('Failed to load school details'))
      .finally(() => setLoading(false));
  }, [schoolId]);

  const handleSuspend = () => {
    if (!school) return;
    setShowSuspendModal(true);
  };

  const handleConfirmSuspend = async (reason: string, note: string) => {
    if (!school) return;
    const activeSub = school.activeSubscription as Subscription | null;
    if (!activeSub?._id) {
      toast.error('No active subscription found');
      return;
    }
    setSuspending(true);
    try {
      await sysAdminService.changeSubscriptionStatus(activeSub._id, {
        status: 'suspended',
        suspensionReason: reason,
        suspensionNote: note,
      });
      setShowSuspendModal(false);
      const refreshed = await sysAdminService.getSchool(school._id);
      setSchool(refreshed);
      toast.success('School suspended');
    } catch {
      toast.error('Failed to suspend school');
    } finally {
      setSuspending(false);
    }
  };

  const handleReactivate = async () => {
    if (!school) return;
    const activeSub = school.activeSubscription as any;
    if (!activeSub?._id) {
      toast.error('No active subscription found');
      return;
    }
    setSuspending(true);
    try {
      await sysAdminService.changeSubscriptionStatus(activeSub._id, { status: 'active' });
      const refreshed = await sysAdminService.getSchool(school._id);
      setSchool(refreshed);
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

  const handleExtendTrial = () => {
    if (!school) return;
    const activeSub = school.activeSubscription as any;
    if (!activeSub) { toast.error('No active subscription to extend'); return; }
    setShowExtendModal(true);
  };

  const handleConfirmExtend = async (days: number) => {
    if (!school) return;
    const activeSub = school.activeSubscription as any;
    setExtendingTrial(true);
    try {
      await sysAdminService.extendTrial(activeSub._id, days);
      setShowExtendModal(false);
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
      {showSuspendModal && (
        <SuspendModal
          schoolName={school?.name ?? ''}
          onCancel={() => setShowSuspendModal(false)}
          onConfirm={handleConfirmSuspend}
          loading={suspending}
        />
      )}
      {showExtendModal && (
        <ExtendTrialModal
          onCancel={() => setShowExtendModal(false)}
          onConfirm={handleConfirmExtend}
          loading={extendingTrial}
        />
      )}

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
              {activeSub?.status === 'suspended' && activeSub.suspensionReason && (
                <p className="mt-1.5 text-xs text-amber-400">
                  Reason: {SUSPENSION_REASONS.find((r) => r.code === activeSub.suspensionReason)?.label ?? activeSub.suspensionReason}
                  {activeSub.suspensionNote && <span className="text-slate-400"> — {activeSub.suspensionNote}</span>}
                </p>
              )}
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
              onClick={() => setTab('subscriptions')}
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <RefreshCw size={13} /> Manage subscription
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 flex gap-0">
        {([
          { key: 'overview',      label: 'Overview' },
          { key: 'subscriptions', label: 'Subscriptions' },
          { key: 'billing',       label: 'Billing' },
          { key: 'users',         label: 'Users' },
          { key: 'usage',         label: 'Usage & AI' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === key
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Subscription KPIs */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <Kpi label="Active package" value={pkg?.name ?? '—'} sub={activeSub ? `${activeSub.studentLimit?.toLocaleString()} seats licensed` : 'No active subscription'} icon={Package} accent="bg-indigo-600" />
            <Kpi label="Seats in use" value={stats?.seatsUsed?.toLocaleString() ?? '—'} sub={stats ? `${stats.utilizationPct}% utilization` : ''} icon={GraduationCap} accent="bg-sky-600" />
            <Kpi label="MRR contribution" value={activeSub?.amountPaid > 0 ? `$${activeSub.amountPaid.toLocaleString()}` : '—'} sub="USD · termly billing" icon={TrendingUp} accent="bg-emerald-600" />
            <Kpi label="Renews in" value={daysUntilExpiry !== null ? `${daysUntilExpiry} days` : '—'} sub={activeSub?.endDate ? new Date(activeSub.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} icon={Calendar} accent={daysUntilExpiry !== null && daysUntilExpiry <= 14 ? 'bg-amber-600' : 'bg-emerald-600'} />
          </div>

          {/* Usage stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              <Kpi label="Teachers" value={stats.teachers} icon={Briefcase} accent="bg-cyan-700" />
              <Kpi label="Students" value={stats.students} icon={GraduationCap} accent="bg-violet-700" />
              <Kpi label="Classes" value={stats.classes} icon={BookOpen} accent="bg-amber-700" />
            </div>
          )}

          {/* Seat usage chart + primary contact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Seat usage — last 12 months</h3>
              <SeatAreaChart data={stats?.seatHistory ?? []} licensed={activeSub?.studentLimit ?? 0} />
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Primary contact</h3>
              {school.primaryContact?.name ? (
                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {school.primaryContact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-white text-sm font-medium">{school.primaryContact.name}</p>
                    {school.primaryContact.email && <p className="text-slate-400 text-xs">{school.primaryContact.email}</p>}
                    {school.primaryContact.phone && <p className="text-slate-400 text-xs">{school.primaryContact.phone}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm mb-4">No primary contact set.</p>
              )}
              <div className="space-y-2 text-xs border-t border-slate-700 pt-3">
                {school.registrationNumber && (
                  <div className="flex gap-3"><span className="text-slate-500 w-24 shrink-0">Reg No.</span><span className="text-slate-300">{school.registrationNumber}</span></div>
                )}
                <div className="flex gap-3"><span className="text-slate-500 w-24 shrink-0">Onboarded</span><span className="text-slate-300">{new Date(school.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                <div className="flex gap-3"><span className="text-slate-500 w-24 shrink-0">Subscriptions</span><span className="text-slate-300">{subscriptions.length}</span></div>
              </div>
            </div>
          </div>

          {/* School information */}
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
            <button
              onClick={() => navigate(`/sys-admin/subscriptions?school=${schoolId}`)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <Plus size={13} /> New subscription
            </button>
          </div>
          {subscriptions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No subscriptions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/60">
                    {['Package', 'Status', 'Period', 'Seats', 'Paid / Due', 'Reference', 'Changed at', 'Changed by'].map((h) => (
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
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {sub.statusChangedAt
                            ? new Date(sub.statusChangedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">
                          {(() => {
                            const cb = sub.statusChangedBy;
                            if (!cb) return '—';
                            if (typeof cb === 'string') return cb;
                            return `${cb.firstName} ${cb.lastName}`;
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <Kpi label="Total users"
                 value={(stats.admins + stats.teachers + stats.students).toLocaleString()}
                 icon={Users} accent="bg-indigo-600" />
            <Kpi label="Admins"
                 value={stats.admins}
                 sub="School & staff admins"
                 icon={ShieldCheck} accent="bg-violet-600" />
            <Kpi label="Teachers"
                 value={stats.teachers}
                 sub="Active accounts"
                 icon={Briefcase} accent="bg-sky-600" />
            <Kpi label="Students"
                 value={stats.students.toLocaleString()}
                 sub={`${stats.seatsLicensed.toLocaleString()} seats licensed`}
                 icon={GraduationCap} accent="bg-emerald-600" />
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-white mb-4">User breakdown</h3>
            <RoleBarChart
              items={[
                { label: 'Students', value: stats.students, color: '#34d399' },
                { label: 'Teachers', value: stats.teachers, color: '#7dd3fc' },
                { label: 'Admins',   value: stats.admins,   color: '#a78bfa' },
              ]}
              max={Math.max(stats.students, stats.teachers, stats.admins, 1)}
            />
          </div>
        </div>
      )}

      {/* Usage & AI tab */}
      {tab === 'usage' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Kpi label="Assessments graded"
                 value={(stats.aiUsage?.gradedThisTerm ?? 0).toLocaleString()}
                 sub="This term · AI + human"
                 icon={Sparkles} accent="bg-emerald-600" />
            <Kpi label="AI tutor sessions"
                 value={(stats.aiUsage?.tutorSessions ?? 0).toLocaleString()}
                 sub="Across all students"
                 icon={MessageSquare} accent="bg-sky-600" />
            <Kpi label="OCR jobs processed"
                 value={(stats.aiUsage?.ocrJobs ?? 0).toLocaleString()}
                 sub="Handwritten submissions"
                 icon={ScanLine} accent="bg-violet-600" />
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Engagement intensity</h3>
            <p className="text-xs text-slate-500 mb-4">Per-student averages this term</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Graded per student',        value: perStudent(stats.aiUsage?.gradedThisTerm, stats.students), unit: 'assessments' },
                { label: 'Tutor sessions per student', value: perStudent(stats.aiUsage?.tutorSessions,  stats.students), unit: 'conversations' },
                { label: 'OCR per student',            value: perStudent(stats.aiUsage?.ocrJobs,        stats.students), unit: 'handwritten subs' },
              ].map(({ label, value, unit }) => (
                <div key={label} className="p-4 bg-slate-900/60 border border-slate-700 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{label}</p>
                  <p className="text-3xl font-bold text-white font-mono">{value}</p>
                  <p className="text-xs text-slate-400 mt-1">{unit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Billing tab */}
      {tab === 'billing' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Kpi label="Lifetime paid" value={`$${totalPaid.toLocaleString()}`} sub={`Across ${subscriptions.length} subscriptions`} icon={TrendingUp} accent="bg-emerald-600" />
            <Kpi label="Outstanding" value={totalDue > 0 ? `$${totalDue.toLocaleString()}` : '$0'} sub={totalDue > 0 ? 'Action required' : 'All caught up'} icon={AlertCircle} accent={totalDue > 0 ? 'bg-rose-600' : 'bg-emerald-600'} />
            <Kpi
              label="Next invoice"
              value={activeSub ? `$${(activeSub.amountDue > 0 ? activeSub.amountDue : pkg?.totalPrice ?? 0).toLocaleString()}` : '—'}
              sub={activeSub?.endDate ? `Due ${new Date(activeSub.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'No active subscription'}
              icon={Calendar}
              accent="bg-indigo-600"
            />
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
