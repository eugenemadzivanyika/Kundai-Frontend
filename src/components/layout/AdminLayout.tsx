import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  ListTree,
  CalendarRange,
  LogOut,
} from 'lucide-react';
import { authService } from '../../services/api';

const NAV_LINKS = [
  { label: 'Dashboard',     path: '/admin',               icon: LayoutDashboard },
  { label: 'Users',         path: '/admin/users',          icon: Users },
  { label: 'Subjects',      path: '/admin/subjects',       icon: BookOpen },
  { label: 'Classes',       path: '/admin/classes',        icon: GraduationCap },
  { label: 'Curriculum',    path: '/admin/curriculum',     icon: ListTree },
  { label: 'Term Forecasts',path: '/admin/term-forecasts', icon: CalendarRange },
];

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-blue-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg tracking-tight">Kundai Admin</span>
              {currentUser && (
                <span className="hidden sm:block text-blue-300 text-xs font-medium">
                  {currentUser.firstName} {currentUser.lastName}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

          <nav className="flex gap-0.5 pb-0 overflow-x-auto">
            {NAV_LINKS.map(({ label, path, icon: Icon }) => {
              const isActive =
                path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(path);
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'border-white text-white bg-blue-700/50'
                      : 'border-transparent text-blue-300 hover:text-white hover:bg-blue-700/30'
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

export default AdminLayout;
