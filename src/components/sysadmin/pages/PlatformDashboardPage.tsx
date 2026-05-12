import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, TrendingUp, Users, AlertCircle,
  RefreshCw, ArrowUpRight, ShieldCheck, CreditCard,
} from 'lucide-react';
import { sysAdminService } from '../../../services/sysAdminService';
import type { School } from '../../../services/sysAdminService';
import { useToast } from '../../ui/use-toast';

interface PlatformOverview {
  totalSchools: number;
  activeSubscriptions: number;
  trialSchools: number;
  suspendedSubscriptions: number;
  mrr: number;
  churnedThisMonth: number;
  seatsSold: number;
  recentSchools: School[];
}

const SUB_STATUS: Record<string, string> = {
  active:    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  trial:     'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  suspended: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  expired:   'bg-red-500/20 text-red-300 border border-red-500/30',
  cancelled: 'bg-slate-600/40 text-slate-400 border border-slate-600/40',
};

interface KpiCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  accent: string;
  delta?: { value: string; positive: boolean };
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, icon: Icon, accent, delta }) => (
  <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
    <div className="flex items-start justify-between gap-2 mb-3">
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wide leading-tight">{label}</p>
      <div className={`${accent} rounded-lg p-1.5 shrink-0`}>
        <Icon size={14} className="text-white" />
      </div>
    </div>
    <p className="text-white text-3xl font-bold tracking-tight">{value}</p>
    <div className="flex items-center justify-between mt-1.5 gap-2">
      <p className="text-slate-500 text-xs">{sub}</p>
      {delta && (
        <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${delta.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
          <ArrowUpRight size={11} className={delta.positive ? '' : 'rotate-180'} />
          {delta.value}
        </span>
      )}
    </div>
  </div>
);

const PlatformDashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    sysAdminService.getOverview()
      .then(setOverview)
      .catch(() => toast.error('Failed to load platform overview'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-64 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-5 h-28 animate-pulse" />
          ))}
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 h-64 animate-pulse" />
      </div>
    );
  }

  if (!overview) return null;

  const totalSubs = overview.activeSubscriptions + overview.trialSchools + overview.suspendedSubscriptions;
  const statusSegments = [
    { label: 'Active',    count: overview.activeSubscriptions, pct: totalSubs ? overview.activeSubscriptions / totalSubs * 100 : 0, color: 'bg-emerald-400' },
    { label: 'Trial',     count: overview.trialSchools,        pct: totalSubs ? overview.trialSchools / totalSubs * 100 : 0,        color: 'bg-sky-400' },
    { label: 'Suspended', count: overview.suspendedSubscriptions, pct: totalSubs ? overview.suspendedSubscriptions / totalSubs * 100 : 0, color: 'bg-amber-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform overview</h1>
          <p className="text-slate-400 text-sm mt-1">
            How the business and system are doing today ·{' '}
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 bg-slate-800 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Monthly Recurring Revenue"
          value={`$${overview.mrr.toLocaleString()}`}
          sub="Active subscriptions only"
          icon={TrendingUp}
          accent="bg-emerald-600"
        />
        <KpiCard
          label="Schools subscribed"
          value={overview.totalSchools}
          sub={`${overview.activeSubscriptions} active · ${overview.trialSchools} on trial`}
          icon={Building2}
          accent="bg-indigo-600"
        />
        <KpiCard
          label="Student seats sold"
          value={overview.seatsSold.toLocaleString()}
          sub="Active + trial subscriptions"
          icon={Users}
          accent="bg-sky-600"
        />
        <KpiCard
          label="Schools needing attention"
          value={overview.suspendedSubscriptions + overview.churnedThisMonth}
          sub={`${overview.suspendedSubscriptions} suspended · ${overview.churnedThisMonth} churned this month`}
          icon={AlertCircle}
          accent="bg-amber-600"
        />
      </div>

      {/* Status mix + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status breakdown */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-sm">Subscriptions by status</h3>
              <p className="text-slate-500 text-xs mt-0.5">{totalSubs} total subscriptions</p>
            </div>
            <button
              onClick={() => navigate('/sys-admin/subscriptions')}
              className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              Manage <ArrowUpRight size={12} />
            </button>
          </div>

          {/* Segmented bar */}
          <div className="flex rounded-full overflow-hidden h-3 bg-slate-700 gap-0.5 mb-4">
            {statusSegments.map((seg) => (
              <div
                key={seg.label}
                className={`${seg.color} h-full transition-all first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${seg.pct}%` }}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-3">
            {statusSegments.map((seg) => (
              <div key={seg.label} className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${seg.color}`} />
                  <span className="text-slate-400 text-[11px] uppercase tracking-wide font-semibold">{seg.label}</span>
                </div>
                <p className="text-white text-2xl font-bold">{seg.count}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{seg.pct.toFixed(0)}% of total</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Quick actions</h3>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Onboard new school',    path: '/sys-admin/schools',       icon: Building2,   color: 'bg-indigo-600 hover:bg-indigo-500' },
              { label: 'Manage packages',       path: '/sys-admin/packages',      icon: ShieldCheck, color: 'bg-amber-600 hover:bg-amber-500' },
              { label: 'View subscriptions',    path: '/sys-admin/subscriptions', icon: CreditCard,  color: 'bg-emerald-700 hover:bg-emerald-600' },
            ].map(({ label, path, icon: Icon, color }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className={`${color} flex items-center gap-2.5 text-white text-xs font-semibold w-full px-3 py-2.5 rounded-lg transition-colors text-left`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent schools */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h3 className="text-white font-semibold text-sm">Recently onboarded schools</h3>
          <button
            onClick={() => navigate('/sys-admin/schools')}
            className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            View all <ArrowUpRight size={12} />
          </button>
        </div>
        {overview.recentSchools.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-10">No schools onboarded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  <th className="py-3 px-5 text-left text-slate-500 font-medium text-xs uppercase tracking-wide">School</th>
                  <th className="py-3 px-5 text-left text-slate-500 font-medium text-xs uppercase tracking-wide">Email</th>
                  <th className="py-3 px-5 text-left text-slate-500 font-medium text-xs uppercase tracking-wide">Subscription</th>
                  <th className="py-3 px-5 text-left text-slate-500 font-medium text-xs uppercase tracking-wide">Onboarded</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentSchools.map((school) => {
                  const sub = school.activeSubscription as any;
                  return (
                    <tr
                      key={school._id}
                      onClick={() => navigate(`/sys-admin/schools/${school._id}`)}
                      className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-5 text-white font-medium">{school.name}</td>
                      <td className="py-3 px-5 text-slate-300">{school.email}</td>
                      <td className="py-3 px-5">
                        {sub ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SUB_STATUS[sub.status] ?? 'bg-slate-600 text-slate-300'}`}>
                            {sub.status}{sub.package?.name ? ` · ${sub.package.name}` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">No subscription</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-slate-400 text-xs">
                        {new Date(school.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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
  );
};

export default PlatformDashboardPage;
