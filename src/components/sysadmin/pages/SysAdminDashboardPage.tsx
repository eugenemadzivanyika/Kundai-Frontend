import React, { useEffect, useState } from 'react';
import {
  Building2, Users, TrendingUp, CheckCircle,
  AlertCircle, Package, ShieldCheck,
} from 'lucide-react';
import { sysAdminService, SysAdminSummary, School } from '../../../services/sysAdminService';
import { useToast } from '../../ui/use-toast';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  trial: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  suspended: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  expired: 'bg-red-500/20 text-red-300 border border-red-500/30',
  cancelled: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  sub?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon, accent, sub }) => (
  <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 flex items-start gap-3">
    <div className={`${accent} rounded-md p-2 mt-0.5 shrink-0`}>
      <Icon size={18} className="text-white" />
    </div>
    <div>
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
    </div>
  </div>
);

const subscriptionStatus = (school: School) => {
  const sub = school.activeSubscription as any;
  if (!sub) return null;
  return sub.status as string;
};

const SysAdminDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<SysAdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    sysAdminService.getSummary()
      .then(setSummary)
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-lg border border-slate-700 p-4 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6 mt-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck size={20} className="text-emerald-400" />
        <div>
          <h1 className="text-white text-xl font-bold">System Dashboard</h1>
          <p className="text-slate-400 text-sm">Platform-wide overview — schools, subscriptions, revenue</p>
        </div>
      </div>

      {/* Metrics row 1 — schools & users */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Total Schools" value={summary.totalSchools} icon={Building2} accent="bg-indigo-600" sub={`${summary.activeSchools} active`} />
        <MetricCard label="Active Subscriptions" value={summary.activeSubscriptions} icon={CheckCircle} accent="bg-emerald-600" sub={`${summary.trialSubscriptions} on trial`} />
        <MetricCard label="Student Seats Sold" value={summary.seatsSold.toLocaleString()} icon={Users} accent="bg-blue-600" sub="across active + trial" />
        <MetricCard label="MRR Estimate" value={`$${summary.mrrEstimate.toLocaleString()}`} icon={TrendingUp} accent="bg-violet-600" sub="active subscriptions only" />
      </div>

      {/* Metrics row 2 — operational */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Total Users" value={summary.totalUsers} icon={Users} accent="bg-cyan-700" />
        <MetricCard label="Total Students" value={summary.totalStudents} icon={Users} accent="bg-sky-700" />
        <MetricCard label="Available Packages" value={summary.totalPackages} icon={Package} accent="bg-amber-600" />
        <MetricCard label="Suspended" value={summary.suspendedSubscriptions} icon={AlertCircle} accent="bg-red-700" />
      </div>

      {/* Recent schools table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm">Recently Onboarded Schools</h3>
          <a href="/sys-admin/schools" className="text-emerald-400 hover:text-emerald-300 text-xs font-medium">View all →</a>
        </div>
        {summary.recentSchools.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No schools onboarded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-700">
                  <th className="py-2 pr-4 text-slate-400 font-medium text-xs uppercase tracking-wide">School</th>
                  <th className="py-2 pr-4 text-slate-400 font-medium text-xs uppercase tracking-wide">Email</th>
                  <th className="py-2 pr-4 text-slate-400 font-medium text-xs uppercase tracking-wide">Status</th>
                  <th className="py-2 pr-4 text-slate-400 font-medium text-xs uppercase tracking-wide">Subscription</th>
                  <th className="py-2 text-slate-400 font-medium text-xs uppercase tracking-wide">Onboarded</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentSchools.map((school) => {
                  const status = subscriptionStatus(school);
                  const subAny = school.activeSubscription as any;
                  return (
                    <tr key={school._id} className="border-b border-slate-700/50 last:border-b-0">
                      <td className="py-2.5 pr-4 text-white font-medium">{school.name}</td>
                      <td className="py-2.5 pr-4 text-slate-300">{school.email}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${school.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                          {school.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        {status ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] ?? ''}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                            {subAny?.package?.name ? ` · ${subAny.package.name}` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">No subscription</span>
                        )}
                      </td>
                      <td className="py-2.5 text-slate-400 text-xs">
                        {new Date(school.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
        <h3 className="text-white font-semibold text-sm mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Onboard School', href: '/sys-admin/schools', color: 'bg-indigo-600 hover:bg-indigo-700' },
            { label: 'New Package', href: '/sys-admin/packages', color: 'bg-amber-600 hover:bg-amber-700' },
            { label: 'New Subscription', href: '/sys-admin/subscriptions', color: 'bg-emerald-600 hover:bg-emerald-700' },
            { label: 'View All Schools', href: '/sys-admin/schools', color: 'bg-slate-600 hover:bg-slate-500' },
          ].map(({ label, href, color }) => (
            <a key={label} href={href} className={`${color} text-white text-xs font-semibold rounded-md px-3 py-3 text-center transition-colors`}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SysAdminDashboardPage;
