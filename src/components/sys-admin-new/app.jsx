// App shell — sidebar + topbar + page router.
const { useState: useStateApp, useEffect: useEffectApp } = React;

function AppShell() {
  const [route, setRoute] = useStateApp(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('school/')) return { page: 'school', id: hash.slice(7) };
    if (hash) return { page: hash };
    return { page: 'dashboard' };
  });

  useEffectApp(() => {
    window.location.hash = route.page === 'school' ? `school/${route.id}` : route.page;
  }, [route]);

  const goto = (page, id) => setRoute({ page, id });

  const navItems = [
    { key: 'dashboard',     label: 'Dashboard',     icon: I.Dashboard },
    { key: 'schools',       label: 'Schools',       icon: I.School, badge: window.KUNDAI_DATA.SCHOOLS.length },
    { key: 'subscriptions', label: 'Subscriptions', icon: I.Receipt },
    { key: 'packages',      label: 'Packages',      icon: I.Package },
  ];

  const secondaryNav = [
    { key: 'support',  label: 'Support',  icon: I.Mail },
    { key: 'audit',    label: 'Audit log', icon: I.ShieldCheck },
    { key: 'settings', label: 'Settings', icon: I.Settings },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 232, flexShrink: 0, background: 'var(--bg-side)',
        borderRight: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--line-soft)' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
            display: 'grid', placeItems: 'center', fontWeight: 800, color: '#0b1220',
            fontSize: 15, letterSpacing: '-.02em',
            boxShadow: '0 4px 12px -4px rgba(16,185,129,.5)',
          }}>K</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-.01em' }}>Kundai</div>
            <div style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600 }}>SysAdmin Console</div>
          </div>
        </div>

        {/* Org switcher */}
        <div style={{ padding: '12px 12px 8px' }}>
          <button style={{
            width: '100%', padding: '8px 10px', background: 'var(--bg-elev-1)',
            border: '1px solid var(--line)', borderRadius: 8, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'inherit',
          }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: 'linear-gradient(135deg, #38bdf8, #6366f1)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>HQ</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 11.5, color: 'var(--ink-hi)', fontWeight: 600 }}>Kundai HQ</div>
              <div style={{ fontSize: 10, color: 'var(--ink-faint)' }}>Production · ZW</div>
            </div>
            <I.ChevronDown size={12} style={{ color: 'var(--ink-faint)' }} />
          </button>
        </div>

        {/* Primary nav */}
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(it => {
            const isActive = route.page === it.key || (it.key === 'schools' && route.page === 'school');
            const Icon = it.icon;
            return (
              <button key={it.key} onClick={() => goto(it.key)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
                background: isActive ? 'var(--bg-elev-2)' : 'transparent',
                border: 0, fontFamily: 'inherit', textAlign: 'left',
                color: isActive ? 'var(--ink-hi)' : 'var(--ink-mid)',
                fontWeight: isActive ? 600 : 500, fontSize: 12.5,
                position: 'relative', transition: 'all .12s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(56,189,248,.04)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                {isActive && <span style={{ position: 'absolute', left: -10, top: 6, bottom: 6, width: 2, background: 'var(--emerald-soft)', borderRadius: 999 }} />}
                <Icon size={15} style={{ color: isActive ? 'var(--emerald-soft)' : 'var(--ink-lo)' }} />
                <span style={{ flex: 1 }}>{it.label}</span>
                {it.badge != null && (
                  <span className="tnum" style={{ fontSize: 10.5, padding: '1px 6px', background: 'var(--bg-elev-1)', color: 'var(--ink-lo)', borderRadius: 999, fontWeight: 600 }}>{it.badge}</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ borderTop: '1px solid var(--line-soft)', margin: '10px 12px' }} />

        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 10, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, padding: '6px 10px 4px' }}>Operations</div>
          {secondaryNav.map(it => {
            const Icon = it.icon;
            return (
              <button key={it.key} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                background: 'transparent', border: 0, fontFamily: 'inherit', textAlign: 'left',
                color: 'var(--ink-lo)', fontWeight: 500, fontSize: 12,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Icon size={14} style={{ color: 'var(--ink-faint)' }} />
                <span>{it.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* System status footer */}
        <div style={{ padding: 12, borderTop: '1px solid var(--line-soft)' }}>
          <div style={{ padding: 10, background: 'var(--bg-elev-1)', border: '1px solid var(--line-soft)', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-hi)' }}>All systems operational</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-faint)', lineHeight: 1.4 }}>API · 99.97% · 142ms<br/>OCR queue · 23 jobs<br/>Last incident · 14d ago</div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>TM</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, color: 'var(--ink-hi)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Tendai Moyo</div>
              <div style={{ fontSize: 10, color: 'var(--ink-faint)' }}>Platform admin</div>
            </div>
            <button style={{ padding: 4, background: 'transparent', border: 0, color: 'var(--ink-faint)', cursor: 'pointer' }}><I.Settings size={13} /></button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header style={{
          height: 56, padding: '0 28px',
          display: 'flex', alignItems: 'center', gap: 14,
          borderBottom: '1px solid var(--line)',
          background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ flex: 1, maxWidth: 460, position: 'relative' }}>
            <I.Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
            <input placeholder="Search schools, subscriptions, references…" style={{
              width: '100%', padding: '7px 10px 7px 32px', background: 'var(--bg-elev-1)',
              border: '1px solid var(--line)', borderRadius: 8, color: 'var(--ink-hi)',
              fontFamily: 'inherit', fontSize: 12.5, outline: 'none',
            }} />
            <span className="mono" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--ink-faint)', padding: '2px 6px', background: 'var(--bg-elev-2)', borderRadius: 4, border: '1px solid var(--line)' }}>⌘K</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11.5, color: 'var(--ink-lo)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: '#34d399' }} />
              Live · GMT+2 Harare
            </span>
            <span style={{ width: 1, height: 16, background: 'var(--line)' }} />
            <span className="tnum" style={{ color: 'var(--ink-mid)' }}>Term 2 · Day 47/65</span>
          </div>
          <button style={{ padding: 7, borderRadius: 7, background: 'var(--bg-elev-1)', border: '1px solid var(--line)', cursor: 'pointer', position: 'relative' }}>
            <I.Bell size={14} style={{ color: 'var(--ink-mid)' }} />
            <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 999, background: '#fb7185', border: '1.5px solid var(--bg-canvas)' }} />
          </button>
          <Btn variant="primary" size="sm" icon={I.Plus}>New school</Btn>
        </header>

        {/* Page */}
        <main style={{ flex: 1, padding: '24px 28px 60px', overflowY: 'auto' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            {route.page === 'dashboard'     && <PageDashboard goto={goto} />}
            {route.page === 'schools'       && <PageSchools goto={goto} />}
            {route.page === 'school'        && <PageSchoolDetail schoolId={route.id} goto={goto} />}
            {route.page === 'subscriptions' && <PageSubscriptions goto={goto} />}
            {route.page === 'packages'      && <PagePackages goto={goto} />}
          </div>
        </main>
      </div>
    </div>
  );
}

window.AppShell = AppShell;

ReactDOM.createRoot(document.getElementById('root')).render(<AppShell />);
