// School Dashboard — role-aware landing page
const { useState: useStateD, useMemo: useMemoD } = React;

function SchoolDashboard({ goto, role = 'head' }) {
  const { SCHOOL, STUDENTS, TEACHERS, CLASSES, ASSESSMENTS, TERM_WEEKS, SUBJECT_PERFORMANCE, ANNOUNCEMENTS, BILLING } = window.SCHOOL_DATA;

  const totals = useMemoD(() => {
    const activeStudents = STUDENTS.filter(s => s.active).length;
    const totalClasses = CLASSES.length;
    const headCount = TEACHERS.length;
    const gradedThisTerm = ASSESSMENTS.reduce((a,x)=>a+x.graded, 0);
    const pendingGrade = ASSESSMENTS.reduce((a,x)=>a+x.ungraded, 0);
    const aiSessions = TERM_WEEKS.reduce((a,w)=>a+w.aiSessions, 0);
    const aiPct = Math.round(ASSESSMENTS.filter(a=>a.mode!=='Human-only').reduce((a,x)=>a+x.graded,0) / Math.max(gradedThisTerm,1) * 100);
    return { activeStudents, totalClasses, headCount, gradedThisTerm, pendingGrade, aiSessions, aiPct };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Trial banner */}
      {BILLING.status === 'trial' && (
        <div style={{
          padding: '14px 20px', borderRadius: 8,
          background: 'var(--gold-soft)',
          border: '1px solid color-mix(in srgb, var(--gold) 35%, var(--rule))',
          display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ width: 38, height: 38, borderRadius: 6, background: 'var(--gold)', color: '#fbf8f1', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <SI.Clock size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink-1)' }}>Free trial · {BILLING.trialEndsIn} days remaining</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>Your trial of the {BILLING.package} package ends on 16 June 2026. Pay your first invoice to keep teacher and student accounts active.</div>
          </div>
          <Btn variant="accent" size="sm" icon={SI.Sparkles} onClick={() => goto('billing')}>Activate subscription</Btn>
          <Btn variant="ghost" size="sm" onClick={() => goto('billing')}>View invoice</Btn>
        </div>
      )}

      {/* Header — greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            {SCHOOL.termName} · Week {SCHOOL.termWeek} of {SCHOOL.termTotalWeeks}
          </div>
          <h1 className="serif" style={{ margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-.02em' }}>
            Good morning, {role === 'head' ? 'Mrs. Chigumba' : role === 'deputy' ? 'Mr. Mukamuri' : 'Tendai'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>
            {role === 'head' && 'A snapshot of the school today — enrollment, academics, and the things that need your attention.'}
            {role === 'deputy' && 'Today\'s academic operations — assessments to grade, classes in session, teacher activity.'}
            {role === 'it' && 'System health and account status across teachers, students, and seat licensing.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" size="sm" icon={SI.Download}>Term report</Btn>
          <Btn variant="primary" size="sm" icon={SI.Plus} onClick={() => goto('students')}>Add student</Btn>
        </div>
      </div>

      {/* KPI grid — 4 wide, role-tinted */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KPI label="Enrolled students" value={totals.activeStudents.toLocaleString()} sub={`of ${BILLING.studentLimit} licensed seats`} accent="forest" icon={SI.Students} delta={{ dir: 'up', label: '+12 this term' }} />
        <KPI label="Teachers" value={totals.headCount} sub={`${TEACHERS.filter(t=>t.head).length} heads of department`} accent="plum" icon={SI.Teachers} />
        <KPI label="Classes" value={totals.totalClasses} sub={`Form 1–6 · ${CLASSES.filter(c=>c.level==='O-Level').length} O-level · ${CLASSES.filter(c=>c.level==='A-Level').length} A-level`} accent="sky" icon={SI.Classes} />
        {role === 'it' ? (
          <KPI label="Seat utilization" value={`${Math.round(totals.activeStudents/BILLING.studentLimit*100)}%`} sub={`${BILLING.studentLimit - totals.activeStudents} seats remaining`} accent={(BILLING.studentLimit - totals.activeStudents) < 30 ? 'terracotta' : 'gold'} icon={SI.Pulse} />
        ) : (
          <KPI label="Term average" value="64%" sub="across all subjects · +2.1 vs last term" accent="gold" icon={SI.TrendUp} delta={{ dir: 'up', label: '+2.1 pts' }} />
        )}
      </div>

      {/* Main grid: 2/3 chart + 1/3 attention */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 14 }}>
        <Card>
          <SectionHeader
            eyebrow="Term activity"
            title="Assessments graded — Term 2 progression"
            sub={`${totals.gradedThisTerm} marked this term · ${totals.pendingGrade} awaiting review`}
            action={<Pill tone="forest" sm dotted>Week {SCHOOL.termWeek}</Pill>}
          />
          <SChart.AreaLine data={TERM_WEEKS.filter(w => w.weekNum <= SCHOOL.termWeek)} valueKey="assessments" h={210} accent="var(--forest)" formatY={v => Math.round(v)} />
        </Card>

        <Card padded={false}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--rule-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SI.Alert size={14} style={{ color: 'var(--terracotta)' }} />
              <h3 className="serif" style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink-1)' }}>Needs your attention</h3>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--ink-3)' }}>4 items today</p>
          </div>
          <div>
            {[
              { icon: SI.Billing, tone: 'gold',       title: 'Term 2 invoice due in 11 days', sub: 'INV-2026-0247 · $384', cta: 'Pay now', go: 'billing' },
              { icon: SI.Assessments, tone: 'sky',    title: '6 Algebra II papers ungraded',  sub: 'Form 4A · Mr. Mukamuri',   cta: 'Review',  go: 'assessments' },
              { icon: SI.Students, tone: 'terracotta',title: '20 students near seat limit',   sub: '480 / 500 seats used',     cta: 'Manage', go: 'students' },
              { icon: SI.Teachers, tone: 'plum',      title: '3 teacher invitations pending', sub: 'Sent 5 days ago',          cta: 'Resend', go: 'teachers' },
            ].map((it, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 20px', borderBottom: i < arr.length-1 ? '1px solid var(--rule-soft)' : 'none', cursor: 'pointer' }}
                   onClick={() => goto(it.go)}
                   onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-shade)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 28, height: 28, borderRadius: 5, background: `var(--${it.tone}-soft)`, color: `var(--${it.tone})`, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}><it.icon size={14} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-1)' }}>{it.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{it.sub}</div>
                </div>
                <span style={{ fontSize: 11.5, color: `var(--${it.tone})`, fontWeight: 700, whiteSpace: 'nowrap', marginTop: 4 }}>{it.cta} →</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Subject performance + Form distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <Card>
          <SectionHeader title="Subject performance — this term" sub="Average score across all forms · arrow shows term-on-term change" />
          <SChart.HBars
            max={100}
            items={SUBJECT_PERFORMANCE.slice(0, 8).map(s => ({
              label: `${s.subject} ${s.trend > 0 ? '↑' : s.trend < 0 ? '↓' : '·'} ${Math.abs(s.trend).toFixed(1)}`,
              value: s.avgScore,
              suffix: '%',
              color: `var(--${s.color})`,
            }))}
            formatVal={v => v}
            h={14}
          />
        </Card>

        <Card>
          <SectionHeader title="Enrollment by form" sub={`${totals.activeStudents} students across ${CLASSES.length} classes`} />
          <SChart.Bars
            data={[1,2,3,4,5,6].map(form => ({
              label: `Form ${form}`,
              value: STUDENTS.filter(s => s.form === form && s.active).length,
            }))}
            valueKey="value" labelKey="label" h={170} accent="var(--plum)"
          />
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-around', paddingTop: 12, borderTop: '1px solid var(--rule-soft)', fontSize: 11 }}>
            <div style={{ textAlign: 'center' }}>
              <div className="serif tnum" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>{STUDENTS.filter(s => s.form <= 4 && s.active).length}</div>
              <div style={{ color: 'var(--ink-3)', fontSize: 10.5 }}>O-Level</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="serif tnum" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>{STUDENTS.filter(s => s.form >= 5 && s.active).length}</div>
              <div style={{ color: 'var(--ink-3)', fontSize: 10.5 }}>A-Level</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="serif tnum" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>{STUDENTS.filter(s => s.gender === 'F' && s.active).length}</div>
              <div style={{ color: 'var(--ink-3)', fontSize: 10.5 }}>Girls</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="serif tnum" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>{STUDENTS.filter(s => s.gender === 'M' && s.active).length}</div>
              <div style={{ color: 'var(--ink-3)', fontSize: 10.5 }}>Boys</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent assessments + Announcements */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <Card padded={false}>
          <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--rule-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="serif" style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink-1)' }}>Recent assessments</h3>
              <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--ink-3)' }}>{totals.aiPct}% used AI-assisted grading · {totals.aiSessions.toLocaleString()} tutor sessions term-to-date</p>
            </div>
            <Btn variant="quiet" size="sm" iconAfter={SI.ChevronRight} onClick={() => goto('assessments')}>All assessments</Btn>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {ASSESSMENTS.slice(0, 6).map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < 5 ? '1px solid var(--rule-soft)' : 'none' }}>
                  <Td>
                    <div style={{ fontWeight: 600, color: 'var(--ink-1)', fontSize: 12.5 }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{a.class} · {a.teacher.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.) /, '')}</div>
                  </Td>
                  <Td dim style={{ fontSize: 11.5 }}>{a.subject}</Td>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60 }}>
                        <CapacityBar used={a.graded} total={a.total} accent={a.status === 'complete' ? 'forest' : a.status === 'in-progress' ? 'sky' : 'gold'} label={false} height={4} />
                      </div>
                      <span className="tnum" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{a.graded}/{a.total}</span>
                    </div>
                  </Td>
                  <Td><StatusPill status={a.status} sm /></Td>
                  <Td>
                    {a.mode.includes('AI') ? (
                      <Pill tone="plum" sm><SI.Sparkles size={9} /> AI</Pill>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Manual</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card padded={false}>
          <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--rule-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="serif" style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink-1)' }}>Recent announcements</h3>
              <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--ink-3)' }}>Sent to parents</p>
            </div>
            <Btn variant="quiet" size="sm" icon={SI.Plus} onClick={() => goto('announcements')}>Compose</Btn>
          </div>
          <div>
            {ANNOUNCEMENTS.slice(0, 4).map((a, i, arr) => (
              <div key={a.id} style={{ padding: '12px 20px', borderBottom: i < arr.length-1 ? '1px solid var(--rule-soft)' : 'none', cursor: 'pointer' }}
                   onClick={() => goto('announcements')}
                   onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-shade)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-1)' }}>{a.title}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{a.sent}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.body}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 10.5, color: 'var(--ink-3)' }}>
                  <span>📨 {a.recipients} sent</span>
                  <span>👁 {a.opens} opened ({Math.round(a.opens/a.recipients*100)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

window.SchoolDashboard = SchoolDashboard;
