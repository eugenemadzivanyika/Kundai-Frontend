// School detail — sub history, billing, users breakdown, AI usage, seat chart.
const { useState: useStateSD, useMemo: useMemoSD } = React;

function PageSchoolDetail({ schoolId, goto }) {
  const { SCHOOLS } = window.KUNDAI_DATA;
  const school = SCHOOLS.find(s => s.id === schoolId) || SCHOOLS[0];
  const [tab, setTab] = useStateSD('overview');

  // Synth a 12-month seat-usage chart based on current usage
  const seatSeries = useMemoSD(() => {
    const final = school.seatsUsed;
    return Array.from({ length: 12 }, (_, i) => {
      const t = (i + 1) / 12;
      const v = Math.round(final * (0.45 + t * 0.55) + (Math.sin(i * 1.3) * final * 0.04));
      const months = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'];
      return { m: months[i] + (i < 8 ? ' ’25' : ' ’26'), mrr: Math.max(0, v) };
    });
  }, [school.id]);

  const totalPaid = school.subs.reduce((a,s)=>a+s.amountPaid, 0);
  const outstanding = school.subs.reduce((a,s)=>a+s.amountDue, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-lo)' }}>
        <button onClick={() => goto('schools')} style={{ background: 'transparent', border: 0, color: 'var(--ink-lo)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', fontSize: 12 }}>
          <I.ChevronLeft size={13} /> Schools
        </button>
        <span style={{ color: 'var(--ink-faint)' }}>/</span>
        <span style={{ color: 'var(--ink-mid)' }}>{school.name}</span>
      </div>

      {/* School header card */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <SchoolLogo name={school.name} tone={school.logoTone} size={68} square />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>{school.name}</h1>
                <StatusPill status={school.status} />
                <HealthDot status={school.health} />
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-lo)' }}>{school.type} · {school.location}</p>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: 'var(--ink-lo)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><I.Mail size={12} /> {school.email}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><I.Phone size={12} /> {school.phone}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><I.MapPin size={12} /> {school.address}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" size="sm" icon={I.Mail}>Contact</Btn>
            <Btn variant="ghost" size="sm" icon={I.Edit}>Edit</Btn>
            <Btn variant="primary" size="sm" icon={I.Refresh}>Renew subscription</Btn>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--line)', display: 'flex', gap: 0 }}>
        {[
          ['overview','Overview'],
          ['subscriptions','Subscriptions'],
          ['billing','Billing'],
          ['users','Users'],
          ['usage','Usage & AI'],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            background: 'transparent', border: 0, padding: '10px 18px', fontSize: 12.5, fontWeight: 600,
            color: tab === k ? 'var(--ink-hi)' : 'var(--ink-lo)', cursor: 'pointer',
            borderBottom: `2px solid ${tab === k ? 'var(--emerald-soft)' : 'transparent'}`,
            marginBottom: -1, fontFamily: 'inherit',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <KPI label="Active package" value={school.pkg} sub={`${school.seatsTotal.toLocaleString()} seats licensed`} accent="indigo" icon={I.Package} />
            <KPI label="Seats in use" value={school.seatsUsed.toLocaleString()} sub={`${Math.round(school.seatsUsed/school.seatsTotal*100)}% utilization`} accent="sky" icon={I.GradCap} />
            <KPI label="MRR contribution" value={school.mrr > 0 ? `$${school.mrr.toLocaleString()}` : '—'} sub="USD · termly billing" accent="emerald" icon={I.TrendUp} />
            <KPI label="Renews in" value={school.renewsIn > 0 ? `${school.renewsIn} days` : `−${Math.abs(school.renewsIn)} d`} sub={new Date(school.subs[0].endDate).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'})} accent={school.renewsIn <= 14 ? 'amber' : 'emerald'} icon={I.Calendar} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
            <Card>
              <SectionHeader title="Seat usage · last 12 months" sub="Active student accounts month-over-month" />
              <AreaLineChart data={seatSeries} h={210} accent="#7dd3fc" formatY={v => v.toLocaleString()} />
            </Card>
            <Card>
              <SectionHeader title="Primary contact" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: 'var(--bg-elev-2)', border: '1px solid var(--line-bright)', display: 'grid', placeItems: 'center', fontWeight: 700, color: 'var(--ink-mid)' }}>
                  {school.primaryContact.name.split(' ').slice(-2).map(w=>w[0]).join('')}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-hi)' }}>{school.primaryContact.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-lo)' }}>{school.primaryContact.role}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, color: 'var(--ink-mid)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><I.Mail size={13} style={{ color: 'var(--ink-faint)' }} /> {school.primaryContact.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><I.Phone size={13} style={{ color: 'var(--ink-faint)' }} /> {school.primaryContact.phone}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}>
                <div><div style={{ fontSize: 10.5, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Reg. No.</div><div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-mid)', marginTop: 2 }}>{school.registration}</div></div>
                <div><div style={{ fontSize: 10.5, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Onboarded</div><div style={{ fontSize: 11.5, color: 'var(--ink-mid)', marginTop: 2 }}>{new Date(school.onboarded).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'})}</div></div>
                <div><div style={{ fontSize: 10.5, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Subs</div><div style={{ fontSize: 11.5, color: 'var(--ink-mid)', marginTop: 2 }}>{school.subs.length} total</div></div>
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'subscriptions' && (
        <Card padded={false}>
          <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line-soft)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Subscription history</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-lo)' }}>{school.subs.length} subscriptions · {school.subs.filter(s=>s.status==='active').length} currently active</p>
            </div>
            <Btn variant="primary" size="sm" icon={I.Plus}>New subscription</Btn>
          </div>
          <div style={{ position: 'relative', padding: '6px 18px 18px' }}>
            <div style={{ position: 'absolute', left: 32, top: 24, bottom: 24, width: 2, background: 'var(--line-soft)' }} />
            {school.subs.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 18, padding: '14px 0', position: 'relative' }}>
                <div style={{ width: 32, display: 'grid', placeItems: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 999, background: s.status === 'active' ? '#34d399' : s.status === 'trial' ? '#7dd3fc' : s.status === 'suspended' ? '#fbbf24' : '#475569', border: '3px solid var(--bg-canvas)', boxShadow: s.status === 'active' ? '0 0 0 3px rgba(16,185,129,.18)' : 'none' }} />
                </div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 16, alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-hi)' }}>{s.package}</span>
                      <StatusPill status={s.status} />
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 3 }}>
                      {new Date(s.startDate).toLocaleDateString('en-GB',{day:'numeric',month:'short'})} — {new Date(s.endDate).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Seat limit</div>
                    <div className="tnum" style={{ fontSize: 13, color: 'var(--ink-mid)', fontWeight: 600, marginTop: 2 }}>{s.studentLimit.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Paid / due</div>
                    <div className="tnum" style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                      <span style={{ color: 'var(--ink-mid)' }}>${s.amountPaid.toLocaleString()}</span>
                      {s.amountDue > 0 && <span style={{ color: '#fb7185' }}> · ${s.amountDue.toLocaleString()} due</span>}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Reference</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-lo)', marginTop: 3 }}>{s.paymentRef}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'billing' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <KPI label="Lifetime paid" value={`$${totalPaid.toLocaleString()}`} sub={`Across ${school.subs.length} subscriptions`} accent="emerald" icon={I.Receipt} />
            <KPI label="Outstanding" value={outstanding > 0 ? `$${outstanding.toLocaleString()}` : '$0'} sub={outstanding > 0 ? 'Action required' : 'All caught up'} accent={outstanding > 0 ? 'rose' : 'emerald'} icon={I.Alert} />
            <KPI label="Next invoice" value={`$${school.subs[0].amountDue || school.mrr || 487}`} sub={`Due ${new Date(school.subs[0].endDate).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}`} accent="amber" icon={I.Calendar} />
          </div>
          <Card padded={false}>
            <div style={{ padding: '14px 18px' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Payment history</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><Th>Reference</Th><Th>Subscription</Th><Th>Amount</Th><Th>Method</Th><Th>Status</Th><Th>Date</Th></tr></thead>
              <tbody>
                {school.subs.map((s, i) => (
                  <tr key={i}>
                    <Td mono>{s.paymentRef}</Td>
                    <Td>{s.package}</Td>
                    <Td mono style={{ color: 'var(--ink-hi)', fontWeight: 600 }}>${s.amountPaid.toLocaleString()}</Td>
                    <Td dim>{['Paynow Direct','Stanbic Wire','EcoCash','CBZ Wire','NMB Wire'][i % 5]}</Td>
                    <Td><StatusPill status={s.amountDue > 0 ? 'overdue' : 'received'} /></Td>
                    <Td dim>{new Date(s.startDate).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {tab === 'users' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <KPI label="Total users" value={(school.users.admins + school.users.teachers + school.users.students).toLocaleString()} accent="indigo" icon={I.Users} />
            <KPI label="Admins" value={school.users.admins} sub="School & staff admins" accent="violet" icon={I.ShieldCheck} />
            <KPI label="Teachers" value={school.users.teachers} sub="Active accounts" accent="sky" icon={I.Users} />
            <KPI label="Students" value={school.users.students.toLocaleString()} sub={`${school.seatsTotal.toLocaleString()} licensed`} accent="emerald" icon={I.GradCap} />
          </div>
          <Card>
            <SectionHeader title="User breakdown" sub="Distribution by role" />
            <HBarList
              max={Math.max(school.users.admins, school.users.teachers, school.users.students, 1)}
              items={[
                { label: 'Students', value: school.users.students, suffix: 'accounts', color: '#34d399' },
                { label: 'Teachers', value: school.users.teachers, suffix: 'accounts', color: '#7dd3fc' },
                { label: 'Admins',   value: school.users.admins,   suffix: 'accounts', color: '#a78bfa' },
              ]}
              formatVal={v => v.toLocaleString()}
            />
          </Card>
        </>
      )}

      {tab === 'usage' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <KPI label="Assessments graded" value={school.aiUsage.gradedThisTerm.toLocaleString()} sub="This term · AI + human" accent="emerald" icon={I.Sparkles} />
            <KPI label="AI tutor sessions" value={school.aiUsage.tutorSessions.toLocaleString()} sub="Across all students" accent="sky" icon={I.Pulse} />
            <KPI label="OCR jobs processed" value={school.aiUsage.ocrJobs.toLocaleString()} sub="Handwritten submissions" accent="violet" icon={I.Cpu} />
          </div>
          <Card>
            <SectionHeader title="Engagement intensity" sub="Per-student averages this term" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginTop: 6 }}>
              {[
                { l: 'Graded per student', v: school.users.students > 0 ? (school.aiUsage.gradedThisTerm / school.users.students).toFixed(1) : '—', sub: 'assessments' },
                { l: 'Tutor sessions per student', v: school.users.students > 0 ? (school.aiUsage.tutorSessions / school.users.students).toFixed(1) : '—', sub: 'conversations' },
                { l: 'OCR per student', v: school.users.students > 0 ? (school.aiUsage.ocrJobs / school.users.students).toFixed(1) : '—', sub: 'handwritten subs' },
              ].map((it, i) => (
                <div key={i} style={{ padding: 14, background: 'var(--bg-elev-1)', border: '1px solid var(--line-soft)', borderRadius: 10 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{it.l}</div>
                  <div className="tnum" style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink-hi)', marginTop: 6, letterSpacing: '-.02em' }}>{it.v}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-lo)', marginTop: 4 }}>{it.sub}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

window.PageSchoolDetail = PageSchoolDetail;
