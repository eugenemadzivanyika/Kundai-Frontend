import React, { CSSProperties, useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { authService, adminService } from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationCenter from '../teacher/NotificationCenter';

// ── Design tokens (warm paper palette) ──────────────────────────────────────
const CSS_VARS: CSSProperties = {
  ['--paper' as string]: '#fbf6ec',
  ['--paper-shade' as string]: '#f3ecdc',
  ['--paper-deep' as string]: '#ebe1c9',
  ['--bg-canvas' as string]: '#f5efdf',
  ['--ink-1' as string]: '#1a1814',
  ['--ink-2' as string]: '#4a443a',
  ['--ink-3' as string]: '#7a7062',
  ['--rule' as string]: '#d9cfb8',
  ['--rule-soft' as string]: '#e6dcc4',
  ['--forest' as string]: '#1f4d36',
  ['--forest-deep' as string]: '#163424',
  ['--forest-soft' as string]: '#d6e3d3',
  ['--terracotta' as string]: '#a83a1f',
  ['--terracotta-soft' as string]: '#f0d4c2',
  ['--gold' as string]: '#b88827',
  ['--gold-deep' as string]: '#8a6418',
  ['--gold-soft' as string]: '#f0e2bc',
  ['--sky' as string]: '#2a5a7a',
  ['--sky-soft' as string]: '#cfdde6',
  ['--plum' as string]: '#6b2e5e',
  ['--plum-soft' as string]: '#e2cce0',
};

// ── Nav items ────────────────────────────────────────────────────────────────
const NAV = [
  { key: 'dashboard', label: 'Dashboard',  path: '/admin',              icon: DashboardIcon },
  { key: 'teachers',  label: 'Teachers',   path: '/admin/teachers',     icon: TeachersIcon },
  { key: 'students',  label: 'Students',   path: '/admin/students',     icon: StudentsIcon },
  { key: 'classes',   label: 'Classes',    path: '/admin/classes',      icon: ClassesIcon },
  { key: 'subjects',  label: 'Subjects',   path: '/admin/subjects',     icon: SubjectsIcon },
  { key: 'reports',   label: 'Reports',    path: '/admin/reports',      icon: ReportsIcon },
  { key: 'billing',   label: 'Billing',    path: '/admin/billing',      icon: BillingIcon },
  { key: 'settings',  label: 'Settings',   path: '/admin/settings',     icon: SettingsIcon },
];

// ── Icon components ──────────────────────────────────────────────────────────
function DashboardIcon({ size = 15, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}
function TeachersIcon({ size = 15, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1 14c0-3 2-4.5 5-4.5s5 1.5 5 4.5" />
      <path d="M12 7l2 2-2 2" />
      <path d="M14 9h-3" />
    </svg>
  );
}
function StudentsIcon({ size = 15, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="8" cy="5" r="2.5" />
      <path d="M2 14c0-3 2.5-4.5 6-4.5s6 1.5 6 4.5" />
    </svg>
  );
}
function ClassesIcon({ size = 15, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="1" y="3" width="14" height="10" rx="1" />
      <path d="M5 3V2M11 3V2" />
      <path d="M4 8h8M4 10.5h5" />
    </svg>
  );
}
function SubjectsIcon({ size = 15, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M4 1h8a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" />
      <path d="M6 5h4M6 8h4M6 11h2" />
    </svg>
  );
}
function ReportsIcon({ size = 15, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M4 1h8a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" />
      <path d="M6 5h4M6 8h3M6 11h1M10 8l2-2 2 2" />
    </svg>
  );
}
function BillingIcon({ size = 15, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="1" y="4" width="14" height="9" rx="1" />
      <path d="M1 7h14" />
      <path d="M4 11h2M9 11h3" />
    </svg>
  );
}
function SettingsIcon({ size = 15, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
    </svg>
  );
}
function BellIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1a5 5 0 015 5v3l1.5 2H1.5L3 9V6a5 5 0 015-5z" />
      <path d="M6.5 13a1.5 1.5 0 003 0" />
    </svg>
  );
}
function LogoutIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3" />
      <path d="M11 11l3-3-3-3" />
      <path d="M14 8H6" />
    </svg>
  );
}
function SearchIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6.5" cy="6.5" r="4" />
      <path d="M11 11l3 3" />
    </svg>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
