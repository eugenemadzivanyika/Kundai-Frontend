import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Package,
  CreditCard,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { authService } from '../../services/api';

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

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

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
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-slate-700 transition-colors"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
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
    </div>
  );
};

export default SysAdminLayout;
