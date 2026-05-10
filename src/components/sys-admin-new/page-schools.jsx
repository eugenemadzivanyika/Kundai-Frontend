// SysAdmin Schools list — searchable, filterable table.
const { useState: useStateSchools } = React;

function PageSchools({ goto }) {
  const { SCHOOLS } = window.KUNDAI_DATA;
  const [query, setQuery] = useStateSchools('');
  const [statusFilter, setStatusFilter] = useStateSchools('all');

  const filtered = SCHOOLS.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (query && !`${s.name} ${s.location} ${s.email}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: SCHOOLS.length,
    active: SCHOOLS.filter(s => s.status === 'active').length,
    trial: SCHOOLS.filter(s => s.status === 'trial').length,
    suspended: SCHOOLS.filter(s => s.status === 'suspended').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Schools</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-lo)' }}>{SCHOOLS.length} schools onboarded · {counts.active} active · {counts.trial} on trial</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" size="sm" icon={I.Download}>Export CSV</Btn>
          <Btn variant="primary" size="sm" icon={I.Plus}>Onboard school</Btn>
        </div>
      </div>

      <Card padded={false}>
        {/* toolbar */}
        <div style={{ padding: 14, display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid var(--line-soft)', flexWrap: 'wrap' }}>
          <Input icon={I.Search} placeholder="Search by name, location, email…" value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, minWidth: 240 }} />
          <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg-elev-1)', borderRadius: 8, border: '1px solid var(--line)' }}>
            {[['all','All'],['active','Active'],['trial','Trial'],['suspended','Suspended']].map(([k, l]) => (
              <button key={k} onClick={() => setStatusFilter(k)} style={{
                border: 0, padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: statusFilter === k ? 'var(--bg-elev-2)' : 'transparent',
                color: statusFilter === k ? 'var(--ink-hi)' : 'var(--ink-lo)',
                fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                {l}
                <span className="tnum" style={{ fontSize: 10.5, color: statusFilter === k ? 'var(--ink-lo)' : 'var(--ink-faint)' }}>{counts[k]}</span>
              </button>
            ))}
          </div>
          <Btn variant="ghost" size="sm" icon={I.Filter}>More filters</Btn>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <Th>School</Th>
              <Th>Status</Th>
              <Th>Package</Th>
              <Th>Seats</Th>
              <Th>MRR</Th>
              <Th>Renews</Th>
              <Th>Onboarded</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} onClick={() => goto('school', s.id)}
                  style={{ cursor: 'pointer', transition: 'background .12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <SchoolLogo name={s.name} tone={s.logoTone} size={36} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontWeight: 600, color: 'var(--ink-hi)' }}>{s.name}</span>
                        <HealthDot status={s.health} />
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 1 }}>{s.location} · {s.type}</div>
                    </div>
                  </div>
                </Td>
                <Td><StatusPill status={s.status} /></Td>
                <Td><span style={{ color: 'var(--ink-hi)', fontWeight: 500 }}>{s.pkg}</span></Td>
                <Td><div style={{ width: 130 }}><CapacityBar used={s.seatsUsed} total={s.seatsTotal} label="" /></div></Td>
                <Td mono style={{ color: s.mrr > 0 ? 'var(--ink-hi)' : 'var(--ink-faint)', fontWeight: 600 }}>
                  {s.mrr > 0 ? `$${s.mrr.toLocaleString()}` : '—'}
                </Td>
                <Td mono>
                  {s.status === 'suspended' ? <span style={{ color: '#fb7185' }}>overdue</span>
                   : s.renewsIn <= 0 ? <span style={{ color: '#fb7185' }}>−{Math.abs(s.renewsIn)}d</span>
                   : s.renewsIn <= 14 ? <span style={{ color: '#fbbf24' }}>{s.renewsIn}d</span>
                   : `${s.renewsIn}d`}
                </Td>
                <Td dim>{new Date(s.onboarded).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Td>
                <Td style={{ textAlign: 'right', paddingRight: 16 }}><I.ChevronRight size={14} style={{ color: 'var(--ink-faint)' }} /></Td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><Td colSpan={8} style={{ textAlign: 'center', padding: '40px 14px', color: 'var(--ink-faint)' }}>No schools match your filters.</Td></tr>
            )}
          </tbody>
        </table>
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--ink-lo)' }}>
          <span>Showing <span style={{ color: 'var(--ink-mid)', fontWeight: 600 }}>{filtered.length}</span> of <span style={{ color: 'var(--ink-mid)', fontWeight: 600 }}>{SCHOOLS.length}</span></span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{ padding: '5px 8px', background: 'var(--bg-elev-1)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--ink-lo)', cursor: 'pointer' }}><I.ChevronLeft size={13} /></button>
            <button style={{ padding: '5px 8px', background: 'var(--bg-elev-1)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--ink-lo)', cursor: 'pointer' }}><I.ChevronRight size={13} /></button>
          </div>
        </div>
      </Card>
    </div>
  );
}

window.PageSchools = PageSchools;