const TONE_COLORS: Record<string, [string, string]> = {
  forest:    ['#1f4d36', '#d6e3d3'],
  plum:      ['#6b2e5e', '#e2cce0'],
  sky:       ['#2a5a7a', '#cfdde6'],
  gold:      ['#8a6418', '#f0e2bc'],
  terracotta:['#a83a1f', '#f0d4c2'],
};
function Avatar({ name, tone = 'forest', size = 32 }: { name: string; tone?: string; size?: number }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const [fg, bg] = TONE_COLORS[tone] ?? TONE_COLORS.forest;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: fg, display: 'grid', placeItems: 'center', fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

interface SubStatus {
  status: 'trial' | 'active' | 'suspended' | 'expired' | 'cancelled' | null;
  endDate: string | null;
  suspensionReason: string | null;
  suspensionNote: string | null;
}

// ── Layout component ─────────────────────────────────────────────────────────
const SchoolAdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin';
  const [schoolName, setSchoolName] = useState('School Portal');
  const [subStatus, setSubStatus] = useState<SubStatus>({ status: null, endDate: null, suspensionReason: null, suspensionNote: null });
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    adminService.getSchoolSettings?.()
      .then((d: any) => {
        if (d?.school?.name) setSchoolName(d.school.name);
        if (d?.subscription) {
          setSubStatus({
            status: d.subscription.status ?? null,
            endDate: d.subscription.endDate ?? null,
            suspensionReason: d.subscription.suspensionReason ?? null,
            suspensionNote: d.subscription.suspensionNote ?? null,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => { authService.logout(); };

  const activeKey = (() => {
    if (location.pathname === '/admin') return 'dashboard';
    const match = NAV.slice(1).find(n => location.pathname.startsWith(n.path));
    return match?.key ?? 'dashboard';
  })();

  return (
    <div style={{ ...CSS_VARS, display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)', fontFamily: "'Inter Tight', -apple-system, BlinkMacSystemFont, system-ui, sans-serif", fontSize: 13, color: 'var(--ink-2)', WebkitFontSmoothing: 'antialiased' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{ width: 228, flexShrink: 0, background: 'var(--paper)', borderRight: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>

        {/* School branding */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--rule-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--forest)', color: '#fbf8f1', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 16, fontFamily: "'Source Serif 4', serif", letterSpacing: '-0.03em', flexShrink: 0 }}>
              {schoolName.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 13.5, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {schoolName}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
                Admin Portal
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
          {NAV.map(item => {
            const Icon = item.icon;
            const active = activeKey === item.key;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                  background: active ? 'var(--paper-shade)' : 'transparent',
                  border: 0, borderRadius: 5, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 12.5, fontWeight: active ? 600 : 500,
                  color: active ? 'var(--ink-1)' : 'var(--ink-2)', textAlign: 'left',
                  position: 'relative', transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--paper-shade)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {active && <span style={{ position: 'absolute', left: -10, top: 6, bottom: 6, width: 2, background: 'var(--forest)', borderRadius: 999 }} />}
                <Icon size={15} style={{ color: active ? 'var(--forest)' : 'var(--ink-3)', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User profile */}
        <div style={{ padding: 12, borderTop: '1px solid var(--rule-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 4px' }}>
            <Avatar name={userName} tone="forest" size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>School Admin</div>
            </div>
            <button title="Sign out" onClick={handleLogout} style={{ padding: 5, background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', borderRadius: 4 }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--terracotta)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--ink-3)')}>
              <LogoutIcon size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <header style={{ height: 56, padding: '0 28px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--rule)', background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }}>
              <SearchIcon size={13} />
            </span>
            <input
              disabled
              placeholder="Use the search on each page"
              title="Use the search on each page"
              style={{ width: '100%', padding: '7px 10px 7px 32px', background: 'var(--paper-shade)', border: '1px solid var(--rule)', borderRadius: 5, color: 'var(--ink-3)', fontFamily: 'inherit', fontSize: 12.5, outline: 'none', cursor: 'not-allowed' }}
            />
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setNotifOpen(true)}
            title="Notifications"
            style={{ padding: 7, borderRadius: 5, background: 'var(--paper-shade)', border: '1px solid var(--rule)', cursor: 'pointer', position: 'relative', color: 'var(--ink-2)', lineHeight: 0 }}
          >
            <BellIcon size={14} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, background: 'var(--terracotta)', color: '#fff', borderRadius: 999, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </header>

        {/* Status banners */}
        {subStatus.status === 'suspended' && (
          <div style={{ background: 'rgba(120,53,15,0.25)', borderBottom: '1px solid rgba(217,119,6,0.5)', padding: '12px 28px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: 13 }}>Account Suspended</div>
              <div style={{ color: '#fde68a', fontSize: 12, marginTop: 2 }}>
                Your school's Kundai subscription is currently suspended. Teachers and students cannot access the platform.
              </div>
              {subStatus.suspensionReason && (
                <div style={{ color: '#fcd34d', fontSize: 12, marginTop: 2 }}>
                  Reason: {subStatus.suspensionReason.replace(/_/g, ' ')}
                  {subStatus.suspensionNote ? ` — ${subStatus.suspensionNote}` : ''}
                </div>
              )}
              <div style={{ color: '#fde68a', fontSize: 12, marginTop: 4 }}>
                To reinstate: contact <strong>support@kundai.com</strong> or your account manager.
              </div>
            </div>
          </div>
        )}

        {subStatus.status === 'expired' && (
          <div style={{ background: 'rgba(127,29,29,0.25)', borderBottom: '1px solid rgba(239,68,68,0.4)', padding: '12px 28px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>⛔</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#f87171', fontSize: 13 }}>Subscription Expired</div>
              <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 2 }}>
                {subStatus.endDate
                  ? `Your subscription ended on ${new Date(subStatus.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                  : 'Your subscription has expired.'}
                {' '}Renew to restore access for teachers and students.
              </div>
              <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>
                Contact: <strong>support@kundai.com</strong>
              </div>
            </div>
          </div>
        )}

        {subStatus.status === 'trial' && subStatus.endDate && (() => {
          const daysLeft = Math.round((new Date(subStatus.endDate).getTime() - Date.now()) / 86_400_000);
          const expiryStr = new Date(subStatus.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
          return (
            <div style={{ background: 'rgba(12,74,110,0.25)', borderBottom: '1px solid rgba(56,189,248,0.35)', padding: '10px 28px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 15, lineHeight: 1 }}>🕐</span>
              <div style={{ flex: 1, color: '#7dd3fc', fontSize: 12 }}>
                <strong style={{ color: '#38bdf8' }}>Trial</strong>
                {' '}— {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining` : 'expires today'} · Expires {expiryStr}
              </div>
              <a
                href="mailto:support@kundai.com?subject=Upgrade%20to%20paid%20subscription"
                style={{ color: '#38bdf8', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', textDecoration: 'none' }}
              >
                Upgrade to paid →
              </a>
            </div>
          );
        })()}

        {/* Page content */}
        <main style={{ flex: 1, padding: '24px 28px 60px', overflowY: 'auto' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>

      <NotificationCenter
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onNavigate={(path) => { setNotifOpen(false); navigate(path); }}
      />
    </div>
  );
};

export default SchoolAdminLayout;
