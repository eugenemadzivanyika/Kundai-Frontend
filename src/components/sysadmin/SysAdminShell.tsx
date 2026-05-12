import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Package, CreditCard,
  Settings, Bell, LogOut, ShieldCheck, Plus,
} from 'lucide-react';
import { authService } from '../../services/api';

const NAV_ITEMS = [
  { key: 'dashboard',     label: 'Dashboard',     path: '/sys-admin',               icon: LayoutDashboard },
  { key: 'schools',       label: 'Schools',        path: '/sys-admin/schools',       icon: Building2 },
  { key: 'subscriptions', label: 'Subscriptions',  path: '/sys-admin/subscriptions', icon: CreditCard },
  { key: 'packages',      label: 'Packages',       path: '/sys-admin/packages',      icon: Package },
];

const SysAdminShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const isActive = (path: string) =>
    path === '/sys-admin'
      ? location.pathname === '/sys-admin'
      : location.pathname.startsWith(path);

  const initials = currentUser
    ? `${currentUser.firstName?.[0] ?? ''}${currentUser.lastName?.[0] ?? ''}`.toUpperCase()
    : 'SA';

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-extrabold text-slate-900 text-sm shadow-lg shadow-emerald-900/40">
            K
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">Kundai</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">SysAdmin Console</div>
          </div>
        </div>

        {/* Primary nav */}
        <nav className="flex flex-col gap-0.5 p-2.5 flex-1">
          {NAV_ITEMS.map(({ key, label, path, icon: Icon }) => {
            const active = isActive(path);
            return (
              <button
                key={key}
                onClick={() => navigate(path)}
                className={`relative flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left text-[13px] font-medium transition-colors ${
                  active
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-emerald-400" />
                )}
                <Icon
                  size={15}
                  className={active ? 'text-emerald-400' : 'text-slate-500'}
                />
                {label}
              </button>
            );
          })}

          <div className="mt-3 mb-1 px-3 text-[10px] text-slate-600 uppercase tracking-widest font-semibold">
            Operations
          </div>
          <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left text-[12px] font-medium text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 transition-colors">
            <Settings size={14} className="text-slate-600" />
            Settings
          </button>
        </nav>

        {/* System status + user */}
        <div className="p-3 border-t border-slate-800">
          <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700 mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span className="text-[11px] font-semibold text-slate-200">All systems operational</span>
            </div>
            <div className="text-[10px] text-slate-500 leading-relaxed">
              API · 99.97% uptime<br />
              Platform · Live
            </div>
          </div>
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-slate-200 truncate">
                {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Platform Admin'}
              </div>
              <div className="text-[10px] text-slate-500">sys_admin</div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="h-14 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-10">
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-[11.5px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live · GMT+2 Harare
            </span>
            <span className="w-px h-4 bg-slate-700" />
            <ShieldCheck size={13} className="text-emerald-500" />
            <span className="text-slate-300 font-medium">SysAdmin</span>
          </div>
          <button className="relative p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors">
            <Bell size={14} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 border border-slate-800" />
          </button>
          <button
            onClick={() => navigate('/sys-admin/schools')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={13} />
            New school
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-screen-xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SysAdminShell;
