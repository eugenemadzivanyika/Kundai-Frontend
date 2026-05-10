// School Portal app shell — sidebar + topbar + role-aware nav + tweaks panel.
const { useState: useStateApp, useEffect: useEffectApp } = React;

const SCHOOL_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "role": "Head"
}/*EDITMODE-END*/;

const NAV = [
  { key: 'dashboard',     label: 'Dashboard',     icon: SI.Dashboard },
  { key: 'students',      label: 'Students',      icon: SI.Students },
  { key: 'teachers',      label: 'Teachers',      icon: SI.Teachers },
  { key: 'classes',       label: 'Classes',       icon: SI.Classes },
  { key: 'assessments',   label: 'Assessments',   icon: SI.Quill },
  { key: 'announcements', label: 'Announcements', icon: SI.Announce },
  { key: 'billing',       label: 'Billing',       icon: SI.Billing },
  { key: 'settings',      label: 'Settings',      icon: SI.Settings },
];

const ROLE_VISIBILITY = {
  Head:   ['dashboard','students','teachers','classes','assessments','announcements','billing','settings'],
  Deputy: ['dashboard','students','teachers','classes','assessments','announcements','settings'],
  IT:     ['dashboard','students','teachers','billing','settings'],
};

const ROLE_PROFILE = {
  Head:   { name: 'Mrs. R. Chigumba', title: 'Headmistress',   tone: 'forest',     initials: 'RC' },
  Deputy: { name: 'Mr. T. Mukamuri',  title: 'Deputy / Academic Head', tone: 'plum', initials: 'TM' },
  IT:     { name: 'Ms. N. Madondo',   title: 'IT Coordinator', tone: 'sky',        initials: 'NM' },
};

function SchoolApp() {
  const tw = window.useTweaks ? window.useTweaks(SCHOOL_TWEAKS) : [SCHOOL_TWEAKS, () => {}];
  const tweaks = tw[0]; const setTweak = tw[1];
  const [route, setRoute] = useStateApp(() => {
    const h = window.location.hash.slice(1);
    return h && NAV.some(n => n.key === h) ? h : 'dashboard';
  });
  useEffectApp(() => { window.location.hash = route; }, [route]);
  useEffectApp(() => { document.documentElement.dataset.theme = tweaks.theme || 'light'; }, [tweaks.theme]);

  const visibleNav = NAV.filter(n => ROLE_VISIBILITY[tweaks.role || 'Head'].includes(n.key));
  const profile = ROLE_PROFILE[tweaks.role || 'Head'];
  const goto = (k) => setRoute(k);
  const { SCHOOL } = window.SCHOOL_DATA;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)' }}>
      {/* Sidebar */}
      <aside style={{ width: 232, flexShrink: 0, background: 'var(--paper)', borderRight: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--rule-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--forest)', color: '#fbf8f1', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 16, fontFamily: "'Source Serif 4', serif", letterSpacing: '-.03em' }}>G</div>
            <div style={{ minWidth: 0 }}>
              <div className="serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-.01em' }}>{SCHOOL.shortName}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.05em', textTransform: 'uppercase', fontWeight: 600 }}>Est. {SCHOOL.established}</div>
            </div>
          </div>
          <div style={{ marginTop: 10, padding: '6px 8px', background: 'var(--paper-shade)', border: '1px solid var(--rule-soft)', borderRadius: 5, fontSize: 10.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{SCHOOL.termName}</span>
            <span className="tnum" style={{ color: 'var(--ink-2)', fontWeight: 600 }}>Wk {SCHOOL.termWeek}/{SCHOOL.termTotalWeeks}</span>
          </div>
        </div>

        <div style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
          {visibleNav.map(it => {
            const Icon = it.icon;
            const active = route === it.key;
            return (
              <button key={it.key} onClick={() => goto(it.key)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                background: active ? 'var(--paper-shade)' : 'transparent',
                border: 0, borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit',
                color: active ? 'var(--ink-1)' : 'var(--ink-2)', fontWeight: active ? 600 : 500, fontSize: 12.5,
                position: 'relative', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--paper-shade)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                {active && <span style={{ position: 'absolute', left: -10, top: 6, bottom: 6, width: 2, background: 'var(--forest)', borderRadius: 999 }} />}
                <Icon size={15} style={{ color: active ? 'var(--forest)' : 'var(--ink-3)' }} />
                <span style={{ flex: 1 }}>{it.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: 12, borderTop: '1px solid var(--rule-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 4px' }}>
            <Avatar name={profile.name} tone={profile.tone} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name}</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{profile.title}</div>
            </div>
            <button title="Sign out" style={{ padding: 5, background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer' }}><SI.Logout size={13} /></button>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: 58, padding: '0 28px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--rule)', background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ flex: 1, maxWidth: 420, position: 'relative' }}>
            <SI.Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }} />
            <input placeholder="Search students, teachers, classes…" style={{ width: '100%', padding: '7px 10px 7px 32px', background: 'var(--paper-shade)', border: '1px solid var(--rule)', borderRadius: 5, color: 'var(--ink-1)', fontFamily: 'inherit', fontSize: 12.5, outline: 'none' }} />
          </div>
          <div style={{ flex: 1 }} />
          <Pill tone={tweaks.role === 'Head' ? 'forest' : tweaks.role === 'Deputy' ? 'plum' : 'sky'} sm dotted>{tweaks.role || 'Head'} view</Pill>
          <button style={{ padding: 7, borderRadius: 5, background: 'var(--paper-shade)', border: '1px solid var(--rule)', cursor: 'pointer', position: 'relative' }}>
            <SI.Bell size={14} style={{ color: 'var(--ink-2)' }} />
            <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 999, background: 'var(--terracotta)' }} />
          </button>
        </header>

        <main style={{ flex: 1, padding: '24px 28px 60px', overflowY: 'auto' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            {route === 'dashboard'     && <SchoolDashboard goto={goto} role={(tweaks.role || 'Head').toLowerCase()} />}
            {route === 'students'      && <PageStudents goto={goto} />}
            {route === 'teachers'      && <PageTeachers goto={goto} />}
            {route === 'classes'       && <PageClasses goto={goto} />}
            {route === 'assessments'   && <PageAssessments goto={goto} />}
            {route === 'announcements' && <PageAnnouncements goto={goto} />}
            {route === 'billing'       && <PageBilling goto={goto} />}
            {route === 'settings'      && <PageSettings goto={goto} />}
          </div>
        </main>
      </div>

      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection title="Appearance">
            <window.TweakRadio label="Theme" value={tweaks.theme} onChange={v => setTweak('theme', v)} options={[{value:'light',label:'Light'},{value:'dark',label:'Dark'}]} />
          </window.TweakSection>
          <window.TweakSection title="Role view">
            <window.TweakSelect label="Active role" value={tweaks.role} onChange={v => setTweak('role', v)} options={[{value:'Head',label:'Head — Headmistress'},{value:'Deputy',label:'Deputy — Academic Head'},{value:'IT',label:'IT Admin — Operations'}]} />
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.4 }}>Each role sees a different set of nav items, KPIs, and prominent actions.</p>
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SchoolApp />);
