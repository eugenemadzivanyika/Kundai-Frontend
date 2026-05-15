import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Package, CreditCard,
  Settings, Bell, LogOut, ShieldCheck, Plus, CheckCheck, X,
} from 'lucide-react';
import { authService } from '../../services/api';
import { sysAdminService, SysNotification } from '../../services/sysAdminService';

const NAV_ITEMS = [
  { key: 'dashboard',     label: 'Dashboard',     path: '/sys-admin',               icon: LayoutDashboard },
  { key: 'schools',       label: 'Schools',        path: '/sys-admin/schools',       icon: Building2 },
  { key: 'subscriptions', label: 'Subscriptions',  path: '/sys-admin/subscriptions', icon: CreditCard },
  { key: 'packages',      label: 'Packages',       path: '/sys-admin/packages',      icon: Package },
];

const TYPE_LABELS: Record<string, string> = {
  school_registered:       'New school registered',
  subscription_created:    'Subscription created',
  subscription_expired:    'Subscription expired',
  payment_received:        'Payment received',
  subscription_trial:      'Trial started',
  subscription_active:     'Subscription activated',
  subscription_suspended:  'Subscription suspended',
  subscription_cancelled:  'Subscription cancelled',
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const SysAdminShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<SysNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount and every 60s
  useEffect(() => {
    const fetchCount = () => {
      sysAdminService.getUnreadCount()
        .then(({ count }) => setUnreadCount(count))
        .catch(() => {});
    };
    fetchCount();
    const id = setInterval(fetchCount, 60000);
    return () => clearInterval(id);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openNotifPanel = async () => {
    setNotifOpen((v) => !v);
    if (!notifOpen) {
      setNotifLoading(true);
      try {
        const { notifications: notifs, unreadCount: count } = await sysAdminService.getNotifications({ limit: 20 });
        setNotifications(notifs);
        setUnreadCount(count);
        // Mark each unread notification as read on view
        if (count > 0) {
          notifs
            .filter((n) => !n.read)
            .forEach((n) => sysAdminService.markNotificationRead(n._id).catch(() => {}));
          setUnreadCount(0);
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }
      } catch { /* silent */ } finally {
        setNotifLoading(false);
      }
    }
  };

  const markAllRead = async () => {
    try {
      await sysAdminService.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    } catch { /* silent */ }
  };

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
          <button
            onClick={() => navigate('/sys-admin/settings')}
            className={`relative flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left text-[13px] font-medium transition-colors ${
              isActive('/sys-admin/settings')
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            {isActive('/sys-admin/settings') && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-emerald-400" />
            )}
            <Settings size={14} className={isActive('/sys-admin/settings') ? 'text-emerald-400' : 'text-slate-600'} />
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

          {/* Notification bell */}
          <div className="relative" ref={panelRef}>
            <button
              onClick={openNotifPanel}
              className="relative p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <Bell size={14} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white px-0.5 border border-slate-900">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                      >
                        <CheckCheck size={12} /> Mark all read
                      </button>
                    )}
                    <button onClick={() => setNotifOpen(false)} className="text-slate-500 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifLoading ? (
                    <div className="p-6 text-center text-slate-500 text-xs">Loading…</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">No notifications yet.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`px-4 py-3 border-b border-slate-800/60 last:border-b-0 ${!n.read ? 'bg-slate-800/40' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${!n.read ? 'text-white' : 'text-slate-300'}`}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1">{TYPE_LABELS[n.type] ?? n.type} · {formatRelativeTime(n.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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
