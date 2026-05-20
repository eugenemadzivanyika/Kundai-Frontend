import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Package,
  CreditCard,
  LogOut,
  ShieldCheck,
  Bell,
} from 'lucide-react';
import { authService } from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationCenter from '../teacher/NotificationCenter';

const NAV_LINKS = [
  { label: 'Dashboard',     path: '/sys-admin',                  icon: LayoutDashboard },
  { label: 'Schools',       path: '/sys-admin/schools',          icon: Building2 },
  { label: 'Packages',      path: '/sys-admin/packages',         icon: Package },
  { label: 'Subscriptions', path: '/sys-admin/subscriptions',    icon: CreditCard },
];

const SysAdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const handleLogout = () => { authService.logout(); };

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 text-white shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span className="font-bold text-base tracking-tight text-white">Kundai <span className="text-emerald-400">SysAdmin</span></span>
              {currentUser && (
                <span className="hidden sm:block text-slate-400 text-xs font-medium ml-2">
                  {currentUser.firstName} {currentUser.lastName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNotifOpen(true)}
                className="relative p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Notifications"
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-slate-700 transition-colors"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          <nav className="flex gap-0.5 pb-0 overflow-x-auto">
            {NAV_LINKS.map(({ label, path, icon: Icon }) => {
              const isActive =
                path === '/sys-admin'
                  ? location.pathname === '/sys-admin'
                  : location.pathname.startsWith(path);
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'border-emerald-400 text-emerald-300 bg-slate-800'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      <NotificationCenter
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onNavigate={(path) => { setNotifOpen(false); navigate(path); }}
      />
    </div>
  );
};

export default SysAdminLayout;
