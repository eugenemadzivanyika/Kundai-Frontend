// Subscriptions — lifecycle pipeline, upcoming renewals, billing ops, churn.
const { useState: useStateSub } = React;

function PageSubscriptions({ goto }) {
  const { SCHOOLS, MRR_SERIES: MRR_HISTORY } = window.KUNDAI_DATA;
  const [view, setView] = useStateSub('all');

  // Flatten all subs
  const allSubs = SCHOOLS.flatMap(s => s.subs.map(sub => ({ ...sub, school: s })));
  const active = allSubs.filter(s => s.status === 'active');
  const trial = allSubs.filter(s => s.status === 'trial');
  const expired = allSubs.filter(s => s.status === 'expired' || s.status === 'churned');
  const overdue = allSubs.filter(s => s.amountDue > 0);

  // Upcoming renewals (active subs with school.renewsIn data)
  const upcomingRenewals = SCHOOLS
    .filter(s => s.status === 'active' || s.status === 'trial')
    .map(s => ({ school: s, sub: s.subs[0], renewsIn: s.renewsIn }))
    .sort((a, b) => a.renewsIn - b.renewsIn)
    .slice(0, 7);

  const totalActiveMRR = SCHOOLS.filter(s => s.status === 'active').reduce((a,s)=>a+s.mrr, 0);
  const totalOverdue = SCHOOLS.reduce((a,s)=>a+s.subs.reduce((b,sub)=>b+sub.amountDue,0), 0);
  const churnRate = (expired.length / allSubs.length * 100).toFixed(1);
  const trialToActive = 67; // %, hard-coded synth

  // Funnel: trial -> active -> renewed
  const funnel = [
    { label: 'Trials started (90d)',      value: 18, color: '#7dd3fc' },
    { label: 'Converted to paid',         value: 12, color: '#a78bfa' },
    { label: 'Renewed at term-end',       value: 9,  color: '#34d399' },
    { label: 'Multi-term renewals',       value: 6,  color: '#fbbf24' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Subscriptions</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-lo)' }}>{allSubs.length} subscriptions on record · {active.length} currently active · {trial.length} on trial</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" size="sm" icon={I.Download}>Export</Btn>
          <Btn variant="primary" size="sm" icon={I.Refresh}>Run renewal batch</Btn>
        </div>
      </div>

      {/* Top KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KPI label="Active MRR" value={`$${totalActiveMRR.toLocaleString()}`} sub={`From ${active.length} subscriptions`} accent="emerald" icon={I.TrendUp} delta={{ pct: 12.4, dir: 'up' }} />
        <KPI label="Renewals next 30d" value={upcomingRenewals.filter(r => r.renewsIn <= 30 && r.renewsIn >= 0).length} sub={`$${upcomingRenewals.filter(r => r.renewsIn <= 30 && r.renewsIn >= 0).reduce((a,r)=>a+r.school.mrr*3, 0).toLocaleString()} at risk`} accent="amber" icon={I.Calendar} />
        <KPI label="Overdue invoices" value={overdue.length} sub={`$${totalOverdue.toLocaleString()} unpaid`} accent="rose" icon={I.Alert} />
        <KPI label="Churn rate (12mo)" value={`${churnRate}%`} sub={`${expired.length} schools churned`} accent="violet" icon={I.TrendDown} delta={{ pct: 0.8, dir: 'down' }} />
      </div>

      {/* MRR chart + Funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 14 }}>
        <Card>
          <SectionHeader title="MRR growth · last 12 months" sub="Active subscription value, USD" />
          <AreaLineChart data={MRR_HISTORY} h={210} accent="#34d399" formatY={v => '$' + (v/1000).toFixed(1) + 'k'} />
        </Card>
        <Card>
          <SectionHeader title="Trial → renewal funnel" sub={`${trialToActive}% conversion rate`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 4 }}>
            {funnel.map((step, i) => {
              const pct = step.value / funnel[0].value * 100;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--ink-mid)', fontWeight: 500 }}>{step.label}</span>
                    <span className="tnum" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-hi)' }}>{step.value} <span style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontWeight: 500 }}>· {Math.round(pct)}%</span></span>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-elev-1)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: step.color, borderRadius: 999, transition: 'width .35s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Upcoming renewals */}
      <Card padded={false}>
        <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line-soft)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Upcoming renewals</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-lo)' }}>Next 60 days · sorted by urgency</p>
          </div>
          <Btn variant="ghost" size="sm" icon={I.Mail}>Send reminder batch</Btn>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>School</Th><Th>Current package</Th><Th>End date</Th><Th>Days</Th><Th>Term value</Th><Th>Auto-renew</Th><Th></Th></tr></thead>
          <tbody>
            {upcomingRenewals.map(({ school, sub, renewsIn }) => (
              <tr key={school.id} onClick={() => goto('school', school.id)} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <SchoolLogo name={school.name} tone={school.logoTone} size={28} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--ink-hi)' }}>{school.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{school.location}</div>
                    </div>
                  </div>
                </Td>
                <Td>{sub.package}</Td>
                <Td dim>{new Date(sub.endDate).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</Td>
                <Td mono>
                  {renewsIn <= 0
                    ? <Pill tone="rose" sm>Overdue {Math.abs(renewsIn)}d</Pill>
                    : renewsIn <= 14
                    ? <Pill tone="amber" sm>{renewsIn} days</Pill>
                    : <span style={{ color: 'var(--ink-mid)' }}>{renewsIn} days</span>}
                </Td>
                <Td mono style={{ color: 'var(--ink-hi)', fontWeight: 600 }}>${(school.mrr*3).toLocaleString()}</Td>
                <Td>
                  {Math.random() > 0.3
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#34d399' }}><I.Check size={12} /> Enabled</span>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--ink-faint)' }}><I.X size={12} /> Off</span>}
                </Td>
                <Td style={{ textAlign: 'right', paddingRight: 16 }}>
                  <Btn variant="ghost" size="sm">Renew</Btn>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Overdue + Recent payments side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card padded={false}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <I.Alert size={14} style={{ color: '#fb7185' }} /> Overdue invoices
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-lo)' }}>${totalOverdue.toLocaleString()} unpaid · {overdue.length} schools</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {overdue.slice(0, 6).map((o, i) => (
              <div key={i} onClick={() => goto('school', o.school.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < Math.min(5, overdue.length-1) ? '1px solid var(--line-soft)' : 'none', cursor: 'pointer' }}
                   onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,113,133,.04)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <SchoolLogo name={o.school.name} tone={o.school.logoTone} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-hi)' }}>{o.school.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{o.package} · ref {o.paymentRef}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="tnum" style={{ fontSize: 14, fontWeight: 700, color: '#fb7185' }}>${o.amountDue.toLocaleString()}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>{Math.floor(Math.random() * 60 + 5)} days late</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 18px', borderTop: '1px solid var(--line-soft)' }}>
            <Btn variant="ghost" size="sm" icon={I.Mail} style={{ width: '100%', justifyContent: 'center' }}>Send dunning emails</Btn>
          </div>
        </Card>

        <Card padded={false}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-soft)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <I.Receipt size={14} style={{ color: '#34d399' }} /> Recent payments received
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-lo)' }}>Last 7 days</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { school: 'Hellenic Academy',          ref: 'PNW-94821', amt: 2450, method: 'Paynow Direct',   when: '2h ago',  tone: 'emerald' },
              { school: 'St. Ignatius College',      ref: 'STN-22107', amt: 4280, method: 'Stanbic Wire',    when: '6h ago',  tone: 'sky' },
              { school: 'Arundel School',            ref: 'CBZ-38920', amt: 3200, method: 'CBZ Direct',      when: '1d ago',  tone: 'emerald' },
              { school: 'Watershed College',         ref: 'PNW-94706', amt: 1880, method: 'Paynow Direct',   when: '2d ago',  tone: 'emerald' },
              { school: 'Goromonzi High School',     ref: 'ECO-18432', amt: 1410, method: 'EcoCash',         when: '3d ago',  tone: 'amber' },
              { school: 'Peterhouse Boys',           ref: 'NMB-77421', amt: 5680, method: 'NMB Wire',        when: '5d ago',  tone: 'sky' },
            ].map((p, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < arr.length-1 ? '1px solid var(--line-soft)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: p.tone === 'emerald' ? 'rgba(16,185,129,.12)' : p.tone === 'sky' ? 'rgba(56,189,248,.12)' : 'rgba(251,191,36,.12)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <I.Check size={14} style={{ color: p.tone === 'emerald' ? '#34d399' : p.tone === 'sky' ? '#7dd3fc' : '#fbbf24' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-hi)' }}>{p.school}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{p.method} · <span className="mono">{p.ref}</span></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="tnum" style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>+${p.amt.toLocaleString()}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>{p.when}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Filter pills + sub list */}
      <Card padded={false}>
        <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line-soft)', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>All subscriptions</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-lo)' }}>{allSubs.length} on file</p>
          </div>
          <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg-elev-1)', borderRadius: 8, border: '1px solid var(--line)' }}>
            {[['all','All', allSubs.length],['active','Active', active.length],['trial','Trial', trial.length],['expired','Expired', expired.length]].map(([k, l, n]) => (
              <button key={k} onClick={() => setView(k)} style={{
                border: 0, padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: view === k ? 'var(--bg-elev-2)' : 'transparent',
                color: view === k ? 'var(--ink-hi)' : 'var(--ink-lo)',
                fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                {l}<span className="tnum" style={{ fontSize: 10.5, color: view === k ? 'var(--ink-lo)' : 'var(--ink-faint)' }}>{n}</span>
              </button>
            ))}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>School</Th><Th>Package</Th><Th>Status</Th><Th>Term</Th><Th>Seats</Th><Th>Paid</Th><Th>Reference</Th></tr></thead>
          <tbody>
            {(view === 'all' ? allSubs : view === 'active' ? active : view === 'trial' ? trial : expired).slice(0, 10).map((s, i) => (
              <tr key={i} onClick={() => goto('school', s.school.id)} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <SchoolLogo name={s.school.name} tone={s.school.logoTone} size={24} />
                    <span style={{ fontWeight: 600, color: 'var(--ink-mid)' }}>{s.school.name}</span>
                  </div>
                </Td>
                <Td>{s.package}</Td>
                <Td><StatusPill status={s.status} /></Td>
                <Td dim>{new Date(s.startDate).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'})} → {new Date(s.endDate).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'})}</Td>
                <Td mono>{s.studentLimit.toLocaleString()}</Td>
                <Td mono style={{ color: 'var(--ink-mid)', fontWeight: 600 }}>${s.amountPaid.toLocaleString()}{s.amountDue > 0 && <span style={{ color: '#fb7185', fontWeight: 500 }}> · −${s.amountDue}</span>}</Td>
                <Td mono dim>{s.paymentRef}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

window.PageSubscriptions = PageSubscriptions;
