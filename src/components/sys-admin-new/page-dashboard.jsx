// SysAdmin Dashboard — overview, MRR, status mix, attention, pipeline, top schools, package mix, system health.
const { useMemo } = React;

function PageDashboard({ goto }) {
  const { SCHOOLS, MRR_SERIES, STATUS_MIX, SYSTEM_HEALTH, PIPELINE, PACKAGES } = window.KUNDAI_DATA;

  const totals = useMemo(() => {
    const totalSchools = SCHOOLS.length;
    const active  = SCHOOLS.filter(s => s.status === 'active').length;
    const trial   = SCHOOLS.filter(s => s.status === 'trial').length;
    const seatsUsed  = SCHOOLS.reduce((a, s) => a + s.seatsUsed, 0);
    const seatsTotal = SCHOOLS.reduce((a, s) => a + s.seatsTotal, 0);
    const mrr = SCHOOLS.reduce((a, s) => a + s.mrr, 0);
    return { totalSchools, active, trial, seatsUsed, seatsTotal, mrr };
  }, []);

  const attention = SCHOOLS
    .filter(s => s.health === 'attention' || s.health === 'critical' || s.renewsIn <= 12)
    .sort((a, b) => a.renewsIn - b.renewsIn)
    .slice(0, 5);

  const topSchools = [...SCHOOLS]
    .filter(s => s.status === 'active')
    .sort((a, b) => b.aiUsage.gradedThisTerm - a.aiUsage.gradedThisTerm)
    .slice(0, 5);

  const statusSegments = [
    { label: 'Active',    value: STATUS_MIX.active,    color: '#10b981' },
    { label: 'Trial',     value: STATUS_MIX.trial,     color: '#38bdf8' },
    { label: 'Suspended', value: STATUS_MIX.suspended, color: '#f59e0b' },
    { label: 'Expired',   value: STATUS_MIX.expired,   color: '#f43f5e' },
  ];
  const statusTotal = Object.values(STATUS_MIX).reduce((a,b)=>a+b, 0);

  const packageMaxSchools = Math.max(...PACKAGES.map(p => p.schoolsOn));
  const packageItems = PACKAGES.map(p => ({
    label: p.name,
    value: p.schoolsOn,
    suffix: 'schools',
    color: p.name === 'Starter' ? '#7dd3fc' : p.name === 'Classroom' ? '#34d399' : p.name === 'Campus' ? '#a78bfa' : '#fbbf24',
  }));

  const topMaxGraded = Math.max(...topSchools.map(s => s.aiUsage.gradedThisTerm));

  const lastMrr = MRR_SERIES[MRR_SERIES.length - 1].mrr;
  const prevMrr = MRR_SERIES[MRR_SERIES.length - 2].mrr;
  const mrrDelta = ((lastMrr - prevMrr) / prevMrr * 100).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Page heading */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Platform overview</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-lo)' }}>How the business and the system are doing today · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" size="sm" icon={I.Refresh}>Refresh</Btn>
          <Btn variant="ghost" size="sm" icon={I.Download}>Export</Btn>
          <Btn variant="primary" size="sm" icon={I.Plus} onClick={() => goto('schools')}>Onboard school</Btn>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KPI label="Monthly recurring revenue" value={`$${lastMrr.toLocaleString()}`} sub="USD · across active subs"
             accent="emerald" icon={I.TrendUp} delta={parseFloat(mrrDelta)} deltaSub="vs. last month" />
        <KPI label="Schools subscribed" value={totals.totalSchools} sub={`${totals.active} active · ${totals.trial} on trial`}
             accent="indigo" icon={I.Building} />
        <KPI label="Student seats sold" value={totals.seatsUsed.toLocaleString()} sub={`of ${totals.seatsTotal.toLocaleString()} licensed · ${Math.round(totals.seatsUsed/totals.seatsTotal*100)}% utilization`}
             accent="sky" icon={I.GradCap} />
        <KPI label="Schools needing attention" value={attention.length} sub="Renewals due, overdue, or near cap"
             accent="amber" icon={I.Alert} />
      </div>

      {/* MRR chart + Status mix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        <Card>
          <SectionHeader
            title="Recurring revenue · last 12 months"
            sub={`Trending +$${(lastMrr - MRR_SERIES[0].mrr).toLocaleString()} since ${MRR_SERIES[0].m}`}
            action={
              <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg-elev-1)', borderRadius: 8, border: '1px solid var(--line)' }}>
                {['12M', '6M', '3M'].map((r, i) => (
                  <button key={r} style={{
                    border: 0, padding: '5px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                    background: i === 0 ? 'var(--bg-elev-2)' : 'transparent',
                    color: i === 0 ? 'var(--ink-hi)' : 'var(--ink-lo)',
                    fontFamily: 'inherit',
                  }}>{r}</button>
                ))}
              </div>
            }
          />
          <AreaLineChart data={MRR_SERIES} h={210} formatY={v => `$${(v/1000).toFixed(1)}k`} />
        </Card>

        <Card>
          <SectionHeader title="Subscriptions by status" sub={`${statusTotal} total subscriptions`} />
          <div style={{ marginTop: 10 }}>
            <StatusMixBar data={statusSegments} total={statusTotal} h={12} />
          </div>
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-lo)' }}>Net new this month</div>
              <div className="tnum" style={{ fontSize: 17, fontWeight: 700, color: '#34d399', marginTop: 2 }}>+ 6 schools</div>
            </div>
            <button onClick={() => goto('subscriptions')} style={{ background: 'transparent', border: '1px solid var(--line-bright)', color: 'var(--ink-mid)', borderRadius: 8, padding: '7px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
              Manage <I.ChevronRight size={13} />
            </button>
          </div>
        </Card>
      </div>

      {/* Attention list + Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        <Card padded={false}>
          <div style={{ padding: '16px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Schools needing attention</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink-lo)' }}>Renewals due soon, near seat cap, or with payment issues</p>
            </div>
            <button onClick={() => goto('schools')} style={{ background: 'transparent', border: 0, color: 'var(--emerald-soft)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
              View all schools <I.ChevronRight size={12} />
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th>School</Th><Th>Issue</Th><Th>Renews in</Th><Th>Seats</Th><Th></Th>
              </tr>
            </thead>
            <tbody>
              {attention.map(s => {
                let issueLabel, issueTone;
                if (s.status === 'suspended') { issueLabel = 'Payment overdue · suspended'; issueTone = 'rose'; }
                else if (s.renewsIn <= 0) { issueLabel = `Expired ${Math.abs(s.renewsIn)}d ago`; issueTone = 'rose'; }
                else if (s.renewsIn <= 7) { issueLabel = `Renews in ${s.renewsIn} days`; issueTone = 'amber'; }
                else if (s.seatsUsed/s.seatsTotal >= 0.95) { issueLabel = `${Math.round(s.seatsUsed/s.seatsTotal*100)}% of seats used`; issueTone = 'amber'; }
                else { issueLabel = 'Health: needs attention'; issueTone = 'amber'; }
                return (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => goto('school', s.id)}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <SchoolLogo name={s.name} tone={s.logoTone} size={32} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--ink-hi)' }}>{s.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{s.location} · {s.pkg}</div>
                        </div>
                      </div>
                    </Td>
                    <Td><Pill tone={issueTone} dot sm>{issueLabel}</Pill></Td>
                    <Td mono>{s.renewsIn > 0 ? `${s.renewsIn} d` : `−${Math.abs(s.renewsIn)} d`}</Td>
                    <Td>
                      <div style={{ width: 130 }}>
                        <CapacityBar used={s.seatsUsed} total={s.seatsTotal} label="" />
                      </div>
                    </Td>
                    <Td style={{ textAlign: 'right', paddingRight: 16 }}>
                      <I.ChevronRight size={14} style={{ color: 'var(--ink-faint)' }} />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionHeader title="Onboarding pipeline" sub="Schools moving toward subscription" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PIPELINE.map((p, i) => {
              const t = TONE[p.color];
              return (
                <div key={p.stage} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: t.bg, color: t.fg, border: `1px solid ${t.line}`, fontWeight: 700, fontSize: 11 }}>
                    {String(i+1).padStart(2,'0')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-mid)' }}>{p.stage}</span>
                      <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-hi)' }}>{p.count}</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg-elev-2)', borderRadius: 999 }}>
                      <div style={{ width: `${(p.count / PIPELINE[0].count) * 100}%`, height: '100%', background: t.fg, borderRadius: 999 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-lo)' }}>Conversion rate (lead → won)</div>
            <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>42.9%</span>
          </div>
        </Card>
      </div>

      {/* Top schools + Package mix + System health */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.1fr', gap: 14 }}>
        <Card>
          <SectionHeader title="Top schools by usage" sub="Assessments graded this term" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topSchools.map((s, i) => (
              <div key={s.id} onClick={() => goto('school', s.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 0' }}>
                <span className="tnum" style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600, width: 18 }}>#{i+1}</span>
                <SchoolLogo name={s.name} tone={s.logoTone} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-hi)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ height: 4, background: 'var(--bg-elev-2)', borderRadius: 999, marginTop: 5 }}>
                    <div style={{ width: `${(s.aiUsage.gradedThisTerm / topMaxGraded) * 100}%`, height: '100%', background: TONE[s.logoTone]?.fg || '#34d399', borderRadius: 999 }} />
                  </div>
                </div>
                <span className="tnum" style={{ fontSize: 12.5, color: 'var(--ink-mid)', fontWeight: 600, minWidth: 56, textAlign: 'right' }}>{s.aiUsage.gradedThisTerm.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Package mix" sub="Schools subscribed by package" action={<button onClick={() => goto('packages')} style={{ background: 'transparent', border: 0, color: 'var(--emerald-soft)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Manage →</button>} />
          <HBarList items={packageItems} max={packageMaxSchools} />
        </Card>

        <Card>
          <SectionHeader title="System health" sub="Service status across the platform" action={<Pill tone="emerald" dot sm>5 of 6 OK</Pill>} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SYSTEM_HEALTH.map(svc => {
              const tone = svc.status === 'operational' ? 'emerald' : svc.status === 'degraded' ? 'amber' : svc.status === 'maintenance' ? 'sky' : 'rose';
              const t = TONE[tone];
              return (
                <div key={svc.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: t.fg, boxShadow: `0 0 0 3px ${t.bg}` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-mid)' }}>{svc.name}</div>
                    {svc.note && <div style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>{svc.note}</div>}
                  </div>
                  <span className="tnum" style={{ fontSize: 11, color: 'var(--ink-lo)', minWidth: 42, textAlign: 'right' }}>{svc.uptime.toFixed(2)}%</span>
                  <span className="tnum" style={{ fontSize: 11, color: 'var(--ink-faint)', minWidth: 50, textAlign: 'right' }}>{svc.p95}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

window.PageDashboard = PageDashboard;
